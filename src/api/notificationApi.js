import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Hộp thông báo và đăng ký thiết bị nhận thông báo đẩy.
 *
 * Backend không có bảng thông báo riêng — danh sách được dựng lại từ lịch sử email hệ thống đã
 * gửi cho chính người đang đăng nhập. Hệ quả: sự kiện nào không có rule email đang bật thì cũng
 * không hiện ở đây.
 *
 * Endpoint nằm ở `/notifications` chứ không phải `/player/notifications`: web dùng chung đúng
 * những endpoint này, mà web thì Admin/Owner/Manager/Staff dùng là chính — nhánh `/player/**`
 * bị backend khoá cứng vào role PLAYER.
 */

/** GET /notifications — thông báo của tôi, mới nhất trước */
export const getMyNotifications = (params) =>
  axiosClient
    .get("/notifications", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/**
 * GET /player/notifications/unread-count — số thông báo mới hơn mốc đã đọc.
 *
 * Mốc do chính máy này giữ và gửi lên: không có cột "đã đọc" nào trong DB, nên hai máy của cùng
 * một người đếm độc lập với nhau.
 */
export const getUnreadCount = (lastReadAt) =>
  axiosClient
    .get("/notifications/unread-count", {
      params: lastReadAt ? { after: lastReadAt } : undefined,
    })
    .then((res) => getApiData(res) ?? 0);

/** POST /notifications/device-tokens — ghi danh máy này để nhận thông báo đẩy */
export const registerDeviceToken = (body) =>
  axiosClient.post("/notifications/device-tokens", body).then((res) => getApiData(res));

/** DELETE /notifications/device-tokens — gỡ máy này, gọi khi đăng xuất */
export const unregisterDeviceToken = (expoToken) =>
  axiosClient
    .delete("/notifications/device-tokens", { params: { expoToken } })
    .then((res) => getApiData(res));
