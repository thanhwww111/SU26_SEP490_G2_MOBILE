import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import FormError from "../../src/components/auth/FormError";
import * as authApi from "../../src/api/authApi";
import {
  collectErrors,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validatePhone,
} from "../../src/utils/validators";

const TERMS_ERROR = "Bạn phải đồng ý với Điều khoản và Chính sách bảo mật";

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateOne = (name, value, source) => {
    if (name === "email") return validateEmail(value);
    if (name === "phone") return validatePhone(value);
    if (name === "password") return validatePassword(value);
    if (name === "confirmPassword")
      return validateConfirmPassword(value, source.password);
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

      // Đổi mật khẩu thì ô xác nhận phải được soi lại theo giá trị mới
      if (name === "password" && next.confirmPassword) {
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

  const toggleTerms = () => {
    const value = !form.agreeTerms;
    setForm((prev) => ({ ...prev, agreeTerms: value }));
    setTouched((prev) => ({ ...prev, agreeTerms: true }));
    setErrors((prev) => {
      const updated = { ...prev };
      if (value) delete updated.agreeTerms;
      else updated.agreeTerms = TERMS_ERROR;
      return updated;
    });
  };

  const handleSubmit = async () => {
    setTouched({
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    const nextErrors = collectErrors({
      email: () => validateEmail(form.email),
      phone: () => validatePhone(form.phone),
      password: () => validatePassword(form.password),
      confirmPassword: () =>
        validateConfirmPassword(form.confirmPassword, form.password),
      agreeTerms: () => (form.agreeTerms ? null : TERMS_ERROR),
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.register({
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (!data.success) {
        throw new Error(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
      router.replace("/login");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Đăng ký." card={false}>
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
        label="Số điện thoại"
        value={form.phone}
        onChangeText={setField("phone")}
        onBlur={markTouched("phone")}
        placeholder="Nhập số điện thoại"
        error={errors.phone}
        touched={touched.phone}
        tone="dark"
        keyboardType="phone-pad"
        className="mb-3"
      />

      <Input
        label="Mật khẩu"
        value={form.password}
        onChangeText={setField("password")}
        onBlur={markTouched("password")}
        placeholder="Ít nhất 6 ký tự"
        error={errors.password}
        touched={touched.password}
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
        placeholder="Nhập lại mật khẩu"
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        secure
        tone="dark"
        autoCapitalize="none"
        className="mb-3"
      />

      <Pressable
        onPress={toggleTerms}
        className="flex-row items-start gap-2 pt-1"
        hitSlop={4}
      >
        <View
          className={`mt-0.5 h-3.5 w-3.5 items-center justify-center rounded-sm border ${
            form.agreeTerms ? "border-white bg-white" : "border-white/50"
          }`}
        >
          {form.agreeTerms ? <Check size={10} color="#1a2a4a" /> : null}
        </View>
        <Text className="flex-1 text-xs leading-relaxed text-slate-300">
          Tôi đã đọc và đồng ý với{" "}
          <Text className="text-sky-300">Điều khoản sử dụng</Text> và{" "}
          <Text className="text-sky-300">Chính sách bảo mật</Text>
        </Text>
      </Pressable>
      {touched.agreeTerms && errors.agreeTerms ? (
        <Text className="mt-1 text-xs text-red-400">{errors.agreeTerms}</Text>
      ) : null}

      {/* Hành động chính nằm bên phải cho vừa tầm ngón cái phải */}
      <Button
        title="Đăng ký"
        loadingTitle="Đang xử lý..."
        onPress={handleSubmit}
        loading={isLoading}
        variant="light"
        className="mt-4 w-2/5 self-end"
      />

      <View className="my-5 h-px bg-white/20" />

      <Text className="mb-2 text-[13px] font-bold uppercase italic tracking-[1.5px] text-white">
        Đã có tài khoản?
      </Text>
      <Text className="mb-4 text-xs text-slate-300">
        Đăng nhập để truy cập{" "}
        <Text className="font-bold uppercase italic text-white">capstone</Text>.
      </Text>
      <Button
        title="Đăng nhập"
        onPress={() => router.replace("/login")}
        variant="ghost"
        className="self-start"
      />
    </AuthScreen>
  );
}
