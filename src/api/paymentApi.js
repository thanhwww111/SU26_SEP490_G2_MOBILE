import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Thanh toán phí đăng ký qua PayOS.
 *
 * Khác web ở chỗ mấu chốt: web chuyển hẳn tab sang PayOS rồi PayOS trả người dùng về một URL
 * đã cấu hình sẵn trên server (`PayOSServiceImpl` đọc `returnUrl` từ cấu hình, KHÔNG nhận từ
 * client). URL đó trỏ về web, nên mobile không có cách nào bắt PayOS quay về `btms://`.
 *
 * Vòng qua bằng `confirmReturn`: mobile mở PayOS trong trình duyệt trong app, chờ người dùng
 * đóng lại, rồi hỏi backend "đơn này trả tiền chưa" — backend gọi thẳng PayOS kiểm tra chứ
 * không tin lời client. Nhờ vậy không phải sửa gì ở backend.
 */

/** POST /player/registrations/{id}/checkout — tạo đơn PayOS, trả checkoutUrl + orderCode */
export const createCheckout = (registrationId) =>
  axiosClient
    .post(`/player/registrations/${registrationId}/checkout`)
    .then((res) => getApiData(res));

/**
 * POST /player/payments/confirm-return — nhờ backend hỏi PayOS xem đơn đã trả tiền chưa.
 *
 * Gọi sau khi người dùng đóng trình duyệt PayOS. An toàn khi gọi nhiều lần và cả khi người
 * dùng bỏ ngang: backend chỉ ghi nhận khi PayOS xác nhận đã thanh toán.
 *
 * Không bắt buộc phải thành công — webhook của PayOS vẫn cập nhật trạng thái ở phía server.
 * Lời gọi này chỉ để người dùng thấy kết quả ngay thay vì phải chờ.
 */
export const confirmReturn = (orderCode) =>
  axiosClient
    .post("/player/payments/confirm-return", null, { params: { orderCode } })
    .then((res) => getApiData(res));

/** GET /player/payments — lịch sử thanh toán của tôi, phân trang */
export const getMyPayments = (params) =>
  axiosClient
    .get("/player/payments", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));
