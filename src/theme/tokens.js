/**
 * Design token dạng JS.
 *
 * NativeWind lo phần `className`, nhưng React Native có những prop chỉ nhận
 * chuỗi màu thật chứ không nhận class: `placeholderTextColor` của TextInput,
 * `color` của icon lucide, `color` của ActivityIndicator, `barStyle` của
 * StatusBar... Những chỗ đó dùng file này thay vì gõ hex thẳng vào màn.
 *
 * Giá trị ở đây PHẢI khớp `tailwind.config.js`. Sửa một bên thì sửa cả bên kia,
 * nếu không màu icon sẽ lệch màu chữ ngay cạnh nó.
 *
 * Nguồn gốc màu và lý do chọn: docs/mobile/01-design-system.md
 */

/** Màu gốc — không dùng trực tiếp trong màn, hãy dùng `colors` bên dưới. */
const palette = {
  navy900: "#0D1B2E",
  navy800: "#1E2D4A",
  navy700: "#1A2A4A",
  navy600: "#243660",
  navy500: "#8A99B5",

  accent: "#EF342A",
  accentPressed: "#C92A21",

  gold: "#C9A227",

  white: "#FFFFFF",

  // Thang slate của Tailwind — web dùng đúng thang này nên mobile không tự chế xám riêng
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0F172A",

  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
};

/**
 * Token theo vai trò.
 *
 * Màn hình chỉ được dùng nhóm này, không đọc `palette`. Nhờ vậy khi làm Dark
 * Mode chỉ cần đổi giá trị ở đây, không phải đi sửa từng màn.
 */
export const colors = {
  /** Nền màn và nền khối */
  surface: palette.white,
  surfaceAlt: palette.slate50,
  surfaceSunken: palette.slate100,
  surfaceInverse: palette.navy900,

  /** Đường kẻ, viền ô nhập, viền card */
  border: palette.slate200,
  borderStrong: palette.slate300,
  borderInverse: "rgba(255,255,255,0.30)",

  /** Chữ trên nền sáng */
  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate500,
  textPlaceholder: palette.slate400,
  textDisabled: palette.slate300,

  /** Chữ trên nền tối (hero, footer, section tối) */
  textInverse: palette.white,
  textInverseMuted: palette.navy500,
  placeholderInverse: "rgba(255,255,255,0.45)",

  /** Thương hiệu */
  brand: palette.navy700,
  brandPressed: palette.navy600,
  accent: palette.accent,
  accentPressed: palette.accentPressed,
  gold: palette.gold,

  /** Trạng thái */
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
};

/**
 * Kích thước icon lucide. Dùng số rời rạc để icon giữa các màn không so le
 * nhau kiểu 17 / 18 / 19.
 */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Bóng đổ.
 *
 * RN không có `box-shadow`: iOS đọc shadowColor/Offset/Opacity/Radius, Android
 * chỉ đọc `elevation`. Vì vậy bóng phải khai báo bằng object style, không dùng
 * được class `shadow-*` của Tailwind.
 *
 * Chỉ hai cấp, và chỉ dùng cho lớp NỔI trên nội dung. Card thường tách khối
 * bằng viền `border-slate-200` — xem lý do ở docs/mobile/01-design-system.md.
 */
export const shadow = {
  /** Lớp dính mép màn: header khi cuộn, thanh hành động dưới đáy */
  raised: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  /** Lớp phủ: drawer, modal, bottom sheet */
  overlay: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
};

/** Màu nền lớp mờ phía sau drawer / modal. */
export const scrim = "rgba(15,23,42,0.45)";

export default { colors, iconSize, shadow, scrim };
