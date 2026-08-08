import { useRouter } from "expo-router";

import MyMatchList from "../../src/components/match/MyMatchList";

/**
 * Lịch thi đấu của tôi, bám trang /player/matches của FE web.
 *
 * Header kèm nút quay lại do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 */
export default function MyMatchesScreen() {
  const router = useRouter();

  return (
    <MyMatchList
      onOpenTournament={(tournamentId) => {
        if (tournamentId) router.push(`/(app)/event/${tournamentId}`);
      }}
    />
  );
}
