/**
 * Nhãn và màu badge trạng thái giải đấu — lấy từ trang /event của FE web.
 *
 * Phải phủ **đủ** TournamentStatus của backend: thiếu key nào thì giải ở trạng
 * thái đó rơi vào nhánh dự phòng của `getTournamentBadge` và in thẳng tên enum
 * ra màn hình (đã từng xảy ra với DRAW_PREVIEW ở màn chủ).
 *
 * Nền đặc + chữ trắng nên dùng tông đậm hơn chấm màu bên web một bậc.
 */
export const TOURNAMENT_STATUS_BADGE = {
  DRAFT: { label: "Nháp", bg: "#475569" },
  OPEN_FOR_REGISTRATION: { label: "Mở đăng ký", bg: "#16a34a" },
  REGISTRATION_CLOSED: { label: "Đóng đăng ký", bg: "#1e293b" },
  DRAW_PREVIEW: { label: "Xem trước bốc thăm", bg: "#ca8a04" },
  DRAW_DONE: { label: "Đã bốc thăm", bg: "#7c3aed" },
  FINAL_BRACKET_READY: { label: "Sẵn sàng chung kết", bg: "#0891b2" },
  IN_PROGRESS: { label: "Đang diễn ra", bg: "#ef342a" },
  COMPLETED: { label: "Kết quả", bg: "#0f172a" },
  CANCELLED: { label: "Đã hủy", bg: "#64748b" },
};

const FULL_BADGE = { label: "Hết slot", bg: "#dc2626" };

const isFull = (t) =>
  t?.approvedCount != null &&
  t?.maxParticipants > 0 &&
  t.approvedCount >= t.maxParticipants;

/** Giải còn mở đăng ký nhưng đã kín chỗ thì báo "Hết slot" thay vì "Mở đăng ký" */
export const getTournamentBadge = (tournament) => {
  if (tournament?.status === "OPEN_FOR_REGISTRATION" && isFull(tournament))
    return FULL_BADGE;

  return (
    TOURNAMENT_STATUS_BADGE[tournament?.status] || {
      label: tournament?.status || "—",
      bg: "#64748b",
    }
  );
};

/**
 * Chip lọc trạng thái ở đầu màn danh sách — đúng 5 mục và đúng thứ tự của
 * TIME_FILTERS trong pages/Event/index.jsx bên web.
 *
 * `value` rỗng nghĩa là không gửi tham số `status` lên backend.
 */
export const TOURNAMENT_STATUS_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "OPEN_FOR_REGISTRATION", label: "Mở đăng ký" },
  { value: "REGISTRATION_CLOSED", label: "Đóng đăng ký" },
  { value: "IN_PROGRESS", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

/** ParticipantType → nhãn tiếng Việt (đơn / đôi / đội) */
export const participantTypeLabel = (type) =>
  ({ SINGLE: "Đơn", DOUBLE: "Đôi", TEAM: "Đội" })[type] || type || "—";

/**
 * MatchStatus của backend gom về ba nhóm mà giao diện quan tâm.
 *
 * `BYE` và `WALKOVER` tính là đã có kết quả (backend: isResolved()), nên xếp
 * chung nhóm "done" — người xem chỉ cần biết trận đã xong hay chưa.
 */
export const getMatchState = (status) => {
  if (status === "IN_PROGRESS") return "live";
  if (status === "COMPLETED" || status === "WALKOVER" || status === "BYE")
    return "done";
  return "upcoming";
};

/**
 * Suy ra bên thắng: 1 nếu player1 thắng, 2 nếu player2 thắng, null nếu chưa rõ.
 *
 * Backend không phải lúc nào cũng gửi `winner` cho trận đã xong, nên khi thiếu
 * thì so tỷ số — web cũng làm đúng vậy trong apiMatchToComp.
 */
export const getWinnerSide = (match) => {
  if (match?.winner) return match.player1?.id === match.winner.id ? 1 : 2;

  const done = getMatchState(match?.status) === "done";
  const { player1Score: s1, player2Score: s2 } = match || {};
  if (done && s1 != null && s2 != null && s1 !== s2) return s1 > s2 ? 1 : 2;

  return null;
};

/**
 * Đặt tên vòng đấu từ số vòng.
 *
 * Chỉ nhánh loại trực tiếp mới có tứ/bán/chung kết — tính ngược từ vòng cuối.
 * Vòng bảng và vòng tròn loại dần thì chỉ "Vòng N", vì ở đó vòng cuối không
 * phải trận chung kết.
 */
const LEAGUE_STAGE_TYPES = ["GROUP", "PROGRESSIVE_ROUND"];

export const getRoundLabel = (roundNo, indexFromEnd, stageType) => {
  if (LEAGUE_STAGE_TYPES.includes(stageType)) return `Vòng ${roundNo}`;
  if (indexFromEnd === 0) return "Chung kết";
  if (indexFromEnd === 1) return "Bán kết";
  if (indexFromEnd === 2) return "Tứ kết";
  return `Vòng ${roundNo}`;
};

/** Tiền tố nhánh của thể thức loại trực tiếp kép */
export const getBracketPrefix = (stageType) =>
  ({ WINNERS: "WB ", LOSERS: "LB ", GRAND_FINAL: "" })[stageType] || "";
