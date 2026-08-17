/**
 * Phân loại, sắp xếp và lọc trận cho màn trọng tài.
 *
 * Port `FE/src/utils/refereeMatch.js`. Giữ nguyên tên hàm và thứ tự phân loại để hai bản khách
 * không bao giờ xếp cùng một danh sách ra hai kiểu khác nhau.
 *
 * Khác bản web đúng một chỗ: `toRefereeDisplayStatus` không trả về class Tailwind. Web nhét sẵn
 * `badgeClass` với `bg-emerald-500/15 ring-emerald-500/30` — mobile không có `ring-*`, và màu
 * phải đi qua token vai trò, nên phần hình thức để component tự lo, ở đây chỉ trả `key` + `label`.
 */

const FINISHED = new Set(["COMPLETED", "WALKOVER", "BYE"]);

const STATUS_RANK = {
  IN_PROGRESS: 0,
  PENDING: 1,
  COMPLETED: 2,
  WALKOVER: 2,
  BYE: 3,
};

export function isMatchPending(status) {
  return status === "PENDING";
}

export function isMatchLive(status) {
  return status === "IN_PROGRESS";
}

export function isMatchFinished(status) {
  return FINISHED.has(status);
}

/** @returns {{ key: "LIVE"|"READY"|"FINISHED"|string, label: string }} */
export function toRefereeDisplayStatus(status) {
  if (isMatchLive(status)) return { key: "LIVE", label: "Đang đấu" };
  if (isMatchPending(status)) return { key: "READY", label: "Sắp tới" };
  if (isMatchFinished(status)) return { key: "FINISHED", label: "Đã xong" };
  return { key: status || "UNKNOWN", label: status || "—" };
}

export function getPlayerName(player, fallback = "Chưa xác định") {
  return player?.displayName?.trim() || fallback;
}

export function getTournamentName(match) {
  return match?.tournamentName?.trim() || "Giải đấu";
}

function scheduledMs(match) {
  if (!match?.scheduledAt) return Number.POSITIVE_INFINITY;
  const t = new Date(match.scheduledAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Đang đấu trước → sắp tới theo giờ tăng dần → đã xong; cùng nhóm thì xếp theo số bàn. */
export function sortRefereeMatches(matches) {
  return [...(matches || [])].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 9;
    const rb = STATUS_RANK[b.status] ?? 9;
    if (ra !== rb) return ra - rb;

    if (a.status === "PENDING" && b.status === "PENDING") {
      const sa = scheduledMs(a);
      const sb = scheduledMs(b);
      if (sa !== sb) return sa - sb;
    }

    const ta = a.tableNo ?? 9999;
    const tb = b.tableNo ?? 9999;
    if (ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

/**
 * Nhóm theo trạng thái hiển thị.
 * @returns {{ live: any[], upcoming: any[], finished: any[] }}
 */
export function groupRefereeMatches(matches) {
  const sorted = sortRefereeMatches(matches);
  const live = [];
  const upcoming = [];
  const finished = [];

  for (const m of sorted) {
    if (isMatchLive(m.status)) live.push(m);
    else if (isMatchFinished(m.status)) finished.push(m);
    else upcoming.push(m);
  }

  return { live, upcoming, finished };
}

export function uniqueTournaments(matches) {
  const map = new Map();
  for (const m of matches || []) {
    if (m.tournamentId == null) continue;
    if (!map.has(m.tournamentId)) map.set(m.tournamentId, getTournamentName(m));
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function countDistinctTournaments(matches) {
  return uniqueTournaments(matches).length;
}

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** @param {"all"|"today"|"tomorrow"} dayFilter */
export function filterMatchesByDay(matches, dayFilter) {
  if (!dayFilter || dayFilter === "all") return matches || [];

  const today = startOfLocalDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (matches || []).filter((m) => {
    // Trận đang đấu luôn thuộc "hôm nay" dù lịch ghi ngày nào — nó đang diễn ra trước mắt
    if (isMatchLive(m.status) && dayFilter === "today") return true;
    if (!m.scheduledAt) return dayFilter === "today";

    const d = new Date(m.scheduledAt);
    if (Number.isNaN(d.getTime())) return false;
    if (dayFilter === "today") return isSameLocalDay(d, today);
    if (dayFilter === "tomorrow") return isSameLocalDay(d, tomorrow);
    return true;
  });
}

/** Nhãn giờ cho badge "Sắp tới". */
export function formatMatchScheduleLabel(scheduledAt, now = new Date()) {
  if (!scheduledAt) return "Chưa xếp giờ";
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return "Chưa xếp giờ";

  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const diffDays = Math.round((startOfLocalDay(d) - startOfLocalDay(now)) / 86400000);
  if (diffDays === 0) return `Hôm nay ${time}`;
  if (diffDays === 1) return `Ngày mai ${time}`;
  if (diffDays === -1) return `Hôm qua ${time}`;

  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return `${date} ${time}`;
}

/** Đã tới giờ đánh: không có lịch, hoặc lịch đã qua. */
export function isMatchDue(match, now = new Date()) {
  if (!isMatchPending(match?.status)) return false;
  if (!match.scheduledAt) return true;
  const t = new Date(match.scheduledAt).getTime();
  if (Number.isNaN(t)) return true;
  return t <= now.getTime();
}

/** Người thắng suy từ tỷ số; hoà thì trả null để trọng tài tự chọn. */
export function pickDefaultWinnerId(match, score1, score2) {
  if (!match) return null;
  if (score1 > score2 && match.player1?.id) return match.player1.id;
  if (score2 > score1 && match.player2?.id) return match.player2.id;
  return null;
}
