import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  View,
} from "react-native";

import RankingRow from "./RankingRow";
import RankingFilterBar from "./RankingFilterBar";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import { getLeaderboard } from "../../api/leaderboardApi";
import { periodLabel } from "../../constants/leaderboard";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useThemeColors } from "../../theme/useThemeColors";

const now = new Date();

const INITIAL_FILTER = {
  period: "ALL",
  year: now.getFullYear(),
  quarter: Math.floor(now.getMonth() / 3) + 1,
  month: now.getMonth() + 1,
};

/**
 * Bảng xếp hạng điểm tích lũy cơ thủ, bám trang /rankings của FE web.
 *
 * Web phân trang bằng thanh số trang; mobile cuộn tới đâu tải tới đó, giống
 * `NewsList` và `TournamentList`.
 *
 * Khác web một điểm có chủ ý: web ghi bộ lọc vào query string để F5 giữ nguyên
 * kỳ đang xem. Trên mobile không có thao tác F5 và màn này không cần link chia
 * sẻ, nên bộ lọc chỉ nằm trong state.
 *
 * Dùng `SectionList` thay `FlatList` chỉ để lấy một thứ: bộ lọc là section
 * header nên tự dính lại mép trên khi cuộn. Danh sách này dài (mọi cơ thủ có
 * điểm), cuộn tới hạng 40 rồi muốn đổi kỳ thống kê mà phải vuốt ngược lên đầu
 * thì quá phiền. Chỉ có một section, `sections` không mang ý nghĩa nhóm.
 */
export default function RankingList({ onPressPlayer }) {
  const colors = useThemeColors();

  const [filter, setFilter] = useState(INITIAL_FILTER);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const { period, year, quarter, month } = filter;

  const loadPage = useCallback(
    async (nextPage) => {
      const res = await getLeaderboard({
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
        period,
        // Kỳ ALL trải mọi thời điểm nên năm không có nghĩa; gửi thừa tham số
        // chỉ khiến request khác nhau mà kết quả giống hệt
        ...(period === "ALL" ? {} : { year }),
        ...(period === "QUARTER" ? { quarter } : {}),
        ...(period === "MONTH" ? { month } : {}),
      });
      if (!alive.current) return;

      setItems((prev) =>
        nextPage === 0 ? res.content : [...prev, ...res.content]
      );
      setTotal(res.totalElements);
      setHasMore(nextPage + 1 < res.totalPages);
      setPage(nextPage);
    },
    [period, year, quarter, month]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      // Dọn danh sách cũ khi đổi kỳ, nếu không người dùng thấy kết quả của kỳ
      // trước nằm ngay dưới chip vừa bấm
      setItems([]);
      try {
        await loadPage(0);
      } catch (e) {
        if (alive.current && !cancelled) setError(e.message);
      } finally {
        if (alive.current && !cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      await loadPage(0);
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;

    setLoadingMore(true);
    loadPage(page + 1)
      // Lỗi khi tải thêm không được xoá danh sách đang hiển thị
      .catch(() => {
        if (alive.current) setHasMore(false);
      })
      .finally(() => {
        if (alive.current) setLoadingMore(false);
      });
  };

  const handleChangeFilter = (patch) =>
    setFilter((prev) => ({ ...prev, ...patch }));

  const resetToAll = () => setFilter(INITIAL_FILTER);

  const sections = useMemo(() => [{ data: items }], [items]);

  return (
    <SectionList
      className="flex-1 bg-canvas"
      sections={sections}
      keyExtractor={(item) => String(item.userId)}
      renderItem={({ item }) => (
        <RankingRow entry={item} onPress={() => onPressPlayer?.(item)} />
      )}
      ItemSeparatorComponent={() => <View className="h-px bg-line-soft" />}
      // Android mặc định TẮT, iOS mặc định bật — phải nói rõ để hai bên giống nhau
      stickySectionHeadersEnabled
      renderSectionHeader={() => (
        <RankingFilterBar {...filter} onChange={handleChangeFilter} />
      )}
      ListHeaderComponent={
        <View className="bg-surface px-4 pb-3 pt-6">
          <Text className="text-2xl font-display uppercase text-content">
            Bảng Xếp Hạng Cơ Thủ
          </Text>
          {/* Số cơ thủ gộp vào dòng phụ đề thay vì đứng riêng dưới bộ lọc: chỗ
              đó giờ là ranh giới dính, chèn thêm một dải chữ vào sẽ dính theo */}
          <Text className="mt-1 text-sm text-muted">
            Điểm tích lũy · {periodLabel(filter)}
            {!loading && !error && items.length > 0 ? ` · ${total} cơ thủ` : ""}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View className="px-4 pt-6">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage="Chưa có cơ thủ nào tích lũy điểm trong kỳ này."
          />

          {!loading && error ? (
            <Pressable
              onPress={handleRefresh}
              className="self-center rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
            >
              <Text className="text-sm font-semibold text-content-2">
                Thử lại
              </Text>
            </Pressable>
          ) : null}

          {!loading && !error && period !== "ALL" ? (
            <Pressable onPress={resetToAll} className="self-center px-5 py-2.5" hitSlop={8}>
              <Text className="text-sm font-semibold text-accent">
                Xem mọi thời điểm
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListFooterComponent={
        <View>
          {loadingMore ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color={colors.brand} />
            </View>
          ) : (
            <View className="h-6" />
          )}
          <AppFooter />
        </View>
      }
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
