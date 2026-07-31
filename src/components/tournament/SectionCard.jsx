import { Text, View } from "react-native";

/**
 * Khối nội dung có tiêu đề trong màn chi tiết giải.
 *
 * Bám các card của web: vạch accent dọc bên trái, tiêu đề IN HOA cỡ overline,
 * thân card viền `slate-200`. Card tách khối bằng viền chứ không bằng bóng —
 * class `shadow-*` của Tailwind không chạy đúng trên native.
 */
export default function SectionCard({ title, children, className = "" }) {
  return (
    <View className={`rounded-xl border border-line bg-surface p-4 ${className}`}>
      {title ? (
        <View className="mb-4 flex-row items-center gap-2">
          <View className="h-4 w-[3px] rounded-full bg-accent" />
          <Text className="text-overline font-bold uppercase text-muted">
            {title}
          </Text>
        </View>
      ) : null}

      {children}
    </View>
  );
}
