/** Nhãn và màu badge trạng thái giải đấu — lấy từ trang /event của FE web. */
export const TOURNAMENT_STATUS_BADGE = {
  OPEN_FOR_REGISTRATION: { label: "Mở đăng ký", bg: "#16a34a" },
  REGISTRATION_CLOSED: { label: "Đóng đăng ký", bg: "#1e293b" },
  DRAW_DONE: { label: "Đã bốc thăm", bg: "#7c3aed" },
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
