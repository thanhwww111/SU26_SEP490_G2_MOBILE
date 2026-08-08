import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Một hàng chip chọn-một, cuộn ngang.
 *
 * Là hình thức thay cho `<select>` của web: React Native không có thẻ đó, và
 * `OptionPicker` chỉ hợp danh sách 3–5 mục nên không dùng được cho 12 tháng hay
 * cho danh sách vòng đấu của giải 128 người.
 *
 * Chip cao 36 nhưng vùng chạm kéo lên đủ chuẩn tiếp cận bằng `hitSlop`, để hàng
 * chip không bị dày ra.
 *
 * Dùng ở: bộ lọc bảng xếp hạng, bộ lọc tab Trận đấu. Sửa hình thức ở đây là đổi
 * cả hai chỗ — đó là chủ đích, ba màn danh sách phải lọc trông như một.
 *
 * @param {Array} options — `[{ value, label }]`, `value` so sánh bằng `===`
 * @param {boolean} [inset] — thêm khoảng đệm ngang 16 cho hàng chip nằm sát mép
 *   màn. Chip đặt trong khối đã có đệm sẵn thì bỏ prop này.
 */
export default function ChipRow({
  options,
  value,
  onChange,
  label,
  inset = true,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName={`gap-2 ${inset ? "px-4" : ""}`}
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`h-9 flex-row items-center justify-center gap-2 rounded-full px-4 ${
              active
                ? "bg-navy-900"
                : "border border-line-strong bg-surface active:bg-sunken"
            }`}
          >
            <Text
              numberOfLines={1}
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-content-2"
              }`}
            >
              {option.label}
            </Text>

            {/* Đếm tiến độ của giai đoạn, ví dụ "3/8" — web cũng gắn ngay trong chip */}
            {option.badge ? (
              <View
                className={`rounded px-1.5 py-0.5 ${
                  active ? "bg-white/20" : "bg-sunken"
                }`}
              >
                <Text
                  className={`text-overline font-bold ${
                    active ? "text-white" : "text-muted"
                  }`}
                >
                  {option.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
