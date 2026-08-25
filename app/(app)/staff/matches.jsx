import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import ChipRow from "../../../src/components/ChipRow";
import SearchField from "../../../src/components/SearchField";
import SectionState from "../../../src/components/home/SectionState";
import AppFooter from "../../../src/components/layout/AppFooter";
import RefereeMatchCard from "../../../src/components/staff/RefereeMatchCard";
import RefereeMatchSection from "../../../src/components/staff/RefereeMatchSection";
import { useRequireStaff } from "../../../src/hooks/useRequireStaff";
import { useTournamentSocket } from "../../../src/hooks/useTournamentSocket";
import * as staffMatchApi from "../../../src/api/staffMatchApi";
import {
  countDistinctTournaments,
  filterMatchesByDay,
  groupRefereeMatches,
  isMatchFinished,
} from "../../../src/utils/refereeMatch";
import { useThemeColors } from "../../../src/theme/useThemeColors";

/**
 * Trận của tôi — màn chính của trọng tài, bám `/staff/matches` của web
 * (`FE/src/pages/Staff/Matches/StaffMatchListPage.jsx`).
 *
 * Header và drawer do `app/(app)/_layout.jsx` dựng; màn này chỉ lo nội dung.
 *
 * Ba khác biệt so với web, đều do nền tảng:
 * - `<select>` lọc ngày → `ChipRow` (React Native không có thẻ select).
 * - Bảng nhiều cột → thẻ xếp dọc, đúng luật ở `docs/mobile/07-web-mapping.md`.
 * - Web tự làm mới mỗi 30 giây khi tab đang hiện (`document.visibilityState`). Mobile không có
 *   API đó; `useFocusEffect` cho biết màn có đang được xem hay không, và interval bị dừng hẳn
 *   khi rời màn — quan trọng hơn trên điện thoại, nơi mỗi lần gọi API là một lần tốn pin và 3G.
 *
 * ## Tỷ số về thẳng qua WebSocket (từ 2026-08-25)
 *
 * Màn này nghe hai topic `/topic/tournament/{id}/{matches,bracket}` của mọi giải còn trận chưa
 * xong, nên tỷ số và trạng thái đổi ngay chứ không phải chờ hết một nhịp 30 giây. Bản tin gửi về
 * đúng DTO `MatchResponse` mà `GET /staff/matches` trả — cùng một `bracketHelper.toMatchResponse`
 * ở backend — nên vá thẳng vào phần tử trong danh sách được, không sợ lệch shape.
 *
 * Vòng hỏi lại vẫn giữ, chỉ giãn ra khi socket đang nối: **trận mới được phân công không đi qua
 * hai topic đó** — lúc quản lý gán trận, máy này còn chưa đăng ký nghe giải ấy. Bỏ hẳn vòng hỏi
 * lại là trọng tài không bao giờ thấy trận mới cho tới khi tự tay vuốt.
 */

/** Nhịp kiểm tra, cũng là khoảng cách tối thiểu giữa hai lần hỏi lại khi KHÔNG có socket */
const AUTO_REFRESH_MS = 30_000;

/** Có socket rồi thì chỉ còn hỏi lại để bắt trận mới được phân công — giãn ra cho đỡ tốn 3G */
const SOCKET_IDLE_REFRESH_MS = 120_000;

const SEARCH_DEBOUNCE_MS = 350;

const DAY_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "tomorrow", label: "Ngày mai" },
  { value: "all", label: "Mọi ngày" },
];

export default function StaffMatchesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { checking, allowed } = useRequireStaff();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [startingId, setStartingId] = useState(null);
  const [startError, setStartError] = useState("");

  /* Màn nằm trong stack nên vẫn còn gắn khi trọng tài đi sang màn chấm điểm. Cờ này để socket
     ngắt lúc đó — màn chấm điểm đã tự nghe giải của trận nó đang chấm rồi. */
  const [focused, setFocused] = useState(false);

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("today");
  const [finishedOpen, setFinishedOpen] = useState(false);

  const alive = useRef(true);
  const loadedOnce = useRef(false);
  /** Mốc lần gọi API gần nhất, để vòng hỏi lại biết khi nào thật sự cần chạy */
  const lastLoadAtRef = useRef(0);

  /* Gõ tới đâu gọi API tới đó là mỗi chữ cái một request trên mạng di động — chờ người dùng
     ngừng gõ rồi mới hỏi backend. `SearchField` cũng gọi `onSubmit` khi bấm nút tìm và khi xoá
     từ khoá, hai lối đó đi thẳng không qua timer. */
  useEffect(() => {
    const id = setTimeout(() => setSubmittedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
    // Ghi mốc ở đây chứ không ở `runLoad`: vuốt tay gọi thẳng `load`, không qua `runLoad` — bỏ
    // sót thì vòng hỏi lại vẫn nổ ngay sau khi người dùng vừa tự tay tải lại xong.
    lastLoadAtRef.current = Date.now();

    const data = await staffMatchApi.getRefereeMatches({
      tournamentName: submittedQuery || undefined,
    });
    if (!alive.current) return;
    setMatches(Array.isArray(data) ? data : []);
  }, [submittedQuery]);

  const runLoad = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && !loadedOnce.current) setLoading(true);
      if (!silent) setError("");
      try {
        await load();
        loadedOnce.current = true;
        if (alive.current && silent) setError("");
      } catch (e) {
        // Làm mới ngầm mà hỏng thì im lặng: danh sách đang hiện vẫn đúng, đổi nó thành màn lỗi
        // giữa lúc trọng tài đang nhìn là tệ hơn.
        if (alive.current && !silent) setError(e.message);
      } finally {
        if (alive.current && !silent) setLoading(false);
      }
    },
    [load]
  );

  /* --- Tỷ số trực tiếp qua WebSocket --- */

  /* Chỉ nghe giải còn trận chưa xong. Giải mà mọi trận đã kết thúc thì không bao giờ có bản tin
     mới, đăng ký nghe nó chỉ tốn thêm một lượt bắt tay và một khoản pin. */
  const liveTournamentIds = useMemo(
    () =>
      matches
        .filter((m) => !isMatchFinished(m.status))
        .map((m) => m.tournamentId)
        .filter((id) => id != null),
    [matches]
  );

  /**
   * Vá một trận trong danh sách khi socket báo tỷ số hoặc trạng thái mới.
   *
   * Trải bản tin lên trên bản cũ (`{ ...cũ, ...mới }`) chứ không thay thẳng: hai bên cùng là
   * `MatchResponse` nên field trùng hết, nhưng cách này an toàn nếu sau này backend thêm field
   * chỉ có ở REST.
   *
   * Trận không có trong danh sách thì bỏ qua — cùng một giải còn trận của trọng tài khác, nhét
   * vào đây là hiện lên những trận người này không được chấm.
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

  const { isConnected } = useTournamentSocket(liveTournamentIds, {
    enabled: allowed && focused,
    onMatchUpdate: applyMatchUpdate,
    onBracketSync: applyBracketSync,
    // Lúc đứt kết nối có thể đã lỡ vài bản tin — đọc lại từ REST cho chắc
    onReconnect: () => runLoad({ silent: true }),
  });

  /* Vòng hỏi lại đọc qua ref chứ không nhận `isConnected` làm dependency: đưa vào deps là mỗi lần
     socket nối/đứt lại dựng lại cả `useFocusEffect`, kéo theo một lần gọi API thừa. */
  const socketConnectedRef = useRef(false);
  socketConnectedRef.current = isConnected;

  useFocusEffect(
    useCallback(() => {
      if (!allowed) return undefined;
      alive.current = true;
      setFocused(true);
      runLoad();

      const tick = () => {
        const minGap = socketConnectedRef.current
          ? SOCKET_IDLE_REFRESH_MS
          : AUTO_REFRESH_MS;
        if (Date.now() - lastLoadAtRef.current < minGap) return;
        runLoad({ silent: true });
      };

      const id = setInterval(tick, AUTO_REFRESH_MS);

      return () => {
        alive.current = false;
        setFocused(false);
        clearInterval(id);
      };
    }, [allowed, runLoad])
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

  const filtered = useMemo(() => filterMatchesByDay(matches, dayFilter), [matches, dayFilter]);
  const groups = useMemo(() => groupRefereeMatches(filtered), [filtered]);
  const tournamentCount = useMemo(() => countDistinctTournaments(filtered), [filtered]);

  const openScoring = (matchId) => router.push(`/(scoring)/${matchId}`);

  const handleStart = async (match) => {
    if (startingId) return;
    setStartingId(match.id);
    setStartError("");
    try {
      await staffMatchApi.startStaffMatch(match.id);
      openScoring(match.id);
    } catch (e) {
      if (alive.current) setStartError(e.message);
      // Trận có thể đã được người khác bắt đầu, hoặc giải chưa mở — đọc lại để danh sách khớp
      // trạng thái thật thay vì giữ nút "Bắt đầu" đã hết hiệu lực.
      runLoad({ silent: true });
    } finally {
      if (alive.current) setStartingId(null);
    }
  };

  /* Trải ba nhóm thành một mảng phẳng cho FlatList — cùng cách MyMatchList đang làm, tránh kéo
     thêm SectionList chỉ để có ba tiêu đề. */
  const rows = useMemo(() => {
    const out = [];

    if (groups.live.length) {
      out.push({ type: "section", key: "s-live", tone: "live", label: "Đang diễn ra", count: groups.live.length });
      groups.live.forEach((m) => out.push({ type: "match", key: `m-${m.id}`, match: m }));
    }

    if (groups.upcoming.length) {
      out.push({ type: "section", key: "s-upcoming", tone: "upcoming", label: "Sắp tới", count: groups.upcoming.length });
      groups.upcoming.forEach((m) => out.push({ type: "match", key: `m-${m.id}`, match: m }));
    }

    if (groups.finished.length) {
      out.push({
        type: "section",
        key: "s-finished",
        tone: "finished",
        label: "Đã xong",
        count: groups.finished.length,
        collapsible: true,
      });
      if (finishedOpen) {
        groups.finished.forEach((m) => out.push({ type: "match", key: `m-${m.id}`, match: m }));
      }
    }

    return out;
  }, [groups, finishedOpen]);

  if (checking || !allowed) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  const emptyMessage = submittedQuery
    ? `Không có trận nào của giải khớp “${submittedQuery}”.`
    : matches.length === 0
      ? "Bạn chưa được phân trận nào. Liên hệ quản lý giải để được gán bàn."
      : "Không có trận nào trong ngày đã chọn. Thử đổi sang Ngày mai hoặc Mọi ngày.";

  return (
    <FlatList
      className="flex-1 bg-canvas"
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={({ item: row }) =>
        row.type === "section" ? (
          <View className="px-4 pb-2 pt-4">
            <RefereeMatchSection
              tone={row.tone}
              label={row.label}
              count={row.count}
              collapsible={row.collapsible}
              open={finishedOpen}
              onToggle={() => setFinishedOpen((v) => !v)}
            />
          </View>
        ) : (
          <View className="px-4 pb-3">
            <RefereeMatchCard
              match={row.match}
              starting={startingId === row.match.id}
              onStart={handleStart}
              onOpen={openScoring}
            />
          </View>
        )
      }
      ListHeaderComponent={
        <View className="gap-3 pb-1 pt-6">
          <View className="px-4">
            <Text className="text-overline font-bold uppercase text-accent">Trọng tài</Text>
            <Text className="mt-1 text-2xl font-display uppercase text-content">
              Trận của tôi
            </Text>
            <Text className="mt-1 text-sm text-muted">
              {filtered.length} trận
              {tournamentCount > 0 ? ` · ${tournamentCount} giải đấu` : ""}
            </Text>
          </View>

          <View className="px-4">
            <SearchField
              value={query}
              onChangeText={setQuery}
              onSubmit={(value) => setSubmittedQuery(value.trim())}
              placeholder="Tìm theo tên giải..."
            />
          </View>

          <ChipRow options={DAY_OPTIONS} value={dayFilter} onChange={setDayFilter} />

          {startError ? (
            <View className="mx-4 rounded-lg bg-tint-danger px-3 py-2">
              <Text className="text-sm text-danger">{startError}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View className="px-4">
          <SectionState loading={loading} error={error} emptyMessage={emptyMessage} />
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
  );
}
