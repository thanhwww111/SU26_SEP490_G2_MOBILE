import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Calendar, ChevronRight, CreditCard, User } from "lucide-react-native";

import RegistrationStatusBadge from "./RegistrationStatusBadge";
import { getRegistrationBadge } from "../../constants/registration";
import { fmtDateTime } from "../../utils/date";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Một đăng ký giải trong danh sách "Đăng ký của tôi".
 *
 * Web dựng lưới 3 cột với hai lối bấm riêng (tên giải mở chi tiết giải, nút
 * "Chi tiết" mở modal). Trên mobile lưới đổ thành một cột và cả thẻ là một vùng
 * bấm mở màn chi tiết — hai đích bấm nhỏ cạnh nhau rất dễ bấm nhầm bằng ngón tay.
 *
 * Ngoại lệ duy nhất là nút thanh toán của đơn còn treo: web đặt nó ngay trên
 * thẻ, và đó là việc gấp nhất trong màn này — bắt đi qua màn chi tiết chỉ để
 * bấm một nút là thêm một bước thừa. Nút nằm ở dải chân thẻ, đủ xa vùng bấm
 * chính để không chạm nhầm.
 */
export default function RegistrationCard({ item, onPress, onPay, paying = false }) {
  const colors = useThemeColors();

  const canPay = item.status === "PENDING_PAYMENT" && Boolean(onPay);

  const badge = getRegistrationBadge(item.status);
  const createdAt = fmtDateTime(item.createdAt);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-line bg-surface active:bg-sunken"
    >
      {/* Vạch màu trên đỉnh thẻ — nhận ra trạng thái từ xa mà chưa cần đọc chip */}
      <View className={`h-1 w-full ${badge.bar}`} />

      <View className="gap-2.5 p-4">
        <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-content">
          {item.tournamentName}
        </Text>

        <RegistrationStatusBadge status={item.status} />

        <View className="gap-1">
          {createdAt ? (
            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color={colors.faint} />
              <Text className="text-xs text-faint">{createdAt}</Text>
            </View>
          ) : null}

          <View className="flex-row items-center gap-1.5">
            <User size={12} color={colors.muted} />
            <Text numberOfLines={1} className="flex-1 text-xs text-muted">
              {item.playerFullName || "—"}
            </Text>
          </View>
        </View>

        {item.status === "APPROVED" ? (
          <Text className="text-xs font-semibold text-emerald-600">✓ Đã xác nhận tham dự</Text>
        ) : null}
        {item.status === "REJECTED" ? (
          <Text className="text-xs font-semibold text-red-600">✗ Không được tham dự</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3 border-t border-line-soft bg-canvas px-4 py-2.5">
        {canPay ? (
          <Pressable
            onPress={onPay}
            disabled={paying}
            accessibilityRole="button"
            className="h-8 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-accent active:bg-accent-pressed"
          >
            {paying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CreditCard size={12} color="#fff" />
            )}
            <Text className="text-xs font-bold text-white">
              {paying ? "Đang chờ..." : "Thanh toán"}
            </Text>
          </Pressable>
        ) : null}

        <View className="ml-auto flex-row items-center">
          <Text className="text-xs font-semibold text-content-2">Chi tiết</Text>
          <ChevronRight size={iconSize.sm} color={colors.content2} />
        </View>
      </View>
    </Pressable>
  );
}
