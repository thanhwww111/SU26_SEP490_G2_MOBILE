import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";

import HomeBanner from "../../src/components/home/HomeBanner";
import NewsSection from "../../src/components/home/NewsSection";
import ScheduleSection from "../../src/components/home/ScheduleSection";
import RankedSection from "../../src/components/home/RankedSection";
import AppFooter from "../../src/components/layout/AppFooter";
import { useRefresh } from "../../src/hooks/useRefresh";

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

/** Ba khối tự gọi API: Tin tức, Lịch thi đấu, Bảng xếp hạng */
const SECTION_COUNT = 3;

/**
 * Chờ tối đa bấy nhiêu rồi tắt vòng xoay dù chưa đủ ba khối báo xong.
 *
 * `axiosClient` đã đặt timeout 15 giây, nên bình thường mọi khối đều báo về trong ngưỡng đó.
 * Đây chỉ là lưới an toàn cho trường hợp một khối chết theo kiểu không ai lường trước — vòng
 * xoay quay mãi trông như app treo, tệ hơn hẳn việc tắt sớm một nhịp.
 */
const REFRESH_TIMEOUT_MS = 20_000;

export default function HomeScreen() {
  const router = useRouter();

  /**
   * Vuốt xuống làm mới cả ba khối cùng lúc.
   *
   * Trang chủ không tự gọi API nào — dữ liệu nằm trong ba khối con, mỗi khối một endpoint. Nên
   * cơ chế ở đây là: tăng `refreshKey` để cả ba chạy lại effect của mình, rồi đếm đủ ba tiếng
   * "xong" mới tắt vòng xoay. Giữ được nguyên tắc "mỗi khối tự lo dữ liệu của nó" mà vòng xoay
   * vẫn phản ánh đúng sự thật, thay vì tắt bừa sau một khoảng thời gian đoán mò.
   */
  const [refreshKey, setRefreshKey] = useState(0);
  const doneCountRef = useRef(0);
  const resolveRef = useRef(null);
  const timerRef = useRef(null);

  const finishRefresh = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    resolveRef.current?.();
    resolveRef.current = null;
  }, []);

  useEffect(() => finishRefresh, [finishRefresh]);

  const load = useCallback(
    () =>
      new Promise((resolve) => {
        doneCountRef.current = 0;
        resolveRef.current = resolve;
        timerRef.current = setTimeout(finishRefresh, REFRESH_TIMEOUT_MS);
        setRefreshKey((key) => key + 1);
      }),
    [finishRefresh]
  );

  const handleSectionLoaded = useCallback(() => {
    doneCountRef.current += 1;
    if (doneCountRef.current >= SECTION_COUNT) finishRefresh();
  }, [finishRefresh]);

  const { refreshControl } = useRefresh(load);

  return (
    <ScrollView className="flex-1 bg-surface" refreshControl={refreshControl}>
      <HomeBanner />

      <NewsSection
        refreshKey={refreshKey}
        onLoaded={handleSectionLoaded}
        onPressAll={() => router.push("/(app)/news")}
        onPressPost={(post) => router.push(`/(app)/news/${post.slug}`)}
      />

      <ScheduleSection
        refreshKey={refreshKey}
        onLoaded={handleSectionLoaded}
        onPressAll={() => router.push("/(app)/event")}
        onPressTournament={(tournament) =>
          router.push(`/(app)/event/${tournament.id}`)
        }
      />

      <RankedSection
        refreshKey={refreshKey}
        onLoaded={handleSectionLoaded}
        onPressAll={() => router.push("/(app)/rankings")}
        onPressPlayer={(player) =>
          router.push(`/(app)/players/${player.userId}`)
        }
      />

      <AppFooter />
    </ScrollView>
  );
}
