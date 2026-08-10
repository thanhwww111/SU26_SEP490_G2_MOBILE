/**
 * Phông chữ của app, bám FE web nhưng KHÔNG cùng tên font — có lý do.
 *
 * Web khai báo `--font-sans: "Poppins", "Be Vietnam Pro", ...` và
 * `--font-display: "Bebas Neue", "Oswald", ...` (src/styles/variables.css).
 * Poppins và Bebas Neue đều thiếu khoảng U+1EA0–1EF1 — phần lớn nguyên âm có
 * dấu tiếng Việt. Trình duyệt lấy glyph thiếu từ font kế tiếp trong stack, nên
 * trên web mọi chữ CÓ DẤU thực chất đang hiện bằng Be Vietnam Pro và Oswald.
 *
 * React Native không có cơ chế thay glyph từng ký tự đó: `fontFamily` chỉ nhận
 * một tên, ký tự thiếu rơi thẳng xuống font hệ thống (San Francisco / Roboto).
 * Đặt Poppins ở đây sẽ cho ra chữ lệch kiểu ngay giữa một từ — "Điểm" có 4 ký
 * tự Poppins và 2 ký tự San Francisco.
 *
 * Nên mobile dùng thẳng hai font dự phòng. Nội dung app gần như toàn tiếng Việt
 * có dấu, tức là đằng nào web cũng đang hiện đúng hai font này.
 *
 * Bảng đối chiếu và cách đổi độ đậm: docs/mobile/01-design-system.md, Phần 3.
 *
 * ---
 *
 * NẠP THẲNG TỪNG FILE .ttf, đừng import từ tên gói.
 *
 * `index.js` của `@expo-google-fonts/*` `require` sẵn MỌI độ đậm, kể cả bản
 * nghiêng. Viết `import { BeVietnamPro_400Regular } from "@expo-google-fonts/
 * be-vietnam-pro"` thì bundler kéo cả 18 file của gói đó và 6 file của Oswald —
 * đã đo: 2,95 MB thay vì 1,15 MB. Trỏ thẳng vào file thì chỉ chín font dưới đây
 * đi vào bản dựng.
 */
export const APP_FONTS = {
  BeVietnamPro_400Regular: require("@expo-google-fonts/be-vietnam-pro/400Regular/BeVietnamPro_400Regular.ttf"),
  BeVietnamPro_400Regular_Italic: require("@expo-google-fonts/be-vietnam-pro/400Regular_Italic/BeVietnamPro_400Regular_Italic.ttf"),
  BeVietnamPro_500Medium: require("@expo-google-fonts/be-vietnam-pro/500Medium/BeVietnamPro_500Medium.ttf"),
  BeVietnamPro_600SemiBold: require("@expo-google-fonts/be-vietnam-pro/600SemiBold/BeVietnamPro_600SemiBold.ttf"),
  BeVietnamPro_700Bold: require("@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf"),
  BeVietnamPro_700Bold_Italic: require("@expo-google-fonts/be-vietnam-pro/700Bold_Italic/BeVietnamPro_700Bold_Italic.ttf"),
  BeVietnamPro_800ExtraBold: require("@expo-google-fonts/be-vietnam-pro/800ExtraBold/BeVietnamPro_800ExtraBold.ttf"),

  Oswald_500Medium: require("@expo-google-fonts/oswald/500Medium/Oswald_500Medium.ttf"),
  Oswald_600SemiBold: require("@expo-google-fonts/oswald/600SemiBold/Oswald_600SemiBold.ttf"),
};
