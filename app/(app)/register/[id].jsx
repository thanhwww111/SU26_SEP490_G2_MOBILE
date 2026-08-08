import { useLocalSearchParams, useRouter } from "expo-router";

import TournamentRegisterView from "../../../src/components/registration/TournamentRegisterView";

/**
 * Đăng ký một giải, bám trang `/player/tournaments/:id/register` của FE web.
 *
 * Header kèm nút quay lại do app/(app)/_layout.jsx dựng; màn này chỉ lắp ráp.
 */
export default function TournamentRegisterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <TournamentRegisterView
      tournamentId={id}
      onDone={() => router.replace("/(app)/my-registrations")}
      onBack={() => router.replace(`/(app)/event/${id}`)}
    />
  );
}
