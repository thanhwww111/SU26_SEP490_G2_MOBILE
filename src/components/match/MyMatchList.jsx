import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Calendar, ChevronRight, Swords } from "lucide-react-native";

import MatchDetailSheet from "./MatchDetailSheet";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as matchApi from "../../api/matchApi";
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

  const done = item.status === "COMPLETED" || item.status === "WALKOVER";
  const winner1 = item.winner?.id && item.winner.id === item.player1?.id;
  const winner2 = item.winner?.id && item.winner.id === item.player2?.id;

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
            numberOfLines={1}
            className={`flex-1 text-sm ${
              winner1 ? "font-bold text-content" : "text-content-2"
            }`}
          >
            {item.player1?.displayName ?? "TBD"}
          </Text>

          <Text className="text-sm font-bold text-content">
            {done ? `${item.player1Score ?? 0} — ${item.player2Score ?? 0}` : "vs"}
          </Text>

          <Text
            numberOfLines={1}
            className={`flex-1 text-right text-sm ${
              winner2 ? "font-bold text-content" : "text-content-2"
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
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const data = await matchApi.getMyMatches();
    if (!alive.current) return;
    setMatches(Array.isArray(data) ? data : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;

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
            <Text className="text-2xl font-bold text-content">Lịch thi đấu</Text>
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
