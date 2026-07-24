/**
 * Rule validate dùng chung cho các màn auth.
 *
 * Mỗi hàm trả về chuỗi lỗi, hoặc null nếu hợp lệ.
 * Thông báo giữ nguyên như FE web để hai nền tảng nói cùng một giọng.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10,11}$/;

export const MIN_PASSWORD_LENGTH = 6;

export const validateEmail = (value) => {
  if (!value) return "Email là bắt buộc";
  if (!EMAIL_PATTERN.test(value)) return "Email không hợp lệ";
  return null;
};

export const validatePassword = (value) => {
  if (!value) return "Mật khẩu là bắt buộc";
  if (value.length < MIN_PASSWORD_LENGTH)
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
  return null;
};

export const validatePhone = (value) => {
  if (!value) return "Số điện thoại là bắt buộc";
  if (!PHONE_PATTERN.test(value)) return "Số điện thoại không hợp lệ (10-11 số)";
  return null;
};

export const validateConfirmPassword = (value, password) => {
  if (!value) return "Vui lòng xác nhận mật khẩu";
  if (value !== password) return "Mật khẩu không khớp";
  return null;
};

export const validateOtp = (value) => {
  if (!value) return "OTP là bắt buộc";
  return null;
};

/**
 * Chạy một loạt rule và gom lại thành object lỗi.
 * `rules` dạng { field: () => string | null } — bỏ qua field trả về null.
 */
export const collectErrors = (rules) => {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule();
    if (message) errors[field] = message;
  }
  return errors;
};
