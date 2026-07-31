import { createContext, useContext } from "react";
import { useColorScheme } from "nativewind";

import { themePalettes } from "./tokens";

/**
 * Khoá bảng màu cho một cây con, bất kể app đang ở chế độ nào.
 *
 * `null` = không khoá, đi theo chế độ chung. Nhóm `(auth)` đặt giá trị `"light"`
 * ở đây — xem `LightThemeScope`.
 */
export const ThemeLockContext = createContext(null);

/**
 * Bảng màu đang có hiệu lực, dùng cho những prop chỉ nhận chuỗi màu:
 * `color` của icon lucide, `placeholderTextColor`, `ActivityIndicator`.
 *
 * ```jsx
 * const colors = useThemeColors();
 * <ChevronLeft size={iconSize.lg} color={colors.brand} />
 * ```
 *
 * Đọc chế độ từ `useColorScheme` của NativeWind chứ không tự tính từ
 * `Appearance` của React Native: NativeWind mới là nơi biết người dùng có đè
 * thủ công hay không, và dùng chung một nguồn thì màu của icon không bao giờ
 * lệch pha với màu của `className` ngay cạnh nó.
 *
 * Hook này CÓ tôn trọng vùng khoá. Cần vậy vì `vars()` của NativeWind chỉ ghi
 * đè được `className`; nếu hook không biết mình đang nằm trong vùng khoá thì
 * icon sẽ lấy màu tối trong khi nền quanh nó vẫn sáng.
 */
export const useThemeColors = () => {
  const locked = useContext(ThemeLockContext);
  const { colorScheme } = useColorScheme();

  if (locked) return themePalettes[locked];
  return colorScheme === "dark" ? themePalettes.dark : themePalettes.light;
};

/** Tiện cho chỗ chỉ cần biết đang tối hay sáng (StatusBar, chọn ảnh minh hoạ). */
export const useIsDarkMode = () => {
  const locked = useContext(ThemeLockContext);
  const { colorScheme } = useColorScheme();

  if (locked) return locked === "dark";
  return colorScheme === "dark";
};

export default useThemeColors;
