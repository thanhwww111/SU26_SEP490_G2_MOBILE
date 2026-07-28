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
  theme: {
    extend: {
      colors: {
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
