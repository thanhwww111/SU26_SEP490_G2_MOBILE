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

/**
 * Danh sách email đã từng đăng nhập thành công trên máy này.
 *
 * Chỉ email và tên hiển thị — KHÔNG có mật khẩu. Nhờ vậy key này lưu được trên cả bản web, khác
 * `BTMS_CREDENTIALS_KEY` vốn chỉ dám ghi trên native.
 *
 * Mục đích duy nhất là gợi ý ở màn đăng nhập: một máy thường bị dùng chung giữa cơ thủ và trọng
 * tài, gõ lại email dài mỗi lần đổi người là phiền mà gõ sai thì báo lỗi chung chung.
 *
 * Đăng xuất KHÔNG xoá danh sách này — nhớ được sau khi đăng xuất mới là điểm của tính năng.
 * Muốn quên một tài khoản thì bấm dấu × ngay trên dòng gợi ý (xem `forgetEmail`).
 */
export const BTMS_KNOWN_EMAILS_KEY = "btms_known_emails";

/**
 * Số email tối đa giữ lại.
 *
 * SecureStore giới hạn mỗi value khoảng 2KB; 5 bản ghi cỡ ~120 byte thì còn xa ngưỡng đó. Con số
 * này là để danh sách gợi ý không dài quá một màn hình chứ không phải vì dung lượng.
 */
export const MAX_KNOWN_EMAILS = 5;

export const ROLES = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  PLAYER: "PLAYER",
};
