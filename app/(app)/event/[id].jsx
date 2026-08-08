import { useLocalSearchParams, useRouter } from "expo-router";

import TournamentDetail from "../../../src/components/tournament/TournamentDetail";

/**
 * Chi tiết giải đấu, bám trang /event/:id của FE web.
 *
 * Header và nút quay lại do app/(app)/_layout.jsx dựng. Không bọc ScrollView:
 * TournamentDetail tự quản vùng cuộn vì nó còn phải ghim thanh tab ở đáy.
 *
 * Cố ý không đặt AppFooter: thanh tab nổi luôn che phần đáy màn, footer đặt
 * dưới đó thì không ai đọc được.
 */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <TournamentDetail
      id={id}
      onOpenMyRegistrations={() => router.push("/(app)/my-registrations")}
      onRegister={() => router.push(`/(app)/register/${id}`)}
      onPressParticipant={(participantId) =>
        router.push(`/(app)/players/participant/${participantId}`)
      }
    />
  );
}
