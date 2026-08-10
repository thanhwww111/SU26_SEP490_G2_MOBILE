import { Image, StyleSheet, Text, View } from "react-native";

const bannerImage = require("../../../assets/auth-hero.jpg");

/**
 * Hero đầu màn danh sách giải, bám khối banner của trang /event trên web.
 *
 * Web dùng ảnh riêng trong `/images/tournaments/`; mobile chưa bê bộ ảnh đó
 * sang nên dùng lại ảnh hero sẵn có, giống cách `HomeBanner` đang làm.
 *
 * Ảnh phải ép width/height 100%: RN Web gán kích thước gốc của ảnh vào style
 * nên absoluteFill một mình không đủ.
 */
export default function TournamentHero() {
  return (
    <View className="h-40 w-full overflow-hidden bg-navy-900">
      <Image
        source={bannerImage}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, styles.fill]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(12, 21, 39, 0.6)" },
        ]}
      />

      <View className="flex-1 justify-end p-4">
        <Text className="text-overline font-bold uppercase text-accent">
          World Nineball Tour
        </Text>
        <Text className="mt-1 text-2xl font-display uppercase text-white">
          Giải Đấu Bi-a
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
});
