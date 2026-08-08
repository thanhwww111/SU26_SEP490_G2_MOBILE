# Bảng xếp hạng cơ thủ + hồ sơ công khai + footer thật

Ngày: 2026-08-06

## Bối cảnh

Trang chủ mobile có bốn khối. Hai khối giữa (`NewsSection`, `ScheduleSection`) đã gọi API
thật. Hai chỗ còn lại chưa:

- **`RankedSection`** đọc mảng cứng `src/constants/topPlayers.js` — 9 cơ thủ nước ngoài chép
  từ trang chủ web, ảnh trỏ sang `matchroompool.com`. Comment trong file nói "backend chưa có
  endpoint xếp hạng toàn hệ thống"; điều đó **không còn đúng**.
- **`AppFooter`** mang thông tin pháp nhân của Matchroom (địa chỉ Essex, `© 2024 Matchroom
  Multi Sport Ltd`, cụm `CAPS.tv`), mười link chữ chết và ba icon mạng xã hội không trỏ đâu.

Backend đã có `PublicLeaderboardController` (`GET /api/v1/leaderboard`) và
`PublicParticipantController` (`GET /api/v1/participants/user/{userId}/profile`). Cả hai nằm
trong `PublicEndpoints.PATTERNS` nên không cần token. FE web đã dùng cả hai:
`pages/Home/components/Ranked.jsx`, `pages/Rankings/index.jsx`, `pages/Event/PlayerProfilePage.jsx`.

Mục tiêu: mobile bám đúng cách web đang làm, không tự nghĩ ra luồng riêng.

## Hợp đồng API

### `GET /leaderboard`

Tham số: `period` (`MONTH|QUARTER|YEAR|ALL`, mặc định `ALL`), `year`, `quarter`, `month`,
`page`, `size`. Trả `PageResponse<LeaderboardEntryResponse>`:

```
rank, userId, playerName, avatarUrl, totalPoints,
tournamentsPlayed, championCount, top3Count, totalPrizeAmount
```

Khoảng thời gian cắt theo lịch Việt Nam (`LeaderboardPeriod.ZONE = Asia/Ho_Chi_Minh`).
Năm sớm nhất có dữ liệu là 2024 (`earliestSelectableYear()`), FE web cứng `FIRST_YEAR = 2024`
để dựng danh sách năm — mobile chép lại đúng con số đó.

Giá trị `period` lạ bị backend nuốt về `ALL` chứ không báo lỗi.

### `GET /participants/user/{userId}/profile`

Trả `PlayerPublicProfileResponse`:

```
participantId, userId, displayName, accountName, avatarUrl,
billiardRank, bio, achievements[]
```

Mỗi `achievements[]`: `tournamentId, tournamentName, rankLabel, note, finalRank,
prizeAmount, pointsEarned, isOfficial`.

Không có trường quốc gia. Web hiển thị cờ 🇻🇳 cứng (`DEFAULT_COUNTRY` trong
`constants/rankingEnums.js`) — đây là giới hạn schema, không phải dữ liệu mẫu. Mobile giữ
nguyên cách xử lý để hai nền tảng không lệch nhau.

## Phần 1 — Footer

`src/components/layout/AppFooter.jsx` viết lại.

Gỡ bỏ: mười link chữ chết, địa chỉ Matchroom, dòng bản quyền Matchroom, cụm `CAPS.tv`, ba
icon mạng xã hội.

Giữ lại và thêm:

- Hàng link điều hướng bấm được, sinh từ `NAV_ITEMS` đã lọc `path !== null`. Một nguồn dữ
  liệu duy nhất cho cả drawer lẫn footer: mở path cho một mục là footer có luôn.
- Logo `caps.`, bấm về `/(app)/home`.
- Một dòng bản quyền: `© {năm hiện tại} CAPSTONE — Nền tảng quản lý giải và tỉ số bi-a.`
  Năm tính động.

Không bịa địa chỉ, điện thoại hay liên kết mạng xã hội — trong repo không có thông tin thật
nào để lấy.

`AppFooter` cần điều hướng nên dùng `useRouter` của expo-router. Mọi màn đặt footer đều nằm
trong nhóm `(app)`, tức dưới router, nên hook này an toàn.

Kiểm tra `src/components/icons/BrandIcons` còn nơi nào dùng không trước khi gỡ import. Không
xoá file kể cả khi footer là nơi duy nhất dùng — ngoài phạm vi đợt này.

## Phần 2 — `RankedSection` gọi API

Xoá `src/constants/topPlayers.js`.

Thêm `src/api/leaderboardApi.js`, sao đúng `FE/src/api/leaderboardApi.js`:

```js
export const getLeaderboard = (params, fallbackSize) =>
  axiosClient.get("/leaderboard", { params })
    .then((res) => parsePagedResponse(getApiData(res), fallbackSize));
```

Thêm `src/constants/leaderboard.js`: `ACCENTS` (dải màu trang trí xoay vòng theo hạng),
`PERIODS`, `FIRST_YEAR = 2024`, `DEFAULT_COUNTRY = { flag: "🇻🇳", name: "Việt Nam" }`,
`RANKING_NOTE_LABELS` (chép từ `FE/src/constants/tournamentConfig.js`).

`RankedSection.jsx` bám `FE/src/pages/Home/components/Ranked.jsx`:

| Web | Mobile |
| --- | --- |
| `getLeaderboard({ period: "YEAR", page: 0, size: 9 })` | giống hệt |
| hạng 1 thành hero card, tám hạng sau xếp lưới | giống hệt, lưới hai cột |
| tiêu đề `Top 9 tay cơ hàng đầu năm {getFullYear()}` | giống hệt |
| hạng 1 hiện `{totalPoints} điểm` | giống hệt |
| rỗng: giữ header + "Chưa có cơ thủ nào tích lũy điểm trong năm nay." | giống hệt |
| bấm thẻ → `/event/players/user/{userId}` | → `/(app)/players/{userId}` |
| nút → `/rankings` | → `/(app)/rankings` |
| `avatarUrl \|\| DEFAULT_PLAYER_AVATAR` kèm `onError` đổi `src` | `PlayerPortrait`, xem dưới |

Loading/lỗi/rỗng đi qua `SectionState` như hai khối kia, không dùng toast: một khối hỏng
không được kéo sập cả trang chủ.

`home.jsx` truyền `onPressAll` cho `RankedSection` để nút "Tất cả" hiện ra —
`SectionHeader` tự ẩn nút khi thiếu handler.

### `PlayerPortrait`

`src/components/player/PlayerPortrait.jsx`. Ảnh chân dung khung chữ nhật; thiếu ảnh hoặc tải
hỏng thì hiện chữ cái đầu trên nền `sunken`.

Đây là chỗ duy nhất lệch web, vì lý do kỹ thuật: React Native không có `onError` đổi `src`
như thẻ `<img>`. `RemoteImage` sẵn có thì fallback về `auth-hero.jpg` — ảnh bàn bi-a, đặt vào
ô chân dung thì sai hẳn. Quy ước chữ cái đầu đã có sẵn trong `PlayerAvatar.jsx`
(dùng `initialsOf` của `utils/format.js`), nên `PlayerPortrait` chỉ là biến thể khung chữ
nhật của cùng quy ước đó.

Dùng ở ba nơi: thẻ trang chủ, hàng bảng xếp hạng, hero màn hồ sơ.

## Phần 3 — Màn Bảng xếp hạng

`app/(app)/rankings.jsx` mỏng, chỉ nối điều hướng; phần việc nằm trong
`src/components/ranking/RankingList.jsx`.

`RankingList` bám khuôn `NewsList.jsx`: `FlatList`, cuộn tới đâu tải tới đó, kéo xuống làm
mới, `AppFooter` ở `ListFooterComponent`, `SectionState` cho ba trạng thái. Lỗi khi tải thêm
trang không được xoá danh sách đang hiển thị.

`RankingFilterBar.jsx`: web dùng `<select>`, mobile không có thẻ đó. Thay bằng chip cuộn
ngang theo đúng khuôn `NewsFilterBar`:

- Hàng 1 — kỳ: Mọi thời điểm / Theo năm / Theo quý / Theo tháng.
- Hàng 2 — năm, chỉ hiện khi kỳ khác `ALL`. Danh sách từ năm hiện tại lùi về `FIRST_YEAR`.
- Hàng 3 — quý (1-4) hoặc tháng (1-12), tuỳ kỳ đang chọn.

Đổi bộ lọc thì dọn danh sách cũ trước khi tải, nếu không người dùng thấy kết quả của bộ lọc
trước nằm ngay dưới chip vừa bấm.

Web ghi bộ lọc vào query string để F5 giữ nguyên kỳ đang xem. Mobile giữ trong state của
component — không có thao tác F5, và expo-router không cần link chia sẻ cho màn này.

`RankingRow.jsx`: `#hạng` · chân dung · tên (họ nhẹ, tên in đậm) · cờ 🇻🇳 · điểm bên phải.
Ba số phụ (giải / vô địch / top 3) bị bỏ khỏi hàng — web cũng ẩn chúng ở màn hẹp
(`hidden lg:flex`), và chúng đã có mặt trong màn hồ sơ.

Rỗng: "Chưa có cơ thủ nào tích lũy điểm trong kỳ này." kèm nút quay về "Mọi thời điểm" khi
kỳ đang chọn khác `ALL`, giống web.

Mở `path: "/(app)/rankings"` cho mục `ranking` trong `src/components/layout/navItems.js`
(đang là `null`, nên mục "Bảng Xếp Hạng" trong drawer đang xám).

## Phần 4 — Màn hồ sơ cơ thủ

`app/(app)/players/[userId].jsx` + `src/components/player/PlayerProfileView.jsx`.

`src/api/publicPlayerApi.js`:

```js
export const getPlayerProfileByUserId = (userId) =>
  axiosClient.get(`/participants/user/${userId}/profile`).then((res) => getApiData(res));
```

Chỉ nhánh theo `userId`. Web còn nhánh `participantId` nhưng nó chỉ để chuyển hướng sang
`userId`; mobile chưa có chỗ nào phát sinh `participantId` nên không dựng nhánh đó.

Hero: chân dung, tên tách hai dòng (họ nhẹ, tên in đậm), badge
`Hạng {BILLIARD_RANK_LABELS[billiardRank]}` — ẩn khi giá trị là `UNKNOWN` hoặc `UNRANKED` —
bio, và hai ô số **Giải tham dự** / **Vô địch** đếm từ `achievements`, đúng cách web tính
(`achievements.length` và số mục có `finalRank === 1`).

Tên hiển thị lấy `accountName || displayName`, giống web.

Danh sách thành tích: mỗi dòng gồm `#finalRank` (màu huy chương vàng/bạc/đồng cho 1/2/3),
tên giải, nhãn `note` qua `RANKING_NOTE_LABELS[note] ?? note` — dòng dữ liệu cũ lưu sẵn text
tiếng Việt nên phải có nhánh fallback — `+{pointsEarned} điểm` khi lớn hơn 0, tiền thưởng khi
lớn hơn 0, và dấu phân biệt kết quả chính thức với tạm thời: icon `Award` màu accent khi
`isOfficial`, icon `Star` màu mờ khi không, đúng cặp icon web dùng (`lucide-react-native` đã
là phụ thuộc sẵn có).

Bấm một dòng mở `/(app)/event/{tournamentId}` — màn này đã có.

Rỗng: "Chưa có thành tích chính thức được ghi nhận".

Lỗi tải: hiện thông báo kèm nút thử lại. Không tự đẩy người dùng về màn khác như web làm
(`navigate("/event")`) — trên mobile việc màn tự nhảy đi khi mạng chập chờn gây mất phương
hướng, và nút quay lại của header đã đủ lối thoát.

## Ngoài phạm vi

- Tab "Cơ thủ" trong chi tiết giải vẫn không bấm được. Nó cầm `participantId` chứ không phải
  `userId`, cần nhánh API khác.
- Mục "Cơ Thủ" trong drawer vẫn xám — chưa có màn danh sách cơ thủ.
- `FE/src/components/layouts/Footer.jsx` và ba màn Auth của web vẫn mang thông tin Matchroom
  y hệt footer mobile trước khi sửa. Đợt này chỉ đụng mobile.
- Chú thích đầu `FE/src/constants/demoData.js` còn liệt kê `Ranked.jsx` là nơi dùng demo
  data; thực tế file đó đã gọi API thật. Chỉ là chú thích lỗi thời bên web.

## Danh sách file

Thêm:

- `src/api/leaderboardApi.js`
- `src/api/publicPlayerApi.js`
- `src/constants/leaderboard.js`
- `src/components/player/PlayerPortrait.jsx`
- `src/components/player/PlayerProfileView.jsx`
- `src/components/ranking/RankingList.jsx`
- `src/components/ranking/RankingFilterBar.jsx`
- `src/components/ranking/RankingRow.jsx`
- `app/(app)/rankings.jsx`
- `app/(app)/players/[userId].jsx`

Sửa:

- `src/components/layout/AppFooter.jsx`
- `src/components/home/RankedSection.jsx`
- `src/components/layout/navItems.js`
- `app/(app)/home.jsx`

Xoá:

- `src/constants/topPlayers.js`

## Kiểm chứng

Không có hạ tầng test tự động trong repo mobile, nên kiểm bằng tay trên Expo web:

1. Trang chủ — khối top tay cơ hiện dữ liệu từ `/leaderboard`, không còn tên nước ngoài.
2. Kỳ rỗng — khối giữ header và câu thông báo, không vỡ bố cục.
3. Nút "Tất cả" mở màn xếp hạng; đổi chip kỳ thì danh sách tải lại đúng.
4. Cuộn hết trang đầu thì tải thêm; kéo xuống thì làm mới.
5. Bấm một cơ thủ mở hồ sơ; bấm một thành tích mở đúng giải.
6. Cơ thủ không có ảnh — hiện chữ cái đầu, không phải ảnh bàn bi-a.
7. Footer — mọi link bấm được và tới đúng màn; không còn chữ Matchroom ở đâu.
8. Cả hai chế độ sáng và tối.
