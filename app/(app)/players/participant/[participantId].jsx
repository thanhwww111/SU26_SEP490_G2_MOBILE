import { useLocalSearchParams, useRouter } from "expo-router";

import PlayerProfileView from "../../../../src/components/player/PlayerProfileView";

/**
 * Hồ sơ cơ thủ theo suất tham dự, bám trang /event/players/:participantId của
 * FE web.
 *
 * Header và nút quay lại do app/(app)/_layout.jsx dựng.
 *
 * Web đặt nhánh này ở gốc (`/event/players/:participantId`) còn nhánh tài khoản
 * ở dưới (`/event/players/user/:userId`); mobile làm ngược lại vì màn `userId`
 * có trước và đã được trang chủ lẫn bảng xếp hạng trỏ tới. Đảo lại chỉ để cho
 * giống web thì phải sửa mọi nơi đang gọi mà không được gì thêm.
 */
export default function ParticipantProfileScreen() {
  const { participantId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <PlayerProfileView
      participantId={participantId}
      onRedirectToUser={(userId) => router.replace(`/(app)/players/${userId}`)}
      onPressTournament={(entry) =>
        router.push(`/(app)/event/${entry.tournamentId}`)
      }
    />
  );
}
