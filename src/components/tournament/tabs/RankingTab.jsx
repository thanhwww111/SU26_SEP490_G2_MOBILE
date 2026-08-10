import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import TabScreen from "./TabScreen";
import PlayerAvatar from "../PlayerAvatar";
import PlayerName from "../PlayerName";
import SearchField from "../../SearchField";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";
import { iconSize } from "../../../theme/tokens";
import { useThemeColors } from "../../../theme/useThemeColors";

/**
 * Tab Xếp hạng — kết quả chung cuộc của giải.
 *
 * Response là OBJECT `{ isOfficial, entries }`, không phải mảng: `isOfficial`
 * quyết định nhãn "Kết quả chính thức" (giải đã COMPLETED) hay "Xếp hạng tạm
 * thời" (giải còn đang chạy).
 *
 * `TournamentRankingEntryResponse` không có trường ảnh — web đọc
 * `player.avatarUrl` nên nhánh ảnh bên đó không bao giờ chạy. Ở đây chỉ dùng
 * avatar chữ cái, không dựng sẵn code chết.
 *
 * Mỗi hàng bấm được sang hồ sơ cơ thủ theo `participantId`, giống web.
 */
export default function RankingTab({ tournamentId, onPressParticipant }) {
  const colors = useThemeColors();

  const [entries, setEntries] = useState([]);
  const [isOfficial, setIsOfficial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data =
          await publicTournamentApi.getPublicTournamentRankings(tournamentId);
        if (alive) {
          setEntries(data.entries);
          setIsOfficial(data.isOfficial);
        }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((e) => e.displayName?.toLowerCase().includes(query));
  }, [entries, search]);

  if (loading || error || entries.length === 0) {
    return (
      <TabScreen>
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có kết quả xếp hạng."
        />
      </TabScreen>
    );
  }

  // Vô địch tách riêng thành khối nổi bật như web; sortOrder 1 là hạng cao nhất
  const champion = filtered.find((e) => e.sortOrder === 1);
  const rest = champion
    ? filtered.filter((e) => e.participantId !== champion.participantId)
    : filtered;

  return (
    <TabScreen
      filters={
        <>
          <View className="flex-row items-center justify-between gap-3">
            <View
              className={`rounded-full border px-3 py-1 ${
                isOfficial
                  ? "border-emerald-200 bg-tint-success"
                  : "border-amber-200 bg-tint-warning"
              }`}
            >
              <Text
                className={`text-overline font-bold uppercase ${
                  isOfficial ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {isOfficial ? "Kết quả chính thức" : "Xếp hạng tạm thời"}
              </Text>
            </View>

            <Text className="text-xs text-faint">{filtered.length} cơ thủ</Text>
          </View>

          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm cơ thủ..."
          />
        </>
      }
    >
      {champion ? (
        <Pressable
          onPress={() => onPressParticipant?.(champion.participantId)}
          accessibilityRole="button"
          accessibilityLabel={`Hồ sơ ${champion.displayName}`}
          className="flex-row items-center gap-4 rounded-xl border border-gold bg-band p-4 active:bg-sunken-strong"
        >
          <PlayerAvatar name={champion.displayName} size="lg" />

          <View className="flex-1">
            <Text className="text-2xl font-display text-gold">
              {champion.rankLabel}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-base font-bold uppercase text-white">
              {champion.displayName}
            </Text>
            {champion.note ? (
              <Text className="mt-0.5 text-sm text-navy-500">{champion.note}</Text>
            ) : null}
          </View>

          <ChevronRight size={iconSize.sm} color={colors.textInverseMuted} />
        </Pressable>
      ) : null}

      {rest.length > 0 ? (
        <View className="overflow-hidden rounded-xl border border-line bg-surface">
          {rest.map((entry, index) => (
            <Pressable
              key={`${entry.participantId}-${index}`}
              onPress={() => onPressParticipant?.(entry.participantId)}
              accessibilityRole="button"
              accessibilityLabel={`Hồ sơ ${entry.displayName}`}
              className="flex-row items-center gap-3 border-b border-line-soft px-4 py-3 active:bg-sunken"
            >
              {/* Hạng đồng vị trả về dạng "#5-8" nên bề ngang để tối thiểu,
                  không cố định — xem docs/mobile/10-data-contracts.md */}
              <Text
                numberOfLines={1}
                className="min-w-[48px] text-base font-bold-italic text-muted"
              >
                {entry.rankLabel}
              </Text>

              <PlayerAvatar name={entry.displayName} />

              <View className="flex-1">
                <PlayerName name={entry.displayName} />
                {entry.note ? (
                  <Text className="mt-0.5 text-xs text-faint">{entry.note}</Text>
                ) : null}
              </View>

              <ChevronRight size={iconSize.sm} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <View className="rounded-xl border border-line bg-surface py-8">
          <Text className="text-center text-sm text-faint">
            Không tìm thấy cơ thủ.
          </Text>
        </View>
      ) : null}
    </TabScreen>
  );
}
