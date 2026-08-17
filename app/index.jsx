import { Redirect } from "expo-router";

import { useAuthStore } from "../src/store/authStore";
import { getHomeRouteForRole } from "../src/utils/auth";

/**
 * Màn hình gốc: chỉ có nhiệm vụ điều hướng theo trạng thái đăng nhập.
 *
 * Từ khi có khu vực trọng tài, đích đến còn phụ thuộc role — mở lại app phải rơi đúng vào chỗ
 * người dùng làm việc, giống lúc vừa đăng nhập xong.
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  return (
    <Redirect href={isAuthenticated ? getHomeRouteForRole(user?.role) : "/login"} />
  );
}
