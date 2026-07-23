import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../src/store/authStore";

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Chưa đọc xong phiên đã lưu — hiện loading để tránh nháy màn Login rồi nhảy sang Home
  if (!authReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
      </Stack>
    </SafeAreaProvider>
  );
}
