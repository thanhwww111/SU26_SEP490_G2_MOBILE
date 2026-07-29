import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Đăng ký giải đấu dưới góc nhìn PLAYER.
 * Bám đúng SU26_SEP490_G2_FE/src/api/playerRegistrationApi.js.
 *
 * Cố ý chưa có createCheckout: luồng thanh toán PayOS trên mobile phải mở
 * trình duyệt rồi bắt deep link quay lại app, cần spec riêng — xem
 * docs/mobile/09-backend-reference.md, mục Thanh toán.
 */

/** GET /player/registrations — tất cả đăng ký của tôi, phân trang */
export const getMyRegistrations = (params) =>
  axiosClient
    .get("/player/registrations", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/**
 * GET /player/tournaments/{id}/my-registration — đăng ký của tôi cho một giải.
 *
 * Trả `null` (kèm 200) khi chưa đăng ký, không phải 404. Web lấy thông tin này
 * bằng cách tải 100 bản ghi đầu của /player/registrations rồi lọc theo id giải;
 * ở đây gọi thẳng endpoint chuyên dụng cho nhẹ đường truyền di động.
 */
export const getMyRegistrationForTournament = (tournamentId) =>
  axiosClient
    .get(`/player/tournaments/${tournamentId}/my-registration`)
    .then((res) => getApiData(res) ?? null);

/** GET /player/registrations/{id} — chi tiết một đăng ký, kèm fieldValues đã điền */
export const getMyRegistrationDetail = (id) =>
  axiosClient.get(`/player/registrations/${id}`).then((res) => getApiData(res));

/** DELETE /player/registrations/{id} — huỷ đăng ký (backend chỉ cho huỷ khi còn chờ thanh toán) */
export const cancelMyRegistration = (id) =>
  axiosClient.delete(`/player/registrations/${id}`).then((res) => getApiData(res));
