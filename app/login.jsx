import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";

import Button from "../src/components/Button";
import * as authApi from "../src/api/authApi";
import { useAuthStore } from "../src/store/authStore";
import { API_URL } from "../src/constants/config";

export default function LoginScreen() {
  const router = useRouter();
  const loginFromResponse = useAuthStore((s) => s.loginFromResponse);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!email) next.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Email không hợp lệ";
    if (!password) next.password = "Mật khẩu là bắt buộc";
    else if (password.length < 6)
      next.password = "Mật khẩu phải có ít nhất 6 ký tự";
    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.login({ email, password });
      if (!data.success) {
        throw new Error(
          data.message || "Đăng nhập thất bại. Sai email hoặc mật khẩu."
        );
      }
      await loginFromResponse(data, email);
      router.replace("/(app)/home");
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `h-12 rounded-xl border px-4 text-base text-slate-900 ${
      errors[field] ? "border-red-400 bg-red-50" : "border-slate-300 bg-slate-50"
    }`;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10">
            <Text className="text-3xl font-black uppercase italic tracking-tight text-slate-900">
              capstone<Text className="text-orange-600">.</Text>
            </Text>
            <Text className="mt-2 text-sm text-slate-500">
              Nền tảng quản lý giải đấu billiards
            </Text>
          </View>

          <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className={inputClass("email")}
          />
          {errors.email ? (
            <Text className="mt-1 text-xs text-red-500">{errors.email}</Text>
          ) : null}

          <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">
            Mật khẩu
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className={`${inputClass("password")} pr-12`}
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              className="absolute right-3 p-1"
              hitSlop={8}
            >
              {showPassword ? (
                <EyeOff size={20} color="#64748b" />
              ) : (
                <Eye size={20} color="#64748b" />
              )}
            </Pressable>
          </View>
          {errors.password ? (
            <Text className="mt-1 text-xs text-red-500">{errors.password}</Text>
          ) : null}

          {errors.submit ? (
            <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{errors.submit}</Text>
            </View>
          ) : null}

          <Button
            title="Đăng nhập"
            onPress={handleSubmit}
            loading={isLoading}
            className="mt-6"
          />

          {/* Hiện API đang trỏ tới đâu — tiết kiệm rất nhiều thời gian khi debug kết nối */}
          <Text className="mt-8 text-center text-xs text-slate-400">
            API: {API_URL}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
