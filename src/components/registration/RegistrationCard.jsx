import { Pressable, Text, View } from "react-native";
import { Calendar, ChevronRight, User } from "lucide-react-native";

import RegistrationStatusBadge from "./RegistrationStatusBadge";
import { getRegistrationBadge } from "../../constants/registration";
import { fmtDateTime } from "../../utils/date";
import { colors, iconSize } from "../../theme/tokens";

/**
 * Một đăng ký giải trong danh sách "Đăng ký của tôi".
 *
 * Web dựng lưới 3 cột với hai lối bấm riêng (tên giải mở chi tiết giải, nút
 * "Chi tiết" mở modal). Trên mobile lưới đổ thành một cột và cả thẻ là một vùng
 * bấm mở màn chi tiết — hai đích bấm nhỏ cạnh nhau rất dễ bấm nhầm bằng ngón tay.
 */
export default function RegistrationCard({ item, onPress }) {
  const badge = getRegistrationBadge(item.status);
  const createdAt = fmtDateTime(item.createdAt);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white active:bg-slate-50"
    >
      {/* Vạch màu trên đỉnh thẻ — nhận ra trạng thái từ xa mà chưa cần đọc chip */}
      <View className={`h-1 w-full ${badge.bar}`} />

      <View className="gap-2.5 p-4">
        <Text numberOfLines={2} className="text-sm font-semibold leading-snug text-slate-900">
          {item.tournamentName}
        </Text>

        <RegistrationStatusBadge status={item.status} />

        <View className="gap-1">
          {createdAt ? (
            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color={colors.textPlaceholder} />
              <Text className="text-xs text-slate-400">{createdAt}</Text>
            </View>
          ) : null}

          <View className="flex-row items-center gap-1.5">
            <User size={12} color={colors.textMuted} />
            <Text numberOfLines={1} className="flex-1 text-xs text-slate-500">
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

      <View className="flex-row items-center justify-end border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <Text className="text-xs font-semibold text-slate-600">Chi tiết</Text>
        <ChevronRight size={iconSize.sm} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}
