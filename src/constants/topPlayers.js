/**
 * Top tay cơ — dữ liệu tĩnh, chép từ trang chủ FE web.
 *
 * Backend chưa có endpoint bảng xếp hạng tay cơ toàn hệ thống
 * (chỉ có /tournaments/{id}/rankings là xếp hạng trong một giải).
 * Khi BE mở endpoint thì thay file này bằng lời gọi API.
 *
 * Ảnh trỏ sang matchroompool.com nên cần mạng ngoài; component có fallback
 * khi ảnh không tải được.
 */
export const TOP_PLAYERS = [
  {
    rank: 1,
    name: "Fedor Gorst",
    country: "🇺🇸",
    image: "https://matchroompool.com/wp-content/uploads/fedor-web-scaled-1.webp",
    accent: "#facc15",
  },
  {
    rank: 2,
    name: "Carlo Biado",
    country: "🇵🇭",
    image: "https://matchroompool.com/wp-content/uploads/biado_1.webp",
    accent: "#22d3ee",
  },
  {
    rank: 3,
    name: "Aloysius Yapp",
    country: "🇸🇬",
    image: "https://matchroompool.com/wp-content/uploads/yapp-web-scaled-1.webp",
    accent: "#ef4444",
  },
  {
    rank: 4,
    name: "Johann Chua",
    country: "🇵🇭",
    image: "https://matchroompool.com/wp-content/uploads/Johann-Chua.png",
    accent: "#ec4899",
  },
  {
    rank: 5,
    name: "Eklent Kaçi",
    country: "🇦🇱",
    image: "https://matchroompool.com/wp-content/uploads/eklent-kaci_profile.webp",
    accent: "#a855f7",
  },
  {
    rank: 6,
    name: "Moritz Neuhausen",
    country: "🇩🇪",
    image: "https://matchroompool.com/wp-content/uploads/Moritz-Neuhausen-2.png",
    accent: "#22c55e",
  },
  {
    rank: 7,
    name: "Joshua Filler",
    country: "🇩🇪",
    image: "https://matchroompool.com/wp-content/uploads/Joshua-Filler-3.png",
    accent: "#f97316",
  },
  {
    rank: 8,
    name: "Ko Pin Yi",
    country: "🇹🇼",
    image: "https://matchroompool.com/wp-content/uploads/ko-pin-yi-2.png",
    accent: "#94a3b8",
  },
  {
    rank: 9,
    name: "Francisco Sánchez Ruíz",
    country: "🇪🇸",
    image:
      "https://matchroompool.com/wp-content/uploads/Francisco-Sanchez-Ruiz-2.png",
    accent: "#facc15",
  },
];
