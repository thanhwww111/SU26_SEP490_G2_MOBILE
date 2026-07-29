import { Text, View } from "react-native";

import { getRegistrationBadge } from "../../constants/registration";

/**
 * Chip trạng thái đăng ký: chấm tròn + nhãn, bám StatusBadge của
 * MyRegistrationsPage.jsx bên web.
 *
 * `self-start` để chip co đúng bề rộng chữ — web đạt việc này bằng
 * width: fit-content, còn View của RN mặc định giãn kín hàng.
 */
export default function RegistrationStatusBadge({ status }) {
  const badge = getRegistrationBadge(status);

  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${badge.chip}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      <Text className={`text-xs font-semibold ${badge.text}`}>{badge.label}</Text>
    </View>
  );
}
