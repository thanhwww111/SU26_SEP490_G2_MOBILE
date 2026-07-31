import { View } from "react-native";
import { vars } from "nativewind";

import { lightColors } from "./tokens";
import { ThemeLockContext } from "./useThemeColors";

/**
 * Ghi đè biến màu về bản Sáng cho biến CSS (`className`)...
 *
 * `vars()` trả về một object style, và biến khai trong đó có hiệu lực với mọi
 * component con — đúng như biến CSS trên web.
 */
const LIGHT_VARS = vars({
  "--c-canvas": lightColors.canvas,
  "--c-surface": lightColors.surface,
  "--c-sunken": lightColors.sunken,
  "--c-sunken-strong": lightColors.sunkenStrong,

  "--c-line-soft": lightColors.lineSoft,
  "--c-line": lightColors.line,
  "--c-line-strong": lightColors.lineStrong,

  "--c-content": lightColors.content,
  "--c-content-2": lightColors.content2,
  "--c-muted": lightColors.muted,
  "--c-faint": lightColors.faint,
  "--c-disabled": lightColors.disabled,

  "--c-tint-danger": "#fef2f2",
  "--c-tint-success": "#ecfdf5",
  "--c-tint-warning": "#fffbeb",
});

/**
 * Khoá cả cây con ở chế độ Sáng, bất kể app đang Sáng hay Tối.
 *
 * Dùng cho nhóm màn `(auth)`: nhóm đã chốt dark mode chỉ áp cho phần đã đăng
 * nhập, nhưng `Input` / `Button` / `FormError` lại dùng chung với phần `(app)`.
 * Không khoá thì màn đăng nhập sẽ thành nửa sáng nửa tối.
 *
 * PHẢI khoá cả hai đường màu mới đủ:
 * - `vars()` lo phần `className`;
 * - `ThemeLockContext` lo phần màu truyền qua prop JS (icon, spinner,
 *   placeholder), vì `vars()` không với tới được chúng.
 *
 * Muốn mở dark mode cho auth sau này thì bỏ component này ở
 * `app/(auth)/_layout.jsx`, không phải sửa từng màn.
 */
export default function LightThemeScope({ children, className = "flex-1" }) {
  return (
    <ThemeLockContext.Provider value="light">
      <View style={LIGHT_VARS} className={className}>
        {children}
      </View>
    </ThemeLockContext.Provider>
  );
}
