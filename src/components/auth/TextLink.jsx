import { Pressable, Text } from "react-native";

/**
 * Link chữ trong form auth ("Khôi phục mật khẩu tại đây", "Quay lại đăng nhập").
 *
 * Dùng Pressable + hitSlop thay vì <Text onPress>: chữ 12px chỉ cao khoảng 16px,
 * quá nhỏ so với vùng chạm tối thiểu 44px trên mobile.
 */
export default function TextLink({
  title,
  onPress,
  align = "right",
  tone = "light",
  className = "",
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 14, bottom: 14, left: 12, right: 12 }}
      className={`${align === "right" ? "self-end" : "self-start"} py-1 ${className}`}
    >
      <Text
        className={`text-xs ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
