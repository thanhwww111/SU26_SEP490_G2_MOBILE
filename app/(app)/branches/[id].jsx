import { useLocalSearchParams } from "expo-router";

import BranchDetail from "../../../src/components/branch/BranchDetail";

/**
 * Chi tiết cơ sở, bám trang /branches/:id của FE web.
 *
 * Header kèm nút quay lại do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 * Không bọc ScrollView: BranchDetail tự quản vùng cuộn và tự đặt AppFooter.
 */
export default function BranchDetailScreen() {
  const { id } = useLocalSearchParams();

  return <BranchDetail id={id} />;
}
