import PaymentList from "../../src/components/payment/PaymentList";

/**
 * Lịch sử thanh toán, bám trang /player/payments của FE web.
 *
 * Header kèm nút quay lại do app/(app)/_layout.jsx dựng, màn này chỉ lắp ráp.
 * Không bọc ScrollView: bên trong là FlatList, nó tự là vùng cuộn.
 */
export default function PaymentsScreen() {
  return <PaymentList />;
}
