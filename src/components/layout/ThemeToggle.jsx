import { Pressable } from "react-native";
import { Moon, Sun } from "lucide-react-native";

import { useThemeStore } from "../../store/themeStore";
import { iconSize } from "../../theme/tokens";
import { useIsDarkMode, useThemeColors } from "../../theme/useThemeColors";

/**
 * Nút đổi Sáng ⇄ Tối trên header, bám nút cùng vai trò ở `Header.jsx` của web.
 *
 * Icon chỉ chỗ SẼ ĐẾN chứ không phải chỗ đang đứng: đang tối thì hiện mặt trời.
 * Đó là quy ước của web, đảo lại thì người dùng quen web sẽ bấm nhầm.
 *
 * Đọc chế độ đang hiển thị THẬT (`useIsDarkMode`) chứ không đọc `mode` trong
 * store. Hai thứ đó khác nhau khi `mode` là `"system"`: lúc đó store không biết
 * máy đang sáng hay tối, mà nút thì phải hiện đúng icon ngay từ lần đầu mở app.
 *
 * Bấm nút luôn ghi ra `"light"` hoặc `"dark"` tường minh, nên sau lần bấm đầu
 * tiên chế độ tự-động-theo-máy không còn áp dụng nữa — cố ý, giống hệt web.
 * `"system"` vẫn là mặc định lúc chưa ai bấm gì, xem `store/themeStore.js`.
 */
export default function ThemeToggle() {
  const colors = useThemeColors();
  const isDark = useIsDarkMode();
  const setMode = useThemeStore((s) => s.setMode);

  const Icon = isDark ? Sun : Moon;

  return (
    <Pressable
      onPress={() => setMode(isDark ? "light" : "dark")}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={
        isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      className="h-10 w-10 items-center justify-center rounded-full active:bg-sunken-strong"
    >
      <Icon size={iconSize.md} color={colors.content} />
    </Pressable>
  );
}
