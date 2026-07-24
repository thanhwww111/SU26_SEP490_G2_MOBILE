import { Text, View } from "react-native";

/**
 * Box đỏ báo lỗi submit, đặt ở đầu form. Không render gì khi không có lỗi.
 *
 * `tone="dark"` cho form đặt thẳng trên nền tối: nền đỏ nhạt của bản sáng
 * sẽ chói và phá vỡ tương phản.
 */
export default function FormError({ message, tone = "light", className = "mb-4" }) {
  if (!message) return null;

  const isDark = tone === "dark";

  return (
    <View
      className={`rounded border px-3 py-3 ${
        isDark
          ? "border-red-400/40 bg-red-500/15"
          : "border-red-200 bg-red-50"
      } ${className}`}
    >
      <Text className={`text-xs ${isDark ? "text-red-300" : "text-red-600"}`}>
        {message}
      </Text>
    </View>
  );
}
