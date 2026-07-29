import { useRouter } from "expo-router";

import TournamentList from "../../src/components/tournament/TournamentList";

/**
 * Danh sách giải đấu công khai, bám trang /event của FE web.
 *
 * Route giữ đúng tên bên web (`/event`) để mục "Giải Đấu" trong drawer khớp
 * `activeKey` mà app/(app)/_layout.jsx truyền xuống (segment cuối của route).
 *
 * Header (kèm nút quay lại) do layout dựng, màn này chỉ lắp ráp. Không bọc
 * ScrollView: bên trong là FlatList, nó tự là vùng cuộn và tự đặt AppFooter
 * ở ListFooterComponent.
 */
export default function EventScreen() {
  const router = useRouter();

  return (
    <TournamentList
      onPressItem={(item) => router.push(`/(app)/event/${item.id}`)}
    />
  );
}
