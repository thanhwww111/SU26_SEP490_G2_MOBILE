import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Camera } from "lucide-react-native";

import RemoteImage from "../home/RemoteImage";
import { initialsOf } from "../../utils/format";
import { getRoleLabel } from "../../utils/auth";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Khối ảnh đại diện đầu màn hồ sơ.
 *
 * Web xếp panel ảnh thành một cột riêng bên trái form; mobile đưa lên trên cùng
 * theo đúng thứ tự đọc của web (trái sang phải → trên xuống dưới).
 *
 * Nút đổi ảnh nằm đè lên góc ảnh như web, cỡ 44 để đủ vùng chạm.
 */
export default function ProfileAvatarCard({
  avatarUrl,
  displayName,
  email,
  role,
  uploading = false,
  disabled = false,
  onPickAvatar,
}) {
  const colors = useThemeColors();

  return (
    <View className="items-center gap-3 rounded-xl border border-line bg-surface p-5">
      <View>
        {avatarUrl ? (
          <RemoteImage
            uri={avatarUrl}
            className="h-24 w-24 rounded-full border border-line"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full border border-line bg-sunken">
            <Text className="text-2xl font-bold text-faint">
              {initialsOf(displayName || email)}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onPickAvatar}
          disabled={uploading || disabled}
          accessibilityLabel="Đổi ảnh đại diện"
          // Viền cùng màu nền thẻ để nút tách khỏi ảnh; để trắng cứng thì ở chế
          // độ tối nó thành một vòng sáng chói quanh nút
          className={`absolute -bottom-1 -right-1 h-11 w-11 items-center justify-center rounded-full border-2 border-surface ${
            uploading || disabled ? "bg-disabled" : "bg-navy-700 active:bg-navy-600"
          }`}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Camera size={iconSize.md} color={colors.textInverse} />
          )}
        </Pressable>
      </View>

      <View className="items-center gap-1">
        <Text numberOfLines={1} className="text-base font-bold text-content">
          {displayName || email || "Người dùng"}
        </Text>
        {email ? (
          <Text numberOfLines={1} className="text-sm text-muted">
            {email}
          </Text>
        ) : null}
        <Text className="text-overline font-bold uppercase text-faint">
          {getRoleLabel(role)}
        </Text>
      </View>

      <Text className="text-center text-xs text-faint">
        Ảnh vuông · JPEG, PNG, WebP, GIF · tối đa 5MB
      </Text>
    </View>
  );
}
