import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "./Button";
import { useOverlay } from "./layout/useOverlay";
import { scrim, shadow } from "../theme/tokens";

/**
 * Hộp xác nhận cho hành động không hoàn tác được, thay ConfirmModal của web.
 *
 * Trượt lên từ đáy chứ không đứng giữa màn: hai nút nằm trong tầm ngón cái,
 * còn hộp thoại giữa màn thì phải với — xem docs/mobile/07-web-mapping.md,
 * mục "Modal → bottom sheet hoặc màn riêng".
 *
 * Không dùng <Modal> vì lý do đã nêu trong layout/useOverlay.js.
 */
export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Quay lại",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { mounted, progress } = useOverlay(visible, 180);
  const insets = useSafeAreaInsets();

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [240, 0],
  });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        {/* Đang xử lý thì khoá luôn lớp nền, tránh đóng sheet giữa lúc request chạy */}
        <Pressable
          disabled={loading}
          onPress={onCancel}
          style={{ flex: 1, backgroundColor: scrim }}
        />
      </Animated.View>

      <Animated.View
        style={[
          shadow.overlay,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            opacity: progress,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          className="rounded-t-2xl bg-white px-6 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Tay nắm chỉ để báo hiệu đây là lớp trượt lên, không kéo được */}
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-slate-200" />

          <Text className="text-base font-bold text-slate-900">{title}</Text>
          {message ? (
            <Text className="mt-2 text-sm leading-5 text-slate-600">{message}</Text>
          ) : null}

          <View className="mt-6 gap-3">
            <Button
              title={confirmText}
              loadingTitle="Đang xử lý..."
              loading={loading}
              variant={confirmVariant}
              onPress={onConfirm}
            />
            <Button
              title={cancelText}
              variant="outline"
              disabled={loading}
              onPress={onCancel}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
