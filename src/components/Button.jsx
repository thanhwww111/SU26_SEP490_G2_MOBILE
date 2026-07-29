import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors } from "../theme/tokens";

/**
 * Nút bấm dùng chung. Kiểu pill navy bám theo nút của trang Auth trên FE web.
 *
 * `loadingTitle` cho phép hiện chữ cạnh spinner khi đang xử lý ("Đang gửi..."),
 * giống web; bỏ trống thì chỉ hiện spinner.
 */
export default function Button({
  title,
  onPress,
  loading = false,
  loadingTitle,
  disabled = false,
  variant = "primary",
  className = "",
}) {
  const isDisabled = disabled || loading;

  const base = "h-12 flex-row items-center justify-center gap-2 rounded-full px-6";
  const styles = {
    primary: isDisabled ? "bg-slate-400" : "bg-navy-700 active:bg-navy-600",
    outline: "border border-slate-300 bg-white active:bg-slate-50",
    // Hành động không hoàn tác được (huỷ đăng ký) — web cũng tô đỏ chỗ này
    danger: isDisabled ? "bg-slate-400" : "bg-danger active:opacity-80",
    // Hai variant dưới dành cho form đặt thẳng trên nền tối
    light: isDisabled ? "bg-white/40" : "bg-white active:bg-slate-200",
    ghost: "border border-white/40 active:bg-white/10",
  };
  const textStyles = {
    primary: "text-white",
    outline: "text-slate-700",
    danger: "text-white",
    light: "text-navy-700",
    ghost: "text-white",
  };
  const onDarkFill = variant === "primary" || variant === "ghost" || variant === "danger";
  const spinnerColor = onDarkFill ? colors.textInverse : colors.brand;

  const label = loading && loadingTitle ? loadingTitle : title;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : null}

      {!loading || loadingTitle ? (
        <Text className={`text-sm font-semibold ${textStyles[variant]}`}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
