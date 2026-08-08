import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Đăng ký giải đấu dưới góc nhìn PLAYER.
 * Bám đúng SU26_SEP490_G2_FE/src/api/playerRegistrationApi.js.
 *
 * Phần thanh toán nằm ở `paymentApi.js`.
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

/**
 * GET /player/tournaments/{id}/registration-form — form đăng ký của giải.
 *
 * Form là ĐỘNG: Owner cấu hình từng giải một, nên số trường và kiểu trường đổi theo giải.
 * Trả về kèm `entryFee` — đây là nguồn quyết định giải này có phải thanh toán hay không,
 * đừng đoán từ chỗ khác.
 */
export const getTournamentRegistrationForm = (tournamentId) =>
  axiosClient
    .get(`/player/tournaments/${tournamentId}/registration-form`)
    .then((res) => getApiData(res));

/**
 * POST /player/tournaments/{id}/registrations — nộp đăng ký.
 *
 * Body: `{ registrationType, note, fieldValues: [{ fieldKey, value }] }`.
 * Mọi giá trị gửi lên đều là chuỗi, kể cả số và checkbox — backend tự ép kiểu theo cấu hình
 * trường, giống hệt web.
 *
 * Backend đặt trạng thái `PENDING_PAYMENT`. Giải miễn phí thì tự xét duyệt ngay trong cùng
 * lời gọi này, nên phản hồi có thể đã là `APPROVED` hoặc `REJECTED` (hết suất).
 */
export const submitTournamentRegistration = (tournamentId, body) =>
  axiosClient
    .post(`/player/tournaments/${tournamentId}/registrations`, body)
    .then((res) => getApiData(res));
