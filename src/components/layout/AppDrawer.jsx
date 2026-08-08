import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { NAV_ITEMS } from "./navItems";
import { useOverlay } from "./useOverlay";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Navbar dạng menu xổ từ nút hamburger bên trái, thay cho thanh ngang 6 mục của
 * web (màn hình điện thoại không đủ chỗ nằm ngang).
 *
 * Dùng CHUNG khuôn với ProfileMenu bên phải: cùng thẻ nổi bo góc, cùng cỡ chữ,
 * cùng khoảng đệm, cùng kiểu bung ra. Trước đây đây là panel cao hết màn hình
 * trượt từ mép trái — hai lớp phủ mở ra từ cùng một thanh header mà trông như
 * hai thành phần của hai app khác nhau.
 *
 * Đặt trong phần body của layout chứ không phủ cả màn: header vẫn hiện, nên bấm
 * lại hamburger là đóng được và người dùng không mất phương hướng.
 *
 * Là View absolute chứ không phải <Modal> — lý do xem useOverlay.js.
 */
export default function AppDrawer({ visible, onClose, onNavigate, activeKey }) {
  const colors = useThemeColors();
  const { mounted, progress } = useOverlay(visible, 140);

  if (!mounted) return null;

  // Bung ra từ phía nút hamburger thay vì hiện đứng yên — giống ProfileMenu
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        {/* Chạm ra ngoài để đóng */}
        <Pressable className="flex-1 bg-black/20" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          opacity: progress,
          transform: [{ translateY }, { scale }],
        }}
      >
        {/* `surface-raised` chứ không phải `surface`: ở chế độ tối lớp phủ nhận
            biết bằng nền sáng hơn nội dung phía dưới, vì bóng đen không hiện */}
        <View className="w-56 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg">
          {NAV_ITEMS.map(({ key, label, path, Icon }, index) => {
            const active = key === activeKey;
            const disabled = !path;

            const textClass = active
              ? "font-semibold text-accent"
              : disabled
                ? "text-disabled"
                : "text-content-2";

            const iconColor = active
              ? colors.accent
              : disabled
                ? colors.disabled
                : colors.content2;

            return (
              <View key={key}>
                {/* Kẻ mảnh giữa các dòng, đúng kiểu ProfileMenu dùng để tách nhóm */}
                {index > 0 ? <View className="h-px bg-sunken" /> : null}

                <Pressable
                  disabled={disabled}
                  onPress={() => onNavigate(path)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled }}
                  className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-sunken"
                >
                  <Icon size={15} color={iconColor} />
                  <Text numberOfLines={1} className={`flex-1 text-[13px] ${textClass}`}>
                    {label}
                  </Text>

                  {/* Chấm accent thay cho vạch dọc bên trái: nó nằm gọn trong
                      dòng nên không làm chữ nhích ngang khi đổi mục đang chọn */}
                  {active ? (
                    <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}
