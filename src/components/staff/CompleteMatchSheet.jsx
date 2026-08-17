import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";

import { useOverlay } from "../layout/useOverlay";
import { getPlayerName } from "../../utils/refereeMatch";
import { shadow } from "../../theme/tokens";

/**
 * Chốt kết quả trận: chọn người thắng rồi xác nhận.
 *
 * Web dùng modal giữa màn (`StaffScoringPage.jsx`, khối `endOpen`); mobile đổi sang sheet trượt
 * lên từ đáy theo luật ở `docs/mobile/07-web-mapping.md`. Không dùng `ConfirmSheet` có sẵn vì
 * sheet đó lấy màu theo token vai trò (nền trắng ở chế độ sáng), còn màn chấm điểm tối cố ý ở cả
 * hai chế độ — một tấm trắng bật lên giữa trận sẽ chói mắt trong quán.
 *
 * Dùng chung cho hai việc, phân biệt bằng `mode`:
 * - `complete` — chốt tỷ số đang có. Chưa ai đạt `raceTo` thì phải gửi kèm `confirmEarlyEnd`,
 *   nên sheet cảnh báo trước để trọng tài không chốt nhầm một trận còn dở.
 * - `walkover` — đối thủ vắng mặt, trận ghi 0-0. **Web chưa có màn này**; giao diện ở đây cố ý
 *   là chính sheet chốt kết quả, chỉ đổi chữ, để mobile không tự đẻ ra một kiểu hộp thoại mới.
 */

const SHEET_BG = "#141A24";

export default function CompleteMatchSheet({
  visible,
  mode = "complete",
  match,
  scores,
  raceTo,
  selectedWinnerId,
  onSelectWinner,
  loading = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  const { mounted, progress } = useOverlay(visible, 180);
  const insets = useSafeAreaInsets();

  if (!mounted || !match) return null;

  const isWalkover = mode === "walkover";
  const players = [match.player1, match.player2].filter(Boolean);
  const raceReached = scores.p1 >= raceTo || scores.p2 >= raceTo;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [280, 0] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable
          disabled={loading}
          onPress={onCancel}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)" }}
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
            maxHeight: "92%",
            opacity: progress,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* `flexShrink` phải có ở CẢ thẻ này lẫn ScrollView bên trong. Thiếu nó thì thẻ lấy
            chiều cao theo nội dung, tràn qua `maxHeight` của lớp cha, và hai nút ở đáy bị đẩy
            ra ngoài mép màn — thấy rõ nhất ở chế độ ngang, nơi màn chỉ cao hơn 300pt. */}
        <View
          className="rounded-t-2xl px-5 pt-4"
          style={{
            backgroundColor: SHEET_BG,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            flexShrink: 1,
          }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-white/15" />

          <Text className="text-base font-bold text-white">
            {isWalkover ? "Xử thắng do vắng mặt" : "Xác nhận kết thúc trận"}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-400">
            {isWalkover
              ? "Trận sẽ ghi là thắng do đối thủ bỏ cuộc, tỷ số giữ 0-0 và người thắng được đẩy tiếp vào nhánh sau."
              : "Chọn người thắng để chốt kết quả. Sau khi chốt, tỷ số không sửa được nữa."}
          </Text>

          <ScrollView
            className="mt-4"
            style={{ flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isWalkover ? (
              <View className="items-center rounded-xl bg-black/30 py-3">
                <Text className="text-overline font-bold uppercase text-slate-500">Tỷ số cuối</Text>
                <Text className="mt-1 text-[32px] font-black text-white">
                  {scores.p1} — {scores.p2}
                </Text>
              </View>
            ) : null}

            <Text className="mb-2 mt-4 text-sm text-slate-400">Người thắng:</Text>

            <View className="gap-2">
              {players.map((player) => {
                const isP1 = player.id === match.player1?.id;
                const selected = selectedWinnerId === player.id;

                return (
                  <Pressable
                    key={player.id}
                    onPress={() => onSelectWinner(player.id)}
                    disabled={loading}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className="h-14 flex-row items-center gap-3 rounded-xl border px-4"
                    style={{
                      borderColor: selected ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.10)",
                      backgroundColor: selected ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.20)",
                    }}
                  >
                    <View
                      className="h-5 w-5 items-center justify-center rounded-full border"
                      style={{
                        borderColor: selected ? "#16A34A" : "rgba(255,255,255,0.30)",
                        backgroundColor: selected ? "#16A34A" : "transparent",
                      }}
                    >
                      {selected ? <Check size={12} color="#FFFFFF" /> : null}
                    </View>

                    <Text numberOfLines={1} className="flex-1 text-base text-white">
                      {getPlayerName(player)}
                    </Text>

                    {!isWalkover ? (
                      <Text className="text-xl font-bold text-white">
                        {isP1 ? scores.p1 : scores.p2}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Backend đòi cờ xác nhận riêng khi chốt sớm (MATCH_EARLY_END_NOT_CONFIRMED) —
                nói rõ ở đây thay vì để trọng tài chạm phải một lỗi khó hiểu */}
            {!isWalkover && !raceReached ? (
              <View className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                <Text className="text-sm text-amber-300">
                  Chưa ai đạt {raceTo} ván. Kết thúc lúc này là chốt sớm (bỏ cuộc, chấn thương…) —
                  hãy chắc chắn trước khi xác nhận.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
                <Text className="text-sm text-red-300">{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="mt-5 gap-2.5">
            <Pressable
              onPress={onConfirm}
              disabled={loading || !selectedWinnerId}
              accessibilityRole="button"
              className="h-12 flex-row items-center justify-center gap-2 rounded-full"
              style={{
                backgroundColor: !selectedWinnerId || loading ? "rgba(255,255,255,0.12)" : "#16A34A",
              }}
            >
              {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
              <Text
                className="text-sm font-semibold"
                style={{ color: !selectedWinnerId || loading ? "#94A3B8" : "#FFFFFF" }}
              >
                {loading
                  ? "Đang xử lý..."
                  : isWalkover
                    ? "Xác nhận xử thắng"
                    : "Xác nhận kết thúc"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              disabled={loading}
              accessibilityRole="button"
              className="h-12 flex-row items-center justify-center rounded-full border border-white/20"
            >
              <Text className="text-sm font-semibold text-slate-300">Quay lại</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
