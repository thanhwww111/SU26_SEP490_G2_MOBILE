import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { NAV_ITEMS } from "./navItems";
import { Facebook, Instagram, Youtube } from "../icons/BrandIcons";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Mạng xã hội của dự án.
 *
 * `url` rỗng = chưa có trang → nút không được dựng. Cố ý không hiện icon xám
 * bấm không ăn: đó đúng là thứ vừa bị gỡ khỏi footer và khỏi drawer.
 *
 * ĐIỀN THÊM: dán URL vào ô `url` tương ứng là nút tự hiện, không phải sửa gì
 * bên dưới. Muốn thêm mạng khác (TikTok, Threads...) thì vẽ icon vào
 * `src/components/icons/BrandIcons.jsx` trước — lucide-react-native đã bỏ hẳn
 * nhóm icon thương hiệu nên không import từ đó được.
 *
 * Facebook lấy từ footer của FE web (`components/layouts/Footer.jsx`).
 */
const SOCIAL_LINKS = [
  {
    key: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/profile.php?id=61591577595713",
    Icon: Facebook,
  },
  { key: "instagram", label: "Instagram", url: "", Icon: Instagram },
  { key: "youtube", label: "YouTube", url: "", Icon: Youtube },
];

/** Mở link ngoài. Nuốt lỗi như `BranchDetail`: máy không có trình duyệt mặc
 *  định thì cũng không có gì để báo cho người dùng làm tiếp. */
const openLink = (url) => Linking.openURL(url).catch(() => {});

/**
 * Chân trang.
 *
 * Trước 2026-08-06 khối này chép nguyên footer của web: 16 link `href="/"`,
 * địa chỉ và dòng bản quyền của Matchroom Multi Sport Ltd, cụm "CAPS.tv" và ba
 * icon mạng xã hội không trỏ đâu cả. Toàn bộ là chỗ giữ chỗ lấy từ nguyên mẫu,
 * không phải thông tin của dự án — để lại thì bàn giao xong vẫn còn tên một
 * công ty khác nằm dưới mọi màn hình.
 *
 * Nay chỉ giữ những gì có thật: liên kết tới các màn đã dựng, mạng xã hội đã
 * có trang, và một dòng bản quyền của chính dự án. Chưa dựng địa chỉ hay điện
 * thoại — nhóm chưa chốt thông tin thật, mà bịa thì tệ hơn để trống.
 *
 * Hai danh sách đều tự lọc theo dữ liệu: link điều hướng đọc từ `NAV_ITEMS`
 * (cùng nguồn với drawer, bỏ mục chưa có màn), nút mạng xã hội đọc từ
 * `SOCIAL_LINKS` (bỏ mục chưa có URL). Điền dữ liệu vào là footer có thêm mục,
 * không phải sửa phần dựng giao diện bên dưới.
 */
export default function AppFooter() {
  const router = useRouter();
  const colors = useThemeColors();

  const links = NAV_ITEMS.filter((item) => item.path);
  const socials = SOCIAL_LINKS.filter((item) => item.url);

  return (
    <View className="bg-sunken-strong px-6 pb-10 pt-10">
      <View className="flex-row flex-wrap gap-x-6 gap-y-3 border-b border-black/10 pb-8">
        {links.map(({ key, label, path }) => (
          <Pressable
            key={key}
            onPress={() => router.push(path)}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="link"
          >
            <Text className="text-sm text-content-2">{label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="pt-8">
        <Pressable
          onPress={() => router.push("/(app)/home")}
          accessibilityRole="link"
          accessibilityLabel="Về trang chủ"
          className="self-start active:opacity-60"
        >
          <Text className="text-5xl font-display leading-none tracking-tight text-content">
            btms<Text className="text-accent">.</Text>
          </Text>
        </Pressable>

        {socials.length > 0 ? (
          <View className="mt-5 flex-row items-center gap-4">
            {socials.map(({ key, label, url, Icon }) => (
              <Pressable
                key={key}
                onPress={() => openLink(url)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="link"
                accessibilityLabel={label}
                className="active:opacity-60"
              >
                <Icon size={iconSize.md} color={colors.content2} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text className="mt-5 text-xs text-content-2">
          © {new Date().getFullYear()} BTMS — Nền tảng quản lý giải và tỉ số
          bi-a.
        </Text>
      </View>
    </View>
  );
}
