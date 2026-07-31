import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

import TournamentCard from "./TournamentCard";
import TournamentFilterBar from "./TournamentFilterBar";
import TournamentHero from "./TournamentHero";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as publicTournamentApi from "../../api/publicTournamentApi";
import { TOURNAMENT_STATUS_FILTERS } from "../../constants/tournament";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Danh sách giải đấu công khai, bám trang /event của FE web.
 *
 * Web phân trang bằng thanh số trang; mobile đổi sang cuộn tới đâu tải tới đó,
 * giống `MyRegistrationList` — bấm số trang bằng ngón tay vừa nhỏ vừa ngược
 * với thói quen cuộn.
 *
 * Padding ngang đặt ở từng phần tử chứ không ở contentContainer, để hero và
 * AppFooter vẫn chạy hết bề ngang màn hình.
 */
export default function TournamentList({ onPressItem }) {
  const colors = useThemeColors();

  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Người dùng có thể rời màn giữa chừng; ref để mọi nhánh tải cùng đọc một cờ
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (nextPage) => {
      const res = await publicTournamentApi.listPublicTournaments({
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
        // Chỉ gửi tham số khi thật sự có giá trị — backend coi chuỗi rỗng là
        // một bộ lọc chứ không phải "bỏ lọc"
        ...(status ? { status } : {}),
        ...(searchApplied ? { search: searchApplied } : {}),
      });
      if (!alive.current) return;

      setItems((prev) =>
        nextPage === 0 ? res.content : [...prev, ...res.content]
      );
      setTotal(res.totalElements);
      setHasMore(nextPage + 1 < res.totalPages);
      setPage(nextPage);
    },
    [status, searchApplied]
  );

  // Đổi bộ lọc hoặc từ khoá thì tải lại từ trang 0 và thay toàn bộ danh sách
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      // Dọn danh sách cũ ngay khi đổi bộ lọc: giữ lại thì người dùng thấy kết
      // quả của bộ lọc trước nằm dưới chip vừa bấm, tưởng là lọc không ăn
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
      // Lỗi khi tải thêm không được xoá danh sách đang hiển thị — chỉ dừng tải tiếp
      .catch(() => {
        if (alive.current) setHasMore(false);
      })
      .finally(() => {
        if (alive.current) setLoadingMore(false);
      });
  };

  const handleChangeStatus = (next) => {
    if (next === status) return;
    setStatus(next);
  };

  const handleSubmitSearch = (value) => {
    const next = (value ?? "").trim();
    if (next === searchApplied) return;
    setSearchApplied(next);
  };

  const clearFilters = () => {
    setStatus("");
    setSearchInput("");
    setSearchApplied("");
  };

  const hasFilter = Boolean(status || searchApplied);
  const activeLabel =
    TOURNAMENT_STATUS_FILTERS.find((f) => f.value === status)?.label ||
    "Tất cả giải đấu";

  return (
    <FlatList
      className="flex-1 bg-canvas"
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View className="px-4">
          <TournamentCard item={item} onPress={() => onPressItem?.(item)} />
        </View>
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View className="bg-surface">
          <TournamentHero />

          <TournamentFilterBar
            status={status}
            onChangeStatus={handleChangeStatus}
            searchInput={searchInput}
            onChangeSearchInput={setSearchInput}
            onSubmitSearch={handleSubmitSearch}
          />

          <View className="flex-row items-center justify-between bg-canvas px-4 pb-4 pt-6">
            <Text className="text-base font-bold text-content">
              {activeLabel}
            </Text>
            {!loading && !error ? (
              <Text className="text-sm text-muted">{total} giải</Text>
            ) : null}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View className="px-4">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage={
              hasFilter
                ? "Không có giải đấu nào phù hợp."
                : "Chưa có giải đấu nào."
            }
          />

          {/* Lỗi thì mời thử lại, rỗng vì bộ lọc thì mời xoá bộ lọc — hai
              tình huống khác nhau nên lối thoát cũng khác nhau */}
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

          {!loading && !error && hasFilter ? (
            <Pressable
              onPress={clearFilters}
              className="self-center px-5 py-2.5"
              hitSlop={8}
            >
              <Text className="text-sm font-semibold text-accent">
                Xóa bộ lọc
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
      keyboardShouldPersistTaps="handled"
    />
  );
}
