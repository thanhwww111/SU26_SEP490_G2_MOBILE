import { API_URL } from "./config";

/**
 * URL broker STOMP — http→ws, https→wss.
 *
 * Bám `FE/src/constants/websocket.js`, chỉ khác nguồn địa chỉ: mobile đọc
 * `EXPO_PUBLIC_API_URL` (IP LAN) thay cho `REACT_APP_API_URL`.
 *
 * Backend khai endpoint `/ws` **không** kèm `.withSockJS()`
 * (`WebSocketConfig.registerStompEndpoints`), nên đây là WebSocket thuần —
 * `@stomp/stompjs` nối thẳng được, không cần thư viện SockJS.
 */
export const getWebSocketUrl = () => `${API_URL.replace(/^http/, "ws")}/ws`;

/**
 * Giá trị header `Origin` gửi kèm lúc bắt tay WebSocket.
 *
 * ## Vì sao phải tự đặt
 *
 * React Native **tự thêm** `Origin` suy từ chính URL socket: `WebSocketModule.kt` gọi
 * `getDefaultOrigin()`, hàm này đổi `wss://api.biliardtournament.cloud/ws` thành
 * `https://api.biliardtournament.cloud`.
 *
 * Nhưng backend chạy profile `prod` chỉ cho phép đúng một origin — origin của web FE,
 * `https://biliardtournament.cloud`, KHÔNG có nhãn `api.` (xem `application-prod.yml`, biến
 * `CORS_ALLOWED_ORIGIN`). Spring chặn ngay ở tầng CORS filter, trước cả WebSocket handler, nên
 * bắt tay trả 403 và socket không bao giờ mở. Kiểm chứng 2026-08-17:
 *
 * | Origin | Kết quả |
 * |---|---|
 * | `https://biliardtournament.cloud` | 101 Switching Protocols |
 * | `https://api.biliardtournament.cloud` (RN tự thêm) | 403 |
 * | không gửi | 101 |
 *
 * May là RN cho ghi đè: truyền sẵn header `origin` thì nó không thêm mặc định nữa.
 *
 * ## Cách suy ra
 *
 * Bỏ nhãn `api.` ở đầu tên miền — quy ước `api.X` phục vụ site `X`. Sai quy ước đó thì đặt
 * `EXPO_PUBLIC_WS_ORIGIN` trong `.env` để chỉ định thẳng.
 *
 * Backend chạy trên máy (profile `dev`) cho phép mọi origin nên giá trị nào cũng được; hàm này
 * chỉ thực sự có việc khi trỏ vào server deploy.
 *
 * CORS vốn là cơ chế bảo vệ trình duyệt — native app không có khái niệm origin, và header này
 * cũng không phải thứ backend dùng để xác thực (việc đó là của JWT). Đặt nó cho khớp allowlist
 * là để đi qua đúng cánh cửa mà web đang đi, không phải để vượt rào.
 */
export const getWebSocketOrigin = () => {
  const override = process.env.EXPO_PUBLIC_WS_ORIGIN;
  if (override) return override;

  return API_URL.replace(/^(https?:\/\/)api\./, "$1");
};

export const tournamentMatchesTopic = (tournamentId) =>
  `/topic/tournament/${tournamentId}/matches`;

export const tournamentBracketTopic = (tournamentId) =>
  `/topic/tournament/${tournamentId}/bracket`;

/** Nhãn tiếng Việt cho từng trạng thái kết nối, dùng ở chỉ báo trong tab Trực tiếp */
export const SOCKET_STATE_LABELS = {
  connected: "Trực tiếp",
  connecting: "Đang kết nối…",
  reconnecting: "Đang kết nối lại…",
  disconnected: "Mất kết nối",
};
