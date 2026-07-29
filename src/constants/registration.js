/**
 * Nhãn và màu badge trạng thái đăng ký giải đấu.
 *
 * Nhãn lấy từ displayName của enums/RegistrationStatus.java bên backend, không
 * tự dịch lại. Riêng REJECTED: FE web đặt "Không được tham gia" ở badge nhưng
 * "Không được tham dự" ở dòng chú thích ngay dưới — web tự lệch với chính nó,
 * nên ở đây thống nhất theo backend.
 *
 * Khác constants/tournament.js: file này trả về class Tailwind chứ không trả hex,
 * để không lặp lại phần nợ kỹ thuật đã ghi trong docs/mobile/08-reusable-patterns.md.
 * Thang màu bám đúng STATUS_STYLES của MyRegistrationsPage.jsx bên web.
 */
export const REGISTRATION_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  APPROVED: "Tham gia chính thức",
  REJECTED: "Không được tham dự",
  CANCELLED: "Đã hủy",
};

const STATUS_BADGE = {
  PENDING_PAYMENT: { chip: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500", bar: "bg-amber-500" },
  PAID: { chip: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500", bar: "bg-blue-500" },
  APPROVED: { chip: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  REJECTED: { chip: "bg-red-100", text: "text-red-700", dot: "bg-red-500", bar: "bg-red-500" },
  CANCELLED: { chip: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400", bar: "bg-slate-400" },
};

/**
 * Trạng thái lạ (backend thêm mã mới) rơi về kiểu CANCELLED xám và hiện mã thô,
 * giống cách web fallback — thà hiện mã còn hơn để trống một ô không màu.
 */
export const getRegistrationBadge = (status) => ({
  label: REGISTRATION_STATUS_LABELS[status] || status || "—",
  ...(STATUS_BADGE[status] || STATUS_BADGE.CANCELLED),
});

/** Chỉ đăng ký còn chờ thanh toán mới huỷ được — khớp điều kiện hiện nút của web */
export const canCancelRegistration = (status) => status === "PENDING_PAYMENT";
