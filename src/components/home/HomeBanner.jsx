import { Image, StyleSheet, Text, View } from "react-native";

const bannerImage = require("../../../assets/auth-hero.jpg");

/**
 * Banner đầu trang chủ. Dùng lại ảnh hero của màn auth nên không cần thêm asset.
 *
 * Lưu ý giống AuthScreen: RN Web gán kích thước gốc của ảnh vào style,
 * nên phải ép width/height 100% chứ absoluteFill một mình không đủ.
 */
export default function HomeBanner() {
  return (
    <View className="h-44 w-full overflow-hidden bg-navy-900">
      <Image
        source={bannerImage}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, styles.fill]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(13, 27, 62, 0.55)" },
        ]}
      />

      <View className="flex-1 justify-end p-4">
        <Text className="text-2xl font-black uppercase italic leading-7 text-white">
          Nền tảng tỉ số{"\n"}trực tuyến
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },
});
