import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ImageIcon, MapPin, Navigation, PhoneCall } from "lucide-react-native";

import RemoteImage from "../home/RemoteImage";
import SectionCard from "../tournament/SectionCard";
import AppFooter from "../layout/AppFooter";
import * as publicBranchApi from "../../api/publicBranchApi";
import { fmtDateShort } from "../../utils/date";
import { colors, iconSize } from "../../theme/tokens";

/**
 * "140 Cầu Giấy, phường Dịch Vọng, thành phố Hà Nội" → "phường Dịch Vọng, thành phố Hà Nội"
 *
 * Quy ước lấy hai đoạn cuối, giống web. Địa chỉ do người dùng nhập tay nên đây
 * là phỏng đoán chứ không phải dữ liệu có cấu trúc — thiếu thì thôi, không hiện.
 */
const extractRegion = (address) => {
  if (!address) return null;
  const parts = String(address)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.slice(-2).join(", ");
};

/** Mở app ngoài (điện thoại, bản đồ); máy không có app phù hợp thì bỏ qua êm */
const openExternal = (url) => {
  if (!url) return;
  Linking.openURL(url).catch(() => {});
};

const telUrl = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;

/** Ô thông tin ngắn trong lưới hai cột */
const Fact = ({ label, value }) => (
  <View className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
    <Text className="text-overline font-bold uppercase text-slate-400">
      {label}
    </Text>
    <Text numberOfLines={1} className="mt-1 text-sm font-bold text-slate-900">
      {value}
    </Text>
  </View>
);

/**
 * Chi tiết chi nhánh, bám trang /branches/:id của FE web.
 *
 * Hai chỗ mobile làm khác web, đều theo hướng hợp thiết bị hơn:
 * - Gọi điện và chỉ đường đi qua `Linking` để mở thẳng app điện thoại và app
 *   bản đồ, thay vì thẻ `<a href="tel:">` của web.
 * - Web có ô "Trạng thái: Đang mở cửa" nhưng đó là chuỗi hardcode, backend
 *   không trả giờ mở cửa. Mobile bỏ hẳn ô đó thay vì bê một thông tin bịa sang.
 *
 * Nút gọi của web nổi cố định góc phải dưới; ở đây đặt trong khối thông tin đầu
 * màn vì nút nổi sẽ che mất ảnh khi cuộn thư viện.
 */
export default function BranchDetail({ id }) {
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicBranchApi.getPublicBranchDetail(id);
      if (alive.current) setBranch(data);
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    alive.current = true;
    if (id) load();
    return () => {
      alive.current = false;
    };
  }, [id, load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (error || !branch) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-4">
        <Text className="text-center text-sm text-slate-500">
          {error || "Không tìm thấy cơ sở."}
        </Text>
        <Pressable
          onPress={load}
          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 active:bg-slate-50"
        >
          <Text className="text-sm font-semibold text-slate-700">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const images = branch.images || [];
  const heroImage = images[0]?.url;
  const region = extractRegion(branch.address);
  const openedAt = fmtDateShort(branch.createdAt);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <RemoteImage uri={heroImage} className="h-52 w-full" />

      <View className="gap-4 p-4">
        <View className="gap-1">
          {region ? (
            <Text className="text-overline font-bold uppercase text-slate-400">
              {region}
            </Text>
          ) : null}
          <Text className="text-2xl font-black leading-8 text-slate-900">
            {branch.name}
          </Text>
          {branch.description ? (
            <Text className="mt-1 text-sm leading-6 text-slate-600">
              {branch.description}
            </Text>
          ) : null}
        </View>

        <View className="flex-row gap-3">
          {branch.phone ? (
            <Pressable
              onPress={() => openExternal(telUrl(branch.phone))}
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-navy-700 active:bg-navy-600"
            >
              <PhoneCall size={iconSize.sm} color={colors.textInverse} />
              <Text className="text-sm font-semibold text-white">Gọi đặt bàn</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => openExternal(mapsUrl(branch.address))}
            className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-slate-300 bg-white active:bg-slate-50"
          >
            <Navigation size={iconSize.sm} color={colors.textSecondary} />
            <Text className="text-sm font-semibold text-slate-700">Chỉ đường</Text>
          </Pressable>
        </View>

        <SectionCard title="Địa chỉ">
          <View className="flex-row items-start gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <MapPin size={iconSize.sm} color={colors.brand} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold leading-6 text-slate-800">
                {branch.address || "—"}
              </Text>
              <Pressable
                onPress={() => openExternal(mapsUrl(branch.address))}
                hitSlop={8}
                className="mt-2"
              >
                <Text className="text-sm font-semibold text-info">
                  Mở trong Google Maps
                </Text>
              </Pressable>
            </View>
          </View>
        </SectionCard>

        <View className="flex-row gap-3">
          <Fact label="Hotline" value={branch.phone || "—"} />
          <Fact label="Hoạt động từ" value={openedAt || "—"} />
        </View>

        {images.length > 0 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <ImageIcon size={iconSize.md} color={colors.brand} />
                <Text className="text-base font-bold text-slate-900">
                  Không gian quán
                </Text>
              </View>
              <Text className="text-sm text-slate-400">{images.length} ảnh</Text>
            </View>

            {/* Ảnh xếp dọc, mỗi ảnh chiếm trọn bề ngang: lưới ô nhỏ như web thì
                trên điện thoại không nhìn ra gì. Không lồng FlatList ở đây vì
                cả màn đã nằm trong ScrollView. */}
            <View className="gap-3">
              {images.map((image, index) => (
                <RemoteImage
                  key={image.key || index}
                  uri={image.url}
                  className="h-52 w-full rounded-xl"
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <AppFooter />
    </ScrollView>
  );
}
