import { Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";

import { getRoleLabel } from "../../utils/auth";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Danh sách email đã từng đăng nhập trên máy này, hiện ngay dưới ô E-mail.
 *
 * Chỉ có email và tên — cố ý KHÔNG có mật khẩu, nên chạm vào một dòng chỉ điền hộ ô email chứ
 * không đăng nhập thay người dùng. Đây là lựa chọn có cân nhắc: máy ở quán bida thường được
 * chuyền tay giữa nhân viên và khách, một chạm là vào thẳng tài khoản người khác thì quá dễ.
 *
 * Nguồn dữ liệu: `readKnownEmails` / `forgetEmail` trong `src/utils/auth.js`.
 *
 * Màu cố định cho nền tối chứ không lấy theo chế độ sáng/tối: cả nhóm `(auth)` bị khoá bảng màu
 * sáng (`LightThemeScope`), trong khi form lại nằm trên ảnh hero phủ navy — cùng lý do khiến
 * `Input` ở các màn này luôn phải khai `tone="dark"`.
 *
 * @param {Array<{email: string, name?: string, role?: string}>} entries — đã lọc sẵn theo ô nhập
 * @param {(email: string) => void} onPick — chạm vào một dòng
 * @param {(email: string) => void} onForget — bấm dấu × để quên dòng đó
 */
export default function EmailSuggestions({ entries, onPick, onForget }) {
  const colors = useThemeColors();

  if (!entries?.length) return null;

  return (
    <View className="mb-3 overflow-hidden rounded border border-white/25 bg-navy-800">
      {entries.map((entry, index) => {
        const initial = String(entry.name || entry.email || "?")
          .trim()
          .charAt(0)
          .toUpperCase();

        return (
          <View
            key={entry.email}
            className={`flex-row items-center ${
              index > 0 ? "border-t border-white/10" : ""
            }`}
          >
            {/* Vùng chạm chính chiếm hết bề ngang còn lại — nút × nhỏ nằm riêng bên phải để
                không ai bấm nhầm vào nó khi chỉ muốn chọn tài khoản */}
            <Pressable
              onPress={() => onPick(entry.email)}
              className="flex-1 flex-row items-center gap-3 px-3 py-2.5 active:bg-white/10"
            >
              <View className="h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Text className="text-xs font-bold text-white">{initial}</Text>
              </View>

              <View className="flex-1">
                <Text numberOfLines={1} className="text-sm text-white">
                  {entry.name || entry.email}
                </Text>
                <Text numberOfLines={1} className="text-xs text-slate-300">
                  {entry.name
                    ? entry.email
                    : entry.role
                      ? getRoleLabel(entry.role)
                      : "Đã đăng nhập trên máy này"}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => onForget(entry.email)}
              hitSlop={8}
              accessibilityLabel={`Quên ${entry.email}`}
              className="px-3 py-3 active:opacity-60"
            >
              <X size={iconSize.sm} color={colors.textInverseMuted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
