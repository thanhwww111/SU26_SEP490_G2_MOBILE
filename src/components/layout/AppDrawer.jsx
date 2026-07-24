import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { NAV_ITEMS } from "./navItems";
import { useOverlay } from "./useOverlay";

/** Đủ chỗ cho nhãn dài nhất ("Tỷ Số Trực Tiếp") mà vẫn chừa nền tối để bấm đóng */
const PANEL_WIDTH = 232;

/**
 * Navbar dạng drawer trượt từ trái, thay cho thanh ngang 6 mục của web
 * (màn hình điện thoại không đủ chỗ nằm ngang).
 *
 * Đặt trong phần body của layout chứ không phủ cả màn: header vẫn hiện, nên
 * bấm lại hamburger là đóng được và người dùng không mất phương hướng. Cũng vì
 * thế panel không cần thanh tiêu đề logo + nút X riêng nữa.
 *
 * Là View absolute chứ không phải <Modal> — lý do xem useOverlay.js.
 */
export default function AppDrawer({ visible, onClose, onNavigate, activeKey }) {
  const { mounted, progress } = useOverlay(visible);

  if (!mounted) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-PANEL_WIDTH, 0],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        {/* Chạm ra ngoài để đóng */}
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{ width: PANEL_WIDTH, height: "100%", transform: [{ translateX }] }}
      >
        <View className="h-full border-r border-slate-200 bg-white">
          <ScrollView contentContainerClassName="py-1.5">
            {NAV_ITEMS.map(({ key, label, path, Icon }) => {
              const active = key === activeKey;
              const disabled = !path;

              return (
                <Pressable
                  key={key}
                  disabled={disabled}
                  onPress={() => onNavigate(path)}
                  // Viền trái luôn có mặt, chỉ đổi màu — để chữ không nhích
                  // ngang mỗi lần đổi mục đang chọn.
                  className={`flex-row items-center gap-2.5 border-l-[3px] px-3 py-2.5 ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-transparent active:bg-slate-50"
                  }`}
                >
                  <Icon
                    size={16}
                    color={active ? "#e8471a" : disabled ? "#cbd5e1" : "#64748b"}
                  />
                  <Text
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      active
                        ? "text-accent"
                        : disabled
                          ? "text-slate-300"
                          : "text-slate-700"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
