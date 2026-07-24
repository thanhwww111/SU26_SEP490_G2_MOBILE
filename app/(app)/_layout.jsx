import { useState } from "react";
import { View } from "react-native";
import { Redirect, Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../src/components/layout/AppHeader";
import AppDrawer from "../../src/components/layout/AppDrawer";
import ProfileMenu from "../../src/components/layout/ProfileMenu";
import { useAuthStore } from "../../src/store/authStore";

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
    // View ngoài cùng là mốc cho drawer/menu định vị absolute, và nó nằm ngoài
    // SafeAreaView để lớp phủ che được cả vùng tai thỏ như Modal vẫn làm.
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <AppHeader
          showBack={!isRoot}
          onPressMenu={() => setDrawerOpen(true)}
          onPressBack={() => router.back()}
          onPressProfile={() => setMenuOpen(true)}
        />

        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </SafeAreaView>

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
        onProfile={() => goTo("/(app)/profile")}
        onLogout={handleLogout}
      />
    </View>
  );
}
