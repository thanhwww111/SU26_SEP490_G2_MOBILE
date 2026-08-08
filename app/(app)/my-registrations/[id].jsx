import { useLocalSearchParams, useRouter } from "expo-router";

import RegistrationDetailSection from "../../../src/components/registration/RegistrationDetailSection";

/**
 * Chi tiết một đăng ký giải — trên web đây là modal trong MyRegistrationsPage.
 *
 * Sau khi huỷ thì quay lại danh sách; danh sách tải lại nhờ useFocusEffect
 * trong MyRegistrationList nên không cần truyền cờ làm mới qua tham số route.
 */
export default function RegistrationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <RegistrationDetailSection
      registrationId={id}
      onCancelled={() => router.back()}
      onOpenTournament={(tournamentId) =>
        router.push(`/(app)/event/${tournamentId}`)
      }
    />
  );
}
