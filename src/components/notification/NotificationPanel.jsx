import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import NotificationRow from "./NotificationRow";
import { useOverlay } from "../layout/useOverlay";
import * as notificationApi from "../../api/notificationApi";
import { useRefresh } from "../../hooks/useRefresh";
import { useNotificationStore } from "../../store/notificationStore";
import { NOTIFICATION_POPUP_SIZE } from "../../constants/notification";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Popup thông báo xổ ra từ chuông trên header.
 *
 * Cố ý là lớp phủ chứ không phải một màn riêng: thông báo là thứ người dùng liếc qua rồi quay
 * lại việc đang làm, đẩy họ sang màn khác là bắt phải bấm quay lại mới về được chỗ cũ.
 *
 * Dùng chung khung với ProfileMenu (useOverlay + View absolute, không dùng Modal — lý do nêu ở
 * useOverlay.js), nhưng rộng gần hết bề ngang vì mỗi dòng có tiêu đề dài.
 *
 * Đánh dấu đã đọc ngay khi mở, còn cái nào được tô sáng thì căn theo mốc đã đọc CHỤP LẠI lúc
 * mở. Nhờ vậy lần này người dùng vẫn thấy rõ cái nào mới, nhưng lần mở sau chúng đã thành đã
 * đọc — đúng cách Facebook làm.
 */
export default function NotificationPanel({ visible, onClose, onOpenItem }) {
  const colors = useThemeColors();
  const { mounted, progress } = useOverlay(visible, 140);

  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const hydrate = useNotificationStore((s) => s.hydrate);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readAtOnOpen, setReadAtOnOpen] = useState(null);

  const alive = useRef(true);

  /**
   * @param silent — vuốt để làm mới thì đừng bật `loading`, và hỏng cũng đừng dựng dải lỗi thay
   *   cho danh sách đang hiện. Mốc "đã đọc" vẫn được cập nhật như thường.
   */
  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await notificationApi.getMyNotifications({
          page: 0,
          size: NOTIFICATION_POPUP_SIZE,
        });
        if (!alive.current) return;
        setItems(res.content);

        // Đánh dấu SAU khi tải xong: tải hỏng mà vẫn xoá huy hiệu thì người dùng
        // tưởng đã xem hết trong khi chưa thấy gì
        await markAllRead();
      } catch (e) {
        if (alive.current && !silent) setError(e.message);
      } finally {
        if (alive.current) setLoading(false);
      }
    },
    [markAllRead]
  );

  /* Chuông không có realtime — backend chỉ bắn WebSocket cho tỷ số trận, thông báo thì đi bằng
     push. Vuốt xuống là cách duy nhất người dùng chủ động hỏi lại danh sách mà không phải đóng
     rồi mở lại bảng. */
  const refresh = useCallback(() => load({ silent: true }), [load]);
  const { refreshControl } = useRefresh(refresh);

  useEffect(() => {
    if (!visible) return undefined;

    alive.current = true;

    (async () => {
      await hydrate();
      if (!alive.current) return;

      // Chụp mốc cũ TRƯỚC khi load gọi markAllRead, nếu không mọi dòng đều thành
      // "đã đọc" ngay khoảnh khắc mở và người dùng mất luôn thông tin cái nào mới
      setReadAtOnOpen(useNotificationStore.getState().lastReadAt);
      load();
    })();

    return () => {
      alive.current = false;
    };
  }, [visible, hydrate, load]);

  if (!mounted) return null;

  const isUnread = (item) => {
    if (!item.createdAt) return false;
    if (!readAtOnOpen) return true;
    return new Date(item.createdAt) > new Date(readAtOnOpen);
  };

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  /**
   * Popup phải trông rõ là một lớp phủ, không phải một màn hình.
   *
   * Trải hết bề ngang và cao nửa màn thì nó che gần sạch nội dung, người dùng mất cảm giác
   * mình vẫn đang ở màn cũ. Chừa lại một phần tư bề ngang là đủ để thấy trang phía sau,
   * đồng thời vẫn đủ chỗ cho tiêu đề hai dòng.
   *
   * Neo bên phải vì chuông nằm ở đó — lớp phủ nên bung ra từ chính nút vừa bấm.
   */
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const panelWidth = screenWidth * 0.76;
  const maxHeight = screenHeight * 0.42;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable className="flex-1 bg-black/20" onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: 6,
          right: 8,
          width: panelWidth,
          opacity: progress,
          transform: [{ translateY }, { scale }],
        }}
      >
        <View className="overflow-hidden rounded-xl border border-line bg-surface-raised shadow-lg">
          <View className="border-b border-line-soft px-3 py-2.5">
            <Text className="text-[13px] font-semibold text-content">Thông báo</Text>
          </View>

          <ScrollView
            style={{ maxHeight }}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={refreshControl}
          >
            {loading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
            ) : null}

            {!loading && error ? (
              <View className="items-center px-4 py-8">
                <Text className="text-center text-[13px] text-danger">{error}</Text>
                <Pressable onPress={load} className="mt-2 px-3 py-1.5 active:opacity-60">
                  <Text className="text-[12px] font-semibold text-accent">Thử lại</Text>
                </Pressable>
              </View>
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <Text className="px-4 py-10 text-center text-[13px] text-faint">
                Chưa có thông báo nào.
              </Text>
            ) : null}

            {!loading && !error
              ? items.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <View className="h-px bg-line-soft" /> : null}
                    <NotificationRow
                      item={item}
                      unread={isUnread(item)}
                      onPress={() => onOpenItem?.(item)}
                    />
                  </View>
                ))
              : null}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
