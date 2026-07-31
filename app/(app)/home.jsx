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
 */
export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-surface">
      <HomeBanner />

      {/* Bảng xếp hạng chưa có màn đích — nối điều hướng khi có màn */}
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
      <RankedSection />

      <AppFooter />
    </ScrollView>
  );
}
