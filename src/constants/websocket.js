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
