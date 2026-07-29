import { useLocalSearchParams } from "expo-router";

import NewsDetail from "../../../src/components/news/NewsDetail";

/**
 * Chi tiết bài viết, bám trang /news/:slug của FE web.
 *
 * Tham số là `slug` chứ không phải id — backend lấy bài theo slug.
 * Header kèm nút quay lại do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 */
export default function NewsDetailScreen() {
  const { slug } = useLocalSearchParams();

  return <NewsDetail slug={slug} />;
}
