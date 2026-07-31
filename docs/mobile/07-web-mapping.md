# Ánh xạ Web ↔ Mobile

Cập nhật: 2026-07-28

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
| Hồ sơ cơ thủ | `/event/players/:participantId` | `pages/Event/PlayerProfilePage.jsx` | ⏳ | |
| Đăng ký giải | `/player/tournaments/:id/register` | `pages/Player/TournamentRegisterPage.jsx` | 🎯 | `app/(app)/tournaments/[id]/register.jsx` |
| Đăng ký của tôi | `/player/registrations` | `pages/Player/MyRegistrationsPage.jsx` | ✅ | `app/(app)/my-registrations.jsx` |
| Chi tiết đăng ký | (modal trong `MyRegistrationsPage`) | `pages/Player/MyRegistrationsPage.jsx` | ✅ | `app/(app)/my-registrations/[id].jsx` |
| Lịch thi đấu của tôi | `/player/matches` | `pages/Player/PlayerMatchSchedulePage.jsx` | 🎯 | `app/(app)/my-matches.jsx` |
| Lịch sử thanh toán | `/player/payments` | `pages/Payment/MyPaymentsPage.jsx` | ⏳ | |
| Chi nhánh | `/branches`, `/branches/:id` | `pages/Branch/index.jsx`, `BranchDetailPage.jsx` | ✅ | `app/(app)/branches.jsx`, `app/(app)/branches/[id].jsx` |
| Kết quả thanh toán | `/payment/success`, `/payment/cancel` | `pages/Payment/PaymentSuccessPage.jsx` | ⏳ | Cần deep link, xem ghi chú cuối trang |

Sáu màn công khai (giải đấu, tin tức, cơ sở) đã xong ngày 2026-07-29. Route giữ đúng tên web (`/event`, `/news`, `/branches`) chứ không phải `tournaments` như bảng này từng dự kiến — nhờ vậy `key` trong `navItems.js` khớp thẳng `activeKey` mà layout truyền cho drawer.

Trang chủ giờ nối được hết: cả nút "Tất cả" của khối Tin tức lẫn nút "Toàn bộ" và từng thẻ của khối Lịch thi đấu. Khối Top tay cơ vẫn chưa có màn đích.

**Lưu ý về `/branches`:** web có hai nhóm màn chi nhánh khác hẳn nhau — `/branches` (công khai, `CommonLayout`) và `/owner/branches`, `/manager/branches` (quản trị, có tạo/sửa/xoá). Mobile chỉ làm nhóm công khai.

**Nội dung bài viết là HTML.** Mobile không dùng WebView mà tự chuyển sang component gốc — xem `src/utils/html.js` và mục 11d trong [08-reusable-patterns.md](08-reusable-patterns.md). Bảng và video nhúng mất định dạng nhưng chữ vẫn giữ.

Ba chỗ trong màn giải đấu còn chờ màn khác:

| Chờ màn | Hiện đang |
|---|---|
| `/player/tournaments/:id/register` | Khối phí vẫn hiện, thay nút đăng ký bằng ghi chú |
| `/event/players/:participantId` | Tên cơ thủ chỉ để đọc, không bấm được |
| WebSocket realtime | Tab Trực tiếp tự làm mới mỗi 15 giây |

Chi tiết thiết kế: `docs/superpowers/specs/2026-07-29-event-screens-design.md`.

## Menu điều hướng của web

`Header.jsx` có 6 mục: Tin Mới Nhất (`/news`), Tỷ Số Trực Tiếp (chưa có), Giải Đấu (`/event`), Cơ Sở (`/branches`), Bảng Xếp Hạng (chưa có), Cơ Thủ (chưa có).

`src/components/layout/navItems.js` của mobile bám đúng 6 mục này. Thêm màn mới thì cập nhật file đó, **không** hardcode trong `AppDrawer`.

Menu hồ sơ của web (PLAYER): Hồ sơ, Đăng ký của tôi, Lịch thi đấu, Lịch sử thanh toán, Đăng xuất.

Mobile khai lại đúng menu này trong `PLAYER_MENU` của `src/components/layout/ProfileMenu.jsx` — **không** nằm trong `navItems.js`. Màn của PLAYER thì điền `path` ở đó, màn công khai thì điền ở `navItems.js`.

---

# Nhóm STAFF — làm sau PLAYER

| Màn | Route web | File web | Mobile |
|---|---|---|---|
| Trận của tôi | `/staff/matches` | `pages/Staff/Matches/StaffMatchListPage.jsx` | ⏳ |
| Bảng điểm | `/staff/matches/:matchId` | `pages/Staff/Matches/StaffScoringPage.jsx` + `components/staff/ShotClock.jsx` | ⏳ |

Đây là nhóm hưởng lợi nhiều nhất từ mobile — trọng tài cầm điện thoại ngay tại bàn. Nhưng màn bảng điểm dùng WebSocket realtime, cần thiết kế riêng trước khi làm.

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

Web dùng PayOS, redirect về `/payment/success` hoặc `/payment/cancel`. Trên mobile luồng này cần deep link (`expo-linking` đã có trong `package.json`) để quay lại app sau khi thanh toán trên trình duyệt.

Phải có spec riêng trước khi làm — đây không phải màn dựng theo khuôn thông thường.

---

# Khi web chưa có màn tương ứng

Ba mục "Tỷ Số Trực Tiếp", "Bảng Xếp Hạng", "Cơ Thủ" trong menu web hiện `path: null` — chưa làm.

Nếu được giao làm những màn này trên mobile trước, **dừng lại và hỏi**. Mobile không phải nơi định nghĩa giao diện mới cho hệ thống.
