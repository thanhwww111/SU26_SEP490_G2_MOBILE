import { Pressable, Text, View } from "react-native";

import RemoteImage from "../home/RemoteImage";
import { fmtDateShort } from "../../utils/date";

/**
 * Một bài viết trong danh sách /news.
 *
 * Web xếp lưới ba cột, thẻ gồm ảnh 16:9, tên chuyên mục màu accent, tiêu đề hai
 * dòng và ngày đăng. Mobile giữ nguyên thứ tự đó, chỉ đổ thành một cột.
 *
 * Tiêu đề của web dùng `line-clamp-2`; bản mobile là `numberOfLines={2}` —
 * tiêu đề bài viết rất hay dài, để tràn thì thẻ cao thấp so le nhau.
 */
export default function NewsCard({ post, onPress }) {
  const publishedAt = fmtDateShort(post.publishedAt);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white active:bg-slate-50"
    >
      <RemoteImage uri={post.thumbnailUrl} className="h-44 w-full" />

      <View className="gap-1 p-4">
        {post.categoryName ? (
          <Text className="text-overline font-bold uppercase text-accent">
            {post.categoryName}
          </Text>
        ) : null}

        <Text
          numberOfLines={2}
          className="text-base font-bold leading-snug text-slate-900"
        >
          {post.title}
        </Text>

        {publishedAt ? (
          <Text className="mt-1 text-xs text-slate-400">{publishedAt}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
