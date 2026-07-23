import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "../../src/store/authStore";

/**
 * Guard cho toàn bộ màn hình bên trong nhóm (app).
 * Tương đương ProtectedRoute của FE web.
 */
export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
