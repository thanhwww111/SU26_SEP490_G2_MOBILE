/**
 * Hằng số cho bảng xếp hạng điểm tích lũy cơ thủ và hồ sơ cơ thủ công khai.
 *
 * Bám `FE/src/pages/Rankings/index.jsx`, `FE/src/pages/Home/components/Ranked.jsx`
 * và `FE/src/constants/rankingEnums.js` để hai nền tảng gửi lên backend cùng bộ
 * tham số và hiển thị cùng nhãn.
 */

/** Kỳ thống kê — `value` khớp enum `LeaderboardPeriod` của backend. */
export const PERIODS = [
  { value: "ALL", label: "Mọi thời điểm" },
  { value: "YEAR", label: "Theo năm" },
  { value: "QUARTER", label: "Theo quý" },
  { value: "MONTH", label: "Theo tháng" },
];

/**
 * Năm sớm nhất có dữ liệu giải đấu — khớp `LeaderboardPeriod.earliestSelectableYear()`
 * phía backend, web cũng cứng đúng con số này. Trước mốc đó chắc chắn chưa có
 * giải nào nên không dựng lựa chọn.
 */
export const FIRST_YEAR = 2024;

export const QUARTER_OPTIONS = [1, 2, 3, 4].map((q) => ({
  value: q,
  label: `Quý ${q}`,
}));

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));

/** Danh sách năm chọn được: từ năm hiện tại lùi dần về `FIRST_YEAR`. */
export const yearOptions = () => {
  const current = new Date().getFullYear();
  const count = Math.max(1, current - FIRST_YEAR + 1);
  return Array.from({ length: count }, (_, i) => ({
    value: current - i,
    label: `Năm ${current - i}`,
  }));
};

/** Nhãn kỳ đang xem, vd "Quý 3/2026" — đối chiếu `LeaderboardPeriod.label()`. */
export const periodLabel = ({ period, year, quarter, month }) => {
  switch (period) {
    case "YEAR":
      return `Năm ${year}`;
    case "QUARTER":
      return `Quý ${quarter}/${year}`;
    case "MONTH":
      return `Tháng ${month}/${year}`;
    default:
      return "Mọi thời điểm";
  }
};

/**
 * Quốc gia hiển thị tạm.
 *
 * `LeaderboardEntryResponse` không có trường quốc gia; web cũng cứng cờ này
 * trong `constants/rankingEnums.js`. Đây là giới hạn của schema chứ không phải
 * dữ liệu mẫu — bỏ đi thì mobile lệch web, mà bịa cờ theo tên thì sai.
 */
export const DEFAULT_COUNTRY = { flag: "🇻🇳", name: "Việt Nam" };

/**
 * Màu vạch dưới ảnh cơ thủ, xoay vòng theo thứ hạng — thuần trang trí.
 * Giá trị lấy từ `--accent-*` trong `FE/src/styles/variables.css`, đúng thứ tự
 * mảng `ACCENTS` của khối Ranked bên web.
 *
 * Đây là ngoại lệ có chủ đích với luật "toàn app chỉ một màu accent"
 * (01-design-system.md, Phần 2): khối Top tay cơ của web vốn nhiều màu, và
 * trước đây mobile cũng đã nhiều màu qua trường `accent` của `topPlayers.js`
 * (file đó đã bị xoá khi khối này chuyển sang gọi API). Chỉ dùng cho đúng khối
 * Top tay cơ, không mở rộng sang chỗ khác.
 */
export const RANK_ACCENTS = [
  "#F4B400",
  "#22D3EE",
  "#EF4444",
  "#EC4899",
  "#A855F7",
  "#22C55E",
  "#F97316",
  "#525252",
];

export const accentOfRank = (index) =>
  RANK_ACCENTS[index % RANK_ACCENTS.length];

/**
 * Nhãn hạng trong lịch sử thành tích — chép từ `RANKING_NOTE_LABELS` của
 * `FE/src/constants/tournamentConfig.js`.
 */
export const RANKING_NOTE_LABELS = {
  CHAMPION: "Vô địch",
  RUNNER_UP: "Á quân",
  THIRD_PLACE: "Hạng 3",
  FOURTH_PLACE: "Hạng 4",
  SEMI_FINAL: "Bán kết",
  GROUP_LEADER: "Dẫn đầu bảng",
};

/**
 * Bản ghi cũ lưu sẵn text tiếng Việt trước khi backend đổi sang `name()`, nên
 * key lạ thì hiển thị nguyên văn thay vì để trống.
 */
export const rankingNoteLabel = (note) =>
  note ? (RANKING_NOTE_LABELS[note] ?? note) : "";

/**
 * Màu huy chương ba hạng đầu, bám `RANK_MEDAL` của web.
 *
 * Vàng khớp token `gold`; bạc và đồng chưa có token tương ứng nên để hex ở đây.
 * Cùng dạng nợ kỹ thuật với màu badge trong `constants/tournament.js` — khi nào
 * bổ sung token cho podium thì dọn cả hai chỗ.
 */
export const MEDAL_COLORS = {
  1: "#C9A227",
  2: "#94A3B8",
  3: "#CD7F32",
};
