import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * GET /leaderboard — bảng xếp hạng điểm tích lũy cơ thủ, phân trang.
 *
 * Endpoint công khai (`PublicLeaderboardController`), không cần đăng nhập.
 * Điểm cộng dồn từ `tournament_results.points_earned`; khoảng thời gian của mỗi
 * kỳ backend cắt theo lịch Việt Nam chứ không theo UTC.
 *
 * @param {object} params
 * @param {"MONTH"|"QUARTER"|"YEAR"|"ALL"} params.period kỳ thống kê; giá trị lạ
 *   backend nuốt về `ALL` chứ không báo lỗi
 * @param {number} [params.year]    năm áp dụng — mặc định năm hiện tại
 * @param {number} [params.quarter] quý 1-4, chỉ dùng khi period = QUARTER
 * @param {number} [params.month]   tháng 1-12, chỉ dùng khi period = MONTH
 * @param {number} [params.page]
 * @param {number} [params.size]
 */
export const getLeaderboard = (params, fallbackSize) =>
  axiosClient
    .get("/leaderboard", { params })
    .then((res) => parsePagedResponse(getApiData(res), fallbackSize ?? params?.size));
