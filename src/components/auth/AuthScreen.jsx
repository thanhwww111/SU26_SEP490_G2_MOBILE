import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const heroImage = require("../../../assets/auth-hero.jpg");

/** Xấp xỉ gradient rgba(10,20,50,.72) → rgba(10,20,60,.80) của FE web */
const OVERLAY_COLOR = "rgba(13, 27, 62, 0.76)";

/**
 * Khung dùng chung cho cả 4 màn auth, bám layout trang Auth của FE web:
 * ảnh nền phủ lớp navy tối, logo BTMS, câu chào, rồi nội dung.
 *
 * `card = false` bỏ nền trắng, đặt form thẳng lên nền tối — khi đó màn con phải
 * dùng Input tone="dark" và Button variant="light" cho đọc được.
 *
 * Ảnh nền dùng <Image> chứ không dùng <ImageBackground>: trên React Native Web,
 * ImageBackground không bị ràng buộc kích thước và render bằng kích thước gốc
 * của ảnh. Cũng vì vậy mà riêng absoluteFill chưa đủ — RN Web gán width/height
 * gốc của ảnh vào style, và width tường minh thắng cặp left/right: 0.
 * Phải ép 100% mới phủ đúng khung.
 */
export default function AuthScreen({ title, children, card = true }) {
  return (
    <View className="flex-1 bg-navy-900">
      <Image
        source={heroImage}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, styles.heroSize]}
      />
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: OVERLAY_COLOR }]}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerClassName="grow justify-center px-4 py-10"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-5 items-center">
              <Text className="text-[42px] font-display uppercase leading-[44px] tracking-tight text-white">
                btms<Text className="text-accent">.</Text>
              </Text>
              <Text className="mt-1.5 text-center text-[13px] text-slate-300">
                Chào mừng bạn đến với nền tảng tỉ số trực tuyến{" "}
                <Text className="font-display uppercase text-white">
                  btms
                </Text>
                .
              </Text>
            </View>

            <View
              className={
                card
                  ? "rounded-lg bg-white px-7 pb-6 pt-7"
                  : "px-3 pb-6 pt-2"
              }
            >
              <Text
                className={`mb-4 text-[13px] font-display uppercase tracking-[1.5px] ${
                  card ? "text-navy-700" : "text-white"
                }`}
              >
                {title}
              </Text>
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSize: { width: "100%", height: "100%" },
});
