import { Pressable, Text, View } from "react-native";
import { ChevronRight, MapPin, Phone } from "lucide-react-native";

import RemoteImage from "../home/RemoteImage";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Một chi nhánh trong danh sách /branches.
 *
 * Web dùng thẻ tỷ lệ 4:3 với tên đè lên ảnh, dưới là địa chỉ, số điện thoại,
 * mô tả. Mobile giữ nguyên thứ tự đó nhưng đưa tên xuống dưới ảnh: chữ trắng
 * đè ảnh chỉ đọc được khi ảnh đủ tối, mà ảnh quán bi-a thì sáng tối lẫn lộn.
 *
 * Cả thẻ là một vùng bấm; "Xem chi tiết" ở web là nút riêng nhưng cùng đích đến,
 * nên ở đây chỉ còn là nhãn — hai đích bấm cạnh nhau dễ bấm nhầm bằng ngón tay.
 */
export default function BranchCard({ branch, onPress }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-line bg-surface active:bg-sunken"
    >
      <RemoteImage uri={branch.thumbnailUrl} className="h-40 w-full" />

      <View className="gap-2 p-4">
        <Text numberOfLines={2} className="text-base font-bold text-content">
          {branch.name}
        </Text>

        <View className="flex-row items-start gap-2">
          <View className="mt-0.5">
            <MapPin size={14} color={colors.muted} />
          </View>
          <Text numberOfLines={2} className="flex-1 text-sm text-content-2">
            {branch.address || "—"}
          </Text>
        </View>

        {branch.phone ? (
          <View className="flex-row items-center gap-2">
            <Phone size={14} color={colors.muted} />
            <Text className="text-sm text-content-2">{branch.phone}</Text>
          </View>
        ) : null}

        {branch.description ? (
          <Text numberOfLines={2} className="text-xs leading-5 text-faint">
            {branch.description}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center justify-end border-t border-line-soft bg-canvas px-4 py-2.5">
        <Text className="text-overline font-bold uppercase text-content-2">
          Xem chi tiết
        </Text>
        <ChevronRight size={iconSize.sm} color={colors.content2} />
      </View>
    </Pressable>
  );
}
