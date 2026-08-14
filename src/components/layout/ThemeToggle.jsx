import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useThemeStore } from "../../store/themeStore";
import { useIsDarkMode } from "../../theme/useThemeColors";

/**
 * Công tắc Sáng ⇄ Tối trên header, bám đúng công tắc cùng vai trò ở
 * `ThemeSwitch.jsx` của web (mẫu Uiverse — JustCode14).
 *
 * Bật = giao diện SÁNG: nền trời xanh, mặt trời vàng, có mây.
 * Tắt = giao diện TỐI: nền đêm, trăng lưỡi liềm, có sao.
 *
 * Khác bản web ở chỗ dựng hình, vì React Native không có CSS:
 *
 * - Chuyển động chạy bằng `Animated` của React Native chứ không phải Reanimated.
 *   Reanimated có trong dự án, nhưng công tắc này chỉ nội suy vài giá trị nên
 *   không đáng kéo thêm worklet vào; `Animated` lại chạy được ở mọi cấu hình.
 *
 * - `useNativeDriver` phải để `false`: driver gốc không nội suy được
 *   `backgroundColor`, mà đổi màu nền chính là phần lớn hiệu ứng ở đây.
 *
 * - Trăng lưỡi liềm bên web là `box-shadow: inset` — React Native không có bóng
 *   đổ vào trong. Thay bằng hai hình tròn chồng lệch: một tròn sáng làm mặt
 *   trăng, một tròn cùng màu nền rãnh đè lệch sang trái-dưới để "cắn" ra vệt
 *   khuyết. Sang chế độ sáng thì hình tròn cắn mờ đi, để lại mặt trời tròn đầy.
 *
 * Đọc chế độ đang hiển thị THẬT (`useIsDarkMode`) chứ không đọc `mode` trong
 * store — hai thứ khác nhau khi `mode` là `"system"`, lúc đó store không biết
 * máy đang sáng hay tối. Bấm luôn ghi ra `"light"`/`"dark"` tường minh nên sau
 * lần bấm đầu tiên chế độ tự-động-theo-máy không còn áp dụng, cố ý giống web.
 */

/* Số đo lấy theo tỉ lệ mẫu web (rãnh 4em × 2.2em, con trượt 1.2em, lề 0.5em)
   với em = 12px. Ra rãnh 48×26 — vừa với hai nút tròn 40px cạnh nó. */
const EM = 12;
const TRACK_W = 4 * EM;
const TRACK_H = 2.2 * EM;
const THUMB = 1.2 * EM;
const PAD = 0.5 * EM;
const TRAVEL = TRACK_W - THUMB - PAD * 2;

/* Vệt cắn của trăng khuyết: bản web đẩy bóng (0.47em, -0.235em) so với con
   trượt 1.2em, nên hình tròn cắn phải lệch ngược lại đúng tỉ lệ ấy. */
const BITE_X = -(0.47 / 1.2) * THUMB;
const BITE_Y = (0.235 / 1.2) * THUMB;

/**
 * Bốn màu này KHÔNG lấy từ token vai trò, và đó là cố ý: chúng vẽ bầu trời ngày
 * và đêm bên trong công tắc, nên phải giữ nguyên ở cả hai chế độ. Token đổi màu
 * theo chế độ sẽ làm mặt trời hoá xám ngay khi bật đèn.
 */
const NIGHT_BG = "#2a2a2a";
const DAY_BG = "#00a6ff";
const MOON = "#ffffff";
const SUN = "#ffcf48";

const STARS = [
  { left: 2.5 * EM, top: 0.5 * EM },
  { left: 2.2 * EM, top: 1.2 * EM },
  { left: 3 * EM, top: 0.9 * EM },
];
const STAR_SIZE = 0.29 * EM;

const CLOUD_SIZE = 3.5 * EM;

/**
 * Mây trắng ló ở góc dưới trái khi trời sáng.
 *
 * Bản web bọc path trong `transform="matrix(...)"`. Ở đây gấp phép biến đổi đó
 * thẳng vào `viewBox` — cùng một kết quả, mà không phải trông chờ trình phân
 * tích transform của react-native-svg đọc đúng chuỗi matrix viết liền dấu trừ.
 */
const CLOUD_VIEWBOX = "384.72 534 20.52 20.4";
const CLOUD_PATH =
  "m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925";

export default function ThemeToggle() {
  const isDark = useIsDarkMode();
  const setMode = useThemeStore((s) => s.setMode);

  /* 0 = tối, 1 = sáng */
  const progress = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isDark ? 0 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [isDark, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [NIGHT_BG, DAY_BG],
  });
  const thumbColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [MOON, SUN],
  });
  const thumbX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] });
  const fadeOutOnDay = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable
      onPress={() => setMode(isDark ? "light" : "dark")}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isDark }}
      accessibilityLabel={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
    >
      <Animated.View
        style={{
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          backgroundColor: trackColor,
          overflow: "hidden",
          justifyContent: "center",
        }}
      >
        {STARS.map((star) => (
          <Animated.View
            key={`${star.left}-${star.top}`}
            style={{
              position: "absolute",
              left: star.left,
              top: star.top,
              width: STAR_SIZE,
              height: STAR_SIZE,
              borderRadius: STAR_SIZE / 2,
              backgroundColor: MOON,
              opacity: fadeOutOnDay,
            }}
          />
        ))}

        <Animated.View
          style={{
            position: "absolute",
            bottom: -1.4 * EM,
            left: -1.1 * EM,
            opacity: progress,
          }}
        >
          <Svg width={CLOUD_SIZE} height={CLOUD_SIZE} viewBox={CLOUD_VIEWBOX}>
            <Path d={CLOUD_PATH} fill={MOON} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            left: PAD,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: thumbColor,
            transform: [{ translateX: thumbX }],
          }}
        >
          {/* Hình tròn "cắn" cùng màu rãnh. Phần nó tràn ra ngoài con trượt trùng
              màu nền nên vô hình — chỉ phần đè lên con trượt là thấy được. */}
          <Animated.View
            style={{
              position: "absolute",
              left: BITE_X,
              top: BITE_Y,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: trackColor,
              opacity: fadeOutOnDay,
            }}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
