import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

import { useThemeColors } from "../theme/useThemeColors";

/**
 * Ô nhập dùng chung cho các màn auth: label, ô nhập, chữ lỗi.
 *
 * Lỗi chỉ hiện khi field đã `touched` — giống FE web, tránh việc vừa mở màn
 * đã đỏ lòm dù người dùng chưa gõ gì.
 *
 * `secure` bật kiểu mật khẩu kèm nút con mắt để hiện/ẩn.
 *
 * `ref` nhận thẳng trong danh sách prop, KHÔNG cần `forwardRef`: từ React 19 `ref` là prop
 * thường của component hàm. Có nó để màn Đăng nhập đưa con trỏ sang ô mật khẩu sau khi người
 * dùng chọn một email gợi ý (`app/(auth)/login.jsx`).
 */
export default function Input({
  ref,
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  touched = false,
  secure = false,
  multiline = false,
  tone = "light",
  className = "",
  ...inputProps
}) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const showError = Boolean(touched && error);
  // `tone` nói ô nhập đang nằm trên nền tối hay sáng — độc lập với chế độ
  // sáng/tối của app. Form đặt trên hero tối thì luôn dùng tone="dark".
  const isDark = tone === "dark";

  const stateClass = showError
    ? isDark
      ? "border-red-400 bg-red-500/15"
      : "border-red-400 bg-tint-danger"
    : isDark
      ? "border-white/25 bg-white/10"
      : "border-line-strong bg-canvas";

  return (
    <View className={className}>
      {label ? (
        <Text
          className={`mb-1 text-xs ${isDark ? "text-disabled" : "text-muted"}`}
        >
          {label}
        </Text>
      ) : null}

      <View className="relative justify-center">
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={
            isDark ? colors.placeholderInverse : colors.faint
          }
          secureTextEntry={secure && !visible}
          multiline={multiline}
          // Android canh chữ giữa ô khi multiline nếu không ép lên đỉnh
          textAlignVertical={multiline ? "top" : undefined}
          className={`rounded border px-3 text-sm ${
            multiline ? "h-24 py-2" : "h-10"
          } ${isDark ? "text-white" : "text-content"} ${stateClass} ${
            secure ? "pr-10" : ""
          }`}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            className="absolute right-3 p-1"
            hitSlop={8}
          >
            {visible ? (
              <EyeOff size={16} color={isDark ? colors.disabled : colors.muted} />
            ) : (
              <Eye size={16} color={isDark ? colors.disabled : colors.muted} />
            )}
          </Pressable>
        ) : null}
      </View>

      {showError ? (
        <Text
          className={`mt-1 text-xs ${isDark ? "text-red-400" : "text-red-500"}`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
