# Ánh xạ Web ↔ Mobile

Cập nhật: 2026-08-08

Web FE là chuẩn giao diện. Trước khi dựng bất kỳ màn nào, tra bảng này để biết **đọc file nào bên web**.

Đường dẫn web đầy đủ: `D:\HocTap\SEP490_G2_BiliardsManager\SU26_SEP490_G2_FE\src\`
Nguồn của bảng: `src/constants/routes.js` (mảng `ROUTES`) và `src/components/layouts/Header.jsx`.

Cột **Mobile**:
- `✅` — đã có trên mobile
- `🎯` — ưu tiên làm tiếp
- `⏳` — sẽ làm sau
- `❌` — không đưa lên mobile

---

# Nhóm công khai / PLAYER — ưu tiên cao nhất

| Màn | Route web | File web | Mobile | Route mobile |
|---|---|---|---|---|
| Trang chủ | `/` | `pages/Home/index.jsx` + `components/{Banner,News,Schedule,Ranked}.jsx` | ✅ | `app/(app)/home.jsx` |
| Đăng nhập | `/login` | `pages/Auth/LoginPage.jsx` | ✅ | `app/(auth)/login.jsx` |
| Đăng ký | `/register` | `pages/Auth/RegisterPage.jsx` | ✅ | `app/(auth)/register.jsx` |
| Quên mật khẩu | `/forgot-password` | `pages/Auth/ForgotPasswordPage.jsx` | ✅ | `app/(auth)/forgot-password.jsx`, `reset-password.jsx` |
| Hồ sơ | `/profile` | `pages/Profile/` (`index.jsx`, `ProfileForm.jsx`, `ProfileAvatarPanel.jsx`, `ProfileChangePassword.jsx`) | ✅ | `app/(app)/profile.jsx` |
| Danh sách tin | `/news` | `pages/News/NewsListPage.jsx` | ✅ | `app/(app)/news.jsx` |
| Chi tiết tin | `/news/:slug` | `pages/News/ArticleDetailPage.jsx` | ✅ | `app/(app)/news/[slug].jsx` |
| Danh sách giải | `/event` | `pages/Event/index.jsx` | ✅ | `app/(app)/event.jsx` |
| Chi tiết giải | `/event/:id` | `pages/Event/EventDetailPage.jsx` + `MatchesTab.jsx`, `RankingTab.jsx`, `eventTheme.css` | ✅ | `app/(app)/event/[id].jsx` |
| Hồ sơ cơ thủ (tài khoản) | `/event/players/user/:userId` | `pages/Event/PlayerProfilePage.jsx` | ✅ | `app/(app)/players/[userId].jsx` |
| Hồ sơ cơ thủ (suất dự giải) | `/event/players/:participantId` | `pages/Event/PlayerProfilePage.jsx` | ✅ | `app/(app)/players/participant/[participantId].jsx` |
| Bảng xếp hạng | `/rankings` | `pages/Rankings/index.jsx` | ✅ | `app/(app)/rankings.jsx` |
| Đăng ký giải | `/player/tournaments/:id/register` | `pages/Player/TournamentRegisterPage.jsx` | ✅ | `app/(app)/register/[id].jsx` |
| Đăng ký của tôi | `/player/registrations` | `pages/Player/MyRegistrationsPage.jsx` | ✅ | `app/(app)/my-registrations.jsx` |
| Chi tiết đăng ký | (modal trong `MyRegistrationsPage`) | `pages/Player/MyRegistrationsPage.jsx` | ✅ | `app/(app)/my-registrations/[id].jsx` |
| Lịch thi đấu của tôi | `/player/matches` | `pages/Player/PlayerMatchSchedulePage.jsx` | ✅ | `app/(app)/matches.jsx` |
| Lịch sử thanh toán | `/player/payments` | `pages/Payment/MyPaymentsPage.jsx` | ✅ | `app/(app)/payments.jsx` |
| Chi nhánh | `/branches`, `/branches/:id` | `pages/Branch/index.jsx`, `BranchDetailPage.jsx` | ✅ | `app/(app)/branches.jsx`, `app/(app)/branches/[id].jsx` |
| Kết quả thanh toán | `/payment/success`, `/payment/cancel` | `pages/Payment/PaymentSuccessPage.jsx` | ✅ | Không có màn riêng — xem ghi chú cuối trang |

**Chi tiết giải cho PLAYER.** Web tách `/player/tournaments/:id` (`PlayerTournamentDetailPage`) khỏi `/event/:id` công khai. Mobile gộp làm một: tab Thông tin của `app/(app)/event/[id].jsx` đã có đủ khối kêu gọi đăng ký, phí, số slot và trạng thái đăng ký của tôi. Hai màn riêng trên điện thoại chỉ khiến người dùng thấy cùng một giải ở hai chỗ khác nhau.

**Hai nhánh hồ sơ cơ thủ.** Web đặt `participantId` ở gốc và `userId` ở dưới `user/`; mobile làm ngược lại vì màn `userId` có trước và đã được trang chủ lẫn bảng xếp hạng trỏ tới. Suất dự giải có gắn tài khoản thì `PlayerProfileView` tự chuyển tiếp sang nhánh `userId` — giống web.

**Dải chữ chạy ở trang chủ: cố ý không có trên mobile.** Web chèn ba dải Marquee ngăn giữa các khối (`pages/Home/components/Marquee.jsx`). Bản mobile đã được dựng ngày 2026-08-08 rồi gỡ bỏ ngay: đó là chi tiết trang trí của landing page desktop, trên màn hẹp nó chỉ ăn chiều cao và bắt máy chạy một hoạt ảnh không bao giờ dừng. **Đừng dựng lại** — nếu thấy thiếu so với web thì đây là lý do.

Sáu màn công khai (giải đấu, tin tức, cơ sở) đã xong ngày 2026-07-29. Route giữ đúng tên web (`/event`, `/news`, `/branches`) chứ không phải `tournaments` như bảng này từng dự kiến — nhờ vậy `key` trong `navItems.js` khớp thẳng `activeKey` mà layout truyền cho drawer.

Trang chủ giờ nối được hết, kể cả khối Top tay cơ: nút "Tất cả" mở `/rankings`, từng thẻ cơ thủ mở hồ sơ công khai (2026-08-06).

**Lưu ý về `/branches`:** web có hai nhóm màn chi nhánh khác hẳn nhau — `/branches` (công khai, `CommonLayout`) và `/owner/branches`, `/manager/branches` (quản trị, có tạo/sửa/xoá). Mobile chỉ làm nhóm công khai.

**Nội dung bài viết là HTML.** Mobile không dùng WebView mà tự chuyển sang component gốc — xem `src/utils/html.js` và mục 11d trong [08-reusable-patterns.md](08-reusable-patterns.md). Bảng và video nhúng mất định dạng nhưng chữ vẫn giữ.

Màn giải đấu giờ ngang web về chức năng, trừ sơ đồ bracket (cố ý bỏ).

Tab Cơ thủ và tab Xếp hạng đã bấm sang hồ sơ được (2026-08-08), đi bằng nhánh `participantId`. Tab Trực tiếp và tab Trận đấu cùng nghe WebSocket như web, không còn tự làm mới mỗi 15 giây.

**Tab Trận đấu (2026-08-08).** Đọc `/tournaments/{id}/stages` thay cho `/matches` — bảng điểm gộp cần `orderNo` và chip giai đoạn cần `name`, hai trường đó chỉ endpoint stages mới có. Có đủ hai chế độ xem (Lịch đấu, Bảng điểm) và cả ba bộ lọc của web (tên cơ thủ, vòng, giai đoạn). Riêng sơ đồ bracket vẫn không làm — xem mục "Ba chỗ cố ý không sao chép từ web" trong [11-changelog.md](11-changelog.md).

Thứ tự phân định hạng trong bảng điểm phải khớp `BracketGenerationServiceImpl.computeStageStandings()` của backend. Có test: `node scripts/test-standings.js`.

Chi tiết thiết kế: `docs/superpowers/specs/2026-07-29-event-screens-design.md`.

## Menu điều hướng của web

`Header.jsx` có 4 mục: Tin Mới Nhất (`/news`), Giải Đấu (`/event`), Cơ Sở (`/branches`), Bảng Xếp Hạng (`/rankings`).

> **Đổi từ 2026-08-06.** Trước đây mục này ghi 6 mục, thêm "Tỷ Số Trực Tiếp" và "Cơ Thủ". Web đã bỏ cả hai khỏi thanh điều hướng (cùng với "Vé" và "Cửa Hàng" đang bị chú thích lại trong `Header.jsx`), nên mobile bỏ theo. Cả 4 mục còn lại đều đã có màn trên mobile.

`src/components/layout/navItems.js` của mobile bám đúng 4 mục này, cùng thứ tự. Thêm màn mới thì cập nhật file đó, **không** hardcode trong `AppDrawer` — file đó cũng là nguồn cho các link ở `AppFooter`.

Menu hồ sơ của web (PLAYER): Hồ sơ, Đăng ký của tôi, Lịch thi đấu, Lịch sử thanh toán, Đăng xuất.

Mobile khai lại đúng menu này trong `PLAYER_MENU` của `src/components/layout/ProfileMenu.jsx` — **không** nằm trong `navItems.js`. Màn của PLAYER thì điền `path` ở đó, màn công khai thì điền ở `navItems.js`.

Từ 2026-08-17, file đó còn có `STAFF_MENU` (một mục: Trận của tôi), khai đúng `STAFF_NAV` của web. Cùng quy tắc phân chia: màn theo role nằm ở `ProfileMenu`, màn công khai nằm ở `navItems.js`.

**Đích đến sau khi đăng nhập phụ thuộc role.** `getHomeRouteForRole` trong `src/utils/auth.js` (port từ web) đưa STAFF thẳng vào `/(app)/staff/matches`, các role còn lại về trang chủ. Dùng ở cả `login.jsx` lẫn `app/index.jsx` — thêm màn cho role mới thì sửa đúng một chỗ đó.

---

# Nhóm STAFF — xong 2026-08-17

| Màn | Route web | File web | Mobile | Route mobile |
|---|---|---|---|---|
| Trận của tôi | `/staff/matches` | `pages/Staff/Matches/StaffMatchListPage.jsx` | ✅ | `app/(app)/staff/matches.jsx` |
| Bảng điểm | `/staff/matches/:matchId` | `pages/Staff/Matches/StaffScoringPage.jsx` + `ScorePanel.jsx` + `components/staff/ShotClock.jsx` | ✅ | `app/(scoring)/[matchId].jsx` |

Đây là nhóm hưởng lợi nhiều nhất từ mobile — trọng tài cầm điện thoại ngay tại bàn.

**Màn bảng điểm nằm ngoài nhóm `(app)`.** Nó cần trọn màn hình và chạy ngang, nên có nhóm route
riêng `(scoring)` với layout không header, không drawer. Web cũng tách đúng như vậy: màn danh sách
đi qua `withStaffPage` còn màn chấm điểm là route trần (`FE/src/constants/routes.js`, dòng 268–280).

**App giờ khai `orientation: "default"` trong `app.json`.** Bắt buộc, nếu không màn chấm điểm không
xoay ngang được trên bản build thật. Bù lại, `app/(app)/_layout.jsx` tự khoá dọc cho mọi màn khác —
**đừng gỡ lệnh khoá đó**, không thì bảng xếp hạng và chi tiết giải sẽ giãn hết cỡ khi người dùng
nằm nghiêng cầm máy.

**Xử thắng do vắng mặt (walkover) là hành động mobile có mà web chưa có.** Backend đã sẵn sàng từ
trước (`POST /staff/matches/{id}/walkover`). Nó cố ý dùng lại đúng sheet chốt kết quả, chỉ đổi chữ,
để lúc web làm màn này thì hai bên vẫn khớp.

Thiết kế đầy đủ, kèm ba chỗ cố ý không sao chép từ web: `docs/superpowers/specs/2026-08-17-staff-screens-design.md`.

---

# Nhóm OWNER / MANAGER — cân nhắc từng màn

Owner và Manager dùng **chung component**, chỉ khác `api` và `basePath` (xem `routes.js`, các wrapper `OwnerTournamentHub` / `ManagerTournamentHub`).

| Nhóm màn | Route web | Mobile | Lý do |
|---|---|---|---|
| Tổng quan | `/{role}/dashboard` | ⏳ | Xem nhanh trên điện thoại có ích |
| Danh sách giải | `/{role}/tournaments` | ⏳ | |
| Chi tiết giải | `/{role}/tournaments/:id` | ⏳ | |
| Duyệt đăng ký | `/{role}/tournaments/:id/registrations` | ⏳ | Duyệt trên điện thoại có ích |
| Dashboard trực tiếp | `/manager/tournaments/:id/live` | ⏳ | |
| Wizard tạo giải | `/{role}/tournaments/new` | ❌ | Wizard 3 bước, nhiều trường — để trên web |
| Bốc thăm & lịch đấu | `/{role}/tournaments/:id/draw` | ❌ | Bracket kéo thả, cần màn rộng |
| Người tham gia | `/{role}/tournaments/:id/participants` | ❌ | Có import Excel |
| Thống kê & giao dịch | `/{role}/analytics`, `/transactions` | ❌ | Bảng nhiều cột, biểu đồ Highcharts |
| Nhân viên, chi nhánh, bàn | `/{role}/employees`, `/branches`, `/tables` | ❌ | Quản trị, hợp với web |
| CMS tin tức | `/{role}/news` | ❌ | Có rich text editor |
| Thông báo email | `/{role}/tournaments/:id/notifications` | ❌ | |
| Thống kê Facebook | `/{role}/facebook-posts` | ❌ | |

---

# Nhóm ADMIN — không đưa lên mobile

Toàn bộ `/admin/**` là cấu hình hệ thống: thể thức giải (wizard 4 bước), loại bi, catalog trường, template form đăng ký (wizard 3 bước), mẫu email, quy tắc tự động, nhật ký email, quản lý tài khoản.

Đây là công việc bàn giấy, làm trên web. Nếu sau này cần, chỉ nên đưa màn **xem** lên mobile, không đưa màn wizard.

---

# Màn chỉ có trên web

| Màn | Route | Ghi chú |
|---|---|---|
| TV trực tiếp | `/live/tournament/:id` | Thiết kế cho màn hình lớn treo tường |
| Hồ sơ nhân viên | `/staffProfile/:slug` | |

---

# Cách chuyển layout web sang mobile

## Nhiều cột → một cột

Trang chủ web xếp Banner | News và Schedule | Ranking thành lưới. Mobile xếp dọc, thứ tự giữ nguyên như web đọc từ trái sang phải, trên xuống dưới.

## Bảng → thẻ

Web dùng `<table>` cho danh sách đăng ký, trận đấu, giao dịch. Mobile **không dùng bảng cuộn ngang** — đổi mỗi dòng thành một `Card` xếp dọc, đưa 3–4 trường quan trọng nhất lên, phần còn lại vào màn chi tiết.

## Tab → tab hoặc màn riêng

`EventDetailPage` của web có các tab (Trận đấu, Bảng xếp hạng). Trên mobile, nếu chỉ 2–3 tab thì giữ tab ngang; nhiều hơn thì tách thành màn riêng.

## Hover → nhấn

Web dùng `hover:` cho nhiều gợi ý thị giác. Native không có hover — đổi sang `active:`. Thông tin chỉ hiện khi hover thì phải hiện sẵn hoặc đưa vào màn chi tiết.

## Modal → bottom sheet hoặc màn riêng

Modal giữa màn hình khó thao tác một tay. Form ngắn → bottom sheet; form dài → màn riêng.

## Thanh điều hướng → menu xổ

Thanh ngang 6 mục của web (`Header.jsx`) đổi thành `AppDrawer` — menu xổ ra từ nút hamburger bên trái.

**Dùng chung khuôn với `ProfileMenu` bên phải**: cùng thẻ nổi bo góc `w-56`, cùng cỡ chữ `text-[13px]`, cùng khoảng đệm `px-3 py-2.5`, cùng kiểu bung ra. Hai lớp phủ mở từ cùng một thanh header nên phải trông như một bộ; sửa cái này thì sửa cả cái kia.

Mục đang mở đánh dấu bằng chữ + icon màu accent và một chấm tròn cuối dòng — không dùng vạch dọc bên trái, vì vạch đó làm chữ nhích ngang mỗi lần đổi mục.

---

# Ghi chú về thanh toán

Web dùng PayOS, redirect về `/payment/success` hoặc `/payment/cancel`. **Mobile không dựng hai màn đó và cũng không dùng deep link** — `PayOSServiceImpl` đọc `returnUrl` từ cấu hình server chứ không nhận từ client, nên PayOS luôn trả về bản web, không có cách nào bắt nó quay về `btms://`.

Cách đi vòng: mở PayOS bằng trình duyệt trong app (`expo-web-browser`), rồi nhờ backend hỏi thẳng PayOS xem đơn đã trả tiền chưa (`POST /player/payments/confirm-return`). Backend không tin lời client, nên không phải sửa gì phía server.

Toàn bộ khâu này nằm ở `src/hooks/usePayOsCheckout.js`, dùng chung cho màn đăng ký giải và màn chi tiết đăng ký. **Đọc hook đó trước khi đụng vào luồng thanh toán** — nó giải thích vì sao mã đơn phải ghi xuống bộ nhớ trước khi mở trình duyệt, và vì sao phải đối chiếu lại ở ba thời điểm (trình duyệt đóng, app về tiền cảnh, hook gắn lần đầu).

Nguồn sự thật vẫn là webhook của PayOS ở phía server; lời gọi đối chiếu chỉ để người dùng thấy kết quả ngay thay vì phải chờ.

---

# Khi web chưa có màn tương ứng

Ba mục "Tỷ Số Trực Tiếp", "Bảng Xếp Hạng", "Cơ Thủ" trong menu web hiện `path: null` — chưa làm.

Nếu được giao làm những màn này trên mobile trước, **dừng lại và hỏi**. Mobile không phải nơi định nghĩa giao diện mới cho hệ thống.
