import { EMPTY_PROFILE_FORM, VN_PHONE_PATTERN } from "../../constants/profile";
import { dateInputToIso, isFutureDate, isoToDateInput } from "../../utils/date";

/** Response của backend → state của form. Ngày đổi sang dd/mm/yyyy để người dùng đọc. */
export const profileToForm = (profile) => ({
  ...EMPTY_PROFILE_FORM,
  fullName: profile?.fullName || "",
  displayName: profile?.displayName || "",
  phone: profile?.phone || "",
  avatarPreviewUrl: profile?.avatarUrl || "",
  dateOfBirth: isoToDateInput(profile?.dateOfBirth),
  gender: profile?.gender || "",
  billiardRank: profile?.billiardRank || "UNRANKED",
  bio: profile?.bio || "",
});

/**
 * Kiểm tra form và dựng body gửi lên.
 *
 * Trả `{ body, errors: null }` khi hợp lệ, `{ errors }` khi không — cùng giao
 * kèo với `validateProfileForm` bên web để hai bên dễ đối chiếu.
 *
 * Hai luật của backend phải tôn trọng, nếu không sẽ bị từ chối:
 * - `billiardRank` chỉ được gửi khi tài khoản là PLAYER.
 * - Trường trống thì bỏ hẳn khỏi body, đừng gửi chuỗi rỗng.
 */
export const buildProfileBody = (form, { mode = "edit", isPlayer = true } = {}) => {
  const errors = {};

  if (!form.fullName?.trim()) {
    errors.fullName = "Họ và tên là bắt buộc";
  }

  const phone = form.phone?.trim();
  if (mode === "edit" && phone && !VN_PHONE_PATTERN.test(phone)) {
    errors.phone = "Số điện thoại VN hợp lệ: 10 số, bắt đầu 03/05/07/08/09";
  }

  let dateOfBirthIso = null;
  if (form.dateOfBirth?.trim()) {
    dateOfBirthIso = dateInputToIso(form.dateOfBirth);
    if (!dateOfBirthIso) {
      errors.dateOfBirth = "Ngày sinh không hợp lệ, nhập theo dạng dd/mm/yyyy";
    } else if (isFutureDate(dateOfBirthIso)) {
      errors.dateOfBirth = "Ngày sinh không được là ngày trong tương lai";
    }
  }

  if (Object.keys(errors).length > 0) return { errors };

  const body = { fullName: form.fullName.trim() };

  const optional = (key, value) => {
    if (value != null && String(value).trim() !== "") {
      body[key] = String(value).trim();
    }
  };

  optional("displayName", form.displayName);
  // Backend nhận objectKey của MinIO nhưng đặt tên trường là avatarUrl —
  // gửi presigned URL vào đây thì ảnh sẽ hỏng ở lần đọc sau
  optional("avatarUrl", form.avatarObjectKey);
  optional("gender", form.gender);
  optional("bio", form.bio);

  if (dateOfBirthIso) body.dateOfBirth = dateOfBirthIso;

  // Tạo hồ sơ lần đầu chưa cho đặt số điện thoại — web cũng bỏ trường này ở
  // chế độ create vì số điện thoại đã lấy từ lúc đăng ký tài khoản
  if (mode === "edit") optional("phone", phone);

  if (isPlayer) {
    body.billiardRank = form.billiardRank?.trim() || "UNRANKED";
  }

  return { body, errors: null };
};
