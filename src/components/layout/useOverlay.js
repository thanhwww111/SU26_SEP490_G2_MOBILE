import { useEffect, useRef, useState } from "react";
import { Animated, Platform } from "react-native";

/**
 * Trạng thái đóng/mở cho các lớp phủ (drawer, dropdown hồ sơ).
 *
 * Có hook riêng vì đám lớp phủ không dùng <Modal> được: trên web Modal của
 * react-native-web tạo div rồi appendChild thẳng vào document.body, nên nó
 * thoát khỏi khung điện thoại giả lập của WebPhoneFrame và phủ kín trình duyệt.
 * Lớp phủ giờ là View absolute nằm trong cây view của app, đổi lại phải tự lo
 * phần hiện/ẩn mà Modal vốn làm hộ.
 *
 * `mounted` trễ hơn `visible` một nhịp khi đóng, để animation chạy hết rồi mới
 * gỡ khỏi cây — bằng không lớp phủ biến mất phựt một cái.
 */
export function useOverlay(visible, duration = 180) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setMounted(true);

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      // react-native-web không có native animated module, bật lên chỉ tổ cảnh báo
      useNativeDriver: Platform.OS !== "web",
    });

    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });

    return () => animation.stop();
  }, [visible, duration, progress]);

  return { mounted, progress };
}
