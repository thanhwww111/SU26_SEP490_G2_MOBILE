import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Award, Star, Trophy } from "lucide-react-native";

import PlayerPortrait from "./PlayerPortrait";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import {
  getParticipantProfile,
  getPlayerProfileByUserId,
} from "../../api/publicPlayerApi";
import { MEDAL_COLORS, rankingNoteLabel } from "../../constants/leaderboard";
import { BILLIARD_RANK_LABELS } from "../../constants/profile";
import { fmtCurrency, splitName } from "../../utils/format";
import { iconSize } from "../../theme/tokens";
import { useRefresh } from "../../hooks/useRefresh";
import { useThemeColors } from "../../theme/useThemeColors";

/** Hạng chưa khai báo thì không dựng badge trống. */
const HIDDEN_RANKS = ["UNKNOWN", "UNRANKED"];

const StatBox = ({ value, label }) => (
  <View className="flex-1">
    <Text className="text-3xl font-black text-gold">{value}</Text>
    <Text className="mt-1 text-overline font-bold uppercase text-navy-500">
      {label}
    </Text>
  </View>
);

const AchievementRow = ({ entry, onPress, colors }) => {
  const medal = MEDAL_COLORS[entry.finalRank];
  const note = rankingNoteLabel(entry.note);
  // fmtCurrency trả "Miễn phí" khi giá trị rỗng — hợp cho phí dự giải, sai cho
  // tiền thưởng, nên chỉ gọi khi thực sự có thưởng
  const prize = Number(entry.prizeAmount) > 0 ? fmtCurrency(entry.prizeAmount) : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 active:bg-white/10"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full border"
        style={{ borderColor: medal || colors.borderInverse }}
      >
        <Text
          className="text-base font-black text-white"
          style={medal ? { color: medal } : undefined}
        >
          #{entry.finalRank ?? "—"}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={2} className="text-sm font-semibold text-white">
          {entry.tournamentName}
        </Text>

        <View className="mt-1 flex-row flex-wrap items-center gap-x-3">
          {note ? (
            <Text className="text-overline font-bold uppercase text-gold">
              {note}
            </Text>
          ) : null}
          {entry.pointsEarned > 0 ? (
            <Text className="text-xs font-semibold text-navy-500">
              +{entry.pointsEarned} điểm
            </Text>
          ) : null}
          {prize ? (
            <Text className="text-xs font-semibold text-navy-500">{prize}</Text>
          ) : null}
        </View>
      </View>

      {entry.isOfficial ? (
        <Award
          size={iconSize.sm}
          color={colors.gold}
          accessibilityLabel="Kết quả chính thức"
        />
      ) : (
        <Star
          size={iconSize.sm}
          color={colors.textInverseMuted}
          accessibilityLabel="Xếp hạng tạm thời"
        />
      )}
    </Pressable>
  );
};

/**
 * Hồ sơ cơ thủ công khai, bám hai trang `/event/players/user/:userId` và
 * `/event/players/:participantId` của FE web.
 *
 * Nhận **một trong hai** khoá:
 * - `userId` — hồ sơ của tài khoản, gom thành tích mọi giải từng dự. Bảng xếp
 *   hạng chung và khối Top tay cơ ở trang chủ đi lối này.
 * - `participantId` — hồ sơ của một suất tham dự. Tab Cơ thủ và tab Xếp hạng
 *   trong chi tiết giải chỉ có khoá này.
 *
 * Suất tham dự có gắn tài khoản thì chuyển tiếp sang nhánh `userId` để người
 * dùng thấy đủ thành tích thay vì mỗi giải đang mở — web cũng `navigate` như
 * vậy. Chuyển tiếp phải `replace` chứ không `push`, nếu không bấm Quay lại sẽ
 * rơi về đúng màn vừa chuyển đi rồi lại chuyển tiếp, thành vòng lặp.
 *
 * Web dựng hai cột ảnh | thông tin; mobile xếp dọc theo quy ước layout nhiều
 * cột đổ về một cột.
 *
 * Khối hero và khối thành tích cố ý tối ở cả hai chế độ, giống web — nên dùng
 * màu tuyệt đối (`bg-navy-900`, `text-white`) chứ không dùng token vai trò.
 */
export default function PlayerProfileView({
  userId,
  participantId,
  onRedirectToUser,
  onPressTournament,
}) {
  const colors = useThemeColors();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const alive = useRef(true);

  /* `onRedirectToUser` giữ trong ref chứ không đưa vào deps của `load`: component cha truyền hàm
     mũi tên mới mỗi lần render, đưa vào deps là tải lại hồ sơ vô tận. */
  const onRedirectRef = useRef(onRedirectToUser);
  onRedirectRef.current = onRedirectToUser;

  /**
   * @param silent — vuốt để làm mới thì đừng bật `loading` và hỏng cũng đừng dựng màn lỗi: hồ sơ
   *   đang hiện vẫn đúng cho tới khi có bản mới.
   */
  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      // Màn sắp bị thay bằng nhánh userId thì giữ nguyên vòng quay: tắt loading
      // để lộ nội dung một nhịp rồi mới chuyển đi trông như giật hình
      let redirected = false;

      try {
        const data = userId
          ? await getPlayerProfileByUserId(userId)
          : await getParticipantProfile(participantId);

        if (!alive.current) return;

        if (!userId && data?.userId && onRedirectRef.current) {
          redirected = true;
          onRedirectRef.current(data.userId);
          return;
        }

        setProfile(data);
      } catch (e) {
        if (alive.current && !silent) setError(e.message);
      } finally {
        if (alive.current && !redirected) setLoading(false);
      }
    },
    [userId, participantId]
  );

  useEffect(() => {
    alive.current = true;
    load();

    return () => {
      alive.current = false;
    };
  }, [load]);

  const refresh = useCallback(() => load({ silent: true }), [load]);
  const { refreshControl } = useRefresh(refresh);

  if (loading || error || !profile) {
    return (
      <ScrollView className="flex-1 bg-canvas" refreshControl={refreshControl}>
        <View className="px-4 pt-6">
          <SectionState
            loading={loading}
            error={error}
            emptyMessage="Không tìm thấy hồ sơ cơ thủ."
          />

          {!loading && error ? (
            <Pressable
              onPress={() => load()}
              className="self-center rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
            >
              <Text className="text-sm font-semibold text-content-2">
                Thử lại
              </Text>
            </Pressable>
          ) : null}
        </View>

        <AppFooter />
      </ScrollView>
    );
  }

  const primaryName = profile.accountName || profile.displayName;
  const { first, last } = splitName(primaryName);
  const achievements = profile.achievements ?? [];
  const champCount = achievements.filter((a) => a.finalRank === 1).length;
  const rankLabel = HIDDEN_RANKS.includes(profile.billiardRank)
    ? null
    : (BILLIARD_RANK_LABELS[profile.billiardRank] ?? profile.billiardRank);

  return (
    <ScrollView className="flex-1 bg-canvas" refreshControl={refreshControl}>
      <PlayerPortrait
        uri={profile.avatarUrl}
        name={primaryName}
        className="h-72 w-full"
        initialsClassName="text-[32px]"
      />

      <View className="bg-navy-900 p-6">
        {first ? (
          <Text numberOfLines={1} className="text-xl uppercase text-navy-500">
            {first}
          </Text>
        ) : null}
        <Text numberOfLines={2} className="text-[32px] font-black uppercase leading-9 text-white">
          {last}
        </Text>

        {achievements.length > 0 ? (
          <View className="mt-6 flex-row gap-4">
            <StatBox value={achievements.length} label="Giải tham dự" />
            {champCount > 0 ? (
              <StatBox value={champCount} label="Vô địch" />
            ) : null}
          </View>
        ) : null}

        {rankLabel ? (
          <View className="mt-6 self-start rounded-full border border-gold px-3 py-1">
            <Text className="text-overline font-bold uppercase text-gold">
              Hạng {rankLabel}
            </Text>
          </View>
        ) : null}

        {profile.bio ? (
          <Text className="mt-5 text-sm leading-6 text-navy-500">
            {profile.bio}
          </Text>
        ) : null}
      </View>

      <View className="px-4 pb-10 pt-6">
        <View className="mb-3 flex-row items-center gap-2">
          <Trophy size={iconSize.sm} color={colors.content} />
          <Text className="text-overline font-bold uppercase text-content">
            Thành tích giải đấu
          </Text>
        </View>

        <View className="gap-2 rounded-2xl bg-navy-900 p-4">
          {achievements.length === 0 ? (
            <Text className="py-8 text-center text-sm text-navy-500">
              Chưa có thành tích chính thức được ghi nhận
            </Text>
          ) : (
            achievements.map((entry, index) => (
              <AchievementRow
                key={`${entry.tournamentId}-${index}`}
                entry={entry}
                colors={colors}
                onPress={() => onPressTournament?.(entry)}
              />
            ))
          )}
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}
