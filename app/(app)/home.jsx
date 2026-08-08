import { ScrollView } from "react-native";
import { useRouter } from "expo-router";

import HomeBanner from "../../src/components/home/HomeBanner";
import NewsSection from "../../src/components/home/NewsSection";
import ScheduleSection from "../../src/components/home/ScheduleSection";
import RankedSection from "../../src/components/home/RankedSection";
import AppFooter from "../../src/components/layout/AppFooter";

/**
 * Trang chủ sau đăng nhập, bám trang chủ của FE web.
 *
 * Header nằm ở app/(app)/_layout.jsx nên màn này không tự dựng.
 * Footer thì ngược lại: đặt cuối ScrollView để cuộn tới mới thấy, giống web.
 *
 * Mỗi khối tự gọi API và tự xử lý loading/lỗi của mình — khối này hỏng
 * không kéo sập khối kia.
 *
 * Web có ba dải chữ chạy ngang ngăn giữa các khối; mobile cố ý không làm — xem
 * docs/mobile/07-web-mapping.md, mục "Ba chỗ cố ý không sao chép từ web".
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface">
      <HomeBanner />

      <NewsSection
        onPressAll={() => router.push("/(app)/news")}
        onPressPost={(post) => router.push(`/(app)/news/${post.slug}`)}
      />

      <ScheduleSection
        onPressAll={() => router.push("/(app)/event")}
        onPressTournament={(tournament) =>
          router.push(`/(app)/event/${tournament.id}`)
        }
      />

      <RankedSection
        onPressAll={() => router.push("/(app)/rankings")}
        onPressPlayer={(player) =>
          router.push(`/(app)/players/${player.userId}`)
        }
      />

      <AppFooter />
    </ScrollView>
  );
}
