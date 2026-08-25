import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import RegistrationCard from "./RegistrationCard";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import FormError from "../auth/FormError";
import * as registrationApi from "../../api/playerRegistrationApi";
import { usePayOsCheckout } from "../../hooks/usePayOsCheckout";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Danh sách đăng ký giải của người dùng đang đăng nhập.
 *
 * Web phân trang bằng thanh số trang (AdminPagination); trên điện thoại đổi
 * thành cuộn tới đâu tải tới đó, vì bấm số trang bằng ngón tay vừa nhỏ vừa
 * ngược với thói quen cuộn.
 *
 * Tải lại bằng useFocusEffect chứ không phải useEffect: sau khi huỷ một đăng ký
 * ở màn chi tiết rồi quay lại đây, danh sách phải phản ánh trạng thái mới —
 * useEffect chỉ chạy lúc gắn nên sẽ hiện dữ liệu cũ.
 *
 * Padding ngang đặt ở từng phần tử chứ không ở contentContainer, để AppFooter
 * ở cuối vẫn chạy hết bề ngang màn hình như trên web.
 */
export default function MyRegistrationList({ onPressItem }) {
  const colors = useThemeColors();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Đơn đang mở PayOS — chỉ thẻ đó hiện vòng quay, các thẻ khác vẫn bấm được
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState("");

  // Người dùng có thể rời màn giữa chừng; ref để mọi nhánh tải cùng đọc một cờ
  const alive = useRef(true);
  // Lần focus đầu mới cần spinner toàn khối, các lần sau tải ngầm cho đỡ nháy
  const loadedOnce = useRef(false);

  const loadPage = useCallback(async (nextPage) => {
    const res = await registrationApi.getMyRegistrations({
      page: nextPage,
      size: DEFAULT_PAGE_SIZE,
    });
    if (!alive.current) return;

    setItems((prev) => (nextPage === 0 ? res.content : [...prev, ...res.content]));
    setHasMore(nextPage + 1 < res.totalPages);
    setPage(nextPage);
  }, []);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;

      (async () => {
        if (!loadedOnce.current) setLoading(true);
        setError("");

        try {
          await loadPage(0);
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
    }, [loadPage])
  );

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

  /* Đối chiếu xong với PayOS thì tải lại trang đầu để thấy trạng thái mới.
     Cố ý tải lại từ trang 0 thay vì sửa một phần tử: người dùng có thể đã trả
     tiền cho nhiều đơn trong một phiên (hook đối chiếu cả đơn treo từ lần mở
     app trước), nên cập nhật một dòng là chưa đủ. */
  const refreshAfterPay = useCallback(async () => {
    try {
      await loadPage(0);
    } catch {
      // Giữ nguyên danh sách đang hiện — kéo làm mới vẫn dùng được
    }
  }, [loadPage]);

  const { pay } = usePayOsCheckout({ onSettled: refreshAfterPay });

  const handlePay = async (registrationId) => {
    setPayError("");
    setPayingId(registrationId);

    try {
      await pay(registrationId);
    } catch (e) {
      if (alive.current) setPayError(e.message);
    } finally {
      if (alive.current) setPayingId(null);
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

  return (
    <FlatList
      className="flex-1 bg-canvas"
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View className="px-4">
          <RegistrationCard
            item={item}
            onPress={() => onPressItem?.(item)}
            onPay={() => handlePay(item.id)}
            paying={payingId === item.id}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View className="px-4 pb-4 pt-6">
          <Text className="text-2xl font-display uppercase text-content">
            Đăng ký của tôi
          </Text>
          <Text className="mt-1 text-sm text-muted">
            Lịch sử và trạng thái các đăng ký giải đấu
          </Text>

          {/* Lỗi thanh toán hiện ở đầu danh sách: thẻ gây lỗi có thể đã bị cuộn
              khuất, đặt lỗi ngay trên thẻ đó thì người dùng không thấy */}
          <FormError message={payError} className="mt-4" />
        </View>
      }
      ListEmptyComponent={
        <View className="px-4">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage="Bạn chưa đăng ký giải nào."
          />
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
    />
  );
}
