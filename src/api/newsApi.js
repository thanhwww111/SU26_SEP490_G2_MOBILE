import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/** GET /news — bài viết đã xuất bản, phân trang */
export const listPublishedPosts = (params) =>
  axiosClient
    .get("/news", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /news/{slug} — chi tiết bài viết. Lấy theo slug, không phải id. */
export const getPostBySlug = (slug) =>
  axiosClient.get(`/news/${slug}`).then((res) => getApiData(res));

/**
 * GET /news/categories — chuyên mục để lọc danh sách.
 *
 * Mảng trần, không phân trang. Ép về `[]` khi backend trả null để hàng chip lọc
 * khỏi phải kiểm lại lần nữa.
 */
export const listPublicCategories = () =>
  axiosClient.get("/news/categories").then((res) => getApiData(res) ?? []);
