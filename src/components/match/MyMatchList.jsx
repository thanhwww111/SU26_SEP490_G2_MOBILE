import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Calendar, ChevronRight, Swords } from "lucide-react-native";

import MatchDetailSheet from "./MatchDetailSheet";
import MatchScore from "./MatchScore";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as matchApi from "../../api/matchApi";
import { useTournamentSocket } from "../../hooks/useTournamentSocket";
import { getMatchState, getWinnerSide } from "../../constants/tournament";
import { fmtDateTime } from "../../utils/date";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Lịch thi đấu của tôi, bám trang `/player/matches` của web.
 *
 * Web nhóm trận theo giải bằng các khối lồng nhau; ở đây dùng section của FlatList — cùng cách
 * gom nhưng cuộn mượt hơn trên danh sách dài, và tiêu đề giải dính lại ở mép trên khi cuộn.
 *
 * Backend trả một mảng phẳng không phân trang, nên toàn bộ việc gom nhóm nằm ở client.
 *
 * Bấm vào thẻ mở lớp chi tiết trận như web; riêng dải chân thẻ đi thẳng sang giải đấu, vì đó
 * là việc người dùng làm nhiều nhất và bắt họ qua hai bước thì thừa.
 */

const StatusChip = ({ status }) => {
  const map = {
    PENDING: { label: "Chưa xếp lịch", tone: "bg-sunken text-muted" },
    SCHEDULED: { label: "Đã xếp lịch", tone: "bg-tint-warning text-warning" },
    IN_PROGRESS: { label: "Đang diễn ra", tone: "bg-tint-accent text-accent" },
    COMPLETED: { label: "Đã kết thúc", tone: "bg-tint-success text-emerald-600" },
    WALKOVER: { label: "Thắng do bỏ cuộc", tone: "bg-tint-success text-emerald-600" },
    CANCELLED: { label: "Đã huỷ", tone: "bg-sunken text-muted" },
  };
  const cfg = map[status] || map.PENDING;

  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${cfg.tone.split(" ")[0]}`}>
      <Text className={`text-[10px] font-semibold ${cfg.tone.split(" ")[1]}`}>
        {cfg.label}
      </Text>
    </View>
  );
};

const MatchCard = ({ item, onPress, onOpenTournament }) => {
  const colors = useThemeColors();

  /* Dùng chung cách suy ra bên thắng với tab Trận đấu: backend không phải lúc
     nào cũng gửi `winner` cho trận đã xong, `getWinnerSide` có nhánh so tỷ số */
  const state = getMatchState(item.status);
  const winner = getWinnerSide(item);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-line bg-surface active:bg-sunken"
    >
      <View className="gap-2.5 p-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5">
            <Swords size={12} color={colors.faint} />
            <Text className="text-xs text-faint">
              {item.matchCode || `Vòng ${item.roundNo ?? "—"}`}
              {item.raceTo ? ` · Race to ${item.raceTo}` : ""}
            </Text>
          </View>
          <StatusChip status={item.status} />
        </View>

        {/* Người thắng in đậm — lướt qua là biết kết quả mà không phải so điểm */}
        <View className="flex-row items-center gap-2">
          <Text
            numberOfLines={2}
            className={`flex-1 text-sm ${
              winner === 1 ? "font-bold text-content" : "text-content-2"
            }`}
          >
            {item.player1?.displayName ?? "TBD"}
          </Text>

          <MatchScore
            score1={item.player1Score}
            score2={item.player2Score}
            winner={winner}
            state={state}
          />

          <Text
            numberOfLines={2}
            className={`flex-1 text-right text-sm ${
              winner === 2 ? "font-bold text-content" : "text-content-2"
            }`}
          >
            {item.player2?.displayName ?? "TBD"}
          </Text>
        </View>

        {item.scheduledAt ? (
          <View className="flex-row items-center gap-1.5">
            <Calendar size={12} color={colors.faint} />
            <Text className="text-xs text-faint">{fmtDateTime(item.scheduledAt)}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenTournament}
        accessibilityRole="button"
        className="flex-row items-center justify-end border-t border-line-soft bg-canvas px-4 py-2.5 active:bg-sunken-strong"
      >
        <Text className="text-xs font-semibold text-content-2">Xem giải đấu</Text>
        <ChevronRight size={iconSize.sm} color={colors.content2} />
      </Pressable>
    </Pressable>
  );
};

export default function MyMatchList({ onOpenTournament }) {
  const colors = useThemeColors();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  /* Màn nằm trong stack nên vẫn còn gắn khi người dùng đi sang màn khác. Cờ này để socket ngắt
     lúc đó: giữ kết nối cho một màn không ai nhìn là tốn pin và 3G không đổi lấy gì. */
  const [focused, setFocused] = useState(false);

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const data = await matchApi.getMyMatches();
    if (!alive.current) return;
    setMatches(Array.isArray(data) ? data : []);
  }, []);

  /* --- Tỷ số trực tiếp qua WebSocket (từ 2026-08-25) --- */

  /* Chỉ nghe giải còn trận chưa xong. `GET /player/matches` trả cả lịch sử, nên một cơ thủ chơi
     lâu năm có thể dính hàng chục giải — đăng ký nghe hết là mấy chục lượt bắt tay để nhận về
     những trận không bao giờ đổi nữa. */
  const liveTournamentIds = useMemo(
    () =>
      matches
        .filter((m) => getMatchState(m.status) !== "done")
        .map((m) => m.tournamentId)
        .filter((id) => id != null),
    [matches]
  );

  /**
   * Vá một trận trong danh sách khi socket báo tỷ số hoặc trạng thái mới.
   *
   * Bản tin gửi về đúng DTO `MatchResponse` mà `GET /player/matches` trả (cùng
   * `bracketHelper.toMatchResponse` ở backend), nên trải lên nhau là khớp field.
   *
   * Trận không có trong danh sách thì bỏ qua: cùng một giải còn trận của người khác, nhét vào
   * đây là hiện lịch thi đấu của cả giải thay vì của riêng mình.
   */
  const applyMatchUpdate = useCallback((incoming) => {
    if (!alive.current || incoming?.id == null) return;

    setMatches((prev) => {
      const index = prev.findIndex((m) => m.id === incoming.id);
      if (index === -1) return prev;

      const next = [...prev];
      next[index] = { ...next[index], ...incoming };
      return next;
    });
  }, []);

  /** Đồng bộ cả bracket: gộp một lượt thay vì gọi `applyMatchUpdate` cho từng trận */
  const applyBracketSync = useCallback((list) => {
    if (!alive.current || !Array.isArray(list)) return;

    const byId = new Map(
      list.filter((m) => m?.id != null).map((m) => [m.id, m])
    );

    setMatches((prev) =>
      prev.map((m) => (byId.has(m.id) ? { ...m, ...byId.get(m.id) } : m))
    );
  }, []);

  useTournamentSocket(liveTournamentIds, {
    enabled: focused,
    onMatchUpdate: applyMatchUpdate,
    onBracketSync: applyBracketSync,
    /* Đứt kết nối thì có thể đã lỡ bản tin. Nuốt lỗi: danh sách đang hiện vẫn đúng, và người
       dùng còn vuốt xuống được. */
    onReconnect: () => {
      load().catch(() => {});
    },
  });

  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      setFocused(true);

      (async () => {
        if (!loadedOnce.current) setLoading(true);
        setError("");
        try {
          await load();
          loadedOnce.current = true;
        } catch (e) {
          if (alive.current) setError(e.message);
        } finally {
          if (alive.current) setLoading(false);
        }
      })();

      return () => {
        alive.current = false;
        setFocused(false);
      };
    }, [load])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await load();
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setRefreshing(false);
    }
  };

  /**
   * Gom theo giải, trong mỗi giải xếp trận sắp diễn ra lên trước.
   *
   * Trận chưa có lịch đẩy xuống cuối chứ không lên đầu: chúng chưa xảy ra được, để trên cùng
   * thì thứ người dùng cần xem nhất bị đẩy khỏi tầm mắt.
   */
  const sections = useMemo(() => {
    const groups = new Map();

    matches.forEach((m) => {
      const key = String(m.tournamentId ?? "khac");
      if (!groups.has(key)) {
        groups.set(key, { tournamentId: m.tournamentId, title: m.tournamentName, data: [] });
      }
      groups.get(key).data.push(m);
    });

    return [...groups.values()].map((group) => ({
      ...group,
      data: [...group.data].sort((a, b) => {
        if (!a.scheduledAt && !b.scheduledAt) return 0;
        if (!a.scheduledAt) return 1;
        if (!b.scheduledAt) return -1;
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
      }),
    }));
  }, [matches]);

  // Trải section thành một mảng phẳng có dòng tiêu đề — đủ dùng và tránh kéo thêm SectionList
  const rows = useMemo(
    () =>
      sections.flatMap((section) => [
        { type: "header", key: `h-${section.tournamentId}`, section },
        ...section.data.map((m) => ({ type: "match", key: `m-${m.id}`, match: m, section })),
      ]),
    [sections]
  );

  return (
    <View className="flex-1">
      <FlatList
        className="flex-1 bg-canvas"
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={({ item: row }) =>
          row.type === "header" ? (
            <View className="px-4 pb-2 pt-5">
              <Text numberOfLines={2} className="text-sm font-bold uppercase text-content">
                {row.section.title || "Giải đấu"}
              </Text>
            </View>
          ) : (
            <View className="px-4 pb-3">
              <MatchCard
                item={row.match}
                onPress={() => setSelected(row.match)}
                onOpenTournament={() => onOpenTournament?.(row.section.tournamentId)}
              />
            </View>
          )
        }
        ListHeaderComponent={
          <View className="px-4 pb-2 pt-6">
            <Text className="text-2xl font-display uppercase text-content">
              Lịch thi đấu
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Các trận của bạn ở mọi giải đang tham dự
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="px-4">
            <SectionState
              loading={loading}
              error={error}
              emptyMessage="Bạn chưa có trận nào."
            />
          </View>
        }
        ListFooterComponent={
          <View>
            <View className="h-6" />
            <AppFooter />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressBackgroundColor={colors.surface}
          />
        }
      />

      <MatchDetailSheet
        match={selected}
        onClose={() => setSelected(null)}
        onOpenTournament={(tournamentId) => {
          setSelected(null);
          onOpenTournament?.(tournamentId);
        }}
      />
    </View>
  );
}
