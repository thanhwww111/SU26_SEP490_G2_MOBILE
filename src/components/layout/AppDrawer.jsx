import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { READY_NAV_ITEMS } from "./navItems";
import { useOverlay } from "./useOverlay";

/** Hẹp hơn khung 390px kha khá, để phần nền tối phía sau vẫn đủ rộng mà bấm đóng */
const PANEL_WIDTH = 264;

/**
 * Navbar dạng drawer trượt từ trái, thay cho thanh ngang 6 mục của web
 * (màn hình điện thoại không đủ chỗ nằm ngang).
 *
 * Là View absolute chứ không phải <Modal> — lý do xem useOverlay.js.
 * Vì nằm ngoài SafeAreaView của layout nên tự chèn inset lấy phần tai thỏ.
 *
 * Chỉ render mục đã có màn — xem cờ `ready` trong navItems.js.
 */
export default function AppDrawer({ visible, onClose, onNavigate, activeKey }) {
  const { mounted, progress } = useOverlay(visible);

  if (!mounted) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-PANEL_WIDTH, 0],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        {/* Chạm ra ngoài để đóng */}
        <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{ width: PANEL_WIDTH, height: "100%", transform: [{ translateX }] }}
      >
        <View className="h-full rounded-r-2xl bg-white shadow-lg">
          <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
            <View className="h-12 flex-row items-center justify-between pl-4 pr-2">
              <Text className="text-base font-black uppercase italic tracking-tighter text-navy-700">
                capstone<Text className="text-accent">.</Text>
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="h-8 w-8 items-center justify-center rounded-full active:bg-slate-100"
              >
                <X size={17} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView contentContainerClassName="pb-2">
              {READY_NAV_ITEMS.map(({ key, label, path, Icon }) => {
                const active = key === activeKey;
                return (
                  <Pressable
                    key={key}
                    onPress={() => onNavigate(path)}
                    // Viền trái luôn có mặt, chỉ đổi màu — để chữ không nhích
                    // ngang mỗi lần đổi mục đang chọn.
                    className={`flex-row items-center gap-2.5 border-l-[3px] px-3 py-2.5 ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-transparent active:bg-slate-50"
                    }`}
                  >
                    <Icon size={17} color={active ? "#e8471a" : "#64748b"} />
                    <Text
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        active ? "text-accent" : "text-slate-700"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Animated.View>
    </View>
  );
}
