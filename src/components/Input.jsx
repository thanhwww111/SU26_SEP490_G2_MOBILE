import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

/**
 * Ô nhập dùng chung cho các màn auth: label, ô nhập, chữ lỗi.
 *
 * Lỗi chỉ hiện khi field đã `touched` — giống FE web, tránh việc vừa mở màn
 * đã đỏ lòm dù người dùng chưa gõ gì.
 *
 * `secure` bật kiểu mật khẩu kèm nút con mắt để hiện/ẩn.
 */
export default function Input({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  touched = false,
  secure = false,
  tone = "light",
  className = "",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const showError = Boolean(touched && error);
  const isDark = tone === "dark";

  const stateClass = showError
    ? isDark
      ? "border-red-400 bg-red-500/15"
      : "border-red-400 bg-red-50"
    : isDark
      ? "border-white/25 bg-white/10"
      : "border-slate-300 bg-slate-50";

  return (
    <View className={className}>
      {label ? (
        <Text
          className={`mb-1 text-xs ${isDark ? "text-slate-300" : "text-slate-500"}`}
        >
          {label}
        </Text>
      ) : null}

      <View className="relative justify-center">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "rgba(255,255,255,0.45)" : "#94a3b8"}
          secureTextEntry={secure && !visible}
          className={`h-10 rounded border px-3 text-sm ${
            isDark ? "text-white" : "text-slate-900"
          } ${stateClass} ${secure ? "pr-10" : ""}`}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            className="absolute right-3 p-1"
            hitSlop={8}
          >
            {visible ? (
              <EyeOff size={16} color={isDark ? "#cbd5e1" : "#9ca3af"} />
            ) : (
              <Eye size={16} color={isDark ? "#cbd5e1" : "#9ca3af"} />
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
