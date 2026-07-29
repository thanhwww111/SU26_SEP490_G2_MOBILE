import { useRouter } from "expo-router";

import BranchList from "../../src/components/branch/BranchList";

/**
 * Danh sách cơ sở, bám trang /branches của FE web (bản công khai, không phải
 * màn quản trị /owner/branches hay /manager/branches).
 *
 * Route giữ đúng tên web để mục "Cơ Sở" trong drawer khớp `activeKey` mà
 * app/(app)/_layout.jsx truyền xuống (segment cuối của route).
 *
 * Header do layout dựng. Không bọc ScrollView: bên trong là FlatList, nó tự là
 * vùng cuộn và tự đặt AppFooter ở ListFooterComponent.
 */
export default function BranchesScreen() {
  const router = useRouter();

  return (
    <BranchList
      onPressItem={(branch) => router.push(`/(app)/branches/${branch.id}`)}
    />
  );
}
