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
