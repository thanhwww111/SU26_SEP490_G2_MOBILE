import { ScrollView, View } from "react-native";

import { useRefresh } from "../../../hooks/useRefresh";

/**
 * Khung của một tab danh sách trong màn chi tiết giải.
 *
 * Chia tab thành hai tầng: bộ lọc nằm yên ở trên, nội dung cuộn bên dưới. Danh
 * sách trận của giải 128 cơ thủ dài vài màn hình, cuộn xuống giữa rồi muốn đổi
 * vòng đấu mà phải vuốt ngược lên đầu thì quá phiền.
 *
 * Trước đây cả năm tab dùng chung một `ScrollView` đặt ở `TournamentDetail`, nên
 * bộ lọc nằm lọt trong vùng cuộn và không có cách nào giữ lại. Giờ mỗi tab tự lo
 * vùng cuộn của mình; đổi lại `TournamentDetail` chỉ còn dựng `ScrollView` cho
 * tab Thông tin, nơi ảnh bìa phải cuộn cùng nội dung.
 *
 * Hệ quả có lợi: mỗi tab nhớ vị trí cuộn riêng, quay lại tab cũ không bị nhảy
 * về đầu. Ba tab danh sách cũng hết cảnh danh sách dài nằm trong `ScrollView`
 * của người khác.
 *
 * @param {React.ReactNode} [filters] — cụm lọc giữ cố định; bỏ trống thì không
 *   dựng dải trên cùng, tab chỉ có vùng cuộn
 * @param {() => Promise<any> | any} [onRefresh] — vuốt xuống để tải lại; bỏ trống
 *   thì tab không nhận cử chỉ đó
 */
export default function TabScreen({ filters, onRefresh, children }) {
  /* Hook phải chạy ở mọi lần render nên gọi vô điều kiện, rồi mới quyết định có gắn hay không.
     Tab không truyền `onRefresh` thì đừng gắn: kéo ra một vòng xoay chớp rồi tắt mà dữ liệu y
     nguyên là lời hứa suông, thà không nhận cử chỉ ngay từ đầu. */
  const { refreshControl } = useRefresh(onRefresh);

  return (
    <View className="flex-1">
      {filters ? (
        <View className="gap-3 border-b border-line bg-surface px-4 py-3">
          {filters}
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        // Chừa chỗ cho thanh tab nổi ở đáy, nếu không nó che mất phần cuối
        contentContainerClassName="gap-3 px-4 pb-28 pt-4"
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? refreshControl : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}
