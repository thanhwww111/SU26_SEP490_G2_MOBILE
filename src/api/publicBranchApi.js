import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Chi nhánh công khai.
 *
 * Backend chỉ trả chi nhánh đang hoạt động ở cả hai endpoint (`listPublicBranches`
 * và `getPublicBranch` đều lọc ACTIVE), nên client không phải lọc lại theo
 * `status`. Chi nhánh đã đóng sẽ trả 404 ở màn chi tiết.
 */

/** GET /branches — danh sách chi nhánh, phân trang, tìm theo tên hoặc địa chỉ */
export const listPublicBranches = (params) =>
  axiosClient
    .get("/branches", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /branches/{id} — chi tiết chi nhánh, kèm danh sách ảnh */
export const getPublicBranchDetail = (id) =>
  axiosClient.get(`/branches/${id}`).then((res) => getApiData(res));
