import { ActivityIndicator, Pressable, Text } from "react-native";

/**
 * Nút bấm dùng chung.
 * Ví dụ mẫu về cách viết component với NativeWind: className y hệt Tailwind trên web.
 */
export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  className = "",
}) {
  const isDisabled = disabled || loading;

  const base = "h-12 flex-row items-center justify-center rounded-xl px-5";
  const styles = {
    primary: isDisabled ? "bg-brand-500/50" : "bg-brand-600 active:bg-brand-700",
    outline: "border border-slate-300 bg-white active:bg-slate-50",
  };
  const textStyles = {
    primary: "text-white",
    outline: "text-slate-700",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#334155"} />
      ) : (
        <Text className={`text-base font-semibold ${textStyles[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
