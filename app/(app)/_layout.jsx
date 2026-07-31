import { useState } from "react";
import { View } from "react-native";
import { Redirect, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../src/components/layout/AppHeader";
import AppDrawer from "../../src/components/layout/AppDrawer";
import ProfileMenu from "../../src/components/layout/ProfileMenu";
import { useAuthStore } from "../../src/store/authStore";
import { useIsDarkMode } from "../../src/theme/useThemeColors";

/** Màn gốc của nhóm — nút trái là hamburger, các màn khác là mũi tên quay lại */
const ROOT_SCREEN = "home";

/**
 * Guard cho toàn bộ màn hình bên trong nhóm (app), đồng thời dựng layout chung:
 * header cố định, drawer và menu hồ sơ phủ lên bằng lớp View absolute.
 *
 * Footer cố ý không đặt ở đây — nó phải cuộn cùng nội dung như trên web,
 * nên từng màn tự đặt <AppFooter /> ở cuối ScrollView.
 */
export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isDark = useIsDarkMode();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const currentScreen = segments[segments.length - 1];
  const isRoot = currentScreen === ROOT_SCREEN;

  const goTo = (path) => {
    setDrawerOpen(false);
    setMenuOpen(false);
    if (path) router.push(path);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Nền header đổi theo chế độ nên chữ trạng thái phải đổi theo */}
      <StatusBar style={isDark ? "light" : "dark"} />

      <AppHeader
        showBack={!isRoot}
        onPressMenu={() => setDrawerOpen(true)}
        onPressBack={() => router.back()}
        onPressLogo={() => goTo("/(app)/home")}
        onPressProfile={() => setMenuOpen(true)}
      />

      {/* Drawer và menu hồ sơ nằm trong View này nên chỉ phủ phần body —
          header vẫn bấm được, đóng lớp phủ bằng chính nút vừa mở nó. */}
      <View className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />

        <AppDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNavigate={goTo}
          activeKey={currentScreen}
        />

        <ProfileMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={user}
          onNavigate={goTo}
          onLogout={handleLogout}
        />
      </View>
    </SafeAreaView>
  );
}
