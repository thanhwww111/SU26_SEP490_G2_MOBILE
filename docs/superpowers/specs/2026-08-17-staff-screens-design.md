# Khu vực STAFF trên mobile — thiết kế

Chốt 2026-08-17. Trạng thái: **đã dựng xong, chưa chạy trên máy thật.**

Đây là khu vực theo role đầu tiên của app mobile — trước đó chỉ có nhóm công khai và PLAYER.

---

## Phạm vi

Hai màn, đúng những gì web có, cộng một hành động web chưa có:

| Màn | Web | Mobile |
|---|---|---|
| Trận của tôi | `pages/Staff/Matches/StaffMatchListPage.jsx` | `app/(app)/staff/matches.jsx` |
| Bảng điểm | `pages/Staff/Matches/StaffScoringPage.jsx` + `ScorePanel.jsx` + `components/staff/ShotClock.jsx` | `app/(scoring)/[matchId].jsx` |

**Xử thắng do vắng mặt (walkover)** được thêm theo yêu cầu, dù web chưa có. Backend đã sẵn sàng
(`POST /staff/matches/{id}/walkover`, `MatchServiceImpl.walkover`). Để không vi phạm luật "web là
chuẩn giao diện", hành động này **không có giao diện riêng**: nó dùng lại đúng sheet chốt kết quả,
chỉ đổi tiêu đề và phần giải thích. Khi web làm màn này, hai bên vẫn khớp nhau.

---

## API — đã có đủ, không phải sửa backend

| Việc | Endpoint | Ghi chú |
|---|---|---|
| Danh sách trận được gán | `GET /staff/matches` | lọc `tournamentName`, `status` |
| Chi tiết trận | `GET /matches/{id}` | endpoint công khai, dùng cho màn bảng điểm |
| Bắt đầu | `PATCH /staff/matches/{id}/start` | chỉ nhận khi trận PENDING |
| Cộng/trừ điểm | `PATCH /staff/matches/{id}/score/increment` | body `{ playerSlot, delta }` |
| Kết thúc | `POST /staff/matches/{id}/complete` | body `{ winnerParticipantId, confirmEarlyEnd }` |
| Xử vắng mặt | `POST /staff/matches/{id}/walkover` | cùng DTO với complete |

`SecurityConfig.java:48` chặn cả nhóm bằng `hasRole("STAFF")`, và mỗi lời gọi còn qua
`assertStaffAssigned` — trọng tài chỉ thao tác được trên trận đã gán cho chính mình.

### Lỗi của web đã tránh: `confirmEarlyEnd`

`MatchServiceImpl.java:643-653` bắt buộc gửi `confirmEarlyEnd: true` khi kết thúc lúc chưa ai đạt
`raceTo`. `StaffScoringPage.jsx:376` bên web chỉ gửi `winnerParticipantId`, nên nút "Kết thúc trận"
của web khi chưa đủ điểm luôn trả lỗi. Mobile gửi `confirmEarlyEnd: !raceReached` và cảnh báo
trước trong sheet.

---

## Phân quyền — bốn lớp

| Lớp | Tệp | Làm gì |
|---|---|---|
| Sau đăng nhập | `app/(auth)/login.jsx` | `getHomeRouteForRole(user.role)` thay cho `/(app)/home` cứng |
| Mở lại app | `app/index.jsx` | cùng hàm trên, để phiên đã lưu rơi đúng chỗ làm việc |
| Guard route | `src/hooks/useRequireStaff.js` | chưa sẵn sàng → chờ; chưa đăng nhập → `/login`; sai role → home theo role |
| Menu | `src/components/layout/ProfileMenu.jsx` | `STAFF_MENU` (Trận của tôi) hiện thay cho `PLAYER_MENU` |

Drawer giữ nguyên bốn mục công khai: trọng tài vẫn xem được tin tức, giải, cơ sở, bảng xếp hạng —
đúng như web, nơi `StaffRoute` chỉ chặn `/staff/**` chứ không chặn trang công khai.

Guard phía mobile **không phải lớp bảo vệ dữ liệu**, chỉ để người dùng sai role khỏi rơi vào màn
luôn báo 403. Nguồn chặn thật vẫn là backend.

---

## Kiến trúc route: vì sao tách hai nhóm

```
app/(app)/staff/matches.jsx    có chrome chung (header, drawer, chuông)
app/(scoring)/_layout.jsx      Stack trần + khoá hướng màn hình, không chrome
app/(scoring)/[matchId].jsx    bảng điểm toàn màn hình, tự gọi guard
```

Guard nằm ở màn chứ không ở layout: màn cần biết trạng thái xác thực để quyết định lúc nào được
gọi API. Thêm route con vào nhóm `(scoring)` thì nhớ gọi `useRequireStaff` trong màn đó.

Bám đúng cách web tách: `StaffMatchListPage` chạy trong layout chung (`routes.js:269`), còn
`StaffScoringRoute` là route trần không qua `withStaffPage` (`routes.js:279`).

Đã cân nhắc gộp cả hai vào `(app)` rồi thêm cờ ẩn header — bỏ, vì `(app)/_layout.jsx` khai
`SafeAreaView edges={["top"]}`; nằm ngang thì tai thỏ chuyển sang cạnh bên, phải đổi cả `edges`
theo hướng máy. Một nhóm route riêng sạch hơn là nhét điều kiện vào layout đang phục vụ 16 màn.

---

## Xoay ngang — cái bẫy trong `app.json`

`app.json` trước đây khai `"orientation": "portrait"`. Khai vậy là bảo hệ điều hành app chỉ hỗ trợ
chế độ dọc: Info.plist và Manifest chỉ đăng ký đúng hướng đó, và `lockAsync(LANDSCAPE)` **không có
tác dụng trên bản build thật**. Trong Expo Go thì vẫn xoay được vì Info.plist lúc đó là của chính
Expo Go — nên lỗi chỉ lộ ra khi build, cùng kiểu bẫy với `userInterfaceStyle` đã ghi ở
[06-agent.md](../../mobile/06-agent.md).

Cách xử lý:

- `app.json` đổi sang `"orientation": "default"`.
- `app/(app)/_layout.jsx` khoá `PORTRAIT_UP` cho toàn bộ 16 màn còn lại — chúng đều dựng cho khổ dọc.
- `app/(scoring)/_layout.jsx` khoá `LANDSCAPE` lúc mở màn, trả lại `PORTRAIT_UP` lúc rời màn.

Cần `expo-screen-orientation` (mới cài, `~9.0.9`). Cả nhóm phải `npm install` sau khi pull.

**Cập nhật 2026-08-17 (c):** khoá ngang là **ưu tiên, không phải điều kiện**. Trên máy thật
`lockAsync` có lúc không ăn (iPad multitasking, máy khoá xoay ở mức hệ thống), và khi đó bố cục
ngang nhét vào khổ dọc thì vỡ. Màn giờ đọc `useWindowDimensions()` và dựng đủ hai bố cục: ngang
thì hai panel cạnh nhau với đồng hồ nổi ở tâm, dọc thì xếp chồng với đồng hồ thành một dải riêng.
Chi tiết ở [11-changelog.md](../../mobile/11-changelog.md), mục 2026-08-17 (c).

---

## Ba chỗ cố ý không sao chép từ web

**Ảnh cơ thủ tràn nền ở bảng điểm.** Web làm mềm biên bằng giao của hai gradient trong một CSS
mask (`maskComposite: intersect`, `ScorePanel.jsx:40-67`). React Native không có `mask-image`;
dựng lại bằng ảnh mờ không mask sẽ ra đúng cái rìa chữ nhật mà web đã cố tránh. Trên màn 6 inch
ảnh nền cũng chỉ làm số điểm khó đọc. Bỏ hẳn thay vì làm nửa vời — kéo theo bỏ cả quầng sáng
radial sau lưng cơ thủ, cùng lý do.

Trạng thái vẫn phân biệt được bằng vạch nhấn mép trên và badge "Đang đánh" — hai thứ web cũng có
và không dựa vào gradient.

**Gradient ở thẻ trận.** Bốn tông thẻ của web (`CARD_TONE`) dựng bằng `bg-gradient-to-r`. Mobile
chưa cài thư viện gradient nên dùng nền đặc, và bốn màu ánh xạ sang token trạng thái của app:
emerald → `success`, indigo → `accent`, amber → `warning`, slate → `muted`.

**Tiếng bíp của đồng hồ.** Web dùng WebAudio (`useShotClock.js:17-39`). Mobile đổi sang rung
(`Vibration` của React Native, không cần cài gì): rung ngắn khi còn 10 giây, rung dài khi hết giờ.
Điện thoại trọng tài thường nằm trên thành bàn giữa tiếng ồn của quán, rung đáng tin hơn tiếng.

---

## Giữ tỷ số đúng khi có ba nguồn cùng ghi

Nút bấm tại chỗ, bản tin WebSocket, và snapshot REST. Thứ tự ưu tiên giữ y hệt web:

- Bấm +1 hiện ngay tỷ số dự đoán (`optimisticScores`), ngón tay không phải chờ mạng.
- Bản tin server ghi đè, **trừ khi** còn lời gọi đang bay — `incrementInFlight` đếm số request
  chưa xong; xoá dự đoán giữa chừng làm số nhảy lùi rồi nhảy tới.
- Mất kết nối rồi nối lại thì tải hẳn snapshot mới, vì lúc rớt có thể đã lỡ vài bản tin.

Backend chốt bằng delta chứ không nhận tỷ số tuyệt đối, nên hai máy cùng chấm một trận không ghi
đè lên nhau.

`useTournamentSocket` dùng lại nguyên bản — hook đó đã tự ngắt khi app xuống nền và nối lại khi
quay lại.

---

## Đồng hồ mỗi cú đánh

Luật giữ nguyên của web (`src/utils/shotClock.js` port nguyên): 30s mỗi cú, cú mở ván 60s, mỗi cơ
thủ một lần gia hạn 30s mỗi ván, báo khi còn 10s, hết giờ là lỗi và mất lượt.

Hook `src/hooks/useShotClock.js` khác bản web ba chỗ, đều do nền tảng:

1. **Lưu trạng thái bất đồng bộ.** Web ghi thẳng `localStorage` trong lúc render. Mobile đi qua
   `src/utils/storage.js` (SecureStore trên native), nên có cờ `hydrated` và ghi gộp nhịp 400ms.
   Chưa khôi phục xong thì chưa ghi, nếu không state khởi tạo đè mất bản đã lưu.
2. **Rung thay tiếng bíp.**
3. **`setInterval` bị bóp khi app xuống nền.** Mốc `endsAt` là thời điểm tuyệt đối nên giờ vẫn
   đúng lúc quay lại, nhưng phải đọc lại `Date.now()` ngay khi app về tiền cảnh, bằng không mặt
   đồng hồ đứng im tới nhịp tick kế tiếp.

**Giữ sáng màn hình**: `expo-keep-awake` đã có sẵn trong `node_modules` (dependency của `expo`),
không phải cài. Chỉ giữ khi trận đang chạy, thả ra khi trận xong.

---

## Tệp

**Mới (13)**

```
app/(app)/staff/matches.jsx
app/(scoring)/_layout.jsx
app/(scoring)/[matchId].jsx
src/api/staffMatchApi.js
src/utils/refereeMatch.js
src/utils/shotClock.js
src/hooks/useShotClock.js
src/hooks/useRequireStaff.js
src/components/staff/RefereeMatchCard.jsx
src/components/staff/RefereeMatchSection.jsx
src/components/staff/ScorePanel.jsx
src/components/staff/ShotClockDial.jsx
src/components/staff/ShotClockControls.jsx
src/components/staff/CompleteMatchSheet.jsx
scripts/test-referee-match.js
```

**Sửa (6)**: `src/utils/auth.js` (+`isStaffUser`, `getHomeRouteForRole`), `src/api/matchApi.js`
(+`getMatchDetail`), `src/components/layout/ProfileMenu.jsx`, `app/(auth)/login.jsx`,
`app/index.jsx`, `app/(app)/_layout.jsx`, `app.json`.

---

## Kiểm chứng

```
node scripts/test-referee-match.js     30 test — phân loại, sắp xếp, lọc ngày, luật đồng hồ
node scripts/test-standings.js         25 test cũ, chạy lại để chắc không vỡ
npx expo export --platform web         bundle sạch
```

**Chưa chạy trên thiết bị thật.** Những chỗ chỉ kiểm được trên máy:

- Khoá xoay ngang khi vào màn chấm điểm và trả về dọc khi thoát.
- Rung cảnh báo 10 giây và rung khi hết giờ.
- Giữ sáng màn hình suốt trận.
- WebSocket nhận bản tin từ máy khác đang chấm cùng trận.
- Trạng thái đồng hồ sống sót khi app xuống nền rồi quay lại.
