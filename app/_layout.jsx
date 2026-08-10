import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";

import WebPhoneFrame from "../src/components/WebPhoneFrame";
import { useAuthStore } from "../src/store/authStore";
import { useThemeStore } from "../src/store/themeStore";
import { APP_FONTS } from "../src/theme/fonts";
import { useIsDarkMode, useThemeColors } from "../src/theme/useThemeColors";

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const authReady = useAuthStore((s) => s.authReady);

  const hydrateTheme = useThemeStore((s) => s.hydrateTheme);
  const themeReady = useThemeStore((s) => s.themeReady);

  // Font hỏng thì vẫn cho vào app: `error` nghĩa là chữ hiện bằng font hệ thống,
  // xấu hơn nhưng đọc được. Chặn ở đây sẽ thành màn quay vô tận.
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  const fontsReady = fontsLoaded || Boolean(fontError);

  const colors = useThemeColors();
  const isDark = useIsDarkMode();

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  // Chờ phiên đăng nhập, lựa chọn giao diện và phông chữ.
  // Thiếu vế theme thì app sẽ loé sáng một nhịp rồi mới chuyển tối — người để
  // máy ở chế độ tối sẽ bị chói ngay khi mở app. Thiếu vế font thì mọi màn hiện
  // bằng font hệ thống rồi nhảy sang font thật, chữ giật một nhịp và các khối
  // đo theo chiều cao chữ bị xô lệch.
  if (!authReady || !themeReady || !fontsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <WebPhoneFrame>
      <SafeAreaProvider>
        {/* StatusBar đặt ở TỪNG NHÓM chứ không phải ở đây: nhóm (auth) bị khoá
            sáng nên chữ trạng thái phải luôn tối, còn (app) thì đổi theo chế độ.
            Để chung một cái ở gốc sẽ làm chữ trắng nằm trên nền trắng ở màn
            đăng nhập khi app đang ở chế độ tối. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </SafeAreaProvider>
    </WebPhoneFrame>
  );
}
