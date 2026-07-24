import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/** GET /news — bài viết đã xuất bản, phân trang */
export const listPublishedPosts = (params) =>
  axiosClient
    .get("/news", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /news/{slug} — chi tiết bài viết */
export const getPostBySlug = (slug) =>
  axiosClient.get(`/news/${slug}`).then((res) => getApiData(res));
