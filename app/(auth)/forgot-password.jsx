import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import FormError from "../../src/components/auth/FormError";
import TextLink from "../../src/components/auth/TextLink";
import * as authApi from "../../src/api/authApi";
import { validateEmail } from "../../src/utils/validators";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (value) => {
    setEmail(value);
    setTouched(true);
    setErrors((prev) => {
      const updated = { ...prev };
      const message = validateEmail(value);
      if (message) updated.email = message;
      else delete updated.email;
      return updated;
    });
  };

  const handleSubmit = async () => {
    setTouched(true);
    const message = validateEmail(email);
    if (message) {
      setErrors({ email: message });
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.forgotPassword({ email });
      if (!data.success) {
        throw new Error(data.message || "Không thể gửi OTP.");
      }
      // Màn đặt lại mật khẩu cần email để gửi kèm khi xác nhận OTP
      router.push({ pathname: "/reset-password", params: { email } });
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Khôi phục mật khẩu." card={false}>
      <FormError message={errors.submit} tone="dark" />

      <Text className="mb-3 text-xs text-slate-300">
        Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi mã OTP
        để đặt lại mật khẩu.
      </Text>

      <Input
        label="Địa chỉ E-mail"
        value={email}
        onChangeText={handleChange}
        onBlur={() => setTouched(true)}
        placeholder="Nhập email đã đăng ký với Capstone"
        error={errors.email}
        touched={touched}
        tone="dark"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onSubmitEditing={handleSubmit}
        className="mb-4"
      />

      {/* Hành động chính nằm bên phải cho vừa tầm ngón cái phải */}
      <Button
        title="Gửi mã OTP"
        loadingTitle="Đang gửi..."
        onPress={handleSubmit}
        loading={isLoading}
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
