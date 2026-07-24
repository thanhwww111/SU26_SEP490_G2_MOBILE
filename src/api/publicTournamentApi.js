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
