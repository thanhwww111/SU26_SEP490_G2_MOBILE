import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../Button";
import { useOverlay } from "../layout/useOverlay";
import { getMatchState, getWinnerSide } from "../../constants/tournament";
import { fmtDateTime } from "../../utils/date";
import { scrim, shadow } from "../../theme/tokens";

/** Nhãn giai đoạn — web hiện thẳng mã enum, ở đây dịch ra tiếng Việt */
const STAGE_LABELS = {
  KNOCKOUT: "Loại trực tiếp",
  GROUP: "Vòng bảng",
  PROGRESSIVE_ROUND: "Vòng tròn loại dần",
  PROGRESSIVE_PLAYOFF: "Playoff",
  PLAYOFF: "Playoff",
  WINNERS: "Nhánh thắng",
  LOSERS: "Nhánh thua",
  GRAND_FINAL: "Chung kết lớn",
};

const InfoRow = ({ label, value }) => (
  <View className="flex-row items-start justify-between gap-4 border-b border-line-soft py-2.5">
    <Text className="text-sm text-muted">{label}</Text>
    <Text className="flex-1 text-right text-sm font-medium text-content">
      {value || "—"}
    </Text>
  </View>
);

/** Một bên của cặp đấu; người thắng in đậm và có nhãn, giống web */
const Side = ({ name, score, isWinner, dimmed, align = "left" }) => (
  <View className={`flex-1 ${align === "right" ? "items-end" : "items-start"}`}>
    <Text
      numberOfLines={2}
      className={`text-sm ${align === "right" ? "text-right" : ""} ${
        isWinner
          ? "font-bold text-emerald-600"
          : dimmed
            ? "text-faint"
            : "font-semibold text-content"
      }`}
    >
      {name || "TBD"}
    </Text>

    {isWinner ? (
      <Text className="mt-0.5 text-overline font-bold uppercase text-emerald-600">
        Thắng
      </Text>
    ) : null}

    {score != null ? (
      <Text
        className={`mt-1 text-2xl font-black tabular-nums ${
          isWinner ? "text-content" : "text-muted"
        }`}
      >
        {score}
      </Text>
    ) : null}
  </View>
);

/**
 * Chi tiết một trận trong màn Lịch thi đấu của tôi.
 *
 * Web mở modal giữa màn; trên điện thoại đổi thành lớp trượt lên từ đáy để nút
 * nằm trong tầm ngón cái — quy ước ở docs/mobile/07-web-mapping.md, mục
 * "Modal → bottom sheet hoặc màn riêng". Nội dung ngắn và cố định nên hợp
 * sheet, không cần màn riêng.
 *
 * Dữ liệu lấy trọn từ `MatchResponse` mà danh sách đã tải, không gọi thêm API —
 * web cũng chỉ hiện lại đúng bản ghi trong danh sách chứ không tải chi tiết.
 *
 * Dùng chung khuôn với `ConfirmSheet`: cùng tay nắm, cùng bo góc, cùng kiểu
 * bung ra. Sửa cái này thì sửa cả cái kia.
 */
export default function MatchDetailSheet({ match, onClose, onOpenTournament }) {
  const { mounted, progress } = useOverlay(Boolean(match), 180);
  const insets = useSafeAreaInsets();

  if (!mounted || !match) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  const state = getMatchState(match.status);
  const winner = getWinnerSide(match);
  const isDone = state === "done";

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: scrim }} />
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
          className="max-h-[80%] rounded-t-2xl bg-surface-raised px-6 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-sunken-strong" />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-2">
              <Text className="rounded bg-sunken px-2 py-0.5 text-overline font-bold uppercase text-muted">
                {match.matchCode || `#${match.id}`}
              </Text>

              {state === "live" ? (
                <View className="flex-row items-center gap-1.5">
                  <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <Text className="text-overline font-bold uppercase text-accent">
                    Đang đấu
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Cặp đấu và tỷ số */}
            <View className="mt-4 flex-row items-start gap-3 rounded-xl border border-line bg-canvas p-4">
              <Side
                name={match.player1?.displayName}
                score={isDone ? (match.player1Score ?? 0) : null}
                isWinner={winner === 1}
                dimmed={isDone && winner === 2}
              />

              <View className="items-center pt-1">
                <Text className="text-xs font-bold uppercase text-faint">
                  {isDone ? "Kết quả" : "vs"}
                </Text>
                {match.raceTo != null ? (
                  <Text className="mt-1 text-xs text-faint">
                    Race to {match.raceTo}
                  </Text>
                ) : null}
              </View>

              <Side
                name={match.player2?.displayName}
                score={isDone ? (match.player2Score ?? 0) : null}
                isWinner={winner === 2}
                dimmed={isDone && winner === 1}
                align="right"
              />
            </View>

            <Text className="mb-1 mt-5 text-overline font-semibold uppercase text-faint">
              Thông tin trận đấu
            </Text>

            <InfoRow label="Giải đấu" value={match.tournamentName} />
            <InfoRow label="Lịch thi đấu" value={fmtDateTime(match.scheduledAt)} />
            {match.stageType ? (
              <InfoRow
                label="Giai đoạn"
                value={STAGE_LABELS[match.stageType] || match.stageType}
              />
            ) : null}
            {match.roundNo != null ? (
              <InfoRow label="Vòng đấu" value={`Vòng ${match.roundNo}`} />
            ) : null}
            {match.tableName || match.tableNo != null ? (
              <InfoRow
                label="Bàn"
                value={match.tableName || `Bàn ${match.tableNo}`}
              />
            ) : null}

            <View className="mt-6 gap-3">
              <Button
                title="Xem giải đấu"
                onPress={() => onOpenTournament?.(match.tournamentId)}
              />
              <Button title="Đóng" variant="outline" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
