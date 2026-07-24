import { Platform, useWindowDimensions, View } from "react-native";

/**
 * Bọc app trong khung điện thoại khi chạy trên web (`npm run web`).
 *
 * Trên Android/iOS component này trả thẳng children — không thêm view nào,
 * nên bản native không bị ảnh hưởng.
 *
 * Cửa sổ hẹp (mở bằng điện thoại thật) cũng bỏ khung để app chiếm trọn màn hình.
 */
const isWeb = Platform.OS === "web";

/** Dưới ngưỡng này thì khung chỉ tổ vướng */
const MIN_WIDTH_FOR_FRAME = 520;

export default function WebPhoneFrame({ children }) {
  const { width } = useWindowDimensions();

  if (!isWeb || width < MIN_WIDTH_FOR_FRAME) return children;

  return (
    <View className="flex-1 items-center justify-center bg-slate-300">
      {/* 390x844 = iPhone 14 Pro */}
      <View className="h-[844px] max-h-full w-[390px] overflow-hidden rounded-[44px] border-[12px] border-slate-900 bg-white">
        {children}
      </View>
    </View>
  );
}
