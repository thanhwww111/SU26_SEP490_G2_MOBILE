/**
 * Hằng số cho màn hồ sơ.
 *
 * Nhãn và mã lấy đúng từ FE web (`constants/profileConfig.js` và
 * `constants/accountConfig.js`) để hai nền tảng gửi lên backend cùng bộ giá trị.
 */

export const GENDER_OPTIONS = [
  { value: "", label: "Không chọn" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export const GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const BILLIARD_RANK_OPTIONS = [
  { value: "UNRANKED", label: "Chưa xếp hạng" },
  { value: "BEGINNER", label: "Mới chơi" },
  { value: "AMATEUR", label: "Phong trào" },
  { value: "SEMI_PRO", label: "Bán chuyên" },
  { value: "PRO", label: "Chuyên nghiệp" },
];

export const BILLIARD_RANK_LABELS = Object.fromEntries(
  BILLIARD_RANK_OPTIONS.map((o) => [o.value, o.label])
);

/**
 * Số điện thoại Việt Nam: 10 số, đầu 03/05/07/08/09.
 *
 * Chặt hơn `validatePhone` trong utils/validators.js (10–11 số bất kỳ) vì
 * backend áp đúng regex này cho `UserProfileRequest.phone` — dùng rule lỏng hơn
 * thì client cho qua rồi server mới báo lỗi.
 */
export const VN_PHONE_PATTERN = /^(0[3|5|7|8|9])[0-9]{8}$/;

/** Ảnh đại diện: định dạng và dung lượng tối đa, khớp giới hạn của web */
export const ACCEPTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const EMPTY_PROFILE_FORM = {
  fullName: "",
  displayName: "",
  phone: "",
  /** Presigned URL từ GET /profile hoặc preview sau khi upload — chỉ để hiển thị */
  avatarPreviewUrl: "",
  /** objectKey của MinIO — gửi lên trong body dưới tên `avatarUrl` */
  avatarObjectKey: "",
  /** Người dùng gõ theo dd/mm/yyyy; đổi sang ISO khi gửi đi */
  dateOfBirth: "",
  gender: "",
  billiardRank: "UNRANKED",
  bio: "",
};
