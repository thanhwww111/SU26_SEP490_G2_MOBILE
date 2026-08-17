# Hướng dẫn cho AI Agent

Cập nhật: 2026-07-29

Tài liệu này dành cho AI agent (Claude Code, Copilot, Cursor…) làm việc trên repo mobile. Người thật đọc cũng được — phần "Sự thật về project" bên dưới đúng cho cả hai.

---

# Đọc gì trước khi làm gì

| Việc | Đọc trước |
|---|---|
| Dựng màn mới | [05-screen-template.md](05-screen-template.md) → [07](07-web-mapping.md) → [01](01-design-system.md) |
| Sửa/tạo component | [03-component-guidelines.md](03-component-guidelines.md) → [01](01-design-system.md) |
| Nối API | [04-api-integration.md](04-api-integration.md) → [09](09-backend-reference.md) → [10](10-data-contracts.md) |
| Cần biết field tên gì | [10-data-contracts.md](10-data-contracts.md) |
| Đổi màu, chữ, spacing | [01-design-system.md](01-design-system.md) |
| Không rõ thứ tự làm | [02-development-workflow.md](02-development-workflow.md) |
| Tìm màn web tương ứng | [07-web-mapping.md](07-web-mapping.md) |
| Cần snippet quen thuộc | [08-reusable-patterns.md](08-reusable-patterns.md) |
| "Màn này đã ai làm chưa, quyết định gì rồi?" | [11-changelog.md](11-changelog.md) |

**Trước khi tự viết một đoạn code lặp lại** (gọi API, phân trang, form, badge trạng thái, điều hướng), tra [08](08-reusable-patterns.md) — nhiều khả năng đã có sẵn.

**Trước khi tự đặt tên endpoint**, tra [09](09-backend-reference.md). Endpoint chưa tồn tại thì báo người dùng, đừng chế đường dẫn.

**Trước khi đoán tên field** trong response, tra [10](10-data-contracts.md). Không có ở đó thì đọc DTO trong `../SU26_SEP490_G2_BE/.../dto/` rồi **bổ sung vào [10](10-data-contracts.md)** — đó là cách bộ tài liệu này tự tốt lên sau mỗi màn.

## Dựng màn mới

Có sẵn slash command `/new-screen <tên màn>` (`.claude/commands/new-screen.md`) chạy đúng quy trình 5 bước. Nếu người dùng mô tả một màn mới mà không gõ lệnh, vẫn làm theo đúng các bước trong file đó.

---

# Sự thật về project — kiểm chứng trước khi tin tài liệu khác

Đây là những điểm mà tài liệu cũ trong repo đang ghi sai hoặc đã lỗi thời. Ưu tiên mục này.

## Expo SDK là 54, không phải 57

`AGENTS.md` ở thư mục gốc trỏ tới `https://docs.expo.dev/versions/v57.0.0/` — **sai**. `package.json` ghi `expo: ~54.0.0`, React Native 0.81.5, expo-router 6.

Dùng docs của SDK 54: `https://docs.expo.dev/versions/v54.0.0/`

**Không tự nâng SDK.** Expo Go trên store chỉ chạy đúng một phiên bản SDK; nhóm đã từng phải hạ từ 57 xuống 54. Muốn nâng thì cả nhóm cùng cập nhật Expo Go rồi nâng một lượt.

## README có mục lỗi thời

Mục "Cấu trúc thư mục" trong `README.md` viết trước khi có nhóm `(auth)/` và `profile.jsx`. Đọc cấu trúc thật bằng cách liệt kê thư mục, đừng tin mục đó.

## JavaScript, không phải TypeScript

Toàn bộ ba repo của dự án dùng `.js` / `.jsx`. **Không tạo file `.ts` / `.tsx`**, không thêm cấu hình TypeScript.

## Env

Biến duy nhất: `EXPO_PUBLIC_API_URL`, giá trị là **IP LAN** của máy chạy backend, ví dụ `http://192.168.1.14:8080`.

Không dùng `localhost` (điện thoại sẽ hiểu là chính nó). Không dùng tiền tố `VITE_` hay `REACT_APP_` — đó là của repo web.

`src/constants/config.js` tự nối `/api/v1`, nên biến env **không** được có sẵn phần đó.

## Thư viện: có gì, chưa có gì

Kiểm chứng bằng `package.json`, đừng đoán. Tính tới 2026-07-29:

| Việc | Tình trạng |
|---|---|
| Toast | **Chưa có.** Thông báo hiển thị inline qua `FormError`, `FormSuccess`, `SectionState`. Đừng sinh code gọi `Toast.show()` |
| Chọn ảnh | Có `expo-image-picker` (thêm 2026-07-29, cho màn hồ sơ) |
| Render HTML | **Không dùng thư viện.** Tự chuyển bằng `src/utils/html.js` — xem [11](11-changelog.md) |
| WebSocket | **Có** (`@stomp/stompjs`, từ 2026-08-08). Dùng qua `src/hooks/useTournamentSocket.js`, đừng tự dựng `Client` mới |
| Chọn ngày | **Có** (`@react-native-community/datetimepicker`, từ 2026-08-08). Dùng qua `src/components/DateField.jsx`, giá trị vào/ra là chuỗi `dd/mm/yyyy` |
| Date picker | **Chưa có.** Ngày sinh trong hồ sơ dùng ô nhập `dd/mm/yyyy` tự validate |
| Gradient | **Chưa có.** Chỗ nào web dùng gradient thì mobile dùng nền đặc |
| Xoay màn hình | **Có** (`expo-screen-orientation`, từ 2026-08-17). App khai `orientation: "default"`; `(app)/_layout.jsx` khoá dọc, chỉ nhóm `(scoring)` khoá ngang |
| Giữ sáng màn hình | **Có sẵn, không phải cài** — `expo-keep-awake` là dependency của `expo`. Dùng `activateKeepAwakeAsync` / `deactivateKeepAwake` |
| Âm thanh | **Chưa có.** Cần báo hiệu thì dùng `Vibration` của React Native (màn chấm điểm đang làm vậy) |
| CSS mask | **Không có trên native.** `mask-image` / `maskComposite` của web không port được — xem cách xử lý ở `src/components/staff/ScorePanel.jsx` |

Thêm thư viện là đổi kiến trúc — xem quy tắc 3 bên dưới. Hỏi người dùng trước, đừng tự cài.

## Nativewind v4 + Tailwind v3

`className` hoạt động trên hầu hết component RN. Nhưng:

- `hover:` không có tác dụng trên native — dùng `active:`.
- `shadow-*` không cho kết quả đúng trên native — dùng `shadow` từ `src/theme/tokens.js`.
- Gradient cần thư viện riêng, hiện chưa cài — đừng dùng.

## App có dark mode — đừng gõ `bg-white` nữa

Từ 2026-07-29, nhóm `(app)` chạy dark mode; nhóm `(auth)` khoá sáng.

Hệ quả với mọi màn mới: **dùng token vai trò thay cho tên màu**, và **không cần viết `dark:` ở đâu cả**.

| Đừng viết | Viết |
|---|---|
| `bg-white` | `bg-surface` |
| `bg-slate-50` | `bg-canvas` |
| `text-slate-900` | `text-content` |
| `text-slate-500` | `text-muted` |
| `border-slate-200` | `border-line` |
| `import { colors }` | `useThemeColors()` |

Bảng đầy đủ ở [01, Phần 9](01-design-system.md); ví dụ dùng ở [08, mục 16](08-reusable-patterns.md).

Ngoại lệ: khối **cố ý tối** (hero, footer, drawer, thanh tab, badge, nút trên nền tối) vẫn dùng `bg-navy-900`, `text-white`, `border-white/40`. Đổi chúng sang token là sai.

### `app.json` phải để `userInterfaceStyle: "automatic"`

Để `"light"` là bảo hệ điều hành rằng app chỉ hỗ trợ chế độ sáng — `Appearance.getColorScheme()` sẽ luôn trả `"light"` trên máy thật và **dark mode không bao giờ chạy trên native**, dù `tailwind.config.js` lẫn code đều đúng.

### Sửa `tailwind.config.js` thì phải xoá cache

NativeWind nhét kiểu dark mode vào CSS đã biên dịch dưới dạng biến `--css-interop-darkMode`, và runtime đọc biến đó **đúng một lần lúc nạp module**. Metro cache bản CSS cũ nên đổi `tailwind.config.js` xong mà chạy tiếp sẽ dùng giá trị cũ.

Triệu chứng trên bản web: `Cannot manually set color scheme, as dark mode is type 'media'`.

```
npx expo start --clear
```

Bản native không dính lỗi này — nó gọi thẳng `Appearance.setColorScheme()`, không đọc flag.

---

# Ba quy tắc không được vi phạm

## 1. Không tự thiết kế giao diện

Web FE là chuẩn. Trước khi chọn màu hay bố cục, mở màn tương ứng trong `SU26_SEP490_G2_FE/src/` ra xem.

Không có màn tương ứng trên web → **hỏi người dùng**, đừng tự sáng tác.

## 2. Không hardcode giá trị thiết kế

Màu, spacing, radius, cỡ chữ đều lấy từ token. Class Tailwind trước; nếu RN đòi giá trị JS thì import từ `src/theme/tokens.js`.

```jsx
// Sai
<ChevronLeft size={24} color="#1a2a4a" />

// Đúng
import { colors, iconSize } from "../theme/tokens";
<ChevronLeft size={iconSize.lg} color={colors.brand} />
```

## 3. Không đổi kiến trúc mà không được yêu cầu

Không thêm thư viện, không đổi cách quản lý state, không refactor thư mục chỉ vì thấy "sạch hơn". Nếu thấy vấn đề thật, nêu ra rồi để người dùng quyết.

---

# Khi được giao một màn

```
1. Xác nhận API đã có (hỏi backend hoặc đọc BTMS-Tournament-Config-API.md)
2. Mở màn tương ứng trên web FE, đọc bố cục + màu + trạng thái
3. Kiểm component nào tái dùng được (03), chỉ tạo mới khi thật sự cần
4. Dựng UI theo khuôn ở 05 — chưa nối API
5. Nối API qua src/api/, không gọi axios thẳng
6. Làm đủ loading / data / empty / error
7. Chạy checklist ở 05, Bước 7
```

Không nhảy bước. Bỏ bước 1 hoặc 2 là nguyên nhân phổ biến nhất khiến phải làm lại.

---

# Khi được giao sửa lỗi

Đọc code trước khi đề xuất sửa. Tái hiện lỗi trước khi kết luận nguyên nhân. Không đoán.

Nếu lỗi nằm ở backend hoặc ở dữ liệu, nói thẳng ra thay vì vá tạm ở mobile.

---

# Khi đụng vào file có sẵn

Repo có một số chỗ viết trước khi có design system, liệt kê ở mục "Nợ kỹ thuật đã biết" trong [01](01-design-system.md). Nguyên tắc:

- **Đang sửa file đó vì việc khác** → dọn luôn phần nợ trong file đó.
- **Không đụng tới file đó** → để yên, đừng refactor rải rác.

---

# Báo cáo kết quả

Nói đúng những gì đã làm và đã kiểm chứng.

- Đã chạy thử trên máy thật thì nói rõ đã chạy.
- Chỉ mới viết code chưa chạy thì nói rõ chưa chạy.
- Có phần bị bỏ dở thì liệt kê ra, đừng im lặng.

Không tuyên bố "đã xong" khi mới hoàn thành một phần.

---

# Ngữ cảnh của cả dự án

Repo này là một trong ba repo git độc lập:

```
D:\HocTap\SEP490_G2_BiliardsManager\
├── SU26_SEP490_G2_BE\      Spring Boot backend
├── SU26_SEP490_G2_FE\      React 19 web (chuẩn giao diện)
└── SU26_SEP490_G2_MOBILE\  repo này — Expo SDK 54
```

Mobile dùng chung backend với web. Thứ tự phụ thuộc: **Backend → Web FE → Mobile**. Mobile không tự định nghĩa nghiệp vụ hay hành vi API.

Role của hệ thống: ADMIN, OWNER, MANAGER, STAFF, PLAYER.

Luồng PLAYER và nhóm màn công khai đã xong. **STAFF xong 2026-08-17** — hai màn trọng tài, kèm lớp phân quyền dùng chung (`getHomeRouteForRole`, `useRequireStaff`, `STAFF_MENU`). OWNER / MANAGER / ADMIN chưa làm; xem [07](07-web-mapping.md) để biết màn nào đáng đưa lên mobile.

**Thêm màn cho role mới thì đi theo khuôn của STAFF**, đừng dựng lớp phân quyền thứ hai: thêm nhánh vào `getHomeRouteForRole`, viết một hook guard cùng kiểu `useRequireStaff`, thêm menu vào `ProfileMenu`.
