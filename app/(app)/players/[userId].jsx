import { useLocalSearchParams, useRouter } from "expo-router";

import PlayerProfileView from "../../../src/components/player/PlayerProfileView";

/**
 * Hồ sơ cơ thủ công khai, bám trang /event/players/user/:userId của FE web.
 *
 * Header và nút quay lại do app/(app)/_layout.jsx dựng.
 *
 * Đường dẫn nhận `userId` chứ không phải `participantId`: cả bảng xếp hạng lẫn
 * khối Top tay cơ đều cầm `userId`, và nhánh đó gom thành tích của mọi giải chứ
 * không riêng một giải.
 */
export default function PlayerProfileScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <PlayerProfileView
      userId={userId}
      onPressTournament={(entry) =>
        router.push(`/(app)/event/${entry.tournamentId}`)
      }
    />
  );
}
