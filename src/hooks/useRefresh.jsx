import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl } from "react-native";

import { useThemeColors } from "../theme/useThemeColors";

/**
 * Vuốt xuống để tải lại — bản dùng chung cho mọi vùng cuộn trong app.
 *
 * Đây là "F5" của mobile: người dùng không có thanh địa chỉ, nên khi nghi dữ liệu đã cũ họ sẽ
 * vuốt xuống theo phản xạ. Màn nào không đáp lại cử chỉ đó thì trông như bị treo.
 *
 * Trả về sẵn phần tử `<RefreshControl>` thay vì để mỗi màn tự dựng: màu vòng xoay phải đọc từ
 * `useThemeColors()` cho khớp chế độ sáng/tối, và ba prop màu của nó tên khác nhau trên hai nền
 * tảng (`tintColor` cho iOS, `colors` + `progressBackgroundColor` cho Android). Gói một chỗ thì
 * không màn nào quên mất một nửa.
 *
 * ```jsx
 * const { refreshControl } = useRefresh(load);
 * <ScrollView refreshControl={refreshControl}>…</ScrollView>
 * ```
 *
 * Với `FlatList` đang dùng cặp prop `refreshing`/`onRefresh` thì lấy `refreshing` và `onRefresh`
 * trả về ở đây cũng được — nhưng khi đó vòng xoay giữ màu mặc định của hệ điều hành.
 *
 * @param {() => Promise<any> | any} load — việc cần chạy khi vuốt; ném lỗi cũng không sao
 * @returns {{ refreshing: boolean, onRefresh: () => Promise<void>, refreshControl: React.ReactElement }}
 */
export function useRefresh(load) {
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  // Người dùng vuốt xong rồi thoát màn ngay là chuyện thường; không có cờ này thì request về đích
  // sau khi component đã gỡ và React cảnh báo set state lên component chết.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load?.();
    } catch {
      /* Nuốt lỗi có chủ đích: nơi gọi đã có state lỗi riêng của nó (`load` thường tự set), còn
         nhiệm vụ của hook chỉ là tắt vòng xoay. Để lỗi thoát ra đây là một promise bị từ chối
         không ai bắt — trên React Native sẽ hiện màn đỏ giữa lúc người dùng chỉ vuốt tay. */
    } finally {
      if (alive.current) setRefreshing(false);
    }
  }, [load]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // Cùng màu với `ActivityIndicator` khắp app (`colors.brand`), không dùng đỏ thương hiệu:
      // đỏ ở đây dễ bị đọc nhầm là báo lỗi, mà vuốt làm mới thì chẳng có gì sai cả.
      // iOS
      tintColor={colors.brand}
      // Android
      colors={[colors.brand]}
      progressBackgroundColor={colors.surface}
    />
  );

  return { refreshing, onRefresh, refreshControl };
}

export default useRefresh;
