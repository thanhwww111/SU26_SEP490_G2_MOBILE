import { Pressable, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";

import { iconSize } from "../theme/tokens";
import { useThemeColors } from "../theme/useThemeColors";

/**
 * Ô tìm kiếm dạng pill, bám ô "Tìm giải đấu..." của trang /event trên web.
 *
 * Tách khỏi `Input` vì khác vai trò: `Input` là field của form (có label, có
 * chữ lỗi, viền vuông), còn đây là bộ lọc — không nhãn, không validate.
 *
 * `onSubmit` chạy khi bấm nút tìm trên bàn phím chứ không chạy theo từng ký tự:
 * gõ tới đâu gọi API tới đó là mỗi chữ cái một request, quá tốn trên mạng di động.
 * Bộ lọc nào lọc tại chỗ (không gọi API) thì chỉ cần `onChangeText`.
 *
 * `onSubmit` luôn nhận từ khoá dưới dạng chuỗi — kể cả khi bấm nút xoá, nơi
 * state ở component cha chưa kịp cập nhật để đọc lại.
 */
export default function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Tìm kiếm...",
  className = "",
}) {
  const colors = useThemeColors();

  return (
    <View
      className={`h-10 flex-row items-center gap-2 rounded-full border border-line-strong bg-surface px-3 ${className}`}
    >
      <Search size={iconSize.sm} color={colors.faint} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={() => onSubmit?.(value)}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        className="flex-1 text-sm text-content"
      />

      {value ? (
        <Pressable
          onPress={() => {
            onChangeText("");
            // Xoá chữ phải trả danh sách về trạng thái chưa lọc ngay, không bắt
            // người dùng bấm thêm nút tìm trên bàn phím mới thấy kết quả cũ
            onSubmit?.("");
          }}
          hitSlop={12}
          accessibilityLabel="Xoá từ khoá"
        >
          <X size={iconSize.sm} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
