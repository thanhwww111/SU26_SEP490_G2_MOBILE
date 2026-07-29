import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/** GET /tournaments — danh sách giải đấu công khai, phân trang */
export const listPublicTournaments = (params) =>
  axiosClient
    .get("/tournaments", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /tournaments/{id} — chi tiết giải đấu */
export const getPublicTournamentDetail = (id) =>
  axiosClient.get(`/tournaments/${id}`).then((res) => getApiData(res));

/**
 * GET /tournaments/{id}/participants — cơ thủ tham gia giải.
 *
 * Trả mảng trần, không phân trang. Ép về `[]` khi backend trả null để phía
 * component khỏi phải kiểm lại lần nữa.
 */
export const listPublicParticipants = (id) =>
  axiosClient
    .get(`/tournaments/${id}/participants`)
    .then((res) => getApiData(res) ?? []);

/** GET /tournaments/{id}/matches — toàn bộ trận của giải, mảng trần */
export const getPublicMatches = (id) =>
  axiosClient
    .get(`/tournaments/${id}/matches`)
    .then((res) => getApiData(res) ?? []);

/**
 * GET /tournaments/{id}/rankings — xếp hạng chung cuộc.
 *
 * Trả OBJECT `{ tournamentId, tournamentStatus, isOfficial, entries }`, không
 * phải mảng — `isOfficial` quyết định nhãn "Kết quả chính thức" hay "Xếp hạng
 * tạm thời", nên không bóc phẳng lấy mỗi `entries`.
 */
export const getPublicTournamentRankings = (id) =>
  axiosClient.get(`/tournaments/${id}/rankings`).then((res) => {
    const data = getApiData(res);
    return {
      isOfficial: Boolean(data?.isOfficial),
      entries: data?.entries ?? [],
    };
  });
