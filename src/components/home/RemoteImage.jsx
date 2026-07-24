import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const fallbackImage = require("../../../assets/auth-hero.jpg");

/**
 * Ảnh từ URL kèm ảnh dự phòng khi thiếu link hoặc tải hỏng.
 *
 * Kích thước đặt bằng `className` trên View bọc ngoài, còn ảnh ép 100% —
 * RN Web gán kích thước gốc của ảnh vào style nếu không ràng buộc, và ảnh
 * sẽ tràn ra ngoài khung.
 */
export default function RemoteImage({
  uri,
  className = "",
  resizeMode = "cover",
}) {
  const [failed, setFailed] = useState(false);
  const useFallback = !uri || failed;

  return (
    <View className={`overflow-hidden bg-slate-200 ${className}`}>
      <Image
        source={useFallback ? fallbackImage : { uri }}
        resizeMode={resizeMode}
        onError={() => setFailed(true)}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
});
