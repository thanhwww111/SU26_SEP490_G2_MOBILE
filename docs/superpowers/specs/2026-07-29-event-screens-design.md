# Giải đấu — danh sách `/event` và chi tiết `/event/[id]`

Ngày: 2026-07-29

## Mục đích

Cho người dùng (chủ yếu PLAYER và khách xem) tìm giải đấu, xem thông tin giải, danh sách cơ thủ, lịch/kết quả trận và bảng xếp hạng chung cuộc ngay trên điện thoại.

Đây cũng là màn đích còn thiếu của trang chủ: `ScheduleSection` đang có nút "Toàn bộ" và các thẻ giải nhưng chưa nối được đi đâu.

## Tham chiếu web

| Màn | Route web | File web |
|---|---|---|
| Danh sách | `/event` | `pages/Event/index.jsx` |
| Chi tiết | `/event/:id` | `pages/Event/EventDetailPage.jsx`, `MatchesTab.jsx`, `RankingTab.jsx` |

Route mobile giữ nguyên tên web (`/event`, `/event/[id]`) thay vì `tournaments` như bảng ánh xạ dự kiến — người dùng yêu cầu khớp web, và `key: "event"` trong `navItems.js` nhờ đó khớp thẳng `activeKey` mà `app/(app)/_layout.jsx` truyền cho drawer (segment cuối của route).

### Khác biệt so với web, kèm lý do

| Web | Mobile | Lý do |
|---|---|---|
| Lưới 3 cột thẻ giải | Một cột | Màn hẹp |
| Thanh số trang `AdminPagination` | Cuộn tới đâu tải tới đó | Bấm số trang bằng ngón tay vừa nhỏ vừa ngược thói quen cuộn — giống `MyRegistrationList` |
| Thẻ giải tỷ lệ 4:5, tên chồng lên ảnh | Ảnh 16:9, tên nằm dưới ảnh | Ảnh dọc 4:5 chiếm gần hết màn điện thoại, mỗi lần cuộn chỉ thấy một giải |
| Tab Trận đấu có cả sơ đồ bracket SVG (zoom, kéo) | Chỉ danh sách theo vòng | `07-web-mapping.md` đã chốt bracket cần màn rộng |
| Tab Trực tiếp cập nhật qua WebSocket | Tự làm mới mỗi 15s + kéo để làm mới | Mobile chưa có thư viện STOMP/SockJS trong `package.json` |
| Modal chi tiết cơ thủ | Không có | Màn hồ sơ cơ thủ chưa dựng trên mobile |
| Nút "Đăng ký tham dự" | Ghi chú thay cho nút | Màn `/player/tournaments/:id/register` chưa dựng trên mobile |

## Route

```
app/(app)/event.jsx        → /(app)/event
app/(app)/event/[id].jsx   → /(app)/event/{id}
```

Vào từ: drawer (mục "Giải Đấu"), khối "Lịch thi đấu" ở trang chủ.
Ra: thẻ giải → chi tiết; trong chi tiết, khối đã-đăng-ký → `/(app)/my-registrations`.

Header và nút quay lại do `app/(app)/_layout.jsx` dựng — hai màn này không tự dựng.

## API

| Endpoint | Method | Dùng cho | Response |
|---|---|---|---|
| `/tournaments` | GET | Danh sách, lọc `status`, tìm `search`, phân trang | `PageResponse<TournamentListItemResponse>` |
| `/tournaments/{id}` | GET | Tab Thông tin | `TournamentDetailResponse` |
| `/tournaments/{id}/participants` | GET | Tab Cơ thủ | `ParticipantResponse[]` |
| `/tournaments/{id}/matches` | GET | Tab Trận đấu, Tab Trực tiếp | `MatchResponse[]` |
| `/tournaments/{id}/rankings` | GET | Tab Xếp hạng | `TournamentRankingResponse` |

Tất cả đều công khai, không cần đăng nhập (`SecurityConfig` cho `/tournaments/**` đọc tự do).

### Ba điểm dễ sai trong hợp đồng dữ liệu

1. `/rankings` trả **object** `{ tournamentId, tournamentStatus, isOfficial, entries[] }`, **không phải mảng**. `10-data-contracts.md` đang ghi sai — sửa cùng lượt này.
2. `ParticipantResponse` có `avtarUrl` (thiếu chữ `a`, lỗi chính tả nằm ở backend), **không có** `avatarUrl`. Web đọc `p.avatarUrl || p.avtarUrl` nên vẫn chạy; mobile đọc thẳng `avtarUrl`.
3. `TournamentRankingEntryResponse` **không có** trường ảnh. `RankingTab.jsx` bên web đọc `player.avatarUrl` nên nhánh ảnh ở đó không bao giờ chạy. Mobile chỉ dựng fallback chữ cái đầu.

## Component

**Tái dùng:** `RemoteImage`, `SectionState`, `AppFooter`, `Input`, `Button`, `getTournamentBadge`, `fmtDateRange` / `fmtDateShort` / `fmtDateTime`, `parsePagedResponse`, `colors` / `iconSize`.

**Tạo mới** — `src/components/tournament/`:

| File | Vai trò |
|---|---|
| `TournamentCard.jsx` | Một giải trong danh sách |
| `TournamentFilterBar.jsx` | Chip lọc trạng thái cuộn ngang + ô tìm kiếm |
| `TournamentList.jsx` | `FlatList` + tải trang + kéo làm mới (màn `/event`) |
| `TournamentDetail.jsx` | Tải chi tiết, dựng hero + thẻ thông tin + thanh tab |
| `TournamentTabBar.jsx` | Thanh tab nổi ở đáy |
| `tabs/InfoTab.jsx` | Khối CTA đăng ký, thời gian, slot, phí/giải thưởng, thể thức, giới thiệu |
| `tabs/PlayersTab.jsx` | Danh sách cơ thủ + tìm theo tên |
| `tabs/MatchesTab.jsx` | Trận nhóm theo vòng |
| `tabs/LiveTab.jsx` | Trận đang `IN_PROGRESS` |
| `tabs/RankingTab.jsx` | Vô địch nổi bật + các hạng còn lại |
| `MatchRow.jsx` | Một dòng trận, dùng chung cho tab Trận đấu và Trực tiếp |
| `PlayerAvatar.jsx` | Ảnh cơ thủ, fallback chữ cái đầu theo màu ổn định |

Lý do không tái dùng `RegistrationCard`: khác hoàn toàn về trường dữ liệu và có ảnh bìa.

**Hằng số mới** — bổ sung vào `src/constants/tournament.js`: `TOURNAMENT_STATUS_FILTERS`, `participantTypeLabel`, `getMatchStatus`. Tiền tệ đưa vào `src/utils/format.js` (`fmtCurrency`) vì màn đăng ký sau này cũng cần.

## Luồng dữ liệu

**Danh sách:** tải trang 0 lúc gắn màn; đổi chip lọc hoặc gửi tìm kiếm thì reset về trang 0 và thay toàn bộ `items`; cuộn tới cuối tải trang kế; kéo xuống làm mới trang 0. Tìm kiếm chỉ chạy khi bấm nút gửi trên bàn phím, không gõ-tới-đâu-gọi-tới-đó (mỗi ký tự một request trên mạng 3G là không chấp nhận được).

**Chi tiết:** `TournamentDetail` tải `/tournaments/{id}`. Mỗi tab tự gọi API của nó **lần đầu được mở** và giữ lại dữ liệu khi chuyển tab — đổi tab qua lại không gọi lại API.

Tab Trực tiếp thêm `setInterval` 15s, chỉ chạy khi tab đang hiển thị, dọn khi rời tab.

## Trạng thái

| Khối | Loading | Data | Empty | Error |
|---|---|---|---|---|
| Danh sách | `SectionState` trong `ListEmptyComponent` | Thẻ giải | "Không có giải đấu nào phù hợp" + nút xoá bộ lọc | Thông báo + nút thử lại |
| Chi tiết (khung) | Spinner giữa màn | Hero + tab | — | Thông báo + nút thử lại |
| Từng tab | Spinner trong vùng tab | Nội dung tab | Câu riêng cho từng tab | Thông báo trong vùng tab |

Spinner toàn màn ở khung chi tiết là chấp nhận được vì cả màn phụ thuộc đúng một request (`01-design-system.md` Phần 7). Lỗi của một tab không được kéo sập khung.

## Rủi ro đã biết

- **Tab Trực tiếp không realtime.** Người dùng thấy tỷ số trễ tối đa 15s. Cần nhóm quyết định có cài `@stomp/stompjs` cho mobile không.
- **Không phân trang trong các tab chi tiết.** `/participants` và `/matches` trả mảng trần, không phân trang. Giải 128 người sẽ render 128 dòng bằng `.map()` trong `ScrollView`. Chấp nhận được ở quy mô hiện tại; nếu chậm thì đổi sang `FlatList` và bỏ hero khỏi vùng cuộn.
- **`isPublicRatio`.** Web ẩn ba tab Trận đấu / Trực tiếp / Xếp hạng khi giải tắt cờ này. Mobile làm y hệt — nếu backend trả `null` thì coi như tắt.
- **Tab Trận đấu bị khoá khi giải còn `OPEN_FOR_REGISTRATION`** (web đặt `matchesLocked`), vì lịch chưa xếp.

## Cách kiểm chứng

1. `npm start`, mở trên máy thật cùng mạng LAN với backend.
2. Drawer → "Giải Đấu" → danh sách hiện, mục đang chọn sáng màu accent.
3. Đổi từng chip lọc; gõ tìm kiếm rồi gửi; kéo làm mới; cuộn tới cuối để tải thêm.
4. Bấm một thẻ → chi tiết, đi hết 5 tab.
5. Mở một giải `OPEN_FOR_REGISTRATION` (tab Trận đấu phải bị khoá) và một giải `COMPLETED` (tab Xếp hạng phải có dữ liệu).
6. Tắt Wi-Fi giữa chừng → mỗi khối hiện lỗi riêng, không crash, nút thử lại chạy.
7. Giải chưa có cơ thủ / chưa có trận → hiện Empty, không hiện lỗi.
