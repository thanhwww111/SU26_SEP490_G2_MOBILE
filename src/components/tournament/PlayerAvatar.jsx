import { Text, View } from "react-native";

import RemoteImage from "../home/RemoteImage";
import { initialsOf } from "../../utils/format";

/**
 * Ảnh cơ thủ hình tròn, không có ảnh thì hiện chữ cái đầu.
 *
 * Web đổi màu nền theo tên để mỗi người một sắc; mobile dùng một nền xám duy
 * nhất — bảng màu của app chỉ có một accent, và màu trạng thái không được mượn
 * làm màu trang trí (01-design-system.md, Phần 2).
 *
 * Lưu ý tên trường: `ParticipantResponse` của backend là `avtarUrl` (thiếu chữ
 * `a`), không phải `avatarUrl`. Đọc sai sẽ luôn rơi vào fallback.
 */
export default function PlayerAvatar({ uri, name, size = "md" }) {
  const sizeClass = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const textClass = size === "lg" ? "text-base" : "text-sm";

  if (uri) {
    return (
      <RemoteImage
        uri={uri}
        className={`${sizeClass} rounded-full border border-slate-200`}
      />
    );
  }

  return (
    <View
      className={`${sizeClass} items-center justify-center rounded-full border border-slate-200 bg-slate-200`}
    >
      <Text className={`${textClass} font-bold text-slate-500`}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
