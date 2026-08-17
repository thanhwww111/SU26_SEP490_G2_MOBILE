import { Pressable, Text, View } from "react-native";
import {
  ArrowLeftRight,
  Pause,
  Play,
  PlusCircle,
  RotateCcw,
  Timer,
  TimerOff,
} from "lucide-react-native";

import { WARNING_SECONDS } from "../../utils/shotClock";
import { iconSize } from "../../theme/tokens";

/**
 * Hàng nút điều khiển đồng hồ, đặt ở đáy màn chấm điểm. Bám `ShotClockControls` của
 * `FE/src/components/staff/ShotClock.jsx`.
 *
 * Nằm trên nền tối cố ý nên dùng màu tuyệt đối, không dùng token vai trò.
 *
 * Mọi nút cao 44 — mức tối thiểu ở `docs/mobile/01-design-system.md`, Phần 8. Trọng tài bấm
 * những nút này giữa lúc nhìn bàn chứ không nhìn màn hình, nên đây là chỗ không được thu nhỏ.
 */

const CTRL = "h-11 flex-row items-center justify-center gap-1.5 rounded-xl px-3.5";

const ControlButton = ({ label, Icon, iconColor, onPress, disabled, className, textClassName }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    className={`${CTRL} ${className} ${disabled ? "opacity-35" : ""}`}
  >
    {Icon ? <Icon size={iconSize.md} color={iconColor} /> : null}
    {label ? <Text className={`text-sm font-semibold ${textClassName}`}>{label}</Text> : null}
  </Pressable>
);

export default function ShotClockControls({ clock, disabled }) {
  if (!clock.enabled) {
    return (
      <ControlButton
        label="Bật đồng hồ"
        Icon={Timer}
        iconColor="#CBD5E1"
        onPress={() => clock.setEnabled(true)}
        className="border border-white/15 bg-white/[0.06]"
        textClassName="text-slate-300"
      />
    );
  }

  return (
    <View className="flex-row flex-wrap items-center justify-center gap-2">
      <ControlButton
        label={clock.running ? "Tạm dừng" : "Chạy giờ"}
        Icon={clock.running ? Pause : Play}
        iconColor={clock.running ? "#FCD34D" : "#0A0E14"}
        onPress={clock.toggleRun}
        disabled={disabled}
        className={clock.running ? "border border-amber-400/30 bg-amber-400/15" : "bg-emerald-500"}
        textClassName={clock.running ? "text-amber-300" : "text-[#0A0E14]"}
      />

      <ControlButton
        label="Chuyển lượt"
        Icon={ArrowLeftRight}
        iconColor="#E2E8F0"
        onPress={clock.switchTurn}
        disabled={disabled}
        className="border border-white/15 bg-white/[0.06]"
        textClassName="text-slate-200"
      />

      <ControlButton
        label="+30s"
        Icon={PlusCircle}
        iconColor="#7DD3FC"
        onPress={clock.grantExtension}
        disabled={disabled || !clock.canExtend}
        className="border border-sky-400/30 bg-sky-500/15"
        textClassName="text-sky-300"
      />

      <ControlButton
        label="Đặt lại"
        Icon={RotateCcw}
        iconColor="#94A3B8"
        onPress={clock.resetShot}
        disabled={disabled}
        className="border border-white/10 bg-white/[0.06]"
        textClassName="text-slate-400"
      />

      <ControlButton
        Icon={TimerOff}
        iconColor="#64748B"
        label=""
        onPress={() => clock.setEnabled(false)}
        className="border border-white/10 bg-white/[0.04] px-3"
      />
    </View>
  );
}

/** Dòng nhắc luật, hiện ngay dưới hàng nút — giống `ShotClockRuleHint` của web. */
export function ShotClockRuleHint({ clock }) {
  return (
    <Text className="text-center text-xs text-slate-500">
      30s/cú · cú mở ván 60s · mỗi cơ thủ 1 lần +30s mỗi ván · còn {WARNING_SECONDS}s sẽ rung ·
      hết giờ là lỗi, mất lượt
      {clock.extensionUsed[clock.turnSlot] ? " · đã dùng gia hạn" : ""}
    </Text>
  );
}
