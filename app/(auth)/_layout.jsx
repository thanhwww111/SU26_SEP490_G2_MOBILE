import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import LightThemeScope from "../../src/theme/LightThemeScope";

/**
 * Nhóm màn xác thực. Là route group nên không thêm đoạn nào vào URL.
 *
 * Cả nhóm bị khoá ở chế độ Sáng — nhóm chốt dark mode chỉ áp cho phần đã đăng
 * nhập. Lý do khoá ở đây thay vì sửa từng màn: `Input`, `Button`, `FormError`
 * dùng chung với phần (app); nếu chúng tự đổi theo chế độ thì màn đăng nhập sẽ
 * thành nửa sáng nửa tối.
 */
export default function AuthLayout() {
  return (
    <LightThemeScope>
      {/* Nền luôn sáng nên chữ trạng thái luôn tối, không đổi theo chế độ app */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </LightThemeScope>
  );
}
