import { Newspaper, Trophy, MapPin, BarChart3 } from "lucide-react-native";

/**
 * Mục điều hướng của drawer — đúng NAV_ITEMS của Header web, kể cả thứ tự.
 * Trang chủ không nằm ở đây: bên web về trang chủ bằng cách bấm logo, mobile
 * cũng vậy (logo giữa AppHeader).
 *
 * `key` PHẢI trùng segment cuối của route: `app/(app)/_layout.jsx` lấy segment
 * đó làm `activeKey` để tô mục đang mở.
 *
 * Danh sách này cũng là nguồn cho các link ở AppFooter — thêm màn mới ở đây là
 * cả drawer lẫn footer có luôn, không phải sửa hai nơi.
 *
 * Trước 2026-08-06 còn hai mục nữa: "Tỷ Số Trực Tiếp" và "Cơ Thủ", để `path:
 * null` và làm mờ trong drawer. Web đã bỏ cả hai khỏi thanh điều hướng (xem
 * `FE/src/components/layouts/Header.jsx`), nên mobile bỏ theo cho khớp.
 *
 * Nếu sau này lại có mục chưa dựng màn: `path: null` vẫn được `AppDrawer` xử lý
 * — hiện mờ và bấm không ăn. Bỏ hẳn thì người dùng không biết app sẽ có gì, mà
 * cho bấm thì expo-router văng lỗi không tìm thấy route.
 */
export const NAV_ITEMS = [
  { key: "news", label: "Tin Mới Nhất", path: "/(app)/news", Icon: Newspaper },
  { key: "event", label: "Giải Đấu", path: "/(app)/event", Icon: Trophy },
  { key: "branches", label: "Cơ Sở", path: "/(app)/branches", Icon: MapPin },
  { key: "rankings", label: "Bảng Xếp Hạng", path: "/(app)/rankings", Icon: BarChart3 },
];
