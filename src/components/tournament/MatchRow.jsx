import { Text, View } from "react-native";

import { getMatchState, getWinnerSide } from "../../constants/tournament";
import { fmtDateTime } from "../../utils/date";

/** Tỷ số chưa có thì để trống chứ không hiện 0 — 0 là một kết quả thật */
const scoreText = (value) => (value == null ? "–" : String(value));

/**
 * Một trận đấu trong tab Trận đấu và tab Trực tiếp.
 *
 * Web xếp mã trận, hai cơ thủ, tỷ số, giờ và bàn trên cùng một hàng ngang. Màn
 * điện thoại không đủ bề ngang cho sáu cụm, nên tách hai dòng: dòng trên là mã
 * trận + giờ/bàn, dòng dưới là cặp đấu và tỷ số. Thứ tự đọc giữ nguyên như web.
 *
 * Cơ thủ chưa xác định (`player1`/`player2` null) hiện "TBD" — trận vòng sau
 * luôn ở trạng thái này cho tới khi vòng trước kết thúc.
 */
export default function MatchRow({ match }) {
  const state = getMatchState(match.status);
  const winner = getWinnerSide(match);
  const isLive = state === "live";
  const isDone = state === "done";
  const scheduled = fmtDateTime(match.scheduledAt);

  const nameClass = (side) => {
    if (winner === side) return "font-bold text-info";
    if (isDone) return "text-faint";
    return "text-content-2";
  };

  const scoreClass = (side) => {
    if (winner === side) return "text-info";
    if (isDone) return "text-faint";
    return "text-content";
  };

  return (
    <View
      className={`border-b border-line-soft px-4 py-3 ${
        isLive ? "bg-accent/5" : ""
      }`}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-overline font-bold uppercase text-muted">
          {match.matchCode || `#${match.id}`}
        </Text>

        <View className="flex-row items-center gap-3">
          {isLive ? (
            <View className="flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-accent" />
              <Text className="text-overline font-bold uppercase text-accent">
                Đang đấu
              </Text>
            </View>
          ) : scheduled ? (
            <Text className="text-xs text-faint">{scheduled}</Text>
          ) : null}

          {match.tableName || match.tableNo != null ? (
            <Text className="text-xs font-semibold text-muted">
              {match.tableName || `Bàn ${match.tableNo}`}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Text
          numberOfLines={1}
          className={`flex-1 text-sm ${nameClass(1)}`}
        >
          {match.player1?.displayName || "TBD"}
        </Text>

        <View className="flex-row items-center gap-1">
          <Text className={`text-base font-black ${scoreClass(1)}`}>
            {scoreText(match.player1Score)}
          </Text>
          <Text className="text-xs text-disabled">-</Text>
          <Text className={`text-base font-black ${scoreClass(2)}`}>
            {scoreText(match.player2Score)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          className={`flex-1 text-right text-sm ${nameClass(2)}`}
        >
          {match.player2?.displayName || "TBD"}
        </Text>
      </View>
    </View>
  );
}
