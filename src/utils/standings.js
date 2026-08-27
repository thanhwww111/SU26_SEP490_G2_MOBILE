/**
 * Bảng điểm vòng tròn — tính từ danh sách trận, không gọi API riêng.
 *
 * Port từ `computeStandings` và `mergedStanding` trong
 * `FE/src/pages/Event/MatchesTab.jsx`. Backend có sẵn endpoint
 * `/stage-standings` nhưng chỉ mở cho Owner/Manager; phía công khai web tự tính
 * từ `/stages`, mobile làm y hệt.
 *
 * ⚠️ Thứ tự phân định PHẢI khớp `BracketGenerationServiceImpl.computeStageStandings()`
 * của backend, vì backend dùng chính thứ tự đó để loại người sau mỗi giai đoạn.
 * Lệch nhau thì khán giả thấy một bảng còn hệ thống loại người theo bảng khác.
 */

/** Trận đã có kết quả để cộng vào bảng điểm. BYE không tính: không ai đánh ván nào. */
const isCounted = (match) =>
  match?.status === "COMPLETED" || match?.status === "WALKOVER";

/**
 * Suy ra id người thắng. Backend không phải lúc nào cũng gửi `winner`, nên
 * thiếu thì so tỷ số — hoà thì trả null (vòng tròn bi-a không có trận hoà, chỉ
 * xảy ra khi dữ liệu chưa đủ).
 */
const winnerIdOf = (match) => {
  if (match?.winner?.id) return match.winner.id;

  const s1 = match?.player1Score ?? 0;
  const s2 = match?.player2Score ?? 0;
  if (s1 > s2) return match?.player1?.id ?? null;
  if (s2 > s1) return match?.player2?.id ?? null;
  return null;
};

/** Số trận thắng khi CHỈ tính các trận giữa những người trong nhóm đang hoà */
const headToHeadWins = (matches, groupIds) => {
  const wins = {};
  groupIds.forEach((id) => {
    wins[id] = 0;
  });

  matches.forEach((match) => {
    if (!isCounted(match)) return;

    const id1 = match.player1?.id;
    const id2 = match.player2?.id;
    // Chỉ xét trận mà cả hai bên đều nằm trong nhóm hoà
    if (!(id1 in wins) || !(id2 in wins)) return;

    const winId = winnerIdOf(match);
    if (winId != null && winId in wins) wins[winId] += 1;
  });

  return wins;
};

/**
 * Tính bảng điểm cho một giai đoạn vòng tròn.
 *
 * Thứ tự phân định:
 *   1. Số trận thắng
 *   2. Hiệu số ván
 *   3. Đối đầu trực tiếp giữa những người còn hoà
 *   4. Tổng số ván thắng
 *   5. Tên A→Z (backend chốt bằng hạt giống → id; hai trường đó không có trong
 *      `MatchResponse` nên ở đây chốt bằng tên, giống web)
 *
 * @returns {Array} `[{ id, name, played, wins, losses, framesWon, framesLost, frameDiff, rank }]`
 */
export const computeStandings = (matches) => {
  const list = matches ?? [];
  const table = new Map();

  const ensure = (player) => {
    if (!player?.id) return null;
    if (!table.has(player.id)) {
      table.set(player.id, {
        id: player.id,
        name: player.displayName || "—",
        played: 0,
        wins: 0,
        losses: 0,
        framesWon: 0,
        framesLost: 0,
      });
    }
    return table.get(player.id);
  };

  // Lượt 1: đưa TẤT CẢ cơ thủ vào bảng, kể cả người chưa đá trận nào — bảng
  // phải đủ người ngay từ lúc mới bốc thăm xong
  list.forEach((match) => {
    ensure(match.player1);
    ensure(match.player2);
  });

  // Lượt 2: cộng dồn kết quả các trận đã xong
  list.forEach((match) => {
    if (!isCounted(match)) return;

    const a = ensure(match.player1);
    const b = ensure(match.player2);
    if (!a || !b) return;

    const s1 = match.player1Score ?? 0;
    const s2 = match.player2Score ?? 0;

    a.played += 1;
    b.played += 1;
    a.framesWon += s1;
    a.framesLost += s2;
    b.framesWon += s2;
    b.framesLost += s1;

    const winId = winnerIdOf(match);
    if (winId === a.id) {
      a.wins += 1;
      b.losses += 1;
    } else if (winId === b.id) {
      b.wins += 1;
      a.losses += 1;
    }
  });

  const rows = [...table.values()].map((row) => ({
    ...row,
    frameDiff: row.framesWon - row.framesLost,
  }));

  // Bậc 1–2
  rows.sort((x, y) => y.wins - x.wins || y.frameDiff - x.frameDiff);

  // Bậc 3–5: chỉ xét trong từng nhóm còn hoà (cùng số thắng và cùng hiệu số)
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (
      j < rows.length &&
      rows[j].wins === rows[i].wins &&
      rows[j].frameDiff === rows[i].frameDiff
    ) {
      j += 1;
    }

    if (j - i > 1) {
      const group = rows.slice(i, j);
      const h2h = headToHeadWins(list, group.map((r) => r.id));

      group.sort(
        (x, y) =>
          (h2h[y.id] || 0) - (h2h[x.id] || 0) ||
          y.framesWon - x.framesWon ||
          (x.name || "").localeCompare(y.name || "")
      );

      rows.splice(i, j - i, ...group);
    }

    i = j;
  }

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

/** Giai đoạn tính điểm theo thể lệ vòng tròn */
const LEAGUE_STAGE_TYPES = ["PROGRESSIVE_ROUND", "GROUP"];

/** Giai đoạn loại trực tiếp diễn ra sau vòng tròn */
const PLAYOFF_STAGE_TYPES = ["PROGRESSIVE_PLAYOFF", "PLAYOFF"];

const playerIdsOf = (matches) =>
  new Set(
    (matches ?? [])
      .flatMap((m) => [m.player1?.id, m.player2?.id])
      .filter(Boolean)
  );

/**
 * Bảng điểm GỘP cho cả giải — một bảng duy nhất, không tách theo giai đoạn.
 *
 * Người trụ lại tới giai đoạn muộn hơn thì xếp trên. Ai không có mặt ở bước kế
 * tiếp (giai đoạn sau, hoặc Playoff khi đã điền người) thì `eliminated: true`
 * để giao diện làm mờ và gắn nhãn "Bị loại".
 *
 * Duyệt các giai đoạn vòng tròn từ CUỐI về ĐẦU: người xuất hiện ở giai đoạn
 * muộn nhất được xếp trước, và mỗi người chỉ lấy thành tích ở giai đoạn xa nhất
 * họ đi được.
 *
 * @param {Array} stages — `StageWithMatchesResponse[]` từ `/tournaments/{id}/stages`
 * @returns {Array} rows đã đánh `rank` liên tục toàn giải
 */
export const buildMergedStanding = (stages) => {
  const all = stages ?? [];

  const league = all
    .filter((s) => LEAGUE_STAGE_TYPES.includes(s.stageType))
    .slice()
    .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));

  if (league.length === 0) return [];

  const playoffStage = all.find((s) => PLAYOFF_STAGE_TYPES.includes(s.stageType));
  const playoffPlayerIds = playerIdsOf(playoffStage?.matches);
  // Playoff chỉ dùng làm mốc cắt SAU khi bước "chuyển giai đoạn" đã điền người
  const playoffFilled = playoffPlayerIds.size > 0;

  const perStage = league.map((stage) => ({
    standings: computeStandings(stage.matches ?? []),
    playerIds: playerIdsOf(stage.matches),
  }));

  const rows = [];
  const seen = new Set();

  for (let i = perStage.length - 1; i >= 0; i -= 1) {
    // Tập người còn trụ lại ở bước ngay sau giai đoạn này
    let nextPlayerIds = null;
    if (i < perStage.length - 1) {
      // Giai đoạn kế có thể đã được tạo sẵn nhưng chưa gán cơ thủ (đang chờ
      // giai đoạn này đá xong) — tập rỗng đó KHÔNG phải mốc cắt, coi như chưa có
      const next = perStage[i + 1].playerIds;
      if (next.size > 0) nextPlayerIds = next;
    } else if (playoffFilled) {
      nextPlayerIds = playoffPlayerIds;
    }

    perStage[i].standings.forEach((row) => {
      if (seen.has(row.id)) return;
      seen.add(row.id);
      rows.push({
        ...row,
        eliminated: nextPlayerIds != null && !nextPlayerIds.has(row.id),
      });
    });
  }

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
};

/**
 * Suy thể thức giải từ các giai đoạn, đủ để biết tab Trận đấu cần bày gì.
 *
 * Mobile không dựng sơ đồ bracket nên chỉ cần phân biệt "có bảng điểm" hay
 * không — gọn hơn `detectFormatFromStages` bên web, vốn còn phải chọn kiểu
 * bracket để vẽ.
 */
export const hasLeagueStage = (stages) =>
  (stages ?? []).some((s) => LEAGUE_STAGE_TYPES.includes(s.stageType));
