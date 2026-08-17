import { useEffect } from "react";
import { useRouter } from "expo-router";

import { useAuthStore } from "../store/authStore";
import { getHomeRouteForRole, isStaffUser } from "../utils/auth";

/**
 * Chặn cửa khu vực trọng tài. Port `StaffRoute` của web (`FE/src/components/guards/StaffRoute.jsx`).
 *
 * Ba nhánh giống hệt bản web: chưa đọc xong phiên đã lưu thì chờ, chưa đăng nhập thì về màn đăng
 * nhập, đăng nhập rồi mà không phải STAFF thì về màn chính của role đó.
 *
 * Khác một chỗ: web bắn toast "Chỉ tài khoản STAFF mới truy cập được". Mobile chưa có thư viện
 * toast (xem `docs/mobile/06-agent.md`) và người dùng sai role gần như chỉ tới đây bằng deep link,
 * nên đá về màn chính là đủ — không dựng lớp thông báo riêng chỉ cho trường hợp này.
 *
 * Đây KHÔNG phải lớp bảo vệ dữ liệu: backend đã chặn `/api/v1/staff/**` bằng `hasRole("STAFF")`
 * và còn kiểm trận có đúng người được gán hay không. Hook này chỉ để người dùng khỏi rơi vào một
 * màn luôn báo lỗi 403.
 *
 * @returns {{ checking: boolean, allowed: boolean }} `checking` = còn đang xác thực phiên,
 *   màn nên hiện trạng thái chờ; `allowed` = được xem nội dung.
 */
export function useRequireStaff() {
  const router = useRouter();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const allowed = authReady && isAuthenticated && isStaffUser(user);

  useEffect(() => {
    if (!authReady) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // `replace` chứ không `push`: người dùng sai role bấm quay lại sẽ rơi đúng vào màn vừa bị
    // chặn, thành vòng lặp không thoát được.
    if (!isStaffUser(user)) {
      router.replace(getHomeRouteForRole(user?.role));
    }
  }, [authReady, isAuthenticated, user, router]);

  return { checking: !authReady, allowed };
}
