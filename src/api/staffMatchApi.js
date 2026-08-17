import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

/**
 * API khu vực trọng tài. Bám `FE/src/api/staffMatchApi.js`.
 *
 * Toàn bộ nhóm `/staff/**` bị `SecurityConfig` chặn bằng `hasRole("STAFF")`, và mỗi lời gọi còn
 * qua `assertStaffAssigned` — trọng tài chỉ thao tác được trên trận đã gán cho chính mình. Nghĩa
 * là guard phía mobile chỉ để người dùng khỏi thấy màn trống, không phải lớp bảo vệ thật.
 */

const unwrap = (p) => p.then((res) => getApiData(res));

/**
 * Danh sách trận được phân công cho trọng tài đang đăng nhập.
 *
 * @param {{ status?: string, tournamentName?: string }} [params]
 *   `tournamentName` tìm theo tên giải, nhưng chỉ trong phạm vi trận đã gán cho người này.
 */
export const getRefereeMatches = ({ status, tournamentName } = {}) =>
  unwrap(
    axiosClient.get("/staff/matches", {
      params: {
        ...(status ? { status } : {}),
        ...(tournamentName?.trim() ? { tournamentName: tournamentName.trim() } : {}),
      },
    })
  );

/** Chuyển trận sang IN_PROGRESS. Backend chỉ nhận khi trận đang PENDING. */
export const startStaffMatch = (matchId) =>
  unwrap(axiosClient.patch(`/staff/matches/${matchId}/start`));

/**
 * Cộng/trừ một điểm.
 *
 * Gửi delta thay vì tỷ số tuyệt đối để hai thiết bị cùng chấm một trận không ghi đè lên nhau —
 * xem `MatchServiceImpl.incrementScore`.
 *
 * @param {{ playerSlot: 1|2, delta: 1|-1 }} body
 * @returns {Promise<{ match: object, suggestComplete: boolean, suggestedWinnerId: number|null }>}
 */
export const incrementStaffScore = (matchId, body) =>
  unwrap(axiosClient.patch(`/staff/matches/${matchId}/score/increment`, body));

/**
 * Chốt kết quả trận.
 *
 * `confirmEarlyEnd` BẮT BUỘC là true khi chưa ai đạt `raceTo` — `assertWinnerWhenRaceReached`
 * ném `MATCH_EARLY_END_NOT_CONFIRMED` nếu thiếu. Bản web đang quên field này nên nút kết thúc
 * sớm bên đó luôn báo lỗi; đừng chép theo.
 *
 * @param {{ winnerParticipantId: number, confirmEarlyEnd?: boolean }} body
 */
export const completeStaffMatch = (matchId, body) =>
  unwrap(axiosClient.post(`/staff/matches/${matchId}/complete`, body));

/**
 * Xử thắng do đối thủ vắng mặt — trận ghi WALKOVER, tỷ số giữ 0-0.
 *
 * Dùng được cả khi trận còn PENDING: `MatchServiceImpl.walkover` chỉ chặn trận đã
 * COMPLETED / WALKOVER / BYE, nên không cần bấm "Bắt đầu" trước.
 *
 * @param {{ winnerParticipantId: number }} body cùng DTO với complete
 */
export const walkoverStaffMatch = (matchId, body) =>
  unwrap(axiosClient.post(`/staff/matches/${matchId}/walkover`, body));
