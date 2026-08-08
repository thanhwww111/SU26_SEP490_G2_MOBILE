import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { initialsOf } from "../../utils/format";

/**
 * Ảnh chân dung cơ thủ khung chữ nhật. Thiếu ảnh hoặc tải hỏng thì hiện chữ cái
 * đầu của tên.
 *
 * Không dùng `RemoteImage`: ảnh dự phòng của nó là `auth-hero.jpg` — ảnh bàn
 * bi-a, đặt vào ô chân dung thì trông như lỗi dữ liệu. Web giải quyết bằng
 * `onError` đổi `src` sang `/player-default.webp`, nhưng `Image` của React
 * Native không đổi được nguồn theo cách đó. Quy ước chữ cái đầu đã có sẵn ở
 * `PlayerAvatar.jsx`; component này là biến thể khung chữ nhật của cùng quy ước.
 *
 * Kích thước đặt bằng `className` trên View bọc ngoài, ảnh bên trong ép 100% —
 * RN Web gán kích thước gốc của ảnh vào style nếu không ràng buộc.
 */
export default function PlayerPortrait({
  uri,
  name,
  className = "",
  initialsClassName = "text-2xl",
  resizeMode = "cover",
}) {
  const [failed, setFailed] = useState(false);
  const showInitials = !uri || failed;

  return (
    <View
      className={`items-center justify-center overflow-hidden bg-sunken-strong ${className}`}
    >
      {showInitials ? (
        <Text className={`font-black text-faint ${initialsClassName}`}>
          {initialsOf(name)}
        </Text>
      ) : (
        <Image
          source={{ uri }}
          resizeMode={resizeMode}
          onError={() => setFailed(true)}
          style={styles.fill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
});
