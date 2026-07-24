import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, User } from "lucide-react-native";

import Button from "../../src/components/Button";
import { useAuthStore } from "../../src/store/authStore";
import { getRoleLabel } from "../../src/utils/auth";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="text-2xl font-bold text-slate-900">
          Xin chào{user?.fullName ? `, ${user.fullName}` : ""}
        </Text>

        <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100">
              <User size={22} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-900">
                {user?.fullName || user?.email || "Người dùng"}
              </Text>
              <Text className="text-sm text-slate-500">{user?.email}</Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-2 border-t border-slate-100 pt-4">
            <ShieldCheck size={18} color="#16a34a" />
            <Text className="text-sm text-slate-600">
              Vai trò:{" "}
              <Text className="font-semibold text-slate-900">
                {getRoleLabel(user?.role)}
              </Text>
            </Text>
          </View>
        </View>

        <Button
          title="Đăng xuất"
          variant="outline"
          onPress={handleLogout}
          className="mt-8"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
