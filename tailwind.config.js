/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Bảng màu dùng chung với FE web
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        // Nhận diện màn auth, lấy từ trang Auth của FE web
        navy: {
          900: "#0d1b3e", // nền hero
          700: "#1a2a4a", // nút, tiêu đề
          600: "#243660", // trạng thái nhấn
        },
        accent: "#e8471a", // dấu chấm cam sau logo
      },
    },
  },
  plugins: [],
};
