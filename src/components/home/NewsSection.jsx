import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import SectionHeader from "./SectionHeader";
import SectionState from "./SectionState";
import RemoteImage from "./RemoteImage";
import * as newsApi from "../../api/newsApi";
import { fmtDateShort } from "../../utils/date";

const PAGE_SIZE = 5;

/** Bài đầu tiên hiển thị dạng card lớn, các bài sau xếp thành hàng ngang nhỏ */
const FeaturedPost = ({ post, onPress }) => (
  <Pressable onPress={onPress} className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface active:opacity-80">
    <RemoteImage uri={post.thumbnailUrl} className="h-48 w-full" />
    <View className="p-4">
      {post.categoryName ? (
        <Text className="mb-1 text-[11px] font-bold uppercase tracking-wide text-accent">
          {post.categoryName}
        </Text>
      ) : null}
      <Text className="text-base font-black uppercase leading-5 text-content">
        {post.title}
      </Text>
      {fmtDateShort(post.publishedAt) ? (
        <Text className="mt-2 text-xs text-faint">
          {fmtDateShort(post.publishedAt)}
        </Text>
      ) : null}
    </View>
  </Pressable>
);

const PostRow = ({ post, onPress }) => (
  <Pressable
    onPress={onPress}
    className="mt-3 flex-row overflow-hidden rounded-2xl border border-line bg-surface active:opacity-80"
  >
    <RemoteImage uri={post.thumbnailUrl} className="h-24 w-24" />
    <View className="flex-1 justify-center p-3">
      <Text
        numberOfLines={3}
        className="text-xs font-extrabold uppercase leading-4 text-content"
      >
        {post.title}
      </Text>
      {fmtDateShort(post.publishedAt) ? (
        <Text className="mt-1.5 text-[11px] text-faint">
          {fmtDateShort(post.publishedAt)}
        </Text>
      ) : null}
    </View>
  </Pressable>
);

export default function NewsSection({
  onPressPost,
  onPressAll,
  refreshKey = 0,
  onLoaded,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Giữ `onLoaded` trong ref: trang chủ truyền hàm mũi tên mới sau mỗi lần vẽ lại, đưa thẳng
     vào deps của effect là mỗi lần vẽ lại một lần gọi API. */
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    let alive = true;

    (async () => {
      // Lần vuốt làm mới không hiện lại khung xương: vòng xoay của RefreshControl đã nói đủ, đổi
      // nội dung người dùng đang đọc thành khung xám nữa chỉ làm màn hình nháy.
      if (refreshKey > 0) setError("");

      try {
        const page = await newsApi.listPublishedPosts({
          page: 0,
          size: PAGE_SIZE,
        });
        if (alive) setPosts(page.content);
      } catch {
        if (alive) setError("Không tải được tin tức.");
      } finally {
        if (alive) {
          setLoading(false);
          // Trang chủ đếm đủ ba khối báo xong mới tắt vòng xoay — xem `app/(app)/home.jsx`
          onLoadedRef.current?.();
        }
      }
    })();

    // Màn có thể bị rời trước khi request xong — tránh set state lên component đã gỡ
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const [featured, ...rest] = posts;

  return (
    <View className="px-4 pt-6">
      <SectionHeader
        title="Tin mới nhất từ BTMS"
        actionLabel="Tất cả"
        onPressAction={onPressAll}
      />

      {loading || error || posts.length === 0 ? (
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có tin tức."
        />
      ) : (
        <>
          <FeaturedPost post={featured} onPress={() => onPressPost?.(featured)} />
          {rest.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              onPress={() => onPressPost?.(post)}
            />
          ))}
        </>
      )}
    </View>
  );
}
