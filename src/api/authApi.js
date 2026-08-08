import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

export const login = (body) => axiosClient.post("/auth/login", body);

export const getMe = () => axiosClient.get("/auth/me").then((res) => getApiData(res));

/** POST /auth/register — body: { email, phone, password } */
export const register = (body) => axiosClient.post("/auth/register", body);

/** POST /auth/forgot-password — body: { email }. Backend gửi OTP về email. */
export const forgotPassword = (body) =>
  axiosClient.post("/auth/forgot-password", body);

/**
 * POST /auth/verify-otp — body: { email, otp }
 *
 * Chỉ kiểm mã, chưa đổi mật khẩu. Nhờ bước này người dùng gõ nhầm OTP biết ngay
 * thay vì phải điền xong cả mật khẩu mới rồi mới bị báo sai — web tách đúng như
 * vậy ở `ForgotPasswordPage`.
 */
export const verifyOtp = (body) => axiosClient.post("/auth/verify-otp", body);

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
