import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import ChipRow from "../../../src/components/ChipRow";
import SearchField from "../../../src/components/SearchField";
import SectionState from "../../../src/components/home/SectionState";
import AppFooter from "../../../src/components/layout/AppFooter";
import RefereeMatchCard from "../../../src/components/staff/RefereeMatchCard";
import RefereeMatchSection from "../../../src/components/staff/RefereeMatchSection";
import { useRequireStaff } from "../../../src/hooks/useRequireStaff";
import * as staffMatchApi from "../../../src/api/staffMatchApi";
import {
  countDistinctTournaments,
  filterMatchesByDay,
  groupRefereeMatches,
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
 */

const AUTO_REFRESH_MS = 30_000;
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

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("today");
  const [finishedOpen, setFinishedOpen] = useState(false);

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  /* Gõ tới đâu gọi API tới đó là mỗi chữ cái một request trên mạng di động — chờ người dùng
     ngừng gõ rồi mới hỏi backend. `SearchField` cũng gọi `onSubmit` khi bấm nút tìm và khi xoá
     từ khoá, hai lối đó đi thẳng không qua timer. */
  useEffect(() => {
    const id = setTimeout(() => setSubmittedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
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

  useFocusEffect(
    useCallback(() => {
      if (!allowed) return undefined;
      alive.current = true;
      runLoad();

      const id = setInterval(() => runLoad({ silent: true }), AUTO_REFRESH_MS);

      return () => {
        alive.current = false;
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
      refreshing={refreshing}
      onRefresh={handleRefresh}
    />
  );
}
