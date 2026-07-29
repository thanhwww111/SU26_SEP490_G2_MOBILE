import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

export const login = (body) => axiosClient.post("/auth/login", body);

export const getMe = () => axiosClient.get("/auth/me").then((res) => getApiData(res));

/** POST /auth/register — body: { email, phone, password } */
export const register = (body) => axiosClient.post("/auth/register", body);

/** POST /auth/forgot-password — body: { email }. Backend gửi OTP về email. */
export const forgotPassword = (body) =>
  axiosClient.post("/auth/forgot-password", body);

/** POST /auth/reset-password — body: { email, otp, newPassword } */
export const resetPassword = (body) =>
  axiosClient.post("/auth/reset-password", body);

/**
 * POST /auth/change-password — body: { oldPassword, newPassword }
 *
 * Dành cho người đã đăng nhập (khác reset-password vốn đi kèm OTP). Backend
 * ràng buộc mật khẩu mới 6–100 ký tự.
 */
export const changePassword = (body) =>
  axiosClient.post("/auth/change-password", body);
