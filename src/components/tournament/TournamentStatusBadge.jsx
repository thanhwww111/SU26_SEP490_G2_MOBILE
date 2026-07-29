import { Text, View } from "react-native";

import { getTournamentBadge } from "../../constants/tournament";

/**
 * Nhãn trạng thái giải, nền đặc như web (không phải nền pha loãng như badge
 * đăng ký) — nó nằm đè lên ảnh bìa nên cần tương phản mạnh.
 *
 * Màu đến từ `getTournamentBadge` dưới dạng hex nên phải đi qua `style`;
 * đây là nợ kỹ thuật đã ghi trong 01-design-system.md, dọn cùng lúc với
 * việc chuyển `constants/tournament.js` sang token.
 */
export default function TournamentStatusBadge({ tournament }) {
  const badge = getTournamentBadge(tournament);

  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: badge.bg }}
    >
      <Text className="text-overline font-bold uppercase text-white">
        {badge.label}
      </Text>
    </View>
  );
}
