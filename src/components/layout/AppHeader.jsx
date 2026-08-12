import { Pressable, Text, View } from "react-native";
import { ChevronLeft, Menu, User } from "lucide-react-native";

import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { useThemeColors } from "../../theme/useThemeColors";
import { iconSize } from "../../theme/tokens";

/**
 * Thanh trên cùng của mọi màn trong nhóm (app).
 *
 * Nút trái đổi theo màn: ở trang chủ là hamburger mở drawer, các màn con là
 * mũi tên quay lại. Nhờ vậy màn con không phải tự dựng header riêng — nếu tự
 * dựng sẽ thành hai header chồng nhau.
 *
 * Logo giữa bấm được để về trang chủ, giống Header web — drawer bám đúng 6 mục
 * của web nên không có mục "Trang chủ" nào cả.
 *
 * Ba nút bên phải xếp đúng thứ tự của web: đổi giao diện → thông báo → hồ sơ.
 *
 * Ba vùng có bề rộng cố định bằng nhau (`w-[120px]` = đúng ba nút) thay vì
 * `justify-between`: mép phải có ba nút còn mép trái chỉ một, để chúng tự co
 * giãn thì logo bị đẩy lệch khỏi tâm header.
 */
export default function AppHeader({
  showBack = false,
  unreadCount = 0,
  onPressMenu,
  onPressBack,
  onPressLogo,
  onPressNotifications,
  onPressProfile,
}) {
  const colors = useThemeColors();

  return (
    <View className="h-14 flex-row items-center border-b border-line bg-surface px-2">
      <View className="w-[120px] flex-row items-center">
        <Pressable
          onPress={showBack ? onPressBack : onPressMenu}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-sunken-strong"
          accessibilityLabel={showBack ? "Quay lại" : "Mở menu"}
        >
          {showBack ? (
            <ChevronLeft size={iconSize.lg} color={colors.content} />
          ) : (
            <Menu size={iconSize.md} color={colors.content} />
          )}
        </Pressable>
      </View>

      <View className="flex-1 items-center">
        <Pressable onPress={onPressLogo} className="px-2 py-1 active:opacity-60">
          {/* Chữ logo dùng token chữ chính chứ không phải navy cứng: ở chế độ tối
              nền header là navy sẫm, chữ navy sẽ chìm hẳn vào nền */}
          <Text className="text-xl font-display uppercase tracking-tight text-content">
            btms<Text className="text-accent">.</Text>
          </Text>
        </Pressable>
      </View>

      <View className="w-[120px] flex-row items-center justify-end">
        <ThemeToggle />

        <NotificationBell count={unreadCount} onPress={onPressNotifications} />

        <Pressable
          onPress={onPressProfile}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-sunken-strong"
          accessibilityLabel="Mở menu hồ sơ"
        >
          <View className="h-8 w-8 items-center justify-center rounded-full bg-sunken">
            <User size={iconSize.sm} color={colors.content} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
