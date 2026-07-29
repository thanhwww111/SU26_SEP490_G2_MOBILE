import { useRouter } from "expo-router";

import MyRegistrationList from "../../src/components/registration/MyRegistrationList";

/**
 * Đăng ký giải của tôi, bám trang /player/registrations của FE web.
 *
 * Header (kèm nút quay lại) do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 * Không bọc ScrollView: bên trong là FlatList, nó tự là vùng cuộn và tự đặt
 * AppFooter ở ListFooterComponent.
 */
export default function MyRegistrationsScreen() {
  const router = useRouter();

  return (
    <MyRegistrationList
      onPressItem={(item) => router.push(`/(app)/my-registrations/${item.id}`)}
    />
  );
}
