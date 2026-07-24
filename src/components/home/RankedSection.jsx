import { Text, View } from "react-native";

import SectionHeader from "./SectionHeader";
import RemoteImage from "./RemoteImage";
import { TOP_PLAYERS } from "../../constants/topPlayers";

/** Tách "Fedor Gorst" thành ["Fedor", "Gorst"] để in tên trên, họ dưới như web */
const splitName = (name) => {
  const [first, ...rest] = String(name).split(" ");
  return { first, last: rest.join(" ") };
};

const RankBadge = ({ rank, country, size = "md" }) => (
  <>
    <Text
      className={`absolute left-2 top-2 ${size === "lg" ? "text-4xl" : "text-lg"}`}
    >
      {country}
    </Text>
    <Text
      className={`absolute right-2 top-2 font-black text-slate-900 ${
        size === "lg" ? "text-4xl" : "text-xl"
      }`}
    >
      <Text className={size === "lg" ? "text-xl" : "text-xs"}>#</Text>
      {rank}
    </Text>
  </>
);

const TopPlayerCard = ({ player }) => {
  const { first, last } = splitName(player.name);

  return (
    <View className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <View className="relative">
        <RemoteImage
          uri={player.image}
          className="h-64 w-full bg-slate-100"
          resizeMode="contain"
        />
        <View
          className="h-2 w-full"
          style={{ backgroundColor: player.accent }}
        />
        <RankBadge rank={player.rank} country={player.country} size="lg" />
      </View>

      <View className="p-4">
        <Text className="text-lg text-slate-700">{first}</Text>
        <Text className="text-3xl font-black uppercase leading-8 text-slate-900">
          {last}
        </Text>
      </View>
    </View>
  );
};

const PlayerTile = ({ player }) => {
  const { first, last } = splitName(player.name);

  return (
    <View className="w-[48%] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <View className="relative">
        <RemoteImage
          uri={player.image}
          className="h-28 w-full bg-slate-100"
          resizeMode="contain"
        />
        <View
          className="h-1.5 w-full"
          style={{ backgroundColor: player.accent }}
        />
        <RankBadge rank={player.rank} country={player.country} />
      </View>

      <View className="h-16 p-2.5">
        <Text className="text-xs font-black uppercase leading-4 text-slate-900">
          {first}
        </Text>
        <Text
          numberOfLines={1}
          className="text-xs font-black uppercase leading-4 text-slate-900"
        >
          {last}
        </Text>
      </View>
    </View>
  );
};

/**
 * Top tay cơ. Dữ liệu tĩnh từ constants — backend chưa có endpoint xếp hạng
 * toàn hệ thống, xem ghi chú trong src/constants/topPlayers.js.
 */
export default function RankedSection({ onPressAll }) {
  const [first, ...rest] = TOP_PLAYERS;

  return (
    <View className="px-4 pb-10 pt-8">
      <SectionHeader
        title="Top 9 tay cơ Nineball hàng đầu CAPSTONE"
        actionLabel="Tất cả"
        onPressAction={onPressAll}
        dark
      />

      <TopPlayerCard player={first} />

      <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
        {rest.map((player) => (
          <PlayerTile key={player.rank} player={player} />
        ))}
      </View>
    </View>
  );
}
