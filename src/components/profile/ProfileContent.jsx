import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import ProfileAvatarCard from "./ProfileAvatarCard";
import ProfileForm from "./ProfileForm";
import ChangePasswordCard from "./ChangePasswordCard";
import { buildProfileBody, profileToForm } from "./profileFormUtils";
import Button from "../Button";
import FormError from "../auth/FormError";
import FormSuccess from "../auth/FormSuccess";
import AppFooter from "../layout/AppFooter";
import * as profileApi from "../../api/profileApi";
import * as storageApi from "../../api/storageApi";
import { ROLES } from "../../constants/auth";
import {
  ACCEPTED_AVATAR_TYPES,
  EMPTY_PROFILE_FORM,
  MAX_AVATAR_BYTES,
} from "../../constants/profile";
import { useRefresh } from "../../hooks/useRefresh";
import { useAuthStore } from "../../store/authStore";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Hồ sơ chưa tồn tại thì backend trả 404 kèm mã PROFILE_002. Đây là trạng thái
 * bình thường của tài khoản vừa đăng ký, không phải lỗi.
 */
const isProfileMissing = (err) =>
  err?.response?.status === 404 || err?.code === "PROFILE_002";

/**
 * Nội dung màn hồ sơ: tải, sửa, đổi ảnh đại diện, đổi mật khẩu.
 *
 * Bám `pages/Profile/index.jsx` của web, kể cả bốn chế độ:
 * - `edit`   — đã có hồ sơ, sửa được.
 * - `create` — chưa có hồ sơ và tài khoản là PLAYER: tạo mới qua POST /player/profile.
 * - `empty`  — chưa có hồ sơ nhưng không phải PLAYER: backend không cho tự tạo.
 * - `error`  — tải hỏng vì lý do khác, cho thử lại.
 *
 * Sau khi lưu, tên trong phiên đăng nhập được vá lại (`patchUser`) — tên hiển
 * thị nằm ở menu hồ sơ trên header, không đồng bộ thì người dùng đổi tên xong
 * vẫn thấy tên cũ.
 */
export default function ProfileContent() {
  const colors = useThemeColors();

  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const isPlayer = user?.role === ROLES.PLAYER;

  const [mode, setMode] = useState("edit");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_PROFILE_FORM);
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const alive = useRef(true);

  const email = profile?.email || user?.email || "";

  const applyProfile = useCallback(
    (data) => {
      setProfile({ ...data, email: data?.email || user?.email || "" });
      setForm(profileToForm(data));
      setErrors({});
    },
    [user?.email]
  );

  /**
   * @param silent — vuốt để làm mới thì đừng bật `loading`: nhánh loading thay cả màn bằng vòng
   *   quay, mà hồ sơ đang hiện vẫn đúng cho tới khi có bản mới.
   *
   * Lưu ý: `applyProfile` ghi đè form bằng dữ liệu vừa tải, nên vuốt làm mới giữa chừng sẽ mất
   * những gì đang gõ dở. Đó đúng là ý nghĩa của cử chỉ này — F5 trên web cũng vậy — và vì nó do
   * người dùng chủ động làm chứ không tự xảy ra nên không cần hỏi lại.
   */
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setFormError("");
    try {
      const data = await profileApi.getProfile();
      if (!alive.current) return;
      applyProfile(data);
      setMode("edit");
    } catch (e) {
      if (!alive.current) return;

      if (isProfileMissing(e)) {
        setProfile(null);
        setForm({ ...EMPTY_PROFILE_FORM, fullName: user?.fullName || "" });
        setMode(isPlayer ? "create" : "empty");
      } else {
        // Hỏng khi vuốt làm mới thì báo bằng dải lỗi trong form, đừng chuyển sang `mode="error"`:
        // nhánh đó thay cả màn bằng một trang lỗi, mất luôn hồ sơ vẫn đang hiển thị đúng.
        setFormError(e.message);
        if (!silent) setMode("error");
      }
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [applyProfile, isPlayer, user?.fullName]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);
  const { refreshControl } = useRefresh(refresh);

  const patchForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setSuccess("");
  };

  /** Gửi form lên; dùng chung cho nút Lưu và cho việc ghi ảnh vừa tải lên */
  const persist = async (source) => {
    const { body, errors: found } = buildProfileBody(source, {
      mode: mode === "create" ? "create" : "edit",
      isPlayer,
    });

    if (found) {
      setErrors(found);
      return { ok: false, needsForm: true };
    }

    const data =
      mode === "create"
        ? await profileApi.createPlayerProfile(body)
        : await profileApi.updateProfile(body);

    if (!alive.current) return { ok: true };

    applyProfile(data);
    setMode("edit");
    await patchUser({
      fullName: data?.fullName || body.fullName,
      avatarUrl: data?.avatarUrl,
    });

    return { ok: true };
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      const result = await persist(form);
      if (result.ok && alive.current) {
        setSuccess(
          mode === "create" ? "Đã tạo hồ sơ." : "Cập nhật hồ sơ thành công."
        );
      }
    } catch (e) {
      // Hồ sơ đã tồn tại (bấm tạo hai lần, hoặc tạo ở thiết bị khác) —
      // tải lại rồi cho sửa thay vì bắt người dùng tự hiểu lỗi 409
      if (e?.response?.status === 409 || e?.code === "PROFILE_001") {
        await load();
        if (alive.current) setFormError("Hồ sơ đã tồn tại, đã tải lại dữ liệu mới nhất.");
      } else if (alive.current) {
        setFormError(e.message);
      }
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    setFormError("");
    setSuccess("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(
        "Cần quyền truy cập thư viện ảnh để đổi ảnh đại diện. Bật lại trong phần Cài đặt của máy."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      // Ảnh đại diện hiển thị trong khung tròn nên cắt vuông ngay từ đầu
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    if (asset.mimeType && !ACCEPTED_AVATAR_TYPES.includes(asset.mimeType)) {
      setFormError("Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.");
      return;
    }
    if (asset.fileSize != null && asset.fileSize > MAX_AVATAR_BYTES) {
      setFormError("Ảnh tối đa 5MB.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await storageApi.uploadImage(
        {
          uri: asset.uri,
          name: asset.fileName || "avatar.jpg",
          type: asset.mimeType || "image/jpeg",
        },
        "avatars"
      );

      const objectKey = uploaded?.objectKey;
      if (!objectKey) {
        setFormError("Không nhận được objectKey từ máy chủ.");
        return;
      }

      const nextForm = {
        ...form,
        avatarObjectKey: objectKey,
        avatarPreviewUrl: uploaded?.url || asset.uri,
      };
      if (alive.current) {
        patchForm({
          avatarObjectKey: objectKey,
          avatarPreviewUrl: nextForm.avatarPreviewUrl,
        });
      }

      // Ghi luôn như web, để người dùng không đổi ảnh xong rồi quên bấm lưu.
      // Form còn thiếu (thường là họ tên lúc tạo hồ sơ) thì giữ ảnh ở dạng xem
      // trước và nhắc bấm lưu.
      const result2 = await persist(nextForm);
      if (!alive.current) return;

      setSuccess(
        result2.ok
          ? "Đã cập nhật ảnh đại diện."
          : "Đã tải ảnh lên. Điền nốt thông tin còn thiếu rồi bấm lưu hồ sơ."
      );
    } catch (e) {
      if (alive.current) setFormError(e.message);
    } finally {
      if (alive.current) setUploading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (mode === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas px-4">
        <Text className="text-center text-sm text-muted">
          {formError || "Không thể tải hồ sơ."}
        </Text>
        <Pressable
          onPress={() => load()}
          className="rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
        >
          <Text className="text-sm font-semibold text-content-2">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const showForm = mode === "edit" || mode === "create";

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      <View className="gap-4 p-4">
        <ProfileAvatarCard
          avatarUrl={form.avatarPreviewUrl}
          displayName={form.displayName || form.fullName}
          email={email}
          role={user?.role}
          uploading={uploading}
          disabled={saving}
          onPickAvatar={handlePickAvatar}
        />

        <FormError message={formError} className="" />
        <FormSuccess message={success} className="" />

        {mode === "create" ? (
          <Text className="text-sm text-muted">
            Điền thông tin bên dưới và bấm lưu để hoàn tất hồ sơ của bạn.
          </Text>
        ) : null}

        {mode === "empty" ? (
          <View className="rounded-xl border border-line bg-surface p-4">
            <Text className="text-sm text-muted">
              Tài khoản này chưa có hồ sơ và không thuộc nhóm cơ thủ, nên không
              tự tạo hồ sơ được. Liên hệ quản trị viên nếu cần bổ sung.
            </Text>
          </View>
        ) : null}

        {showForm ? (
          <ProfileForm
            form={form}
            errors={errors}
            email={email}
            mode={mode}
            isPlayer={isPlayer}
            saving={saving}
            uploading={uploading}
            onChange={patchForm}
            onSubmit={handleSubmit}
          />
        ) : null}

        <ChangePasswordCard disabled={saving || uploading} />

        <LogoutButton />
      </View>

      <AppFooter />
    </ScrollView>
  );
}

/**
 * Đăng xuất. Web để mục này trong dropdown hồ sơ trên header; mobile giữ luôn
 * ở cuối màn vì đó là nơi người dùng đi tìm khi đang xem hồ sơ của mình —
 * mục trong menu hồ sơ vẫn còn nguyên, đây là lối thứ hai chứ không thay thế.
 */
const LogoutButton = () => {
  const logout = useAuthStore((s) => s.logout);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      // Không cần điều hướng tay: guard trong app/(app)/_layout.jsx thấy phiên
      // trống sẽ tự đẩy về màn đăng nhập
      await logout();
    } finally {
      // Xoá phiên hỏng thì màn vẫn còn đó — mở khoá nút để người dùng thử lại
      setBusy(false);
    }
  };

  return (
    <Button
      title="Đăng xuất"
      variant="outline"
      loading={busy}
      loadingTitle="Đang đăng xuất..."
      onPress={handleLogout}
    />
  );
};
