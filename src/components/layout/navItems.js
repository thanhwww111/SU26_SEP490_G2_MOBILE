import { Newspaper, Radio, Trophy, MapPin, BarChart3, Users } from "lucide-react-native";

/**
 * Mục điều hướng của drawer — đúng 6 mục trong NAV_ITEMS của Header web,
 * kể cả thứ tự. Trang chủ không nằm ở đây: bên web về trang chủ bằng cách bấm
 * logo, mobile cũng vậy (logo giữa AppHeader).
 *
 * `path: null` = màn chưa dựng trên mobile. Bên web ba mục cũng để null; ở đây
 * còn nhiều hơn vì mobile mới có home với profile. Mục null vẫn hiện trong
 * drawer nhưng làm mờ và bấm không ăn — bỏ hẳn thì người dùng không thấy được
 * app sẽ có những gì, mà cho bấm thì expo-router văng lỗi không tìm thấy route.
 *
 * Khi thêm màn mới: dựng file trong app/(app)/ rồi điền path vào đây là xong.
 */
export const NAV_ITEMS = [
  { key: "news", label: "Tin Mới Nhất", path: "/(app)/news", Icon: Newspaper },
  { key: "live", label: "Tỷ Số Trực Tiếp", path: null, Icon: Radio },
  { key: "event", label: "Giải Đấu", path: "/(app)/event", Icon: Trophy },
  { key: "branches", label: "Cơ Sở", path: "/(app)/branches", Icon: MapPin },
  { key: "ranking", label: "Bảng Xếp Hạng", path: null, Icon: BarChart3 },
  { key: "players", label: "Cơ Thủ", path: null, Icon: Users },
];
