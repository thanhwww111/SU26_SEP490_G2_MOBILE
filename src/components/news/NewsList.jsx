import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

import NewsCard from "./NewsCard";
import NewsFilterBar from "./NewsFilterBar";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as newsApi from "../../api/newsApi";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Danh sách bài viết, bám trang /news của FE web.
 *
 * Web phân trang bằng thanh số trang; mobile cuộn tới đâu tải tới đó, giống
 * `TournamentList` và `MyRegistrationList`.
 *
 * Chuyên mục tải riêng một request và lỗi của nó cố ý nuốt: không có hàng chip
 * thì vẫn đọc được tin, chặn cả màn vì mỗi cái chip là quá đáng.
 */
export default function NewsList({ onPressItem }) {
  const colors = useThemeColors();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
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

  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    newsApi
      .listPublicCategories()
      .then((data) => {
        // Chỉ hiện chuyên mục còn hoạt động — mục đã ẩn vẫn nằm trong response
        if (alive.current) setCategories(data.filter((c) => c.status !== "INACTIVE"));
      })
      .catch(() => {});

    return () => {
      alive.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (nextPage) => {
      const res = await newsApi.listPublishedPosts({
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
        // Chuỗi rỗng bị backend coi là một bộ lọc thật, nên chỉ gửi khi có giá trị
        ...(categoryId ? { categoryId } : {}),
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
    [categoryId, searchApplied]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      // Dọn danh sách cũ khi đổi bộ lọc, nếu không người dùng thấy kết quả của
      // bộ lọc trước nằm ngay dưới chip vừa bấm
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

  const handleSubmitSearch = (value) => {
    const next = (value ?? "").trim();
    if (next === searchApplied) return;
    setSearchApplied(next);
  };

  const clearFilters = () => {
    setCategoryId("");
    setSearchInput("");
    setSearchApplied("");
  };

  const hasFilter = Boolean(categoryId || searchApplied);

  return (
    <FlatList
      className="flex-1 bg-canvas"
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View className="px-4">
          <NewsCard post={item} onPress={() => onPressItem?.(item)} />
        </View>
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View className="bg-surface">
          <View className="px-4 pb-2 pt-6">
            <Text className="text-2xl font-black uppercase text-content">
              Tin Tức & Bài Viết
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Cập nhật mới nhất từ thế giới bi-a
            </Text>
          </View>

          <NewsFilterBar
            categories={categories}
            categoryId={categoryId}
            onChangeCategory={setCategoryId}
            searchInput={searchInput}
            onChangeSearchInput={setSearchInput}
            onSubmitSearch={handleSubmitSearch}
          />

          {!loading && !error && items.length > 0 ? (
            <View className="bg-canvas px-4 pb-4 pt-6">
              <Text className="text-sm text-muted">{total} bài viết</Text>
            </View>
          ) : (
            <View className="h-4 bg-canvas" />
          )}
        </View>
      }
      ListEmptyComponent={
        <View className="px-4">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage={
              hasFilter
                ? "Không có bài viết nào phù hợp."
                : "Chưa có bài viết nào."
            }
          />

          {!loading && error ? (
            <Pressable
              onPress={handleRefresh}
              className="self-center rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
            >
              <Text className="text-sm font-semibold text-content-2">Thử lại</Text>
            </Pressable>
          ) : null}

          {!loading && !error && hasFilter ? (
            <Pressable
              onPress={clearFilters}
              className="self-center px-5 py-2.5"
              hitSlop={8}
            >
              <Text className="text-sm font-semibold text-accent">Xóa bộ lọc</Text>
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
