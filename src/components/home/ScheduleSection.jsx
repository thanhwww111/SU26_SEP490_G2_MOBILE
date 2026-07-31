import { useEffect, useState } from "react";
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

export default function ScheduleSection({ onPressTournament, onPressAll }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const page = await publicTournamentApi.listPublicTournaments({
          page: 0,
          size: PAGE_SIZE,
        });
        if (alive) setTournaments(page.content);
      } catch {
        if (alive) setError("Không tải được lịch thi đấu.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

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
