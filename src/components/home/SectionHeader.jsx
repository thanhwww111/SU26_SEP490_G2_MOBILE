import { Pressable, Text, View } from "react-native";

/**
 * Thanh tiêu đề của một khối trên trang chủ: tên khối bên trái,
 * nút "Tất cả" bên phải. Dùng lại cho cả Tin tức, Lịch thi đấu, Top tay cơ.
 *
 * `dark` cho khối đặt trên nền tối (Top tay cơ), giống cách web đảo màu khối Ranked.
 */
export default function SectionHeader({
  title,
  actionLabel,
  onPressAction,
  dark = false,
  className = "",
}) {
  return (
    <View
      className={`flex-row items-center justify-between rounded-md px-4 py-3 ${
        dark ? "bg-navy-900" : "bg-sunken"
      } ${className}`}
    >
      <Text
        className={`flex-1 text-base font-bold ${
          dark ? "text-white" : "text-content"
        }`}
      >
        {title}
      </Text>

      {/* Chưa có màn đích thì ẩn hẳn nút, tránh nút bấm vào không phản ứng */}
      {actionLabel && onPressAction ? (
        <Pressable
          onPress={onPressAction}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className={`ml-3 rounded-md border px-3 py-1.5 ${
            dark ? "border-white/30" : "border-line-strong"
          }`}
        >
          <Text
            className={`text-xs italic ${dark ? "text-white" : "text-content-2"}`}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
