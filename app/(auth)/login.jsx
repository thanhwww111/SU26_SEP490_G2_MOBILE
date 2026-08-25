import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import AuthScreen from "../../src/components/auth/AuthScreen";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import EmailSuggestions from "../../src/components/auth/EmailSuggestions";
import FormError from "../../src/components/auth/FormError";
import FormSuccess from "../../src/components/auth/FormSuccess";
import TextLink from "../../src/components/auth/TextLink";
import * as authApi from "../../src/api/authApi";
import { useAuthStore } from "../../src/store/authStore";
import {
  filterKnownEmails,
  forgetEmail,
  getHomeRouteForRole,
  readKnownEmails,
} from "../../src/utils/auth";
import {
  collectErrors,
  validateEmail,
  validatePassword,
} from "../../src/utils/validators";

/** Chờ bao lâu trước khi ẩn gợi ý lúc ô email mất tiêu điểm — xem `handleEmailBlur` */
const SUGGESTION_HIDE_MS = 150;

export default function LoginScreen() {
  const router = useRouter();
  const loginFromResponse = useAuthStore((s) => s.loginFromResponse);
  /* Màn Đăng ký chuyển sang đây bằng `replace` kèm cờ `registered`. Đọc một lần
     lúc mount rồi giữ trong state: người dùng phải tắt được lời chúc mừng, mà
     params thì còn nguyên suốt vòng đời màn hình nên không tắt theo được. */
  const params = useLocalSearchParams();
  const [notice, setNotice] = useState(
    params.registered === "1"
      ? "Đăng ký tài khoản thành công. Vui lòng đăng nhập để tiếp tục."
      : ""
  );

  const [form, setForm] = useState({
    email: typeof params.email === "string" ? params.email : "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /* --- Gợi ý email đã từng đăng nhập trên máy này --- */
  const [knownEmails, setKnownEmails] = useState([]);
  const [emailFocused, setEmailFocused] = useState(false);
  const passwordRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    let alive = true;

    readKnownEmails().then((entries) => {
      if (alive) setKnownEmails(entries);
    });

    return () => {
      alive = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const suggestions = useMemo(
    () => (emailFocused ? filterKnownEmails(knownEmails, form.email) : []),
    [emailFocused, knownEmails, form.email]
  );

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

  const closeSuggestions = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setEmailFocused(false);
  };

  /**
   * Ẩn gợi ý sau một nhịp ngắn thay vì ngay lập tức.
   *
   * Chạm vào một dòng gợi ý làm ô email mất tiêu điểm TRƯỚC khi cú chạm được xử lý. Ẩn ngay ở
   * đây là gỡ dòng đó khỏi cây giao diện giữa chừng, và cú chạm rơi vào khoảng không — người
   * dùng bấm mà chẳng thấy gì xảy ra. `handlePickEmail` huỷ hẹn giờ này nên không có nhấp nháy.
   */
  const handleEmailBlur = () => {
    markTouched("email")();
    hideTimerRef.current = setTimeout(
      () => setEmailFocused(false),
      SUGGESTION_HIDE_MS
    );
  };

  const handlePickEmail = (email) => {
    closeSuggestions();
    setField("email")(email);
    // Email đã xong thì việc còn lại là mật khẩu — đưa con trỏ tới thẳng đó, đỡ một lần chạm
    passwordRef.current?.focus();
  };

  const handleForgetEmail = async (email) => {
    const remaining = await forgetEmail(email);
    setKnownEmails(remaining);
  };

  const handleSubmit = async () => {
    closeSuggestions();
    setTouched({ email: true, password: true });
    const nextErrors = runValidation();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    // Đã bắt tay vào đăng nhập thì lời chúc mừng đăng ký xong không còn chỗ đứng —
    // nhất là khi lát nữa có lỗi hiện ra, hai khung xanh/đỏ cạnh nhau rất khó hiểu
    setNotice("");
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
      const user = await loginFromResponse(data, form.email, form.password);
      // Trọng tài vào thẳng màn chấm trận thay vì trang chủ — bám `getHomeRouteForRole` của web
      router.replace(getHomeRouteForRole(user?.role));
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen title="Đăng nhập." card={false}>
      <FormSuccess message={notice} tone="dark" />
      <FormError message={errors.submit} tone="dark" />

      <Input
        label="Địa chỉ E-mail"
        value={form.email}
        onChangeText={setField("email")}
        onFocus={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setEmailFocused(true);
        }}
        onBlur={handleEmailBlur}
        placeholder="Nhập địa chỉ email"
        error={errors.email}
        touched={touched.email}
        tone="dark"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        className="mb-3"
      />

      <EmailSuggestions
        entries={suggestions}
        onPick={handlePickEmail}
        onForget={handleForgetEmail}
      />

      <Input
        ref={passwordRef}
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

      <Text className="mb-2 text-[13px] font-display uppercase tracking-[1.5px] text-white">
        Bạn chưa có tài khoản?
      </Text>
      <Text className="mb-4 text-xs text-slate-300">
        Đăng ký ngay để cập nhật tỉ số trực tiếp từ{" "}
        <Text className="font-display uppercase text-white">btms</Text>.
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
