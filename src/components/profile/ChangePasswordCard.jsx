import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Shield } from "lucide-react-native";

import Input from "../Input";
import Button from "../Button";
import FormError from "../auth/FormError";
import FormSuccess from "../auth/FormSuccess";
import * as authApi from "../../api/authApi";
import { MIN_PASSWORD_LENGTH } from "../../utils/validators";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

const EMPTY_FORM = { oldPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Kiểm tra ba ô mật khẩu.
 *
 * Chép đúng luật của `passwordFormUtils.js` bên web, kể cả câu chữ, để hai nền
 * tảng báo lỗi giống nhau. Giới hạn 6–100 ký tự là ràng buộc của backend
 * (`ChangePasswordRequest`), không phải quy ước của client.
 */
const validate = (form) => {
  const errors = {};

  if (!form.oldPassword?.trim()) {
    errors.oldPassword = "Mật khẩu hiện tại không được để trống";
  }

  if (!form.newPassword?.trim()) {
    errors.newPassword = "Mật khẩu mới không được để trống";
  } else if (
    form.newPassword.length < MIN_PASSWORD_LENGTH ||
    form.newPassword.length > 100
  ) {
    errors.newPassword = "Mật khẩu phải từ 6-100 ký tự";
  } else if (form.newPassword === form.oldPassword) {
    errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
  }

  if (!form.confirmPassword?.trim()) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
  } else if (form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return errors;
};

/**
 * Khối "Bảo mật tài khoản" — đổi mật khẩu, xổ ra khi chạm tiêu đề.
 *
 * Giữ nguyên dạng khối xổ của web (`profile-security-card`) thay vì đổi thành
 * bottom sheet: đây là form ba ô có bàn phím, sheet sẽ bị bàn phím che.
 *
 * Thành công thì báo bằng `FormSuccess` ngay trong khối — project chưa có
 * thư viện toast.
 */
export default function ChangePasswordCard({ disabled = false }) {
  const colors = useThemeColors();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const setField = (name) => (value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError("");
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
  };

  const toggle = () => {
    if (submitting) return;
    if (open) reset();
    setSuccess("");
    setOpen((v) => !v);
  };

  const submit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFormError("");
    setSuccess("");
    try {
      await authApi.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      reset();
      setOpen(false);
      setSuccess("Đổi mật khẩu thành công.");
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="overflow-hidden rounded-xl border border-line bg-surface">
      <Pressable
        onPress={toggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3 p-4 active:bg-sunken"
      >
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-sunken">
          <Shield size={iconSize.md} color={colors.brand} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-content">
            Bảo mật tài khoản
          </Text>
          <Text className="mt-0.5 text-xs text-muted">
            Đổi mật khẩu đăng nhập
          </Text>
        </View>

        {open ? (
          <ChevronUp size={iconSize.md} color={colors.muted} />
        ) : (
          <ChevronDown size={iconSize.md} color={colors.muted} />
        )}
      </Pressable>

      {/* Báo thành công ở ngoài phần xổ, vì khối tự đóng lại sau khi đổi xong */}
      {!open && success ? (
        <View className="px-4 pb-4">
          <FormSuccess message={success} className="" />
        </View>
      ) : null}

      {open ? (
        <View className="gap-4 border-t border-line-soft p-4">
          <FormError message={formError} className="" />

          <Input
            label="Mật khẩu hiện tại"
            value={form.oldPassword}
            onChangeText={setField("oldPassword")}
            error={errors.oldPassword}
            touched
            secure
            editable={!submitting}
            autoCapitalize="none"
          />

          <Input
            label="Mật khẩu mới"
            value={form.newPassword}
            onChangeText={setField("newPassword")}
            error={errors.newPassword}
            touched
            secure
            editable={!submitting}
            autoCapitalize="none"
          />

          <Input
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            onChangeText={setField("confirmPassword")}
            error={errors.confirmPassword}
            touched
            secure
            editable={!submitting}
            autoCapitalize="none"
          />

          <View className="flex-row gap-3">
            <Button
              title="Hủy"
              variant="outline"
              onPress={toggle}
              disabled={submitting}
              className="flex-1"
            />
            <Button
              title="Cập nhật"
              loadingTitle="Đang lưu..."
              loading={submitting}
              onPress={submit}
              className="flex-1"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
