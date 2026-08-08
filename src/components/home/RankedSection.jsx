import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import SectionHeader from "./SectionHeader";
import SectionState from "./SectionState";
import PlayerPortrait from "../player/PlayerPortrait";
import { getLeaderboard } from "../../api/leaderboardApi";
import { accentOfRank, DEFAULT_COUNTRY } from "../../constants/leaderboard";
import { splitName } from "../../utils/format";

const TOP_COUNT = 9;

/**
 * Cờ và thứ hạng đè lên góc ảnh, giống khối Ranked của web.
 *
 * Cỡ chữ ở đây cố ý to hơn thang thông thường: nó là số trang trí trên ảnh,
 * không phải chữ để đọc thành câu.
 */
const RankBadge = ({ rank, size = "md" }) => (
  <>
    <Text
      className={`absolute left-2 top-2 ${size === "lg" ? "text-3xl" : "text-base"}`}
    >
      {DEFAULT_COUNTRY.flag}
    </Text>
    <Text
      className={`absolute right-2 top-2 font-black text-content ${
        size === "lg" ? "text-3xl" : "text-xl"
      }`}
    >
      <Text className={size === "lg" ? "text-xl" : "text-xs"}>#</Text>
      {rank}
    </Text>
  </>
);

const TopPlayerCard = ({ player, accent, onPress }) => {
  const { first, last } = splitName(player.playerName);

  return (
    <Pressable
      onPress={onPress}
      className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface active:opacity-80"
    >
      <View className="relative">
        <PlayerPortrait
          uri={player.avatarUrl}
          name={player.playerName}
          className="h-64 w-full"
          initialsClassName="text-[32px]"
          resizeMode="contain"
        />
        <View className="h-2 w-full" style={{ backgroundColor: accent }} />
        <RankBadge rank={player.rank} size="lg" />
      </View>

      <View className="p-4">
        <Text numberOfLines={1} className="text-xl text-content-2">
          {first}
        </Text>
        <Text
          numberOfLines={1}
          className="text-3xl font-black uppercase leading-8 text-content"
        >
          {last}
        </Text>
        <Text className="mt-2 text-sm font-bold text-accent">
          {Number(player.totalPoints || 0).toLocaleString("vi-VN")} điểm
        </Text>
      </View>
    </Pressable>
  );
};

const PlayerTile = ({ player, accent, onPress }) => {
  const { first, last } = splitName(player.playerName);

  return (
    <Pressable
      onPress={onPress}
      className="w-[48%] overflow-hidden rounded-xl border border-line bg-surface active:opacity-80"
    >
      <View className="relative">
        <PlayerPortrait
          uri={player.avatarUrl}
          name={player.playerName}
          className="h-28 w-full"
          initialsClassName="text-xl"
          resizeMode="contain"
        />
        <View className="h-1.5 w-full" style={{ backgroundColor: accent }} />
        <RankBadge rank={player.rank} />
      </View>

      <View className="h-16 p-2.5">
        <Text
          numberOfLines={1}
          className="text-xs font-black uppercase leading-4 text-content"
        >
          {first}
        </Text>
        <Text
          numberOfLines={1}
          className="text-xs font-black uppercase leading-4 text-content"
        >
          {last}
        </Text>
      </View>
    </Pressable>
  );
};

/**
 * Top tay cơ của năm hiện tại, bám `pages/Home/components/Ranked.jsx` bên web:
 * cùng endpoint, cùng kỳ thống kê, cùng số lượng, hạng 1 tách thành thẻ lớn.
 *
 * Đây là điểm tích lũy cả năm chứ không phải kết quả một giải lẻ — thang điểm
 * xem `TournamentPointsPolicy` phía backend.
 *
 * Trước 2026-08-06 khối này đọc mảng cứng `constants/topPlayers.js` vì backend
 * chưa mở endpoint xếp hạng toàn hệ thống. Endpoint đã có, file đó đã xoá.
 */
export default function RankedSection({ onPressAll, onPressPlayer }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const page = await getLeaderboard({
          period: "YEAR",
          page: 0,
          size: TOP_COUNT,
        });
        if (alive) setPlayers(page.content);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const [top, ...rest] = players;

  return (
    <View className="px-4 pb-10 pt-8">
      <SectionHeader
        title={`Top ${TOP_COUNT} tay cơ hàng đầu năm ${new Date().getFullYear()}`}
        actionLabel="Tất cả"
        onPressAction={onPressAll}
        dark
      />

      {loading || error || players.length === 0 ? (
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có cơ thủ nào tích lũy điểm trong năm nay."
        />
      ) : (
        <>
          <TopPlayerCard
            player={top}
            accent={accentOfRank(0)}
            onPress={() => onPressPlayer?.(top)}
          />

          <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
            {rest.map((player, index) => (
              <PlayerTile
                key={player.userId}
                player={player}
                accent={accentOfRank(index + 1)}
                onPress={() => onPressPlayer?.(player)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
