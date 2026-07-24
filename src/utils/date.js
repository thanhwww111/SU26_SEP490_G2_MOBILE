/** Định dạng ngày kiểu Việt Nam, dùng chung cho tin tức và lịch thi đấu. */

export const fmtDateShort = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Khoảng ngày của giải: "01/06/2026 – 05/06/2026", hoặc chỉ ngày bắt đầu nếu thiếu ngày kết thúc */
export const fmtDateRange = (startIso, endIso) => {
  const start = fmtDateShort(startIso);
  const end = fmtDateShort(endIso);
  if (start && end) return `${start} – ${end}`;
  return start || end || "—";
};
