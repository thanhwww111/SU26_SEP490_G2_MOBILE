import { ActivityIndicator, Text, View } from "react-native";

/**
 * Trạng thái tải / lỗi / rỗng của một khối trên trang chủ.
 *
 * Cố ý không dùng toast: mỗi khối gọi API riêng, lỗi của khối này
 * không nên chặn cả màn hình.
 */
export default function SectionState({ loading, error, emptyMessage }) {
  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="small" color="#1a2a4a" />
      </View>
    );
  }

  const message = error || emptyMessage;
  if (!message) return null;

  return (
    <View className="py-8">
      <Text className="text-center text-sm text-slate-400">{message}</Text>
    </View>
  );
}
