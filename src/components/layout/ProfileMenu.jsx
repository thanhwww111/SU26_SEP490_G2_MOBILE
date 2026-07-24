import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, User } from "lucide-react-native";

import { useOverlay } from "./useOverlay";

/** Chiều cao header trong AppHeader (h-14) */
const HEADER_HEIGHT = 56;

/**
 * Menu xổ ra khi bấm icon hồ sơ ở góc phải header, bám dropdown của Header web.
 *
 * Là View absolute phủ cả màn chứ không phải View absolute đặt trong header:
 * header cao cố định nên dropdown đặt bên trong sẽ bị cắt. Không dùng <Modal>
 * vì lý do nêu ở useOverlay.js.
 *
 * Lớp phủ nằm ngoài SafeAreaView của layout, còn header thì nằm sau safe area —
 * không cộng inset thì dropdown đè lên header trên máy có notch.
 *
 * Ba mục dành cho player (đăng ký của tôi, lịch thi đấu, lịch sử thanh toán)
 * chưa có màn trên mobile nên chưa đưa vào.
 */
export default function ProfileMenu({ visible, onClose, user, onProfile, onLogout }) {
  const insets = useSafeAreaInsets();
  const { mounted, progress } = useOverlay(visible, 140);

  if (!mounted) return null;

  // Bung ra từ phía nút hồ sơ thay vì hiện đứng yên
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable className="flex-1 bg-black/20" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: insets.top + HEADER_HEIGHT + 4,
          right: 8,
          opacity: progress,
          transform: [{ translateY }, { scale }],
        }}
      >
        <View className="w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
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

          <Pressable
            onPress={onProfile}
            className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-slate-50"
          >
            <User size={15} color="#334155" />
            <Text className="text-[13px] text-slate-700">Hồ sơ</Text>
          </Pressable>

          <Pressable
            onPress={onLogout}
            className="flex-row items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 active:bg-red-50"
          >
            <LogOut size={15} color="#dc2626" />
            <Text className="text-[13px] text-red-600">Đăng xuất</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
