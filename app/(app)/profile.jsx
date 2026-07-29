import ProfileContent from "../../src/components/profile/ProfileContent";

/**
 * Hồ sơ người dùng, bám trang /profile của FE web.
 *
 * Header (kèm nút quay lại) do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 * Toàn bộ việc tải và lưu nằm trong ProfileContent.
 */
export default function ProfileScreen() {
  return <ProfileContent />;
}
