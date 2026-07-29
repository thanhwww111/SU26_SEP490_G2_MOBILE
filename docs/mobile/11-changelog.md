# Nhật ký màn hình

Ghi lại **màn nào đã dựng, quyết định gì, còn nợ gì**. Mục đích: người vào sau biết được vì sao code hiện tại trông như vậy mà không phải đọc lại toàn bộ diff.

Không ghi ở đây: chi tiết cách dùng component (xem [08](08-reusable-patterns.md)), shape dữ liệu (xem [10](10-data-contracts.md)).

---

# 2026-07-29 — Sáu màn công khai

Dựng xong toàn bộ nhóm màn công khai mà web đang có: giải đấu, tin tức, cơ sở. Cộng thêm làm lại màn hồ sơ cho đủ chức năng như web.

| Màn | Route mobile | Thành phần chính |
|---|---|---|
| Danh sách giải | `app/(app)/event.jsx` | `src/components/tournament/TournamentList.jsx` |
| Chi tiết giải | `app/(app)/event/[id].jsx` | `src/components/tournament/TournamentDetail.jsx` + `tabs/` |
| Danh sách tin | `app/(app)/news.jsx` | `src/components/news/NewsList.jsx` |
| Chi tiết tin | `app/(app)/news/[slug].jsx` | `src/components/news/NewsDetail.jsx` + `RichText.jsx` |
| Danh sách cơ sở | `app/(app)/branches.jsx` | `src/components/branch/BranchList.jsx` |
| Chi tiết cơ sở | `app/(app)/branches/[id].jsx` | `src/components/branch/BranchDetail.jsx` |
| Hồ sơ (làm lại) | `app/(app)/profile.jsx` | `src/components/profile/ProfileContent.jsx` |

Drawer giờ chỉ còn ba mục trống: `Tỷ Số Trực Tiếp`, `Bảng Xếp Hạng`, `Cơ Thủ` — **web cũng chưa có ba màn này**, nên mobile không được tự dựng.

## Quy ước đặt route đã chốt

Route mobile **giữ đúng tên route của web** (`/event`, `/news`, `/branches`), không đổi thành `tournaments` như bảng ánh xạ từng dự kiến.

Lý do không chỉ là cho giống: `app/(app)/_layout.jsx` truyền segment cuối của route làm `activeKey` cho drawer, nên tên file phải trùng `key` trong `navItems.js` thì mục đang mở mới sáng lên. Đặt tên khác là phải viết thêm bảng ánh xạ.

## Thư viện mới

**`expo-image-picker`** (`~17.0.11`) — màn hồ sơ cần chọn ảnh đại diện. Pull về nhớ `npm install`.

Đây là dependency **duy nhất** thêm vào trong đợt này. Hai chỗ khác từng cân nhắc thêm thư viện nhưng đã giải quyết bằng cách khác, xem hai mục dưới.

## Quyết định lớn 1 — HTML của bài viết

`NewsPostResponse.content` là HTML. Không dùng `react-native-webview` (chữ không theo design system, phải đo chiều cao thủ công khi nhúng vào trang cuộn) cũng không dùng `react-native-render-html` (ngừng bảo trì từ 2022).

Thay vào đó tự viết `src/utils/html.js` — parser có stack, chuyển HTML thành khối để render bằng component gốc.

- **Phủ:** đoạn văn, `h1`–`h6`, đậm, nghiêng, link, `ul`/`ol`, ảnh, trích dẫn, `hr`, `br`, entity.
- **Không phủ:** bảng, `iframe`, video nhúng — mất định dạng nhưng **chữ bên trong vẫn giữ**, bài viết không bao giờ trống.
- **Có 34 test.** Sửa parser thì thêm test; cách chạy ghi ở mục "Chạy test" bên dưới.

## Quyết định lớn 2 — tỷ số trực tiếp không realtime

Tab "Trực tiếp" ở chi tiết giải: web nhận cập nhật qua WebSocket (`useTournamentSocket`, STOMP trên SockJS). Mobile **chưa có thư viện WebSocket**, nên tab này gọi lại `/tournaments/{id}/matches` mỗi 15 giây, chỉ khi tab đang hiển thị.

Hệ quả: tỷ số trễ tối đa 15 giây. Muốn realtime thật thì cả nhóm phải thống nhất thêm `@stomp/stompjs`.

## Ba chỗ chờ màn khác

| Chờ | Hiện đang |
|---|---|
| `/player/tournaments/:id/register` | Chi tiết giải hiện đủ phí và số slot, nhưng thay nút đăng ký bằng ghi chú |
| `/event/players/:participantId` | Tên cơ thủ chỉ để đọc, chưa bấm được |
| Màn Top tay cơ | Khối `RankedSection` ở trang chủ chưa nối điều hướng |

## Ba chỗ cố ý không sao chép từ web

Không phải cắt bớt cho nhanh — ba chỗ này bê sang sẽ sai hoặc vô ích:

1. **Ô "Trạng thái: Đang mở cửa"** ở chi tiết cơ sở — web hardcode chuỗi này, backend không trả giờ mở cửa nào cả. Bỏ hẳn thay vì hiển thị thông tin bịa.
2. **Khối "N cơ sở · N khu vực"** ở danh sách cơ sở — web tải thêm 100 chi nhánh rồi tách đoạn cuối địa chỉ theo dấu phẩy để đếm. Một request phụ chỉ để hiện hai con số là không đáng trên mạng di động, và cách đếm đó vốn không đáng tin.
3. **Sơ đồ bracket SVG** ở tab Trận đấu — cần màn rộng, đúng như [07](07-web-mapping.md) đã chốt. Mobile chỉ dùng danh sách theo vòng.

## Lỗi tài liệu đã sửa trong đợt này

Đọc thẳng DTO backend thay vì suy từ code web nên bắt được bốn chỗ tài liệu ghi sai:

| Chỗ sai | Sự thật |
|---|---|
| `/tournaments/{id}/rankings` trả mảng | Trả **object** `{ tournamentId, tournamentStatus, isOfficial, entries }` |
| `ParticipantResponse.avatarUrl` | Tên thật là **`avtarUrl`** — lỗi chính tả nằm ở backend |
| `BranchResponse` "có ảnh và bàn" | **Không có danh sách bàn.** Chỉ có `images` |
| "Có hai chỗ đụng tới hồ sơ, đọc cả hai controller" | Đã dứt điểm: **tạo** qua `/player/profile`, **đọc và sửa** qua `/profile`, kể cả với PLAYER |

Ngoài ra `TournamentRankingEntryResponse` **không có trường ảnh** — nhánh hiển thị avatar trong `RankingTab.jsx` bên web không bao giờ chạy. Mobile không nhân bản code chết đó.

## Component dùng chung mới

| Component | Dùng ở |
|---|---|
| `src/components/SearchField.jsx` | Giải đấu, tin tức, cơ sở, tìm cơ thủ |
| `src/components/OptionPicker.jsx` | Hồ sơ (giới tính, hạng cơ thủ) — thay `<select>` của web |
| `src/components/tournament/SectionCard.jsx` | Chi tiết giải, hồ sơ, chi tiết cơ sở |

`Input` được bổ sung prop `multiline` (ô mô tả trong hồ sơ). `authStore` thêm action `patchUser` để đồng bộ tên sau khi lưu hồ sơ.

## Chưa chạy trên máy thật

**Toàn bộ đợt này mới bundle sạch, chưa chạy trên thiết bị.** Những chỗ chỉ kiểm được trên máy thật:

- Upload ảnh đại diện (multipart từ RN, quyền truy cập thư viện ảnh).
- `Linking.openURL` cho nút gọi điện và chỉ đường ở chi tiết cơ sở.
- Render HTML với nội dung thật từ database — test dùng HTML tự dựng theo những gì trình soạn thảo thường sinh ra.
- Thanh tab 5 mục ở chi tiết giải trên máy màn hẹp.

---

# Chạy test

Không có test runner trong project. Các hàm thuần (`src/utils/html.js`, `src/components/profile/profileFormUtils.js`, `src/utils/date.js`) test được bằng node với babel của Expo:

```js
// .tmp-test.js ở thư mục gốc repo — nhớ xoá sau khi chạy
process.env.NODE_ENV = "test";
const babel = require("@babel/core");
const Module = require("module");
const origJs = Module._extensions[".js"];

Module._extensions[".js"] = (module, filename) => {
  // Bỏ qua node_modules, nếu không babel tự biên dịch chính nó và báo lỗi vòng lặp preset
  if (filename.includes("node_modules")) return origJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    presets: ["babel-preset-expo"],
    babelrc: false,
    configFile: false,
  });
  module._compile(code, filename);
};

const { parseHtmlBlocks } = require("./src/utils/html.js");
// ... so sánh kết quả
```

Kiểm tra cả app bundle được không:

```
npx expo export --platform web --output-dir <thư mục tạm>
```

Lệnh này bắt được lỗi import, JSX hỏng và class NativeWind sai — nhanh hơn mở Expo Go.
