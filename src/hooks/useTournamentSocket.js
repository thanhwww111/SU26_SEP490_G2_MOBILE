import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { Client } from "@stomp/stompjs";

import {
  getWebSocketOrigin,
  getWebSocketUrl,
  tournamentBracketTopic,
  tournamentMatchesTopic,
} from "../constants/websocket";

/**
 * Kết nối STOMP tới backend, nghe hai kênh của một giải: `/matches` và `/bracket`.
 *
 * Port từ `FE/src/hooks/useTournamentSocket.js` — cùng thư viện (`@stomp/stompjs`),
 * cùng topic, cùng cách đọc payload, nên hai bản khách không bao giờ hiểu khác
 * nhau về một bản tin.
 *
 * ## Hai chỗ phải thêm so với bản web
 *
 * 1. **Vòng đời tiền cảnh.** Trình duyệt giữ tab sống khi người dùng chuyển
 *    tab; điện thoại thì hệ điều hành cắt socket khi app xuống nền. Nếu cứ để
 *    nguyên, người dùng mở lại app sẽ thấy tỷ số đứng im mà tưởng trận chưa
 *    đánh. Nên hook tự ngắt khi xuống nền và nối lại khi trở lại.
 * 2. **`forceBinaryWSFrames` + `appendMissingNULLonIncoming`.** Bản WebSocket
 *    của React Native không xử lý khung văn bản giống trình duyệt; thiếu hai cờ
 *    này thì bản tin STOMP bị cắt cụt và không parse được.
 *
 * Không cần polyfill `TextEncoder`/`TextDecoder` dù stompjs v7 dùng cả hai:
 * Hermes có sẵn `TextEncoder`, còn `TextDecoder` do Expo cài vào global
 * (`expo/src/winter/runtime.native.ts`). Đã kiểm ở SDK 54 — nâng SDK thì kiểm lại.
 *
 * @param {number|string|null} tournamentId
 * @param {{
 *   onMatchUpdate?: (match: object) => void,
 *   onBracketSync?: (matches: object[]) => void,
 *   onReconnect?: () => void,
 *   enabled?: boolean,
 * }} [options]
 * @returns {{ connectionState: string, isConnected: boolean }}
 */
export function useTournamentSocket(tournamentId, options = {}) {
  const { onMatchUpdate, onBracketSync, onReconnect, enabled = true } = options;

  const [connectionState, setConnectionState] = useState("disconnected");
  // Xuống nền thì ngắt hẳn; state riêng để hiệu ứng nối lại chạy khi quay lại
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background"
  );

  const subsRef = useRef([]);
  const wasConnectedRef = useRef(false);

  // Giữ callback trong ref: component cha truyền hàm mũi tên mới mỗi lần render,
  // đưa vào deps là dựng lại cả kết nối sau mỗi lần vẽ lại
  const onMatchUpdateRef = useRef(onMatchUpdate);
  const onBracketSyncRef = useRef(onBracketSync);
  const onReconnectRef = useRef(onReconnect);

  onMatchUpdateRef.current = onMatchUpdate;
  onBracketSyncRef.current = onBracketSync;
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
    });

    return () => sub.remove();
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    subsRef.current.forEach((s) => {
      try {
        s?.unsubscribe();
      } catch {
        /* kết nối đã đứt — không có gì để huỷ */
      }
    });
    subsRef.current = [];
  }, []);

  /**
   * Một khung tin có thể là cập nhật một trận, hoặc lệnh đồng bộ cả bracket.
   * Cả hai kênh đều gửi được cả hai dạng nên dùng chung một bộ đọc.
   */
  const handleMessage = useCallback((msg) => {
    try {
      const payload = JSON.parse(msg.body);

      if (payload?.type === "BRACKET_SYNC" && Array.isArray(payload.matches)) {
        onBracketSyncRef.current?.(payload.matches);
        return;
      }

      const match = payload?.match ?? payload;
      if (match?.id != null) onMatchUpdateRef.current?.(match);
    } catch {
      // Bản tin hỏng thì bỏ qua khung đó, không được để văng cả kết nối
    }
  }, []);

  useEffect(() => {
    if (!enabled || !foreground || tournamentId == null || tournamentId === "") {
      setConnectionState("disconnected");
      return undefined;
    }

    wasConnectedRef.current = false;
    setConnectionState("connecting");

    const client = new Client({
      /**
       * Tự dựng socket thay vì để stompjs làm, chỉ để đặt được header `Origin`.
       *
       * Không đặt thì React Native tự điền origin suy từ URL (`https://api.…`), mà server deploy
       * chỉ cho phép origin của web FE (`https://…` không có nhãn `api.`) — bắt tay trả 403 và
       * socket không bao giờ mở. Lý do đầy đủ kèm số liệu kiểm chứng: `constants/websocket.js`,
       * hàm `getWebSocketOrigin`.
       *
       * Trên bản web thì KHÔNG đụng tới: trình duyệt cấm script đặt `Origin`, và cũng không cần
       * — nó tự gửi origin thật của trang, vốn đã nằm trong allowlist.
       */
      webSocketFactory:
        Platform.OS === "web"
          ? undefined
          : () =>
              // Danh sách subprotocol lấy từ chính client, không gõ tay: đây đúng là thứ stompjs
              // truyền vào khi nó tự dựng socket, nên bỏ hoặc gõ sai là đổi hành vi bắt tay.
              new WebSocket(getWebSocketUrl(), client.stompVersions.protocolVersions(), {
                headers: { origin: getWebSocketOrigin() },
              }),
      brokerURL: getWebSocketUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Bắt buộc trên React Native — xem ghi chú ở đầu file
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,

      onConnect: () => {
        const isReconnect = wasConnectedRef.current;
        wasConnectedRef.current = true;
        setConnectionState("connected");

        cleanupSubscriptions();
        subsRef.current = [
          client.subscribe(tournamentMatchesTopic(tournamentId), handleMessage),
          client.subscribe(tournamentBracketTopic(tournamentId), handleMessage),
        ];

        // Lúc mất kết nối có thể đã lỡ vài bản tin — bảo màn tải lại từ REST
        if (isReconnect) onReconnectRef.current?.();
      },

      onWebSocketClose: () => {
        if (wasConnectedRef.current) setConnectionState("reconnecting");
      },

      onStompError: () => setConnectionState("reconnecting"),
    });

    client.activate();

    return () => {
      cleanupSubscriptions();
      wasConnectedRef.current = false;
      client.deactivate();
      setConnectionState("disconnected");
    };
  }, [
    tournamentId,
    enabled,
    foreground,
    cleanupSubscriptions,
    handleMessage,
  ]);

  return {
    connectionState,
    isConnected: connectionState === "connected",
  };
}
