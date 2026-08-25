import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import RichText from "./RichText";
import RemoteImage from "../home/RemoteImage";
import AppFooter from "../layout/AppFooter";
import * as newsApi from "../../api/newsApi";
import { useRefresh } from "../../hooks/useRefresh";
import { fmtDateShort } from "../../utils/date";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Chi tiết bài viết, bám trang /news/:slug của FE web.
 *
 * Web gặp lỗi thì đá người dùng về /news kèm một cái toast. Mobile giữ nguyên
 * màn và hiện nút thử lại: trên điện thoại lỗi mạng chập chờn là chuyện thường,
 * mất luôn màn đang đọc chỉ vì rớt sóng một nhịp thì quá phũ.
 *
 * Không có thanh tab hay nút back tự dựng — header của app/(app)/_layout.jsx
 * đã có nút quay lại.
 */
export default function NewsDetail({ slug }) {
  const colors = useThemeColors();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const alive = useRef(true);

  /**
   * @param silent — vuốt để làm mới thì đừng bật `loading`. Nhánh loading thay cả màn bằng vòng
   *   quay, trong khi bài viết đang đọc vẫn đúng cho tới lúc có bản mới; RefreshControl đã báo
   *   là đang tải rồi, không cần báo lần hai bằng cách xoá trắng nội dung.
   */
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await newsApi.getPostBySlug(slug);
      if (alive.current) setPost(data);
    } catch (e) {
      // Vuốt làm mới mà hỏng thì im lặng giữ nội dung cũ. Đổi bài đang đọc thành màn lỗi chỉ vì
      // mạng chập một nhịp là tệ hơn hẳn — cùng lựa chọn với `app/(app)/staff/matches.jsx`.
      if (alive.current && !silent) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    alive.current = true;
    if (slug) load();
    return () => {
      alive.current = false;
    };
  }, [slug, load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);
  const { refreshControl } = useRefresh(refresh);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface px-4">
        <Text className="text-center text-sm text-muted">
          {error || "Không tìm thấy bài viết."}
        </Text>
        <Pressable
          onPress={load}
          className="rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
        >
          <Text className="text-sm font-semibold text-content-2">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const publishedAt = fmtDateShort(post.publishedAt);

  return (
    <ScrollView className="flex-1 bg-surface" refreshControl={refreshControl}>
      <View className="gap-3 px-4 pt-6">
        {post.categoryName ? (
          <Text className="text-overline font-bold uppercase text-accent">
            {post.categoryName}
          </Text>
        ) : null}

        <Text className="text-2xl font-display leading-8 text-content">
          {post.title}
        </Text>

        {publishedAt ? (
          <Text className="text-sm text-faint">{publishedAt}</Text>
        ) : null}
      </View>

      <View className="px-4 py-5">
        <RemoteImage uri={post.thumbnailUrl} className="h-56 w-full rounded-xl" />
      </View>

      <View className="px-4">
        <RichText html={post.content} />
      </View>

      {post.tags?.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 px-4 pt-6">
          {post.tags.map((tag) => (
            <View key={tag} className="rounded-full bg-sunken px-3 py-1">
              <Text className="text-xs text-content-2">#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="h-8" />
      <AppFooter />
    </ScrollView>
  );
}
