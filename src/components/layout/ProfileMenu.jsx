import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { CreditCard, FileText, LogOut, User } from "lucide-react-native";

import { ROLES } from "../../constants/auth";
import { normalizeRole } from "../../utils/auth";
import { useOverlay } from "./useOverlay";

/**
 * Ba mục riêng của player, khai đúng PLAYER_MENU của Header web.
 * path null = màn chưa dựng trên mobile, xử lý y như bên navItems.js.
 */
const PLAYER_MENU = [
  { key: "registrations", label: "Đăng ký của tôi", path: null, Icon: FileText },
  { key: "matches", label: "Lịch thi đấu", path: null, Icon: FileText },
  { key: "payments", label: "Lịch sử thanh toán", path: null, Icon: CreditCard },
];

/**
 * Menu xổ ra khi bấm icon hồ sơ ở góc phải header, bám dropdown của Header web.
 *
 * Đặt trong phần body của layout nên mép trên của nó đã nằm ngay dưới header —
 * không phải cộng chiều cao header với safe area inset như trước nữa.
 *
 * Không dùng <Modal> vì lý do nêu ở useOverlay.js.
 */
export default function ProfileMenu({ visible, onClose, user, onNavigate, onLogout }) {
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
        className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-slate-50"
      >
        <Icon size={15} color={disabled ? "#cbd5e1" : "#334155"} />
        <Text className={`text-[13px] ${disabled ? "text-slate-300" : "text-slate-700"}`}>
          {label}
        </Text>
      </Pressable>
    );
  };

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
        <View className="w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Header mobile chỉ có icon tròn, không hiện tên như web —
              nên tên và email để ở đây, bằng không không biết đang là ai. */}
          <View className="border-b border-slate-100 px-3 py-2.5">
            <Text numberOfLines={1} className="text-[13px] font-semibold text-slate-900">
              {user?.fullName || user?.email || "Người dùng"}
            </Text>
            {user?.email ? (
              <Text numberOfLines={1} className="mt-0.5 text-[11px] text-slate-500">
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
              <View className="h-px bg-slate-100" />
              {PLAYER_MENU.map(renderItem)}
            </>
          ) : null}

          <View className="h-px bg-slate-100" />

          <Pressable
            onPress={onLogout}
            className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-red-50"
          >
            <LogOut size={15} color="#dc2626" />
            <Text className="text-[13px] text-red-600">Đăng xuất</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
