export const BTMS_TOKEN_KEY = "btms_token";
export const BTMS_USER_KEY = "btms_user";

/**
 * Thông tin đăng nhập giữ lại để tự lấy phiên mới khi JWT hết hạn.
 *
 * Backend cấp token sống 24 giờ và không có refresh token, nên không giữ gì thì cứ mỗi ngày
 * người dùng lại phải đăng nhập tay — hỏng hẳn trải nghiệm khi bấm vào một thông báo đẩy.
 * Chỉ lưu trên native, nơi expo-secure-store dùng Keystore/Keychain của hệ điều hành.
 */
export const BTMS_CREDENTIALS_KEY = "btms_credentials";

export const ROLES = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  PLAYER: "PLAYER",
};
