import { useRouter } from "expo-router";

import NewsList from "../../src/components/news/NewsList";

/**
 * Danh sách tin tức, bám trang /news của FE web.
 *
 * Route giữ đúng tên web để mục "Tin Mới Nhất" trong drawer khớp `activeKey`
 * mà app/(app)/_layout.jsx truyền xuống (segment cuối của route).
 *
 * Header do layout dựng. Không bọc ScrollView: bên trong là FlatList, nó tự là
 * vùng cuộn và tự đặt AppFooter ở ListFooterComponent.
 */
export default function NewsScreen() {
  const router = useRouter();

  return (
    <NewsList
      onPressItem={(post) => router.push(`/(app)/news/${post.slug}`)}
    />
  );
}
