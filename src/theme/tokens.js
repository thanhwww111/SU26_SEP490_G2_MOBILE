/**
 * Design token dạng JS.
 *
 * NativeWind lo phần `className`, nhưng React Native có những prop chỉ nhận
 * chuỗi màu thật chứ không nhận class: `placeholderTextColor` của TextInput,
 * `color` của icon lucide, `color` của ActivityIndicator... Những chỗ đó dùng
 * file này thay vì gõ hex thẳng vào màn.
 *
 * TỪ 2026-07-29 CÓ HAI BẢNG: sáng và tối. Đừng import `lightColors` /
 * `darkColors` thẳng vào màn — dùng `useThemeColors()` ở `src/theme/useThemeColors.js`,
 * nó tự trả đúng bảng theo chế độ đang bật.
 *
 * Giá trị ở đây PHẢI khớp biến CSS trong `global.css`. Sửa một bên thì sửa cả
 * bên kia, nếu không màu icon sẽ lệch màu chữ ngay cạnh nó.
 *
 * Nguồn gốc màu và quy tắc dùng: docs/mobile/01-design-system.md
 */

/** Màu gốc — không dùng trực tiếp trong màn, hãy dùng token vai trò bên dưới. */
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
 * Màu không đổi giữa hai chế độ.
 *
 * Thương hiệu và trạng thái giữ nguyên để người dùng nhận ra ngay dù đang ở chế
 * độ nào — đỏ vẫn là lỗi, xanh vẫn là thành công.
 */
const constantColors = {
  accent: palette.accent,
  accentPressed: palette.accentPressed,
  gold: palette.gold,

  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  /** Chữ đặt trên khối cố ý tối (hero, footer, drawer) — tối hay sáng đều trắng */
  textInverse: palette.white,
  textInverseMuted: palette.navy500,
  placeholderInverse: "rgba(255,255,255,0.45)",
  borderInverse: "rgba(255,255,255,0.30)",
};

/** Bảng màu chế độ Sáng. Khớp nhánh `:root` trong global.css. */
export const lightColors = {
  ...constantColors,

  canvas: palette.slate50,
  surface: palette.white,
  surfaceRaised: palette.white,
  sunken: palette.slate100,
  sunkenStrong: palette.slate200,
  surfaceInverse: palette.navy900,

  lineSoft: palette.slate100,
  line: palette.slate200,
  lineStrong: palette.slate300,

  content: palette.slate900,
  content2: palette.slate700,
  muted: palette.slate500,
  faint: palette.slate400,
  disabled: palette.slate300,

  /** Màu thương hiệu dùng cho nút chính và icon nổi bật */
  brand: palette.navy700,
  brandPressed: palette.navy600,
};

/**
 * Bảng màu chế độ Tối. Khớp nhánh `.dark:root` trong global.css — SỬA MỘT BÊN
 * THÌ SỬA CẢ HAI, nếu không màu icon sẽ lệch màu chữ ngay cạnh nó.
 *
 * SỬA 2026-08-10: thang cũ tăng độ sáng chủ yếu ở kênh xanh nên càng lên lớp
 * cao càng xanh — hiệu B−R của viền đậm lên tới 59 trong khi web giữ khoảng 24
 * ở mọi lớp, làm app trông "xanh đậm" thay vì "đen sâu".
 *
 * Thang hiện tại pha trắng đều cả ba kênh như web, B−R nằm trong 18–28 xuyên
 * suốt. `canvas` và `surface` lấy đúng giá trị web; chúng cách nhau không nhiều
 * nên VIỀN mới là thứ tách thẻ khỏi nền — web cũng vậy.
 *
 * `brand` phải sáng lên chứ không giữ navy-700: navy đặt trên nền tối gần như
 * chìm hẳn, icon và spinner sẽ không nhìn ra.
 */
export const darkColors = {
  ...constantColors,

  canvas: "#0A1220",
  surface: "#131C2E",
  surfaceRaised: "#1D2739",
  sunken: "#1A2333",
  sunkenStrong: "#232C3D",
  surfaceInverse: "#05090F",

  lineSoft: "#1E2839",
  line: "#2A3446",
  lineStrong: "#3D4759",

  content: "#F8FAFC",
  content2: "#CFD5DE",
  muted: "#9AA2AF",
  /* Đạt đúng 4.5:1 trên nền thẻ — mức AA cho chữ thường. Đừng hạ xuống tối hơn */
  faint: "#7C8491",
  disabled: "#464E5C",

  brand: "#8FB0DC",
  brandPressed: "#A9C4E6",
};

export const themePalettes = { light: lightColors, dark: darkColors };

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
 * bằng viền `border-line` — xem lý do ở docs/mobile/01-design-system.md.
 *
 * Ở chế độ tối bóng gần như không thấy (đen trên đen); lớp nổi lúc đó nhận biết
 * bằng nền sáng hơn nền trang, không phải bằng bóng.
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

export default { lightColors, darkColors, themePalettes, iconSize, shadow, scrim };
