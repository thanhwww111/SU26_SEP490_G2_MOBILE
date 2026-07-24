import { Text, View } from "react-native";
import { Facebook, Instagram, Youtube } from "../icons/BrandIcons";

/**
 * Chân trang, bám Footer của web nhưng xếp lại cho màn hẹp:
 * web chia 16 link thành 4 cột, mobile gom thành 2 nhóm xếp dọc.
 *
 * Link bên web đều là href="/" (chưa trỏ đâu cả) nên ở đây để chữ thường,
 * không bấm được — thay vì làm nút bấm vào không phản ứng.
 */
const LINK_GROUPS = [
  ["Tin Mới Nhất", "Lịch Thi Đấu", "Vé", "Bảng Xếp Hạng", "Cầu Thủ", "Liên Hệ"],
  [
    "Điều Khoản & Điều Kiện",
    "Chính Sách Bảo Vệ",
    "Chính Sách Quyền Riêng Tư",
    "Chính Sách Cookie",
  ],
];

export default function AppFooter() {
  return (
    <View className="bg-slate-200 px-6 pb-10 pt-10">
      <View className="gap-6 border-b border-black/10 pb-8">
        {LINK_GROUPS.map((group, index) => (
          <View key={index} className="gap-2">
            {group.map((label) => (
              <Text key={label} className="text-xs font-light text-slate-800">
                {label}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View className="pt-8">
        <Text className="text-5xl font-black italic leading-none tracking-tighter text-slate-800">
          caps<Text className="text-accent">.</Text>
        </Text>

        <Text className="mt-4 text-xs text-slate-700">
          Matchroom Multi Sport Ltd, Mascalls, Mascalls Lane, Brentwood, Essex,
          England CM14 5LJ
        </Text>
        <Text className="mt-2 text-xs font-light text-slate-600">
          © 2024 Matchroom Multi Sport Ltd. Bảo lưu mọi quyền.
        </Text>

        <View className="mt-6 flex-row items-center gap-5">
          <Text className="text-2xl font-black italic text-slate-800">
            CAPS.tv
          </Text>
          <Facebook size={20} color="#334155" />
          <Instagram size={20} color="#334155" />
          <Youtube size={22} color="#334155" />
        </View>
      </View>
    </View>
  );
}
