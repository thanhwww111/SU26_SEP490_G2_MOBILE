import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import FormError from "../../src/components/auth/FormError";
import FormSuccess from "../../src/components/auth/FormSuccess";
import TextLink from "../../src/components/auth/TextLink";
import * as authApi from "../../src/api/authApi";
import {
  collectErrors,
  validateConfirmPassword,
  validatePassword,
} from "../../src/utils/validators";

/** Chờ chút cho người dùng kịp đọc thông báo thành công rồi mới đẩy về Login */
const REDIRECT_DELAY_MS = 2000;

/**
 * Bước 3 của luồng khôi phục mật khẩu: đặt mật khẩu mới.
 *
 * `email` và `otp` đến từ tham số route — OTP đã được bước 2 xác thực, ở đây
 * chỉ gửi kèm lên vì backend cần cả ba trường trong một lời gọi.
 *
 * Vào thẳng màn này mà thiếu tham số (deep link cũ, hoặc khôi phục phiên) thì
 * không có gì để gửi lên; lúc đó đẩy người dùng về bước 1 thay vì để họ điền
 * xong rồi mới nhận lỗi từ server.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email = "", otp = "" } = useLocalSearchParams();

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const redirectTimer = useRef(null);
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  /* Thiếu email hoặc OTP thì không có gì gửi lên — quay về bước 1 ngay thay vì
     để người dùng điền xong mật khẩu rồi mới nhận lỗi từ server */
  useEffect(() => {
    if (!email || !otp) router.replace("/forgot-password");
  }, [email, otp, router]);

  const validateOne = (name, value, source) => {
    if (name === "newPassword") return validatePassword(value);
    if (name === "confirmPassword")
      return validateConfirmPassword(value, source.newPassword);
    return null;
  };

  const setField = (name) => (value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    setTouched((prev) => ({ ...prev, [name]: true }));

    setErrors((prev) => {
      const updated = { ...prev };
      const message = validateOne(name, value, next);
      if (message) updated[name] = message;
      else delete updated[name];

      if (name === "newPassword" && next.confirmPassword) {
        const confirmMessage = validateConfirmPassword(
          next.confirmPassword,
          value
        );
        if (confirmMessage) updated.confirmPassword = confirmMessage;
        else delete updated.confirmPassword;
      }

      return updated;
    });
  };

  const markTouched = (name) => () =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const handleSubmit = async () => {
    setTouched({ newPassword: true, confirmPassword: true });

    const nextErrors = collectErrors({
      newPassword: () => validatePassword(form.newPassword),
      confirmPassword: () =>
        validateConfirmPassword(form.confirmPassword, form.newPassword),
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.resetPassword({
        email,
        otp,
        newPassword: form.newPassword,
      });
      if (!data.success) {
        throw new Error(data.message || "Đặt lại mật khẩu thất bại.");
      }
      setSuccessMessage(
        "Mật khẩu đã được đặt lại thành công! Đang chuyển hướng..."
      );
      redirectTimer.current = setTimeout(
        () => router.replace("/login"),
        REDIRECT_DELAY_MS
      );
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Đặt lại mật khẩu." card={false}>
      <FormSuccess message={successMessage} tone="dark" />
      <FormError message={errors.submit} tone="dark" />

      <Text className="mb-3 text-xs text-slate-300">
        Mã OTP đã được xác thực. Đặt mật khẩu mới cho{" "}
        <Text className="font-bold text-white">{email}</Text>.
      </Text>

      <Input
        label="Mật khẩu mới"
        value={form.newPassword}
        onChangeText={setField("newPassword")}
        onBlur={markTouched("newPassword")}
        placeholder="Ít nhất 6 ký tự"
        error={errors.newPassword}
        touched={touched.newPassword}
        secure
        tone="dark"
        autoCapitalize="none"
        className="mb-3"
      />

      <Input
        label="Xác nhận mật khẩu"
        value={form.confirmPassword}
        onChangeText={setField("confirmPassword")}
        onBlur={markTouched("confirmPassword")}
        placeholder="Nhập lại mật khẩu mới"
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        secure
        tone="dark"
        autoCapitalize="none"
        className="mb-4"
      />

      {/* Hành động chính nằm bên phải cho vừa tầm ngón cái phải */}
      <Button
        title="Đặt lại mật khẩu"
        loadingTitle="Đang xử lý..."
        onPress={handleSubmit}
        loading={isLoading}
        disabled={Boolean(successMessage)}
        variant="light"
        className="self-end"
      />

      <TextLink
        title="Quay lại đăng nhập"
        onPress={() => router.replace("/login")}
        align="left"
        tone="dark"
        className="mt-4"
      />
    </AuthScreen>
  );
}
