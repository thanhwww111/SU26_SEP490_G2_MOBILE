import { ScrollView } from "react-native";

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
  return (
    <ScrollView className="flex-1 bg-white">
      <HomeBanner />

      {/* Các màn danh sách và chi tiết chưa làm — nối điều hướng khi có màn */}
      <NewsSection />
      <ScheduleSection />
      <RankedSection />

      <AppFooter />
    </ScrollView>
  );
}
