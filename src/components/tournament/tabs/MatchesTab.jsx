import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import MatchRow from "../MatchRow";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";
import { getBracketPrefix, getRoundLabel } from "../../../constants/tournament";

/**
 * Gom danh sách trận phẳng thành từng vòng đấu.
 *
 * Web đọc `/stages` (mỗi stage có mảng matches lồng bên trong); ở đây dùng
 * `/matches` vì tab Trực tiếp cũng cần đúng endpoint đó — một nguồn dữ liệu cho
 * hai tab thì ít chỗ sai hơn. Mỗi `MatchResponse` đã mang sẵn stageId,
 * stageType và roundNo nên gom lại được y hệt.
 *
 * Thứ tự: theo stage (id tăng dần, khớp thứ tự backend tạo), trong stage thì
 * theo roundNo, trong vòng thì theo positionNo.
 */
const groupIntoRounds = (matches) => {
  const byStage = new Map();

  matches.forEach((match) => {
    const stageId = match.stageId ?? 0;
    if (!byStage.has(stageId)) byStage.set(stageId, []);
    byStage.get(stageId).push(match);
  });

  const rounds = [];

  [...byStage.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([stageId, stageMatches]) => {
      const stageType = stageMatches[0]?.stageType;
      const roundNos = [...new Set(stageMatches.map((m) => m.roundNo))].sort(
        (a, b) => a - b
      );

      roundNos.forEach((roundNo, index) => {
        const items = stageMatches
          .filter((m) => m.roundNo === roundNo)
          .sort((a, b) => (a.positionNo ?? 0) - (b.positionNo ?? 0));

        rounds.push({
          key: `${stageId}-${roundNo}`,
          label:
            getBracketPrefix(stageType) +
            getRoundLabel(roundNo, roundNos.length - 1 - index, stageType),
          raceTo: items.find((m) => m.raceTo != null)?.raceTo ?? null,
          matches: items,
        });
      });
    });

  return rounds;
};

/**
 * Tab Trận đấu — lịch và kết quả, nhóm theo vòng.
 *
 * Web có thêm chế độ xem sơ đồ bracket (SVG, zoom, kéo thả) và bảng điểm vòng
 * tròn. Mobile chỉ dựng danh sách: sơ đồ bracket cần màn rộng, đúng như
 * docs/mobile/07-web-mapping.md đã chốt.
 */
export default function MatchesTab({ tournamentId, locked }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(!locked);
  const [error, setError] = useState("");

  useEffect(() => {
    // Giải chưa bốc thăm thì backend chưa có trận nào — khỏi gọi cho tốn request
    if (locked) return undefined;

    let alive = true;

    (async () => {
      try {
        const data = await publicTournamentApi.getPublicMatches(tournamentId);
        if (alive) setMatches(data);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId, locked]);

  const rounds = useMemo(() => groupIntoRounds(matches), [matches]);

  if (locked) {
    return (
      <SectionState emptyMessage="Lịch thi đấu chưa được xếp — giải vẫn đang mở đăng ký." />
    );
  }

  if (loading || error || rounds.length === 0) {
    return (
      <SectionState
        loading={loading}
        error={error}
        emptyMessage="Chưa có trận đấu nào."
      />
    );
  }

  return (
    <View className="gap-4">
      {rounds.map((round) => (
        <View
          key={round.key}
          className="overflow-hidden rounded-xl border border-line bg-surface"
        >
          {/* Web tô gradient đỏ cho thanh tiêu đề vòng; RN chưa có thư viện
              gradient trong project nên dùng nền navy đặc như các khối tối khác */}
          <View className="flex-row items-center justify-between bg-navy-900 px-4 py-2.5">
            <Text className="text-sm font-semibold text-white">{round.label}</Text>
            {round.raceTo != null ? (
              <Text className="text-xs text-navy-500">Race to {round.raceTo}</Text>
            ) : null}
          </View>

          {round.matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </View>
      ))}
    </View>
  );
}
