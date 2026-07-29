import { Pressable, Text, View } from "react-native";

/**
 * Chọn một giá trị trong danh sách ngắn — thay cho `<select>` của web.
 *
 * React Native không có thẻ select gốc; `@react-native-picker/picker` thì mỗi
 * hệ điều hành hiện một kiểu khác nhau. Với danh sách 3–5 mục (giới tính, hạng
 * cơ thủ) thì bày hết ra thành chip vừa nhanh hơn một chạm, vừa cho người dùng
 * thấy luôn có những lựa chọn nào.
 *
 * Chip cao 36, `hitSlop` bù cho đủ 44 chiều dọc.
 */
export default function OptionPicker({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}) {
  return (
    <View className={className}>
      {label ? (
        <Text className="mb-1 text-xs text-slate-500">{label}</Text>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value || "empty"}
              onPress={() => !disabled && onChange(option.value)}
              disabled={disabled}
              hitSlop={{ top: 4, bottom: 4 }}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              className={`h-9 items-center justify-center rounded-full px-4 ${
                active
                  ? "bg-navy-700"
                  : disabled
                    ? "border border-slate-200 bg-slate-50"
                    : "border border-slate-300 bg-white active:bg-slate-50"
              }`}
            >
              <Text
                className={`text-sm ${
                  active
                    ? "font-semibold text-white"
                    : disabled
                      ? "text-slate-300"
                      : "text-slate-700"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
