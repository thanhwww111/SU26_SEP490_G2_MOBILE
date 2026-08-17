import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Clock, Play, Trophy } from "lucide-react-native";

import {
  formatMatchScheduleLabel,
  getPlayerName,
  getTournamentName,
  isMatchDue,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
} from "../../utils/refereeMatch";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Một trận trong danh sách của trọng tài. Bám `MatchCard` trong
 * `FE/src/pages/Staff/Matches/StaffMatchListPage.jsx`.
 *
 * Bảng web có bốn tông thẻ dựng bằng gradient (`CARD_TONE`). Mobile chưa cài thư viện gradient
 * (`docs/mobile/06-agent.md`) nên dùng nền đặc, và bốn màu của web ánh xạ sang token trạng thái
 * của app:
 *
 * | Web | Mobile | Vì sao |
 * |---|---|---|
 * | emerald — đang đấu | `success` | cùng vai trò "đang chạy tốt" |
 * | indigo — tới giờ, bấm được | `accent` | app chỉ có một màu kêu gọi hành động |
 * | amber — chưa tới giờ | `warning` | cùng vai trò "khoan đã" |
 * | slate — đã xong | `muted` | |
 *
 * Số bàn giữ cỡ lớn như web: trọng tài quét màn hình tìm bàn của mình trước, tên cơ thủ sau.
 */

const TONE = {
  live: {
    card: "border-success bg-tint-success",
    tableBox: "bg-success",
    tableLabel: "text-white/70",
    tableNo: "text-white",
    badge: "bg-success",
    badgeText: "text-white",
    action: "bg-success active:opacity-80",
    actionText: "text-white",
  },
  ready: {
    card: "border-accent bg-tint-accent",
    tableBox: "bg-accent",
    tableLabel: "text-white/70",
    tableNo: "text-white",
    badge: "bg-tint-accent border border-accent",
    badgeText: "text-accent",
    action: "bg-accent active:bg-accent-pressed",
    actionText: "text-white",
  },
  waiting: {
    card: "border-line bg-surface",
    tableBox: "bg-sunken",
    tableLabel: "text-muted",
    tableNo: "text-content",
    badge: "bg-tint-warning",
    badgeText: "text-warning",
    action: "border border-line-strong bg-surface active:bg-sunken",
    actionText: "text-content-2",
  },
  finished: {
    card: "border-line bg-canvas",
    tableBox: "bg-sunken",
    tableLabel: "text-faint",
    tableNo: "text-muted",
    badge: "bg-sunken",
    badgeText: "text-muted",
    action: "border border-line bg-surface active:bg-sunken",
    actionText: "text-muted",
  },
};

const StatusBadge = ({ match, tone }) => {
  const colors = useThemeColors();

  if (isMatchLive(match.status)) {
    return (
      <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${tone.badge}`}>
        <View className="h-1.5 w-1.5 rounded-full bg-white" />
        <Text className={`text-overline font-bold uppercase ${tone.badgeText}`}>Đang đấu</Text>
      </View>
    );
  }

  if (isMatchPending(match.status)) {
    return (
      <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${tone.badge}`}>
        <Clock
          size={12}
          color={isMatchDue(match) ? colors.accent : colors.warning}
        />
        <Text className={`text-overline font-bold uppercase ${tone.badgeText}`}>
          {formatMatchScheduleLabel(match.scheduledAt)}
        </Text>
      </View>
    );
  }

  return (
    <View className={`rounded-full px-2.5 py-1 ${tone.badge}`}>
      <Text className={`text-overline font-bold uppercase ${tone.badgeText}`}>Đã xong</Text>
    </View>
  );
};

export default function RefereeMatchCard({ match, starting, onStart, onOpen }) {
  const colors = useThemeColors();

  const live = isMatchLive(match.status);
  const pending = isMatchPending(match.status);
  const finished = isMatchFinished(match.status);
  const due = isMatchDue(match);

  const tone = TONE[live ? "live" : finished ? "finished" : due ? "ready" : "waiting"];

  const p1 = getPlayerName(match.player1, "Cơ thủ 1");
  const p2 = getPlayerName(match.player2, "Cơ thủ 2");
  const score1 = match.player1Score ?? 0;
  const score2 = match.player2Score ?? 0;

  const meta = [
    match.matchCode,
    match.raceTo != null ? `Đánh tới ${match.raceTo} ván` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /* Bốn nhánh hành động giống hệt web. "Bắt đầu sớm" tồn tại vì giải hay chạy trước lịch, và
     backend chỉ đòi trận đang PENDING chứ không kiểm giờ. */
  let actionLabel = null;
  let actionIcon = null;
  let onAction = null;

  if (live) {
    actionLabel = "Tiếp tục chấm";
    onAction = () => onOpen(match.id);
  } else if (pending) {
    actionLabel = due ? "Bắt đầu" : "Bắt đầu sớm";
    actionIcon = <Play size={iconSize.sm} color={due ? colors.textInverse : colors.content2} />;
    onAction = () => onStart(match);
  } else if (finished) {
    actionLabel = "Xem lại";
    onAction = () => onOpen(match.id);
  }

  return (
    <View className={`gap-3 rounded-xl border p-4 ${tone.card}`}>
      <View className="flex-row items-start gap-3">
        {/* Ô số bàn — mốc định vị đầu tiên khi trọng tài quét danh sách */}
        <View className={`w-16 items-center rounded-lg px-2 py-1.5 ${tone.tableBox}`}>
          <Text className={`text-overline font-bold uppercase ${tone.tableLabel}`}>Bàn</Text>
          <Text className={`text-[32px] font-black leading-none ${tone.tableNo}`}>
            {match.tableNo != null ? match.tableNo : "—"}
          </Text>
        </View>

        <View className="flex-1 gap-2">
          <View className="flex-row flex-wrap items-center gap-2">
            <StatusBadge match={match} tone={tone} />

            <View className="max-w-[70%] flex-row items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1">
              <Trophy size={12} color={colors.muted} />
              <Text numberOfLines={1} className="text-overline font-bold uppercase text-muted">
                {getTournamentName(match)}
              </Text>
            </View>
          </View>

          {meta ? <Text className="text-xs text-faint">{meta}</Text> : null}

          {/* Trận đang đấu hiện luôn tỷ số: trọng tài liếc qua là biết có đúng bàn mình không */}
          <View className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 text-sm font-semibold text-content">
              {p1}
            </Text>

            {live ? (
              <View className="rounded-lg bg-success px-2 py-0.5">
                <Text className="text-sm font-black text-white">
                  {score1} – {score2}
                </Text>
              </View>
            ) : (
              <Text className="text-xs font-semibold text-faint">vs</Text>
            )}

            <Text numberOfLines={1} className="flex-1 text-right text-sm font-semibold text-content">
              {p2}
            </Text>
          </View>
        </View>
      </View>

      {actionLabel ? (
        <Pressable
          onPress={onAction}
          disabled={starting}
          accessibilityRole="button"
          className={`h-11 flex-row items-center justify-center gap-2 rounded-lg ${tone.action} ${
            starting ? "opacity-60" : ""
          }`}
        >
          {/* Nút "Bắt đầu sớm" là nút nền nhạt duy nhất — spinner trắng trên đó sẽ tàng hình */}
          {starting ? (
            <ActivityIndicator size="small" color={due ? colors.textInverse : colors.content2} />
          ) : (
            actionIcon
          )}
          <Text className={`text-sm font-bold ${tone.actionText}`}>
            {starting ? "Đang bắt đầu…" : actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
