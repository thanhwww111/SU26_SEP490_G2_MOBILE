import { Pressable, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Tiêu đề một nhóm trận (Đang diễn ra / Sắp tới / Đã xong), bám `SectionHeader` trong
 * `FE/src/pages/Staff/Matches/StaffMatchListPage.jsx`.
 *
 * Web bọc mỗi nhóm trong một khối có nền và viền nhạt. Mobile bỏ lớp bọc đó: màn hẹp mà lồng
 * thẻ trong khối thì lề ngang bị ăn hai lần, còn chính các thẻ đã đủ tách bạch nhờ màu trạng
 * thái. Chỉ giữ dòng tiêu đề kèm số đếm.
 *
 * `collapsible` dành cho nhóm "Đã xong" — web cũng gập nhóm này mặc định, vì trọng tài mở màn
 * lên là để tìm trận sắp đánh chứ không phải xem lại trận cũ.
 */

const TONE = {
  live: { dot: "bg-success", text: "text-success", count: "bg-success" },
  upcoming: { dot: "bg-accent", text: "text-accent", count: "bg-accent" },
  finished: { dot: "bg-muted", text: "text-muted", count: "bg-muted" },
};

export default function RefereeMatchSection({
  tone = "upcoming",
  label,
  count,
  collapsible = false,
  open = true,
  onToggle,
}) {
  const colors = useThemeColors();
  const styles = TONE[tone] ?? TONE.upcoming;

  const content = (
    <View className="flex-row items-center gap-2 py-1">
      <View className={`h-2 w-2 rounded-full ${styles.dot}`} />
      <Text className={`text-overline font-bold uppercase ${styles.text}`}>{label}</Text>

      <View className={`min-w-[20px] items-center rounded-full px-1.5 py-0.5 ${styles.count}`}>
        <Text className="text-overline font-bold text-white">{count}</Text>
      </View>

      {collapsible ? (
        <View className="ml-auto">
          <ChevronDown
            size={iconSize.md}
            color={colors.muted}
            style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
          />
        </View>
      ) : null}
    </View>
  );

  if (!collapsible) return content;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      hitSlop={{ top: 8, bottom: 8 }}
    >
      {content}
    </Pressable>
  );
}
