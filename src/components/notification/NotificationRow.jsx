import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { getNotificationLabel } from "../../constants/notification";
import { fmtRelative } from "../../utils/date";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Một dòng thông báo trong popup chuông.
 *
 * Cách phân biệt đã đọc / chưa đọc bám thói quen của Facebook, vì đó là thứ người dùng đã quen:
 * chưa đọc thì có chấm và nền hơi nhuốm màu nhấn, tiêu đề in đậm; đã đọc thì bỏ hẳn chấm, nền
 * trở lại như thẻ thường và chữ nhạt bớt. Nhờ vậy lướt qua là biết cái nào cần xem, không phải
 * đọc từng dòng.
 *
 * Là dòng trong popup nên cố ý gọn: không vạch màu trên đỉnh, không chân thẻ — popup chỉ cao
 * chừng nửa màn hình, mỗi dòng chiếm thêm một tầng là bớt đi một thông báo nhìn thấy được.
 */
export default function NotificationRow({ item, unread = false, onPress }) {
  const colors = useThemeColors();

  const label = getNotificationLabel(item.eventType);
  const canOpen = Boolean(item.tournamentId);

  return (
    <Pressable
      onPress={canOpen ? onPress : undefined}
      disabled={!canOpen}
      className={`flex-row gap-2.5 px-3 py-3 ${unread ? "bg-tint-accent" : ""} ${
        canOpen ? "active:bg-sunken" : ""
      }`}
    >
      {/* Cột chấm giữ chỗ cố định để tiêu đề mọi dòng thẳng hàng, đọc rồi hay chưa cũng vậy */}
      <View className="w-2 pt-1.5">
        {unread ? <View className="h-2 w-2 rounded-full bg-accent" /> : null}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </Text>
          <Text className="text-[10px] text-faint">{fmtRelative(item.createdAt)}</Text>
        </View>

        <Text
          numberOfLines={2}
          className={`mt-0.5 text-[13px] leading-snug ${
            unread ? "font-bold text-content" : "font-normal text-muted"
          }`}
        >
          {item.title}
        </Text>

        {item.preview ? (
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted">
            {item.preview}
          </Text>
        ) : null}
      </View>

      {canOpen ? (
        <View className="justify-center">
          <ChevronRight size={iconSize.sm} color={colors.faint} />
        </View>
      ) : null}
    </Pressable>
  );
}
