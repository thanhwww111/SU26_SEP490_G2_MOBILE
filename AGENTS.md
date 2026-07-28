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

Dựng màn mới: gõ `/new-screen <tên màn>` — chạy đúng quy trình 5 bước.

## Ba luật

1. **Web FE là chuẩn giao diện.** Mobile không tự thiết kế. Không có màn tương ứng trên web → hỏi người dùng.
2. **Không hardcode màu / spacing / cỡ chữ.** Dùng class Tailwind, hoặc `src/theme/tokens.js` khi React Native đòi giá trị JS.
3. **Mỗi màn có dữ liệu phải xử lý đủ 4 trạng thái**: loading, data, empty, error. Một khối lỗi không được kéo sập cả màn.

## Env

Biến duy nhất: `EXPO_PUBLIC_API_URL` = IP LAN của máy chạy backend, ví dụ `http://192.168.1.14:8080`.

Không dùng `localhost` (điện thoại hiểu là chính nó). Không có hậu tố `/api/v1` — `src/constants/config.js` tự nối. Không dùng tiền tố `VITE_` hay `REACT_APP_`.

## Lưu ý

- Chưa cài thư viện toast — mọi thông báo hiển thị inline.
- Mục "Cấu trúc thư mục" trong `README.md` đã lỗi thời; đọc cấu trúc thật từ thư mục.
- Repo này là một trong ba repo git độc lập: `SU26_SEP490_G2_BE`, `SU26_SEP490_G2_FE`, `SU26_SEP490_G2_MOBILE`.
