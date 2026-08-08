import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../src/components/layout/AppHeader";
import AppDrawer from "../../src/components/layout/AppDrawer";
import ProfileMenu from "../../src/components/layout/ProfileMenu";
import NotificationPanel from "../../src/components/notification/NotificationPanel";
import {
  unregisterPushToken,
  usePushNotifications,
} from "../../src/hooks/usePushNotifications";
import { useAuthStore } from "../../src/store/authStore";
import { useNotificationStore } from "../../src/store/notificationStore";
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

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const resetNotifications = useNotificationStore((s) => s.reset);
  const refreshUnread = useNotificationStore((s) => s.refreshUnread);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Gọi trước nhánh Redirect bên dưới: hook không được nằm sau một lệnh return có điều kiện,
  // nếu không thứ tự hook sẽ đổi giữa hai lần render. Cờ enabled lo phần "chỉ chạy khi đã đăng nhập".
  usePushNotifications(isAuthenticated);

  /**
   * Đếm lại số chưa đọc mỗi lần đổi màn.
   *
   * Không dựa vào push để cập nhật huy hiệu: trong Expo Go push không tới được, và ngay cả khi
   * có development build thì người dùng vẫn có thể từ chối quyền thông báo. Đổi màn là nhịp tự
   * nhiên và đủ thưa để một lời gọi đếm không thành gánh nặng.
   */
  const routeKey = segments.join("/");
  useEffect(() => {
    if (isAuthenticated) refreshUnread();
  }, [routeKey, isAuthenticated, refreshUnread]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const currentScreen = segments[segments.length - 1];
  const isRoot = currentScreen === ROOT_SCREEN;

  const goTo = (path) => {
    setDrawerOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
    if (path) router.push(path);
  };

  /**
   * Bấm một thông báo: đóng popup rồi mở giải liên quan.
   *
   * Thông báo không gắn giải nào (chuyện tài khoản) thì không có chỗ để tới — chỉ đóng popup,
   * đúng như NotificationRow đã vô hiệu hoá lượt chạm ở những dòng đó.
   */
  const handleOpenNotification = (item) => {
    setNotifOpen(false);
    if (item?.tournamentId) router.push(`/(app)/event/${item.tournamentId}`);
  };

  /**
   * Quay lại, có lối thoát khi không còn gì để quay về.
   *
   * `router.back()` trần chỉ chạy khi ngăn xếp điều hướng có màn phía trước.
   * Vào thẳng một màn con — deep link, F5 trên bản web, mở app từ thông báo —
   * thì expo-router dựng lại ngăn xếp chỉ với đúng màn đó, `canGoBack()` là
   * false và `back()` thành lệnh rỗng: nút vẫn hiện nhưng bấm không phản ứng.
   *
   * Rơi về trang chủ bằng `replace` chứ không `push`: push sẽ chồng thêm một
   * entry nữa, bấm quay lại lần sau lại kẹt đúng chỗ cũ.
   */
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(app)/home");
  };

  const handleLogout = async () => {
    setMenuOpen(false);

    // Gỡ thiết bị TRƯỚC khi xoá phiên — lời gọi này cần JWT, làm sau thì đã mất token.
    // Không gỡ thì người mượn máy đăng nhập sau vẫn nhận thông báo của chủ trước.
    await unregisterPushToken();
    await resetNotifications();

    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      {/* Nền header đổi theo chế độ nên chữ trạng thái phải đổi theo */}
      <StatusBar style={isDark ? "light" : "dark"} />

      <AppHeader
        showBack={!isRoot}
        unreadCount={unreadCount}
        onPressMenu={() => setDrawerOpen(true)}
        onPressBack={handleBack}
        onPressLogo={() => goTo("/(app)/home")}
        onPressNotifications={() => setNotifOpen(true)}
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

        <NotificationPanel
          visible={notifOpen}
          onClose={() => setNotifOpen(false)}
          onOpenItem={handleOpenNotification}
        />
      </View>
    </SafeAreaView>
  );
}
