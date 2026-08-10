import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, Clock, XCircle } from "lucide-react-native";

import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import * as paymentApi from "../../api/paymentApi";
import { fmtCurrency } from "../../utils/format";
import { fmtDateTime } from "../../utils/date";
import { DEFAULT_PAGE_SIZE } from "../../utils/pagination";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Lịch sử thanh toán, bám trang `/player/payments` của web.
 *
 * Web mở modal chi tiết khi bấm một dòng; ở đây thẻ hiển thị luôn mọi thứ đáng xem (số tiền,
 * giải, mã giao dịch, mốc thời gian) nên không cần thêm một tầng nữa — mở modal chỉ để đọc lại
 * đúng những gì vừa thấy là thao tác thừa.
 */

/** Nhãn và màu theo trạng thái, bám STATUS_CONFIG của web. */
const STATUS = {
  SUCCESS: { label: "Thành công", tone: "text-emerald-600", Icon: CheckCircle2 },
  PENDING: { label: "Chờ thanh toán", tone: "text-warning", Icon: Clock },
  FAILED: { label: "Thất bại", tone: "text-danger", Icon: XCircle },
  CANCELLED: { label: "Đã huỷ", tone: "text-muted", Icon: XCircle },
};

const PaymentCard = ({ item }) => {
  const colors = useThemeColors();
  const cfg = STATUS[item.status] || STATUS.PENDING;
  const iconColor =
    item.status === "SUCCESS"
      ? colors.success
      : item.status === "FAILED"
        ? colors.danger
        : item.status === "CANCELLED"
          ? colors.muted
          : colors.warning;

  return (
    <View className="overflow-hidden rounded-xl border border-line bg-surface">
      <View className="gap-2 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <Text numberOfLines={2} className="flex-1 text-sm font-semibold text-content">
            {item.tournamentName || "Giải đấu"}
          </Text>
          <Text className="text-base font-bold text-content">
            {fmtCurrency(item.amount)}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <cfg.Icon size={14} color={iconColor} />
          <Text className={`text-xs font-semibold ${cfg.tone}`}>
            {item.statusLabel || cfg.label}
          </Text>
        </View>

        {item.transactionCode ? (
          <Text className="text-xs text-faint">Mã GD: {item.transactionCode}</Text>
        ) : null}

        <Text className="text-xs text-faint">
          {item.paidAt
            ? `Thanh toán: ${fmtDateTime(item.paidAt)}`
            : `Tạo: ${fmtDateTime(item.createdAt)}`}
        </Text>
      </View>
    </View>
  );
};

export default function PaymentList() {
  const colors = useThemeColors();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  const loadPage = useCallback(async (nextPage) => {
    const res = await paymentApi.getMyPayments({
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

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;

    setLoadingMore(true);
    loadPage(page + 1)
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
          <PaymentCard item={item} />
        </View>
      )}
      ItemSeparatorComponent={() => <View className="h-3" />}
      ListHeaderComponent={
        <View className="px-4 pb-4 pt-6">
          <Text className="text-2xl font-display uppercase text-content">
            Lịch sử thanh toán
          </Text>
          <Text className="mt-1 text-sm text-muted">
            Các khoản phí tham dự bạn đã tạo hoặc đã trả
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View className="px-4">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage="Bạn chưa có giao dịch nào."
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
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
