import { Pressable, Text, View } from "react-native";

import { shadow } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Thanh tab nổi ở đáy màn chi tiết giải, bám đúng thanh tab của web.
 *
 * Đặt ở đáy chứ không ở đầu màn là quyết định của web, và nó cũng hợp mobile
 * hơn: năm đích bấm nằm trong tầm ngón cái.
 *
 * Mỗi tab cao 48 nên vùng chạm đã vượt 44 mà không cần hitSlop.
 */
export default function TournamentTabBar({ tabs, activeId, onChange }) {
  const colors = useThemeColors();

  return (
    <View className="absolute inset-x-4 bottom-4">
      <View
        style={shadow.overlay}
        className="flex-row gap-1 rounded-2xl bg-navy-900 p-1.5"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          const disabled = Boolean(tab.disabled);

          return (
            <Pressable
              key={tab.id}
              onPress={() => !disabled && onChange(tab.id)}
              disabled={disabled}
              accessibilityLabel={tab.label}
              className={`h-12 flex-1 items-center justify-center gap-1 rounded-xl ${
                active ? "bg-white" : disabled ? "" : "active:bg-white/10"
              }`}
            >
              <tab.Icon
                size={16}
                color={
                  active
                    ? colors.surfaceInverse
                    : disabled
                      ? "rgba(255,255,255,0.2)"
                      : colors.textInverseMuted
                }
              />
              <Text
                numberOfLines={1}
                className={`text-xs ${
                  active
                    ? "font-bold text-navy-900"
                    : disabled
                      ? "text-white/20"
                      : "text-navy-500"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
