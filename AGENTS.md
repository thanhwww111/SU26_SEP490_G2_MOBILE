# BTMS Mobile

App di động của hệ thống quản lý giải bi-a (SEP490_G2), dùng chung backend Spring Boot với FE web.

## Stack — kiểm chứng bằng package.json, đừng đoán

**Expo SDK 54**, React Native 0.81, expo-router 6, NativeWind 4, Zustand, axios. JavaScript `.jsx` — **không dùng TypeScript**.

Docs Expo phải đọc đúng bản: <https://docs.expo.dev/versions/v54.0.0/>

**Không tự nâng SDK.** Expo Go trên store chỉ chạy đúng một phiên bản; nhóm đã từng phải hạ từ 57 xuống 54. Nâng thì cả nhóm nâng cùng lúc.

## Đọc tài liệu trước khi code

Toàn bộ quy chuẩn nằm ở **[`docs/mobile/`](docs/mobile/README.md)**.

| Việc | Đọc |
|---|---|
| Là AI agent, mới vào | `docs/mobile/06-agent.md` |
| Dựng màn mới | `docs/mobile/05-screen-template.md` |
| Màu, chữ, spacing | `docs/mobile/01-design-system.md` |
| Tạo/sửa component | `docs/mobile/03-component-guidelines.md` |
| Nối API | `docs/mobile/04-api-integration.md` + `09-backend-reference.md` |
| Response có field gì | `docs/mobile/10-data-contracts.md` |
| Tìm màn web tương ứng | `docs/mobile/07-web-mapping.md` |
| Snippet hay dùng | `docs/mobile/08-reusable-patterns.md` |
| Màn nào đã làm, quyết định gì | `docs/mobile/11-changelog.md` |

Dựng màn mới: gõ `/new-screen <tên màn>` — chạy đúng quy trình 5 bước.

## Ba luật

1. **Web FE là chuẩn giao diện.** Mobile không tự thiết kế. Không có màn tương ứng trên web → hỏi người dùng.
2. **Không hardcode màu / spacing / cỡ chữ.** Dùng token vai trò (`bg-surface`, `text-content`) thay cho `bg-white`, `text-slate-900` — app có dark mode nên tên màu cứng sẽ sai ở chế độ tối. Màu qua prop JS lấy từ `useThemeColors()`.
3. **Mỗi màn có dữ liệu phải xử lý đủ 4 trạng thái**: loading, data, empty, error. Một khối lỗi không được kéo sập cả màn.

## Env

Biến duy nhất: `EXPO_PUBLIC_API_URL` = IP LAN của máy chạy backend, ví dụ `http://192.168.1.14:8080`.

Không dùng `localhost` (điện thoại hiểu là chính nó). Không có hậu tố `/api/v1` — `src/constants/config.js` tự nối. Không dùng tiền tố `VITE_` hay `REACT_APP_`.

## Lưu ý

- **`expo-image-picker` thêm ngày 2026-07-29** (màn hồ sơ cần chọn ảnh đại diện). Pull về nhớ chạy `npm install`.
- **`expo-notifications` + `expo-device` + `expo-web-browser` thêm ngày 2026-08-07** (thông báo đẩy, thanh toán PayOS). Pull về nhớ chạy `npm install`.
- **Thông báo đẩy trong Expo Go: iOS chạy được, Android không.** Giới hạn SDK 53 chỉ áp cho Android. Điều kiện bắt buộc là `extra.eas.projectId` trong `app.json` — **đã có từ 2026-08-10**: project `@thanhdinh203s-team/SU26_SEP490_G2_MOBILE`, id `a5fb7778-74dc-42a5-ba3d-aa807a534b00`, kèm `owner` để cả nhóm build được. Đừng chạy lại `eas init`, sẽ tạo project trùng. Android thì mới cần development build + FCM credentials. Chi tiết và cách kiểm chứng: `docs/mobile/11-changelog.md`, mục ngày 2026-08-07.
- **`@stomp/stompjs` + `@react-native-community/datetimepicker` thêm ngày 2026-08-08** (tỷ số trực tiếp realtime, ô chọn ngày). Pull về nhớ chạy `npm install`.
- **`expo-font` + `@expo-google-fonts/be-vietnam-pro` + `@expo-google-fonts/oswald` thêm ngày 2026-08-10** (phông chữ riêng thay font hệ điều hành). Pull về nhớ chạy `npm install`.
- **`expo-screen-orientation` thêm ngày 2026-08-17** (màn chấm điểm của trọng tài chạy ngang). Pull về nhớ chạy `npm install`. Cùng lượt đó `app.json` đổi `orientation` từ `portrait` sang `default` — **đừng đổi ngược lại**, để `portrait` thì bản build thật không xoay ngang được. Các màn khác đã tự khoá dọc trong `app/(app)/_layout.jsx`.
- **Viết `font-bold` như bình thường, đừng gõ tên font.** Plugin trong `tailwind.config.js` đã ánh xạ độ đậm sang họ font. Nhưng **không dùng lớp `italic`** — dùng `font-italic` / `font-bold-italic`. Lý do: `docs/mobile/01-design-system.md`, Phần 3.
- Chưa cài toast, gradient, thư viện render HTML. Bảng đầy đủ kèm cách xử lý thay thế: `docs/mobile/06-agent.md`, mục "Thư viện: có gì, chưa có gì".
- Mục "Cấu trúc thư mục" trong `README.md` đã lỗi thời; đọc cấu trúc thật từ thư mục.
- Repo này là một trong ba repo git độc lập: `SU26_SEP490_G2_BE`, `SU26_SEP490_G2_FE`, `SU26_SEP490_G2_MOBILE`.
