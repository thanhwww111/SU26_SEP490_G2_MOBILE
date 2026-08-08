import { useRouter } from "expo-router";

import RankingList from "../../src/components/ranking/RankingList";

/**
 * Bảng xếp hạng cơ thủ, bám trang /rankings của FE web.
 *
 * Route đặt tên "rankings" để mục "Bảng Xếp Hạng" trong drawer khớp `activeKey`
 * mà app/(app)/_layout.jsx truyền xuống (segment cuối của route).
 *
 * Header do layout dựng. Không bọc ScrollView: bên trong là FlatList, nó tự là
 * vùng cuộn và tự đặt AppFooter ở ListFooterComponent.
 */
export default function RankingsScreen() {
  const router = useRouter();

  return (
    <RankingList
      onPressPlayer={(entry) => router.push(`/(app)/players/${entry.userId}`)}
    />
  );
}
