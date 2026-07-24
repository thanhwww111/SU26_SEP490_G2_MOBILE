import { Pressable, Text, View } from "react-native";
import { ChevronLeft, Menu, User } from "lucide-react-native";

/**
 * Thanh trên cùng của mọi màn trong nhóm (app).
 *
 * Nút trái đổi theo màn: ở trang chủ là hamburger mở drawer, các màn con là
 * mũi tên quay lại. Nhờ vậy màn con không phải tự dựng header riêng — nếu tự
 * dựng sẽ thành hai header chồng nhau.
 */
export default function AppHeader({
  showBack = false,
  onPressMenu,
  onPressBack,
  onPressProfile,
}) {
  return (
    <View className="h-14 flex-row items-center justify-between border-b border-slate-200 bg-white px-2">
      <Pressable
        onPress={showBack ? onPressBack : onPressMenu}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
      >
        {showBack ? (
          <ChevronLeft size={24} color="#1a2a4a" />
        ) : (
          <Menu size={22} color="#1a2a4a" />
        )}
      </Pressable>

      <Text className="text-xl font-black uppercase italic tracking-tighter text-navy-700">
        capstone<Text className="text-accent">.</Text>
      </Text>

      <Pressable
        onPress={onPressProfile}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
      >
        <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <User size={17} color="#1a2a4a" />
        </View>
      </Pressable>
    </View>
  );
}
