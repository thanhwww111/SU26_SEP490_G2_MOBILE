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

/**
 * Ngày kèm giờ: "28/07/2026 14:30".
 *
 * Dùng cho mốc thời gian thao tác (ngày đăng ký, ngày thanh toán) — những chỗ
 * mà biết đúng ngày thôi là chưa đủ để phân biệt hai bản ghi trong cùng một ngày.
 * Trả null y như fmtDateShort khi thiếu hoặc không parse được.
 */
export const fmtDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * "1998-05-15" → "15/05/1998".
 *
 * Dành cho ô nhập ngày: backend trả LocalDate dạng ISO, người Việt gõ và đọc
 * theo dd/mm/yyyy. Không đi qua `new Date()` để tránh lệch một ngày do múi giờ —
 * chuỗi ISO thuần ngày bị hiểu là UTC rồi quy về giờ địa phương.
 */
export const isoToDateInput = (iso) => {
  if (!iso) return "";
  const match = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

/**
 * "15/05/1998" → "1998-05-15", hoặc null nếu không phải ngày có thật.
 *
 * Kiểm tra ngược lại bằng Date để loại 31/02: `new Date(1998, 1, 31)` tự nhảy
 * sang tháng 3, nên so lại ngày/tháng sau khi dựng là bắt được.
 */
export const dateInputToIso = (value) => {
  const match = String(value || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
};

/** Ngày nằm trong tương lai — dùng để chặn ngày sinh vô lý */
export const isFutureDate = (iso) => {
  if (!iso) return false;
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  return iso > todayIso;
};

/** Khoảng ngày của giải: "01/06/2026 – 05/06/2026", hoặc chỉ ngày bắt đầu nếu thiếu ngày kết thúc */
export const fmtDateRange = (startIso, endIso) => {
  const start = fmtDateShort(startIso);
  const end = fmtDateShort(endIso);
  if (start && end) return `${start} – ${end}`;
  return start || end || "—";
};
