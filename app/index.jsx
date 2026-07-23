import { Redirect } from "expo-router";

import { useAuthStore } from "../src/store/authStore";

/** Màn hình gốc: chỉ có nhiệm vụ điều hướng theo trạng thái đăng nhập */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return <Redirect href={isAuthenticated ? "/(app)/home" : "/login"} />;
}
