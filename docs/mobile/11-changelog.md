# Nhật ký màn hình

Ghi lại **màn nào đã dựng, quyết định gì, còn nợ gì**. Mục đích: người vào sau biết được vì sao code hiện tại trông như vậy mà không phải đọc lại toàn bộ diff.

Không ghi ở đây: chi tiết cách dùng component (xem [08](08-reusable-patterns.md)), shape dữ liệu (xem [10](10-data-contracts.md)).

---

# 2026-07-29 — Dark mode

Bật dark mode cho toàn bộ nhóm `(app)`. Nhóm `(auth)` khoá ở chế độ Sáng theo yêu cầu.

## Cơ chế

Ba lựa chọn: **Tự động** (theo hệ điều hành, mặc định) · Sáng · Tối. Lưu vào SecureStore.

Giao diện điều khiển là **một dòng trong menu hồ sơ, chạm để xoay vòng** trạng thái. Bản đầu tách thành khối ba nút riêng, nhưng khối đó chen giữa danh sách toàn dòng-chạm-để-điều-hướng làm gãy nhịp đọc và chiếm chỗ gấp ba — đã gộp lại theo góp ý.

Khác web: `themeStore.js` bên đó cố ý luôn mặc định Sáng và bỏ qua cài đặt hệ thống. Trên điện thoại thì ngược lại — người dùng bật dark mode toàn máy sẽ mong app theo.

## Quyết định lớn — token vai trò, không phải `dark:`

Cách phổ biến của Tailwind là `bg-white dark:bg-navy-900`. **Không chọn cách đó.** Thay vào đó định nghĩa biến CSS trong `global.css` và ánh xạ sang tên vai trò trong `tailwind.config.js`:

```
bg-white      → bg-surface
bg-slate-50   → bg-canvas
text-slate-900 → text-content
border-slate-200 → border-line
```

Lý do quyết định: dự án còn nhiều màn chưa làm. Với cách `dark:`, mỗi màn mới là một cơ hội quên — và app nửa sáng nửa tối còn tệ hơn không có dark mode. Với token, màn mới tự động đúng.

Bảng token đầy đủ: [01-design-system.md](01-design-system.md), Phần 9.

## Phạm vi thật so với ước lượng của tài liệu

`01-design-system.md` Phần 9 từng viết "khi làm dark mode chỉ cần bổ sung bảng giá trị thứ hai trong `tokens.js`, không phải sửa từng màn". **Sai một nửa** — điều đó chỉ đúng với màu truyền qua prop JS. Phía `className`, mọi màn gõ thẳng `bg-white` / `text-slate-900`, không có gì để đổi.

Thực tế: **442 chỗ ở 51 file**. Đã sửa lại đoạn tài liệu đó.

## Đã xác minh trước khi chuyển hàng loạt

Không chuyển 442 chỗ rồi mới thử. Dựng spike nhỏ trước, bundle, soi CSS output:

- `--c-surface:#fff` ở nhánh sáng
- `.dark:root{--c-canvas:#0a1220;--c-surface:#0d1b2e}` ở nhánh tối
- `.bg-surface{background-color:var(--c-surface)}` trỏ đúng biến

Spike xong mới chuyển. Nếu NativeWind 4.2.6 không hỗ trợ biến CSS thì đã phải đổi hướng ngay từ đầu.

## Bẫy đã gặp và cách xử lý

**1. `Input`/`Button` dùng chung giữa auth và app.** Auth khoá sáng nhưng dùng chung component với app — nếu component đổi theo chế độ thì màn đăng nhập thành nửa sáng nửa tối.

Giải: `src/theme/LightThemeScope.jsx` khoá cả cây con. Phải khoá **hai đường**:
- `vars()` của NativeWind cho `className`;
- `ThemeLockContext` cho màu truyền qua prop JS — `vars()` không với tới được chúng.

Thiếu vế thứ hai thì icon lấy màu tối trong khi nền quanh nó đã sáng.

**2. StatusBar ở gốc là sai.** Nhóm auth luôn sáng nên chữ trạng thái phải luôn tối; nhóm app thì đổi theo chế độ. Để chung một cái ở gốc sẽ ra chữ trắng trên nền trắng ở màn đăng nhập khi app đang tối. Đã tách xuống từng nhóm layout.

**3. `brand` phải sáng lên ở chế độ tối.** Navy-700 đặt trên nền `#0A1220` gần như chìm hẳn — icon và spinner sẽ không nhìn ra. Chế độ tối dùng `#8FB0DC`.

**4. Nút `light`/`ghost` không được dùng token.** Chúng nằm trên nền đã tối sẵn ở cả hai chế độ; đổi theo chế độ thì nút trắng sẽ tan vào nền. Đã hoàn nguyên `active:bg-slate-200` cho variant `light` sau khi script đổi nhầm.

## Kiểm chứng đã chạy

- Bundle web sạch; CSS output có đủ cả hai nhánh biến và 16 class token.
- Quét: không còn `slate-*` ngoài nhóm auth; không còn `import { colors }` tĩnh.
- Quét: mọi `colors.` đều nằm sau một lời gọi `useThemeColors()`, kể cả trong component con định nghĩa ở cấp module (`InfoTab` có ba component như vậy).
- Auth vẫn giữ class gốc — xác nhận script không đụng nhầm.

## Chưa chạy trên máy thật

Ba thứ chỉ kiểm được trên thiết bị:

- **Chế độ "Tự động" có thật sự bám hệ điều hành không** — `colorScheme.set("system")` là API đúng theo type của NativeWind, nhưng chưa thấy nó phản ứng khi đổi cài đặt máy.
- **Đổi chế độ có mượt không**, hay có nháy một nhịp khi hàng loạt màn re-render.
- **Độ tương phản thật của bảng màu tối** trên màn hình OLED ngoài nắng.

## Lỗi đã gặp khi chạy thử: "dark mode is type 'media'"

Lần chạy đầu trên bản web ném lỗi:

```
Cannot manually set color scheme, as dark mode is type 'media'.
Please use StyleSheet.setFlag('darkMode', 'class')
```

**Nguyên nhân:** NativeWind nhét kiểu dark mode vào CSS đã biên dịch dưới dạng biến `--css-interop-darkMode`, và `runtime/web/color-scheme.js` đọc biến đó **đúng một lần lúc nạp module**. Metro còn cache bản CSS dựng trước khi `tailwind.config.js` có `darkMode: "class"`, nên runtime vẫn thấy `media`.

**Chữa gốc:** `npx expo start --clear`. Bản build kiểm lại cho ra `--css-interop-darkMode:class dark` — cấu hình đúng, chỉ là chưa tới được runtime.

**Chữa thêm ở code:** bọc `colorScheme.set` trong try/catch. Đổi màu là việc trang trí, không được phép làm sập app. `themeReady` cũng phải bật kể cả khi đặt chế độ thất bại, nếu không người dùng kẹt vĩnh viễn ở màn loading.

Bản native không dính lỗi này — `native/appearance-observables.js` gọi thẳng `Appearance.setColorScheme()`, không đọc flag.

**Bài học:** sửa `tailwind.config.js` thì phải xoá cache Metro. Đã ghi vào [06-agent.md](06-agent.md).

## Lỗi thứ hai, nghiêm trọng hơn: `userInterfaceStyle` khoá cứng ở "light"

`app.json` có `"userInterfaceStyle": "light"` từ trước. Nó bảo hệ điều hành rằng app **chỉ hỗ trợ chế độ sáng**, nên `Appearance.getColorScheme()` trên máy thật luôn trả `"light"` bất kể cài đặt của người dùng.

Hệ quả nếu không sửa: **dark mode không bao giờ chạy trên native**, kể cả khi mọi thứ khác đã đúng. Chế độ "Tự động" luôn ra sáng, và `colorScheme.set("dark")` cũng bị hệ điều hành ghi đè.

Đã đổi thành `"automatic"`.

Đây là lỗi tôi bỏ sót ở lượt làm dark mode — chỉ lộ ra khi chạy thử. Bài học: **làm dark mode thì phải kiểm `app.json`**, không chỉ `tailwind.config.js`.

## Đã thử và loại: `app/+html.jsx`

Có cân nhắc khai biến `--css-interop-darkMode` thẳng trong HTML tĩnh để nó có mặt trước khi bundle chạy. **Không dùng được**: dự án để `web.output` mặc định (`single`), và bản export chứng minh expo-router bỏ qua `+html.jsx` ở chế độ đó — HTML sinh ra vẫn là template mặc định. Cách này chỉ có tác dụng khi `web.output` là `static`.

## Gộp khuôn hai lớp phủ của header

`AppDrawer` (trái) trước đây là panel cao hết màn hình trượt từ mép trái, còn `ProfileMenu` (phải) là thẻ nổi bo góc. Hai lớp phủ mở ra từ **cùng một thanh header** mà trông như hai thành phần của hai app khác nhau.

Đã cho drawer dùng chung khuôn với ProfileMenu: cùng thẻ `w-56` bo góc, cùng cỡ chữ `text-[13px]`, cùng khoảng đệm `px-3 py-2.5`, cùng kiểu bung ra (scale + trượt dọc), cùng độ mờ nền `bg-black/20`.

Hai thay đổi kèm theo:

- **Bỏ chữ IN HOA giãn ký tự** ở nhãn mục — `navItems.js` vốn đã viết hoa đầu từ ("Tin Mới Nhất"), ép uppercase nữa là thừa và làm nhãn dài ra.
- **Mục đang mở** đổi từ vạch dọc bên trái sang chữ + icon accent kèm một chấm tròn cuối dòng. Vạch dọc phải luôn chiếm chỗ (kể cả khi trong suốt) để chữ không nhích ngang; chấm cuối dòng không có vấn đề đó.

Sửa một trong hai file thì phải sửa cả file kia — đã ghi vào [07-web-mapping.md](07-web-mapping.md).

## Nợ để lại

| Chỗ | Vấn đề |
|---|---|
| `shadow` trong `tokens.js` | Bóng đen trên nền tối gần như không thấy; lớp nổi hiện chỉ nhận biết bằng nền sáng hơn |
| `src/constants/tournament.js` | Badge vẫn hardcode hex. Nền đặc chữ trắng nên đọc được ở cả hai chế độ, chưa gấp |
| Ảnh hero | Lớp phủ tối cố định, ở chế độ tối có thể muốn đậm hơn |

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
