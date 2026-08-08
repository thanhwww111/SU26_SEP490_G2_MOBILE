import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import FormError from "../../src/components/auth/FormError";
import TextLink from "../../src/components/auth/TextLink";
import * as authApi from "../../src/api/authApi";
import { useAuthStore } from "../../src/store/authStore";
import {
  collectErrors,
  validateEmail,
  validatePassword,
} from "../../src/utils/validators";

export default function LoginScreen() {
  const router = useRouter();
  const loginFromResponse = useAuthStore((s) => s.loginFromResponse);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runValidation = () =>
    collectErrors({
      email: () => validateEmail(form.email),
      password: () => validatePassword(form.password),
    });

  /** Validate lại ngay khi gõ để lỗi biến mất lúc người dùng sửa xong */
  const setField = (name) => (value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => {
      const message =
        name === "email" ? validateEmail(value) : validatePassword(value);
      const updated = { ...prev };
      if (message) updated[name] = message;
      else delete updated[name];
      return updated;
    });
  };

  const markTouched = (name) => () =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });
    const nextErrors = runValidation();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.login({
        email: form.email,
        password: form.password,
      });
      if (!data.success) {
        throw new Error(
          data.message || "Đăng nhập thất bại. Sai email hoặc mật khẩu."
        );
      }
      await loginFromResponse(data, form.email, form.password);
      router.replace("/(app)/home");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Đăng nhập." card={false}>
      <FormError message={errors.submit} tone="dark" />

      <Input
        label="Địa chỉ E-mail"
        value={form.email}
        onChangeText={setField("email")}
        onBlur={markTouched("email")}
        placeholder="Nhập địa chỉ email"
        error={errors.email}
        touched={touched.email}
        tone="dark"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        className="mb-3"
      />

      <Input
        label="Mật khẩu"
        value={form.password}
        onChangeText={setField("password")}
        onBlur={markTouched("password")}
        placeholder="Nhập mật khẩu"
        error={errors.password}
        touched={touched.password}
        secure
        tone="dark"
        autoCapitalize="none"
        onSubmitEditing={handleSubmit}
        className="mb-2"
      />

      {/* Hành động chính nằm bên phải cho vừa tầm ngón cái phải, link phụ dạt sang trái */}
      <TextLink
        title="Khôi phục mật khẩu tại đây"
        onPress={() => router.push("/forgot-password")}
        align="left"
        tone="dark"
        className="mb-3"
      />

      <Button
        title="Đăng nhập"
        loadingTitle="Đang xử lý..."
        onPress={handleSubmit}
        loading={isLoading}
        variant="light"
        className="self-end"
      />

      <View className="my-5 h-px bg-white/20" />

      <Text className="mb-2 text-[13px] font-bold uppercase italic tracking-[1.5px] text-white">
        Bạn chưa có tài khoản?
      </Text>
      <Text className="mb-4 text-xs text-slate-300">
        Đăng ký ngay để cập nhật tỉ số trực tiếp từ{" "}
        <Text className="font-bold uppercase italic text-white">capstone</Text>.
      </Text>
      <Button
        title="Đăng ký ngay"
        onPress={() => router.push("/register")}
        variant="ghost"
        className="self-start"
      />
    </AuthScreen>
  );
}
