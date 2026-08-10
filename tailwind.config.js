/** @type {import('tailwindcss').Config} */

/*
 * Bảng màu bám nhận diện của FE web. Chi tiết nguồn gốc từng màu và quy tắc
 * dùng: docs/mobile/01-design-system.md
 *
 * Giá trị ở đây phải khớp src/theme/tokens.js — sửa một bên thì sửa cả hai,
 * nếu không màu icon (đọc từ tokens.js) sẽ lệch màu chữ (đọc từ file này).
 *
 * Màu trung tính KHÔNG định nghĩa lại ở đây: web dùng đúng thang `slate` mặc
 * định của Tailwind, nên mobile dùng thẳng slate-50 → slate-900.
 */

const plugin = require("tailwindcss/plugin");

/*
 * Ánh xạ độ đậm → tên font, vì React Native không tự chọn được.
 *
 * Trên web, `font-bold` chỉ cần đặt `font-weight: 700` rồi trình duyệt tìm bản
 * đậm trong cùng họ font. React Native không làm vậy: font nạp lúc chạy (bắt
 * buộc, vì Expo Go không cho nhúng font ở tầng native) thì MỖI ĐỘ ĐẬM LÀ MỘT
 * HỌ RIÊNG. Đặt `font-weight: 700` lên `BeVietnamPro_400Regular` chỉ khiến iOS
 * tự bôi đậm giả, nét bết lại.
 *
 * Nên các lớp `font-*` ở đây bị ghi đè để đổi `fontFamily` thay vì `fontWeight`,
 * và `fontWeight` bị ép về "normal" để chặn bôi đậm giả. Nhờ vậy 190 chỗ đang
 * gõ `font-bold` / `font-black` trong repo không phải sửa một dòng nào.
 *
 * `font-black` (900) cố tình trỏ tới bản 800: web chỉ nạp Be Vietnam Pro tới
 * weight 800, nên 900 trên web vốn đã rơi xuống 800.
 */
const SANS = {
  normal: "BeVietnamPro_400Regular",
  medium: "BeVietnamPro_500Medium",
  semibold: "BeVietnamPro_600SemiBold",
  bold: "BeVietnamPro_700Bold",
  extrabold: "BeVietnamPro_800ExtraBold",
  italic: "BeVietnamPro_400Regular_Italic",
  boldItalic: "BeVietnamPro_700Bold_Italic",
};

/*
 * Tiêu đề. Web đặt `font-style: italic` cho h1–h6 và dùng Oswald 500.
 *
 * Oswald KHÔNG có bản nghiêng thật. Trên web trình duyệt tự nghiêng lấy
 * (synthetic oblique, mặc định 14 độ); React Native thì bỏ qua `fontStyle` với
 * font nạp lúc chạy, chữ vẫn đứng thẳng. Nên nghiêng bằng `skewX` đúng góc mà
 * trình duyệt dùng — cùng một phép biến hình, ra cùng một kết quả.
 */
const DISPLAY_SKEW = "skewX(-14deg)";

const DISPLAY = {
  normal: "Oswald_500Medium",
  bold: "Oswald_600SemiBold",
};

const fontPlugin = plugin(({ addUtilities, theme }) => {
  /*
   * 1) Font mặc định gắn kèm từng bậc cỡ chữ.
   *
   * React Native không có kế thừa font: `<Text>` nằm trong `<View>` đã đặt font
   * vẫn ra font hệ thống. Mà gần như mọi `<Text>` trong repo đều có một lớp
   * `text-*`, nên đây là chỗ móc vào rẻ nhất để phủ hết những chỗ không gõ
   * `font-*`.
   */
  const sizeUtilities = {};

  Object.entries(theme("fontSize")).forEach(([name, value]) => {
    const [size, extra] = Array.isArray(value) ? value : [value, {}];

    sizeUtilities[`.text-${name}`] = {
      fontSize: size,
      ...(extra?.lineHeight ? { lineHeight: extra.lineHeight } : {}),
      ...(extra?.letterSpacing ? { letterSpacing: extra.letterSpacing } : {}),
      fontFamily: SANS.normal,
    };
  });

  addUtilities(sizeUtilities);

  /*
   * 2) Độ đậm. Phải khai báo SAU nhóm cỡ chữ ở trên: hai nhóm cùng nằm trong
   * layer utilities và cùng độ ưu tiên, nên cái viết sau thắng.
   */
  addUtilities({
    ".font-normal": { fontFamily: SANS.normal, fontWeight: "normal" },
    ".font-medium": { fontFamily: SANS.medium, fontWeight: "normal" },
    ".font-semibold": { fontFamily: SANS.semibold, fontWeight: "normal" },
    ".font-bold": { fontFamily: SANS.bold, fontWeight: "normal" },
    ".font-extrabold": { fontFamily: SANS.extrabold, fontWeight: "normal" },
    ".font-black": { fontFamily: SANS.extrabold, fontWeight: "normal" },

    /* Nghiêng phải là họ font riêng chứ không phải `font-style: italic` — đặt
       fontStyle lên font không có bản nghiêng thì iOS làm nghiêng giả. */
    ".font-italic": {
      fontFamily: SANS.italic,
      fontStyle: "normal",
      fontWeight: "normal",
    },
    ".font-bold-italic": {
      fontFamily: SANS.boldItalic,
      fontStyle: "normal",
      fontWeight: "normal",
    },

    /* Tiêu đề màn và logo — thay cho `font-black uppercase italic` kiểu cũ.
       Nghiêng sẵn trong lớp, khỏi phải nhớ gõ kèm gì. */
    ".font-display": {
      fontFamily: DISPLAY.normal,
      fontStyle: "normal",
      fontWeight: "normal",
      transform: DISPLAY_SKEW,
    },
    ".font-display-bold": {
      fontFamily: DISPLAY.bold,
      fontStyle: "normal",
      fontWeight: "normal",
      transform: DISPLAY_SKEW,
    },

    /* Bản đứng thẳng, cho chỗ nghiêng gây hại: chữ dài sát mép màn (nghiêng ăn
       lẹm sang hai bên), hoặc tiêu đề nằm trong ô hẹp có cắt nội dung */
    ".font-display-upright": {
      fontFamily: DISPLAY.normal,
      fontStyle: "normal",
      fontWeight: "normal",
    },
  });
});

module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  // "class" = do app tự quyết chế độ qua colorScheme của NativeWind, thay vì
  // bám cứng cài đặt hệ thống. Cần vậy để người dùng đè thủ công Sáng/Tối được;
  // muốn theo hệ thống thì gọi colorScheme.set("system") — xem src/store/themeStore.js
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /*
         * Token theo VAI TRÒ — giá trị thật nằm ở global.css, tự đổi theo chế độ
         * sáng/tối. Màn hình dùng nhóm này thay cho slate-* và white, nhờ vậy
         * không phải viết `dark:` ở từng chỗ.
         *
         * Không đặt dạng `rgb(var(--x) / <alpha-value>)` vì biến ở đây giữ mã màu
         * đầy đủ; đổi lại là không dùng được hậu tố opacity (`bg-surface/50`).
         * Chỗ nào cần alpha thì dùng `white/10` trên nền tối như trước.
         */
        canvas: "var(--c-canvas)",
        surface: "var(--c-surface)",
        "surface-raised": "var(--c-surface-raised)",
        sunken: "var(--c-sunken)",
        "sunken-strong": "var(--c-sunken-strong)",

        "line-soft": "var(--c-line-soft)",
        line: "var(--c-line)",
        "line-strong": "var(--c-line-strong)",

        content: "var(--c-content)",
        "content-2": "var(--c-content-2)",
        muted: "var(--c-muted)",
        faint: "var(--c-faint)",
        disabled: "var(--c-disabled)",

        "tint-danger": "var(--c-tint-danger)",
        "tint-success": "var(--c-tint-success)",
        "tint-warning": "var(--c-tint-warning)",
        "tint-accent": "var(--c-tint-accent)",

        // Navy — màu thương hiệu chính, lấy từ trang chủ và trang Auth của web
        navy: {
          900: "#0D1B2E", // nền tối: hero, footer, section đảo màu
          800: "#1E2D4A", // khối nổi đặt trên nền navy-900
          700: "#1A2A4A", // nút chính, tiêu đề, icon
          600: "#243660", // navy-700 lúc đang nhấn
          500: "#8A99B5", // chữ phụ trên nền tối
        },

        // Accent — dấu chấm sau logo, nhãn, link, trạng thái đang chọn.
        // Toàn app chỉ có MỘT màu accent.
        accent: {
          DEFAULT: "#EF342A",
          pressed: "#C92A21",
        },

        // Vàng huy chương — thứ hạng, podium
        gold: "#C9A227",

        // Giữ lại cho các component đã dùng trước khi có design system
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },

        // Trạng thái
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        info: "#2563EB",
      },

      fontSize: {
        // Bậc nhỏ nhất của app, chỉ dành cho overline IN HOA có giãn chữ.
        // Không dùng cho chữ thường — xem docs/mobile/01-design-system.md.
        // letterSpacing để px chứ không để em: React Native chỉ nhận số
        overline: ["11px", { lineHeight: "14px", letterSpacing: "0.9px" }],
      },
    },
  },
  plugins: [fontPlugin],
};
