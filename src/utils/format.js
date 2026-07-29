/** Định dạng số liệu hiển thị. Ngày tháng nằm ở date.js. */

/**
 * Tiền Việt: 200000 → "200.000 đ".
 *
 * Không có phí hoặc phí bằng 0 đều là "Miễn phí" — giống web. Backend trả số,
 * không phải chuỗi, nên `Number()` ở đây chỉ để phòng khi field về dạng chuỗi.
 */
export const fmtCurrency = (value) => {
  if (value == null || Number(value) === 0) return "Miễn phí";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("vi-VN")} đ`;
};

/**
 * Chữ cái đầu để làm avatar dự phòng: "Nguyễn Văn A" → "NA".
 *
 * Lấy chữ đầu của tên đầu và tên cuối, bỏ qua đệm — hai chữ là vừa khít trong
 * vòng tròn 48px, ba chữ trở lên phải thu nhỏ chữ mới đủ chỗ.
 */
export const initialsOf = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Tách tên để hiển thị kiểu WNT: phần đầu chữ thường, họ cuối IN HOA đậm.
 * "Nguyễn Văn A" → { first: "Nguyễn Văn", last: "A" }
 */
export const splitName = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] || "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
};
