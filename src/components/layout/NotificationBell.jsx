import { Pressable, Text, View } from "react-native";
import { Bell } from "lucide-react-native";

import { useThemeColors } from "../../theme/useThemeColors";
import { iconSize } from "../../theme/tokens";

/**
 * Chuông thông báo trên header, kèm huy hiệu số chưa đọc.
 *
 * Đặt cạnh nút hồ sơ ở mép phải theo thói quen chung của app di động. Huy hiệu tràn ra ngoài
 * khung 40x40 của nút nên nút không dùng `overflow-hidden`, và vùng bấm được nới bằng `hitSlop`
 * chứ không phải bằng cách phóng to nút — phóng to sẽ đẩy logo lệch khỏi giữa header.
 */
export default function NotificationBell({ count = 0, onPress }) {
  const colors = useThemeColors();

  const hasUnread = count > 0;
  // Quá 9 thì con số thật không còn quan trọng bằng việc "có nhiều thứ chưa xem",
  // mà 2 chữ số cũng làm huy hiệu phình ra che mất chuông
  const badgeText = count > 9 ? "9+" : String(count);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      className="h-10 w-10 items-center justify-center rounded-full active:bg-sunken-strong"
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? `Thông báo, ${count} chưa đọc` : "Thông báo"
      }
    >
      <Bell size={iconSize.md} color={colors.content} />

      {hasUnread ? (
        <View
          className="absolute right-1 top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1"
          // Viền cùng màu nền header tách huy hiệu khỏi thân chuông khi hai màu chạm nhau
          style={{ borderWidth: 1.5, borderColor: colors.surface }}
        >
          <Text className="text-[10px] font-bold leading-none text-white">
            {badgeText}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
