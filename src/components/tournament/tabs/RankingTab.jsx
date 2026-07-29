import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import PlayerAvatar from "../PlayerAvatar";
import PlayerName from "../PlayerName";
import SearchField from "../../SearchField";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";

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
 */
export default function RankingTab({ tournamentId }) {
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
      <SectionState
        loading={loading}
        error={error}
        emptyMessage="Chưa có kết quả xếp hạng."
      />
    );
  }

  // Vô địch tách riêng thành khối nổi bật như web; sortOrder 1 là hạng cao nhất
  const champion = filtered.find((e) => e.sortOrder === 1);
  const rest = champion
    ? filtered.filter((e) => e.participantId !== champion.participantId)
    : filtered;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View
          className={`rounded-full border px-3 py-1 ${
            isOfficial
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
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

        <Text className="text-xs text-slate-400">{filtered.length} cơ thủ</Text>
      </View>

      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm cơ thủ..."
      />

      {champion ? (
        <View className="flex-row items-center gap-4 rounded-xl border border-gold bg-navy-900 p-4">
          <PlayerAvatar name={champion.displayName} size="lg" />

          <View className="flex-1">
            <Text className="text-2xl font-black italic text-gold">
              {champion.rankLabel}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-base font-bold uppercase text-white">
              {champion.displayName}
            </Text>
            {champion.note ? (
              <Text className="mt-0.5 text-sm text-navy-500">{champion.note}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {rest.length > 0 ? (
        <View className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {rest.map((entry, index) => (
            <View
              key={`${entry.participantId}-${index}`}
              className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3"
            >
              <Text className="w-14 text-base font-bold italic text-slate-500">
                {entry.rankLabel}
              </Text>

              <PlayerAvatar name={entry.displayName} />

              <View className="flex-1">
                <PlayerName name={entry.displayName} />
                {entry.note ? (
                  <Text className="mt-0.5 text-xs text-slate-400">{entry.note}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <View className="rounded-xl border border-slate-200 bg-white py-8">
          <Text className="text-center text-sm text-slate-400">
            Không tìm thấy cơ thủ.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
