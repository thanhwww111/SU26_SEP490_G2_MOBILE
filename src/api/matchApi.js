import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

/**
 * Lịch thi đấu của người chơi đang đăng nhập.
 *
 * Backend gom sẵn mọi trận của mọi giải mà người này đang tham dự, trả về một mảng phẳng —
 * không phân trang, không cần truyền id giải. Bám đúng `getMyMatches` của FE web.
 */

/** GET /player/matches — tất cả trận của tôi */
export const getMyMatches = () =>
  axiosClient.get("/player/matches").then((res) => getApiData(res));

/**
 * GET /matches/{id} — chi tiết một trận.
 *
 * Endpoint công khai (không nằm dưới `/player` hay `/staff`), dùng cho màn bảng điểm của trọng
 * tài: nó cần `raceTo`, `tournamentId` và tên hai cơ thủ, mà danh sách `/staff/matches` thì
 * không phải lúc nào cũng được mở từ đầu — trọng tài có thể vào thẳng bằng deep link.
 */
export const getMatchDetail = (matchId) =>
  axiosClient.get(`/matches/${matchId}`).then((res) => getApiData(res));
