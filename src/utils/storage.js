import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Lớp lưu trữ thống nhất cho mọi nền tảng.
 *
 * - Native (Android/iOS): expo-secure-store — dữ liệu được mã hoá bởi Keystore/Keychain.
 * - Web (`npm run web`): localStorage, vì SecureStore không tồn tại trên trình duyệt.
 *
 * Khác với localStorage của FE web, toàn bộ API ở đây là bất đồng bộ.
 * Lưu ý: SecureStore giới hạn mỗi value khoảng 2KB — đủ cho JWT và thông tin user,
 * đừng dùng nó để cache dữ liệu lớn.
 */
const isWeb = Platform.OS === "web";

export const getItem = async (key) => {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

export const setItem = async (key, value) => {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* bỏ qua: chế độ riêng tư của trình duyệt có thể chặn ghi */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

export const removeItem = async (key) => {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* bỏ qua */
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* key không tồn tại — không cần xử lý */
  }
};
