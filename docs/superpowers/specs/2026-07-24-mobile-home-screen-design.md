# Thiết kế: Trang chủ mobile sau đăng nhập

Ngày: 2026-07-24

## Mục tiêu

Dựng trang chủ hiển thị ngay sau khi player đăng nhập, bám trang chủ của web FE
(`SU26_SEP490_G2_FE/src/pages/Home/`): Banner + Tin tức + Lịch thi đấu + Top tay cơ.

## Bối cảnh: web dùng dữ liệu gì

Cả 4 khối trên web đều **hardcode**, không gọi API nào — kể cả ảnh tay cơ cũng trỏ thẳng
sang `matchroompool.com`. Bản mobile thay hai khối bằng API thật:

| Khối | Web | Mobile |
| --- | --- | --- |
| Banner | ảnh tĩnh | ảnh tĩnh (dùng lại `assets/auth-hero.jpg`) |
| Tin tức | 5 item hardcode | `GET /news?size=5` |
| Lịch thi đấu | 4 item hardcode | `GET /tournaments?size=4` |
| Top tay cơ | 9 tay cơ hardcode | giữ hardcode — backend chưa có endpoint |

Backend chỉ có `/tournaments/{id}/rankings` (xếp hạng trong một giải), không có bảng xếp
hạng tay cơ toàn hệ thống. Khối Top tay cơ giữ dữ liệu tĩnh cho tới khi BE mở endpoint.

## Cấu trúc route

```
app/(app)/
  _layout.jsx     giữ nguyên (guard đăng nhập)
  home.jsx        trang chủ mới
  profile.jsx     nội dung home cũ (tên, vai trò) + nút đăng xuất
```

Header trang chủ: logo `CAPSTONE.` bên trái, nút avatar bên phải điều hướng sang
`/(app)/profile`.

## Component

```
src/components/home/
  HomeHeader.jsx      logo + nút avatar
  HomeBanner.jsx      ảnh banner
  SectionHeader.jsx   tiêu đề khối + nút "Tất cả" (dùng lại cho cả 3 khối)
  NewsSection.jsx     gọi GET /news
  ScheduleSection.jsx gọi GET /tournaments
  RankedSection.jsx   đọc từ constants
```

**Mỗi khối tự lo dữ liệu và trạng thái của mình.** Đây là điểm chính của thiết kế: hai
khối gọi hai API khác nhau, nên một khối lỗi không được kéo sập cả trang. Hai phương án
đã loại: gom hết vào `home.jsx` (thành file ~400 dòng), và tải hết ở màn cha rồi truyền
xuống (một API chậm làm cả trang trắng).

Layout đổi từ grid 2 cột của web sang **1 cột dọc**: mỗi khối là một card lớn nổi bật rồi
tới danh sách nhỏ. Riêng Top tay cơ là card #1 lớn + lưới 2 cột cho hạng 2-9.

## Lớp dữ liệu cần thêm

Chép từ web FE, đổi đường dẫn import:

- `src/utils/pagination.js` — `parsePagedResponse` bóc `{ content, page, size, totalElements, totalPages }`
- `src/api/newsApi.js` — `listPublishedPosts`
- `src/api/publicTournamentApi.js` — `listPublicTournaments`
- `src/constants/topPlayers.js` — 9 tay cơ tĩnh
- `src/utils/date.js` — `fmtDateShort` định dạng ngày tiếng Việt

Field lấy từ code web đang dùng chính các API này:

| Nguồn | Field |
| --- | --- |
| News | `id`, `slug`, `title`, `thumbnailUrl`, `categoryName`, `publishedAt` |
| Tournament | `id`, `name`, `thumbnailUrl`, `startAt`, `endAt`, `gameType`, `status` |

Ảnh thiếu (`thumbnailUrl` rỗng) thì fallback về `assets/auth-hero.jpg`.

## Trạng thái và lỗi

Mỗi khối có ba trạng thái: **đang tải** (khối skeleton xám), **có dữ liệu**, và
**lỗi hoặc rỗng** (một dòng chữ nhạt: "Chưa có tin tức", "Không tải được lịch thi đấu").

Không dùng toast — lỗi của một khối không nên chặn cả màn hình.

## Rủi ro đã biết

`GET /news` và `GET /tournaments` trả **401** khi gọi không kèm token, dù web gọi chúng là
endpoint "public". Không ảnh hưởng ở đây vì trang chủ chỉ hiện sau đăng nhập và
`axiosClient` đã tự gắn `Bearer` token.

Hệ quả: **shape response chưa được kiểm chứng bằng dữ liệu thật.** Các field ở trên suy ra
từ code web đang chạy. Nếu backend trả khác, phải chỉnh lại khi chạy thử với tài khoản thật.

## Kiểm chứng

Đăng nhập bằng tài khoản player rồi xem trang chủ: ba khối lên đủ, ảnh có fallback khi
thiếu, bấm avatar sang được màn hồ sơ và đăng xuất vẫn hoạt động. Thử cả trường hợp tắt
backend để xác nhận từng khối hiện thông báo lỗi riêng thay vì làm trắng màn.
