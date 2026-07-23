/**
 * URL của backend Spring Boot.
 *
 * Điện thoại thật KHÔNG hiểu "localhost" — đó là localhost của chính nó.
 * Phải trỏ về IP LAN của máy đang chạy backend (xem README, mục "Đổi IP").
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.14:8080";

export const API_BASE_URL = `${API_URL}/api/v1`;
