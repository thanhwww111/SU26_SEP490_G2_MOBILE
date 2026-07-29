import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

/**
 * Hồ sơ người dùng đang đăng nhập.
 *
 * Backend có hai đường đụng tới hồ sơ và chúng KHÔNG thay thế cho nhau:
 * - `/profile` (ProfileController) — đọc và sửa, dùng cho mọi role.
 * - `/player/profile` (PlayerController) — chỉ để TẠO hồ sơ lần đầu, chỉ PLAYER.
 *
 * Vì vậy sửa hồ sơ luôn đi qua `PUT /profile`, kể cả với tài khoản PLAYER.
 */

/** GET /profile — hồ sơ của tôi. Trả 404 khi tài khoản chưa tạo hồ sơ. */
export const getProfile = () =>
  axiosClient.get("/profile").then((res) => getApiData(res));

/** PUT /profile — cập nhật hồ sơ */
export const updateProfile = (body) =>
  axiosClient.put("/profile", body).then((res) => getApiData(res));

/** POST /player/profile — tạo hồ sơ lần đầu (chỉ PLAYER, 409 nếu đã có) */
export const createPlayerProfile = (body) =>
  axiosClient.post("/player/profile", body).then((res) => getApiData(res));
