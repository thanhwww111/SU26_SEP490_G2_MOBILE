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
  plugins: [],
};
