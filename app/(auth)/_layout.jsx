import { Stack } from "expo-router";

/** Nhóm màn xác thực. Là route group nên không thêm đoạn nào vào URL. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
