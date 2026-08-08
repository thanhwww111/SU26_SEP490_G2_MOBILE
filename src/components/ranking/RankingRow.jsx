import { Pressable, Text, View } from "react-native";

import PlayerPortrait from "../player/PlayerPortrait";
import { DEFAULT_COUNTRY, MEDAL_COLORS } from "../../constants/leaderboard";
import { splitName } from "../../utils/format";

/**
 * Một dòng bảng xếp hạng: thứ hạng, chân dung, tên, quốc gia, điểm tích lũy.
 *
 * Web còn ba cột phụ (giải / vô địch / top 3) nhưng chính nó cũng ẩn chúng ở
 * màn hẹp (`hidden lg:flex`), nên mobile bỏ hẳn — ba số đó có đủ trong màn hồ sơ.
 *
 * Ba hạng đầu tô màu huy chương, các hạng sau dùng chữ mờ. Màu không phải tín
 * hiệu duy nhất: số hạng vẫn đứng ngay đó.
 */
export default function RankingRow({ entry, onPress }) {
  const { first, last } = splitName(entry.playerName);
  const medal = MEDAL_COLORS[entry.rank];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 bg-surface px-4 py-3 active:bg-sunken"
    >
      <Text
        className="w-12 text-2xl font-black text-faint"
        style={medal ? { color: medal } : undefined}
      >
        <Text className="text-xs font-bold">#</Text>
        {entry.rank}
      </Text>

      <PlayerPortrait
        uri={entry.avatarUrl}
        name={entry.playerName}
        className="h-14 w-14 rounded-lg border border-line"
        initialsClassName="text-base"
      />

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base text-content">
          {first ? `${first} ` : ""}
          <Text className="font-black uppercase">{last}</Text>
        </Text>
        <Text className="mt-1 text-xs text-muted">
          {DEFAULT_COUNTRY.flag} {DEFAULT_COUNTRY.name}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-xl font-black text-content">
          {Number(entry.totalPoints || 0).toLocaleString("vi-VN")}
        </Text>
        <Text className="text-xs text-muted">điểm</Text>
      </View>
    </Pressable>
  );
}
