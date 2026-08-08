/** Mốc thời gian người dùng mở màn thông báo lần gần nhất, lưu trên chính máy này. */
export const BTMS_NOTI_READ_AT_KEY = "btms_noti_read_at";

/** Push token Expo đang đăng ký, giữ lại để gỡ đúng token đó khi đăng xuất. */
export const BTMS_PUSH_TOKEN_KEY = "btms_push_token";

/**
 * Nhãn tiếng Việt cho từng loại sự kiện, khớp EmailEventType của backend.
 *
 * Backend đã có sẵn displayName cho push, nhưng danh sách trong app lấy tiêu đề từ dòng chủ đề
 * email — thường dài và trang trọng. Nhãn ngắn ở đây dùng làm chip phân loại trên thẻ.
 */
export const NOTIFICATION_EVENT_LABELS = {
  USER_REGISTERED: "Tài khoản",
  REGISTRATION_SUBMITTED: "Đăng ký",
  REGISTRATION_APPROVED: "Đăng ký",
  REGISTRATION_REJECTED: "Đăng ký",
  REGISTRATION_CANCELLED: "Đăng ký",
  PAYMENT_SUCCESS: "Thanh toán",
  PAYMENT_FAILED: "Thanh toán",
  TOURNAMENT_REGISTRATION_OPEN: "Giải đấu",
  TOURNAMENT_REGISTRATION_CLOSING_SOON: "Giải đấu",
  TOURNAMENT_DRAW_COMPLETED: "Giải đấu",
  TOURNAMENT_STATUS_CHANGED: "Giải đấu",
  MATCH_SCHEDULED_REMINDER: "Trận đấu",
  MATCH_STARTING_SOON: "Trận đấu",
  MATCH_COMPLETED: "Trận đấu",
  MATCH_REFEREE_ASSIGNED: "Trận đấu",
  PARTICIPANT_WITHDRAWN: "Giải đấu",
  STAFF_ACCOUNT_CREATED: "Tài khoản",
  MANAGER_ACCOUNT_CREATED: "Tài khoản",
  CUSTOM_MANUAL_SEND: "Thông báo",
};

export const getNotificationLabel = (eventType) =>
  NOTIFICATION_EVENT_LABELS[eventType] || "Thông báo";

/**
 * Số dòng popup chuông tải về.
 *
 * Không phân trang trong popup: nó cao tối đa nửa màn hình, cuộn hết chừng này là người dùng đã
 * đi đủ xa vào quá khứ. Cần nhiều hơn thì đó là dấu hiệu cần một màn riêng, mà màn riêng thì
 * chính là thứ đã bị bỏ.
 */
export const NOTIFICATION_POPUP_SIZE = 20;
