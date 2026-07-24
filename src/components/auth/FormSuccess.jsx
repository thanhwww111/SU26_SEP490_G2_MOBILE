import { Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

/**
 * Box xanh báo thành công, dùng khi gửi OTP xong hoặc đổi mật khẩu xong.
 *
 * `tone="dark"` cho form đặt thẳng trên nền tối.
 */
export default function FormSuccess({
  message,
  tone = "light",
  className = "mb-4",
}) {
  if (!message) return null;

  const isDark = tone === "dark";

  return (
    <View
      className={`flex-row items-start gap-2 rounded border px-3 py-3 ${
        isDark
          ? "border-green-400/40 bg-green-500/15"
          : "border-green-200 bg-green-50"
      } ${className}`}
    >
      <View className="mt-0.5">
        <CheckCircle2 size={16} color={isDark ? "#4ade80" : "#16a34a"} />
      </View>
      <Text
        className={`flex-1 text-xs ${isDark ? "text-green-300" : "text-green-700"}`}
      >
        {message}
      </Text>
    </View>
  );
}
