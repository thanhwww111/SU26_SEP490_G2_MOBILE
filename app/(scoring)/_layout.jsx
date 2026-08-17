import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Nhóm route của màn chấm điểm.
 *
 * Tách hẳn khỏi `(app)` vì ba lý do, không phải vì gọn:
 *
 * Layout này KHÔNG chặn quyền — việc đó nằm ở `useRequireStaff` trong chính màn bảng điểm, nơi
 * cần biết trạng thái xác thực để quyết định lúc nào được gọi API. Thêm route con vào nhóm này
 * thì nhớ gọi hook đó, đừng cho rằng layout đã lo hộ.
 *
 * 1. **Không có chrome.** `(app)/_layout.jsx` dựng header, drawer, chuông thông báo. Bảng điểm
 *    cần trọn màn hình cho hai panel và mặt đồng hồ — đúng như web, nơi `StaffScoringRoute` là
 *    route trần không đi qua `withStaffPage` (xem `FE/src/constants/routes.js`).
 * 2. **Safe area đổi cạnh khi xoay ngang.** `(app)` khai `edges={["top"]}`; nằm ngang thì tai thỏ
 *    chuyển sang cạnh trái hoặc phải, nên nhóm này lấy `left`/`right` thay vì `top`.
 * 3. **Hướng màn hình.** Khoá ngang phải gắn với vòng đời của đúng nhóm này, mở màn thì khoá,
 *    rời màn thì trả lại portrait cho phần còn lại của app.
 *
 * Khoá ngang ở đây là **ưu tiên, không phải điều kiện**: ngang thì số to hơn và hai panel rộng
 * hơn, nhưng `lockAsync` không phải lúc nào cũng ăn (iPad bật multitasking bỏ qua, một số máy
 * khoá xoay ở mức hệ thống cũng vậy). Nên `[matchId].jsx` tự đọc kích thước cửa sổ và dựng bố
 * cục cho cả hai hướng — hỏng khoá thì màn vẫn dùng được, chỉ là khác dáng.
 *
 * ## Vì sao `app.json` phải để `orientation: "default"`
 *
 * Khai `"portrait"` là bảo hệ điều hành app chỉ hỗ trợ chế độ dọc — Info.plist và Manifest chỉ
 * đăng ký đúng hướng đó, và `lockAsync(LANDSCAPE)` sẽ không có tác dụng trên bản build thật.
 * Trong Expo Go thì vẫn xoay được vì Info.plist lúc đó là của chính Expo Go, nên lỗi này chỉ lộ
 * ra khi build — cùng kiểu bẫy với `userInterfaceStyle` đã ghi ở `docs/mobile/06-agent.md`.
 *
 * Đổi lại, mọi màn khác phải tự khoá dọc: `app/(app)/_layout.jsx` gọi `lockAsync(PORTRAIT_UP)`.
 */
export default function ScoringLayout() {
  useEffect(() => {
    // Bản web (`npm run web`) không có API này; bọc lại để màn không vỡ khi chạy thử trên trình duyệt
    if (Platform.OS === "web") return undefined;

    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {
      /* Máy khoá xoay ở mức hệ thống — vẫn chấm điểm được, chỉ là panel hẹp hơn */
    });

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: "#0A0E14" }}>
      <StatusBar style="light" hidden />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0A0E14" } }} />
    </View>
  );
}
