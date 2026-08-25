import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import SectionHeader from "./SectionHeader";
import SectionState from "./SectionState";
import RemoteImage from "./RemoteImage";
import * as publicTournamentApi from "../../api/publicTournamentApi";
import { getTournamentBadge } from "../../constants/tournament";
import { fmtDateRange } from "../../utils/date";

const PAGE_SIZE = 4;

const StatusBadge = ({ tournament }) => {
  const badge = getTournamentBadge(tournament);
  return (
    <View
      className="self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: badge.bg }}
    >
      <Text className="text-[10px] font-bold uppercase text-white">
        {badge.label}
      </Text>
    </View>
  );
};

const FeaturedTournament = ({ tournament, onPress }) => (
  <Pressable
    onPress={onPress}
    className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface active:opacity-80"
  >
    <RemoteImage uri={tournament.thumbnailUrl} className="h-44 w-full" />
    <View className="gap-2 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="rounded-lg border border-accent px-2 py-0.5 text-[11px] font-bold text-accent">
          {fmtDateRange(tournament.startAt, tournament.endAt)}
        </Text>
        <StatusBadge tournament={tournament} />
      </View>
      <Text className="text-base font-bold text-content">
        {tournament.name}
      </Text>
      {tournament.gameType ? (
        <Text className="text-sm font-semibold text-muted">
          {tournament.gameType}
        </Text>
      ) : null}
    </View>
  </Pressable>
);

const TournamentRow = ({ tournament, onPress }) => (
  <Pressable
    onPress={onPress}
    className="mt-3 flex-row overflow-hidden rounded-2xl border border-line bg-surface active:opacity-80"
  >
    <RemoteImage uri={tournament.thumbnailUrl} className="h-28 w-24" />
    <View className="flex-1 justify-center gap-1.5 p-3">
      <Text className="text-[11px] font-bold text-accent">
        {fmtDateRange(tournament.startAt, tournament.endAt)}
      </Text>
      <Text numberOfLines={2} className="text-sm font-bold text-content">
        {tournament.name}
      </Text>
      <StatusBadge tournament={tournament} />
    </View>
  </Pressable>
);

export default function ScheduleSection({
  onPressTournament,
  onPressAll,
  refreshKey = 0,
  onLoaded,
}) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Giữ `onLoaded` trong ref: trang chủ truyền hàm mũi tên mới sau mỗi lần vẽ lại, đưa thẳng
     vào deps của effect là mỗi lần vẽ lại một lần gọi API. */
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let alive = true;

    (async () => {
      // Lần vuốt làm mới không hiện lại khung xương: vòng xoay của RefreshControl đã nói đủ, đổi
      // nội dung người dùng đang đọc thành khung xám nữa chỉ làm màn hình nháy.
      if (refreshKey > 0) setError("");

      try {
        const page = await publicTournamentApi.listPublicTournaments({
          page: 0,
          size: PAGE_SIZE,
        });
        if (alive) setTournaments(page.content);
      } catch {
        if (alive) setError("Không tải được lịch thi đấu.");
      } finally {
        if (alive) {
          setLoading(false);
          // Trang chủ đếm đủ ba khối báo xong mới tắt vòng xoay — xem `app/(app)/home.jsx`
          onLoadedRef.current?.();
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const [featured, ...rest] = tournaments;

  return (
    <View className="px-4 pt-8">
      <SectionHeader
        title="Lịch thi đấu"
        actionLabel="Toàn bộ"
        onPressAction={onPressAll}
      />

      {loading || error || tournaments.length === 0 ? (
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có giải đấu nào."
        />
      ) : (
        <>
          <FeaturedTournament
            tournament={featured}
            onPress={() => onPressTournament?.(featured)}
          />
          {rest.map((tournament) => (
            <TournamentRow
              key={tournament.id}
              tournament={tournament}
              onPress={() => onPressTournament?.(tournament)}
            />
          ))}
        </>
      )}
    </View>
  );
}
