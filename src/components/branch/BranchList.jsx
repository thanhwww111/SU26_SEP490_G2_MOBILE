import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";

import BranchCard from "./BranchCard";
import SearchField from "../SearchField";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as publicBranchApi from "../../api/publicBranchApi";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Danh sách chi nhánh, bám trang /branches của FE web.
 *
 * Web phân trang bằng thanh số trang; mobile cuộn tới đâu tải tới đó, giống các
 * màn danh sách khác trong app.
 *
 * Web có khối thống kê "N cơ sở · N khu vực" ở hero, trong đó số khu vực được
 * đếm bằng cách tải 100 chi nhánh rồi tách đoạn cuối của địa chỉ. Mobile bỏ khối
 * đó: một request phụ chỉ để hiện hai con số là không đáng trên mạng di động, và
 * cách đếm khu vực kia vốn không đáng tin (địa chỉ nhập tay, tách theo dấu phẩy).
 * Tổng số chi nhánh vẫn hiện, lấy thẳng từ `totalElements` của trang đầu.
 */
export default function BranchList({ onPressItem }) {
  const colors = useThemeColors();

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
    return () => {
      alive.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (nextPage) => {
      const res = await publicBranchApi.listPublicBranches({
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
        // Chuỗi rỗng bị backend coi là một bộ lọc thật, nên chỉ gửi khi có giá trị
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
    [searchApplied]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      // Dọn danh sách cũ khi đổi từ khoá, nếu không người dùng thấy kết quả cũ
      // nằm ngay dưới ô tìm kiếm vừa gõ
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

  /* Một section duy nhất — dùng SectionList chỉ để ô tìm kiếm dính lại mép trên
     khi cuộn, `sections` không mang ý nghĩa nhóm */
  const sections = useMemo(() => [{ data: items }], [items]);

  return (
    <SectionList
      className="flex-1 bg-canvas"
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => (
        // Item đầu tự chừa khoảng dưới ô tìm kiếm: khoảng đó không thể nằm trong
        // section header, vì header dính lại thì nó dính theo
        <View className={`px-4 ${index === 0 ? "pt-4" : ""}`}>
          <BranchCard branch={item} onPress={() => onPressItem?.(item)} />
        </View>
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      stickySectionHeadersEnabled
      renderSectionHeader={() => (
        <View className="border-b border-line bg-surface px-4 pb-4">
          <SearchField
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmit={handleSubmitSearch}
            placeholder="Tìm theo tên hoặc địa chỉ..."
          />
        </View>
      )}
      ListHeaderComponent={
        <View className="bg-surface">
          <View className="px-4 pb-4 pt-6">
            <Text className="text-overline font-bold uppercase text-faint">
              Hệ thống cơ sở
            </Text>
            <Text className="mt-1 text-2xl font-display uppercase text-content">
              Tìm cơ sở gần bạn
            </Text>
            <Text className="mt-2 text-sm leading-6 text-muted">
              Chọn cơ sở gần bạn để xem địa chỉ, số điện thoại và hình ảnh không
              gian club.
            </Text>
          </View>

          <View className="flex-row items-center justify-between bg-surface px-4 pb-3">
            <Text className="text-base font-bold text-content">
              Tất cả cơ sở
            </Text>
            {!loading && !error ? (
              <Text className="text-sm text-muted">{total} cơ sở</Text>
            ) : null}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View className="px-4 pt-6">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage={
              searchApplied
                ? "Không tìm thấy cơ sở nào phù hợp."
                : "Chưa có cơ sở nào."
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

          {!loading && !error && searchApplied ? (
            <Pressable
              onPress={() => {
                setSearchInput("");
                setSearchApplied("");
              }}
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.brand}
          colors={[colors.brand]}
          progressBackgroundColor={colors.surface}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
    />
  );
}
