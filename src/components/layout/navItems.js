import {
  Home,
  Newspaper,
  Radio,
  Trophy,
  MapPin,
  BarChart3,
  Users,
  User,
} from "lucide-react-native";

/**
 * Mục điều hướng, khai theo NAV_ITEMS của Header web.
 *
 * `ready: false` = màn chưa làm trên mobile. Drawer chỉ render mục ready,
 * nên khi thêm màn mới chỉ cần bật cờ ở đây, không phải sửa AppDrawer.
 *
 * Lưu ý: chính web cũng để path null cho Tỷ số trực tiếp, Bảng xếp hạng và Cơ thủ.
 */
export const NAV_ITEMS = [
  { key: "home", label: "Trang chủ", path: "/(app)/home", Icon: Home, ready: true },
  { key: "profile", label: "Hồ sơ", path: "/(app)/profile", Icon: User, ready: true },
  { key: "news", label: "Tin mới nhất", path: "/(app)/news", Icon: Newspaper, ready: false },
  { key: "live", label: "Tỷ số trực tiếp", path: null, Icon: Radio, ready: false },
  { key: "event", label: "Giải đấu", path: "/(app)/event", Icon: Trophy, ready: false },
  { key: "branches", label: "Cơ sở", path: "/(app)/branches", Icon: MapPin, ready: false },
  { key: "ranking", label: "Bảng xếp hạng", path: null, Icon: BarChart3, ready: false },
  { key: "players", label: "Cơ thủ", path: null, Icon: Users, ready: false },
];

export const READY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.ready);
