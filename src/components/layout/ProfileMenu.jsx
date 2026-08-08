import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import {
  CreditCard,
  FileText,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Swords,
  User,
} from "lucide-react-native";

import { ROLES } from "../../constants/auth";
import { normalizeRole } from "../../utils/auth";
import { useOverlay } from "./useOverlay";
import { useThemeStore } from "../../store/themeStore";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Ba mục riêng của player, khai đúng PLAYER_MENU của Header web.
 * path null = màn chưa dựng trên mobile, xử lý y như bên navItems.js.
 */
const PLAYER_MENU = [
  { key: "registrations", label: "Đăng ký của tôi", path: "/(app)/my-registrations", Icon: FileText },
  { key: "matches", label: "Lịch thi đấu", path: "/(app)/matches", Icon: Swords },
  { key: "payments", label: "Lịch sử thanh toán", path: "/(app)/payments", Icon: CreditCard },
];

/**
 * Menu xổ ra khi bấm icon hồ sơ ở góc phải header, bám dropdown của Header web.
 *
 * Đặt trong phần body của layout nên mép trên của nó đã nằm ngay dưới header —
 * không phải cộng chiều cao header với safe area inset như trước nữa.
 *
 * Không dùng <Modal> vì lý do nêu ở useOverlay.js.
 */
/**
 * Ba chế độ giao diện, xếp theo đúng thứ tự chạm để xoay vòng:
 * Tự động → Sáng → Tối → Tự động.
 *
 * Web chỉ có hai trạng thái bật/tắt; mobile thêm "Tự động" vì trên điện thoại
 * người dùng hay bật dark mode toàn máy theo giờ.
 *
 * Gộp thành MỘT dòng trong menu chứ không tách thành khối ba nút riêng: menu
 * này toàn là dòng chạm-để-làm-gì-đó, một khối lựa chọn nằm chen vào giữa làm
 * gãy nhịp đọc và chiếm chỗ gấp ba.
 */
const THEME_CYCLE = [
  { mode: "system", label: "Tự động", Icon: Monitor },
  { mode: "light", label: "Sáng", Icon: Sun },
  { mode: "dark", label: "Tối", Icon: Moon },
];

export default function ProfileMenu({ visible, onClose, user, onNavigate, onLogout }) {
  const colors = useThemeColors();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const { mounted, progress } = useOverlay(visible, 140);

  if (!mounted) return null;

  // Web chỉ cho player thấy ba mục đăng ký / lịch thi đấu / thanh toán
  const isPlayer = normalizeRole(user?.role) === ROLES.PLAYER;

  // Bung ra từ phía nút hồ sơ thay vì hiện đứng yên
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  const renderItem = ({ key, label, path, Icon }) => {
    const disabled = !path;
    return (
      <Pressable
        key={key}
        disabled={disabled}
        onPress={() => onNavigate(path)}
        className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-sunken"
      >
        <Icon size={15} color={disabled ? colors.disabled : colors.content2} />
        <Text className={`text-[13px] ${disabled ? "text-disabled" : "text-content-2"}`}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const themeIndex = Math.max(
    0,
    THEME_CYCLE.findIndex((choice) => choice.mode === themeMode)
  );
  const theme = THEME_CYCLE[themeIndex];
  const nextTheme = THEME_CYCLE[(themeIndex + 1) % THEME_CYCLE.length];

  // Không đóng menu sau khi đổi: người dùng thường chạm vài lần để so sánh
  // sáng/tối, đóng lại mỗi lần thì phải mở menu ba lượt mới xem hết
  const cycleTheme = () => setThemeMode(nextTheme.mode);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable className="flex-1 bg-black/20" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          opacity: progress,
          transform: [{ translateY }, { scale }],
        }}
      >
        {/* Nền sáng hơn thẻ bên dưới — xem ghi chú cùng chỗ trong AppDrawer */}
        <View className="w-56 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg">
          {/* Header mobile chỉ có icon tròn, không hiện tên như web —
              nên tên và email để ở đây, bằng không không biết đang là ai. */}
          <View className="border-b border-line-soft px-3 py-2.5">
            <Text numberOfLines={1} className="text-[13px] font-semibold text-content">
              {user?.fullName || user?.email || "Người dùng"}
            </Text>
            {user?.email ? (
              <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted">
                {user.email}
              </Text>
            ) : null}
          </View>

          {renderItem({
            key: "profile",
            label: "Hồ sơ",
            path: "/(app)/profile",
            Icon: User,
          })}

          {isPlayer ? (
            <>
              <View className="h-px bg-sunken" />
              {PLAYER_MENU.map(renderItem)}
            </>
          ) : null}

          <View className="h-px bg-sunken" />

          {/* Giao diện: một dòng như mọi mục khác, chạm để xoay vòng trạng thái.
              Trạng thái hiện tại nằm bên phải để biết đang ở chế độ nào mà
              không phải mở thêm gì. */}
          <Pressable
            onPress={cycleTheme}
            accessibilityRole="button"
            accessibilityLabel={`Giao diện: ${theme.label}. Chạm để chuyển sang ${nextTheme.label}`}
            className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-sunken"
          >
            <theme.Icon size={15} color={colors.content2} />
            <Text className="flex-1 text-[13px] text-content-2">Giao diện</Text>
            <Text className="text-[13px] font-semibold text-accent">
              {theme.label}
            </Text>
          </Pressable>

          <View className="h-px bg-sunken" />

          <Pressable
            onPress={onLogout}
            className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-tint-danger"
          >
            <LogOut size={15} color={colors.danger} />
            <Text className="text-[13px] text-danger">Đăng xuất</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
