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
      {/* Dấu # và số hạng phải là hai Text ANH EM, không lồng nhau: React Native
          lấy chiều cao dòng theo Text con nhỏ hơn, nên số hạng cỡ 24 bị cắt mất
          phần trên — hạng 1, 2, 3 cụt đầu còn hạng 4 thì không, vì nét chữ 4
          nằm thấp hơn.

          Bề ngang để tối thiểu chứ không cố định: giải đông người có hạng ba
          chữ số, `w-12` cũ không đủ chỗ. */}
      <View className="min-w-[52px] flex-row items-baseline">
        <Text
          className="text-xs font-bold text-faint"
          style={medal ? { color: medal } : undefined}
        >
          #
        </Text>
        <Text
          className="text-2xl font-black text-faint"
          style={medal ? { color: medal } : undefined}
        >
          {entry.rank}
        </Text>
      </View>

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
