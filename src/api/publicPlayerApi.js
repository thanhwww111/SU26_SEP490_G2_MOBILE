import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

/**
 * GET /participants/user/{userId}/profile — hồ sơ cơ thủ công khai kèm lịch sử
 * thành tích, gom tất cả giải mà tài khoản đó từng dự.
 *
 * Endpoint công khai (`PublicParticipantController`), không cần đăng nhập.
 */
export const getPlayerProfileByUserId = (userId) =>
  axiosClient
    .get(`/participants/user/${userId}/profile`)
    .then((res) => getApiData(res));

/**
 * GET /participants/{participantId}/profile — hồ sơ của một suất tham dự cụ thể.
 *
 * Dùng cho tab Cơ thủ và tab Xếp hạng trong chi tiết giải: cả hai chỉ cầm
 * `participantId`, không có `userId`.
 *
 * Trả về cùng `PlayerPublicProfileResponse` như nhánh userId, và có kèm
 * `userId` **nếu** suất đó gắn với một tài khoản. Ban tổ chức thêm tay hoặc
 * import Excel thì không có tài khoản, `userId` là null — lúc đó chỉ đọc được
 * hồ sơ trong phạm vi giải này. Cách xử lý hai nhánh nằm ở `PlayerProfileView`.
 */
export const getParticipantProfile = (participantId) =>
  axiosClient
    .get(`/participants/${participantId}/profile`)
    .then((res) => getApiData(res));
