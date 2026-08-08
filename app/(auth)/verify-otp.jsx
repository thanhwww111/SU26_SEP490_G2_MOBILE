import { useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import FormError from "../../src/components/auth/FormError";
import FormSuccess from "../../src/components/auth/FormSuccess";
import TextLink from "../../src/components/auth/TextLink";
import * as authApi from "../../src/api/authApi";
import { validateOtp } from "../../src/utils/validators";

/**
 * Bước 2 của luồng khôi phục mật khẩu: xác thực mã OTP.
 *
 * Web gộp cả ba bước trong một trang (`ForgotPasswordPage`, `step` 1→2→3);
 * mobile tách thành ba màn vì mỗi bước một màn thì nút Quay lại của hệ điều
 * hành hoạt động đúng, còn gộp một màn thì bấm Quay lại là văng khỏi cả luồng.
 *
 * Bước này chỉ kiểm mã, chưa đổi mật khẩu — gõ nhầm OTP thì biết ngay tại đây
 * thay vì phải điền xong mật khẩu mới rồi mới bị báo sai.
 *
 * OTP được chuyển tiếp sang bước 3 qua tham số route: backend cần cả `otp` lẫn
 * `newPassword` trong một lời gọi `reset-password`.
 */
export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email = "" } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (value) => {
    setOtp(value);
    setTouched(true);
    setErrors((prev) => {
      const updated = { ...prev };
      const message = validateOtp(value);
      if (message) updated.otp = message;
      else delete updated.otp;
      return updated;
    });
  };

  const handleSubmit = async () => {
    setTouched(true);

    const message = validateOtp(otp);
    if (message) {
      setErrors({ otp: message });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.verifyOtp({ email, otp });
      if (!data.success) {
        throw new Error(data.message || "Mã OTP không hợp lệ.");
      }
      router.push({ pathname: "/reset-password", params: { email, otp } });
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Xác thực OTP." card={false}>
      <FormSuccess message="Mã OTP đã được gửi đến email của bạn." tone="dark" />
      <FormError message={errors.submit} tone="dark" />

      <Text className="mb-3 text-xs text-slate-300">
        Nhập mã OTP đã được gửi đến{" "}
        <Text className="font-bold text-white">{email}</Text>.
      </Text>

      <Input
        label="Mã OTP"
        value={otp}
        onChangeText={handleChange}
        onBlur={() => setTouched(true)}
        placeholder="Nhập mã OTP"
        error={errors.otp}
        touched={touched}
        tone="dark"
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={handleSubmit}
        className="mb-4"
      />

      {/* Hành động chính nằm bên phải cho vừa tầm ngón cái phải */}
      <Button
        title="Xác thực"
        loadingTitle="Đang kiểm tra..."
        onPress={handleSubmit}
        loading={isLoading}
        variant="light"
        className="self-end"
      />

      <TextLink
        title="Nhập lại email"
        onPress={() => router.back()}
        align="left"
        tone="dark"
        className="mt-4"
      />
    </AuthScreen>
  );
}
