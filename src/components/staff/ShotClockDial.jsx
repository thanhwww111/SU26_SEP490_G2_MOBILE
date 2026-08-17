import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Pause, Zap } from "lucide-react-native";

/**
 * Mặt đồng hồ đếm ngược đặt giữa hai bảng điểm. Bám `ShotClockDial` của
 * `FE/src/components/staff/ShotClock.jsx` — cùng công thức vòng cung, cùng ngưỡng đổi màu.
 *
 * Web vẽ bằng `<svg>` và xoay bằng class `-rotate-90`; ở đây xoay bằng thuộc tính `transform`
 * của `react-native-svg` (đã có trong deps, không cài thêm gì).
 *
 * Khối này nằm trên nền tối cố ý (giống web `#0a0e14`) nên dùng màu tuyệt đối chứ không dùng
 * token vai trò — xem ngoại lệ ở `docs/mobile/01-design-system.md`, Phần 9.
 */

const STROKE = 7;
const WARNING_COLOR = "#EF4444";
const WARNING_TEXT = "#FECACA";

export default function ShotClockDial({
  remainingSeconds,
  totalSeconds,
  accent,
  running,
  isWarning,
  isBreakShot,
  size = 112,
}) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = totalSeconds > 0 ? Math.min(1, remainingSeconds / totalSeconds) : 0;
  const color = isWarning ? WARNING_COLOR : accent;

  return (
    <View
      className="items-center justify-center rounded-full bg-[#070B11]"
      style={{ width: size, height: size }}
      accessibilityRole="timer"
      accessibilityLabel={`Còn ${remainingSeconds} giây`}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={STROKE}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Chỉ con số: mọi nhãn chữ đều rộng hơn mặt đồng hồ và sẽ tràn viền. Trạng thái dừng và
          cú mở ván thể hiện bằng biểu tượng nhỏ bên dưới, đúng như web. */}
      <Text
        className="font-black"
        style={{
          fontSize: Math.round(size * 0.38),
          lineHeight: Math.round(size * 0.42),
          color: isWarning ? WARNING_TEXT : running ? "#FFFFFF" : "rgba(255,255,255,0.6)",
        }}
      >
        {remainingSeconds}
      </Text>

      {!running ? (
        <Pause size={Math.round(size * 0.13)} color="rgba(255,255,255,0.45)" fill="rgba(255,255,255,0.45)" />
      ) : isBreakShot ? (
        <Zap size={Math.round(size * 0.13)} color={color} fill={color} />
      ) : null}
    </View>
  );
}
