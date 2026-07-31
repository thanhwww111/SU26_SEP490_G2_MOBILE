import { create } from "zustand";
import { colorScheme } from "nativewind";

import { getItem, setItem } from "../utils/storage";

const STORAGE_KEY = "btms_theme_mode";

/**
 * Ba lựa chọn người dùng thấy trong menu. `system` là mặc định — mở app lên là
 * khớp luôn cài đặt Sáng/Tối của máy, đúng thói quen của app di động.
 *
 * Khác FE web: `themeStore.js` bên đó cố ý luôn mặc định Sáng và bỏ qua cài đặt
 * hệ thống. Trên trình duyệt điều đó hợp lý vì người dùng ít khi bật dark mode
 * toàn hệ điều hành; trên điện thoại thì ngược lại.
 */
export const THEME_MODES = ["system", "light", "dark"];

export const THEME_MODE_LABELS = {
  system: "Tự động",
  light: "Sáng",
  dark: "Tối",
};

const isValidMode = (value) => THEME_MODES.includes(value);

/**
 * Đẩy chế độ xuống NativeWind. Đây là chỗ duy nhất gọi `colorScheme.set` —
 * mọi nơi khác chỉ đọc qua `useThemeColors` / `useColorScheme`.
 *
 * `tailwind.config.js` đặt `darkMode: "class"` nên NativeWind không tự bám hệ
 * thống; truyền `"system"` chính là cách bảo nó quay lại bám.
 *
 * BỌC try/catch vì `colorScheme.set` CÓ THỂ NÉM LỖI, và khi nó ném thì cả app
 * trắng màn — đổi màu là việc trang trí, không đáng để làm sập ứng dụng.
 * Trường hợp đã gặp: NativeWind đọc kiểu dark mode từ biến
 * `--css-interop-darkMode` trong CSS đã biên dịch, đọc đúng MỘT LẦN lúc nạp
 * module. Nếu Metro còn cache bản CSS cũ (dựng trước khi `tailwind.config.js`
 * có `darkMode: "class"`), nó thấy `media` và ném lỗi. Cách chữa gốc là xoá
 * cache: `npx expo start --clear`.
 */
const applyMode = (mode) => {
  try {
    colorScheme.set(mode);
    return true;
  } catch (e) {
    if (__DEV__) {
      console.warn(
        `[theme] Không đặt được chế độ "${mode}": ${e?.message}\n` +
          "Nếu thông báo nhắc tới dark mode kiểu 'media', hãy chạy lại bằng " +
          "`npx expo start --clear` để Metro biên dịch lại CSS."
      );
    }
    return false;
  }
};

export const useThemeStore = create((set, get) => ({
  /** Lựa chọn của người dùng, không phải chế độ đang hiển thị */
  mode: "system",
  /** false cho tới khi đọc xong lựa chọn đã lưu */
  themeReady: false,

  hydrateTheme: async () => {
    if (get().themeReady) return;

    let mode = "system";
    try {
      const stored = await getItem(STORAGE_KEY);
      if (isValidMode(stored)) mode = stored;
    } catch {
      // Đọc ổ đĩa hỏng thì dùng mặc định, không chặn app
    }

    applyMode(mode);

    // `themeReady` phải bật kể cả khi applyMode thất bại: app/_layout.jsx chờ
    // cờ này mới render: không bật thì người dùng kẹt ở màn loading vĩnh viễn
    set({ mode, themeReady: true });
  },

  setMode: async (mode) => {
    if (!isValidMode(mode) || mode === get().mode) return;

    // Đổi giao diện trước rồi mới ghi xuống ổ đĩa: ghi vào SecureStore mất vài
    // chục mili giây, chờ nó xong mới đổi màu thì bấm nút thấy như bị lag
    if (!applyMode(mode)) return;

    set({ mode });
    await setItem(STORAGE_KEY, mode);
  },
}));
