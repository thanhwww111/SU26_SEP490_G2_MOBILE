# Hợp đồng dữ liệu (DTO)

Cập nhật: 2026-07-28

Shape thật của dữ liệu backend trả về và nhận vào, trích từ `SU26_SEP490_G2_BE/src/main/java/com/capstone/su26_sep490_g2_be/dto/`.

Mục đích: **dựng màn mà không phải mở backend đọc DTO**. Tên field ở đây là tên thật — dùng đúng, đừng đoán.

Cặp đôi với [09-backend-reference.md](09-backend-reference.md) (endpoint) — file này trả lời "response có field gì".

> Backend đổi thì file này lỗi thời. Nếu một field không tồn tại như mô tả, mở DTO tương ứng đọc lại rồi **sửa file này**.

---

# Envelope

`dto/response/ApiResponse.java`

```jsonc
{
  "success": true,
  "code": null,        // mã lỗi nghiệp vụ, chỉ có khi success = false
  "message": "OK",
  "data": { },         // phần thật sự cần
  "details": null      // chi tiết lỗi validation, chỉ có khi thất bại
}
```

`getApiData(res)` bóc lấy `data`. Khi lỗi, `axiosClient` đã ném `Error` với `message` từ backend và gắn `.code`.

## Phân trang

`dto/response/PageResponse.java`

```jsonc
{
  "content": [ ],
  "pageNumber": 0,      // 0-indexed
  "pageSize": 10,
  "totalElements": 42,
  "totalPages": 5,
  "isLast": false
}
```

> **Chú ý:** backend dùng `pageNumber` / `pageSize`, **không** phải `page` / `size`. `parsePagedResponse` trong `src/utils/pagination.js` đã chuẩn hoá về `page` / `size` — nên trong màn cứ dùng `page.content`, `page.totalPages`. Đừng đọc `pageNumber` trực tiếp.

`isLast` tiện cho infinite scroll nhưng `parsePagedResponse` hiện **không giữ lại**. Muốn dùng thì tính `page + 1 < totalPages`.

---

# Auth

## POST `/auth/login`

Request — `LoginRequest`

```jsonc
{ "email": "a@b.com", "password": "123456" }
```

Response — `LoginResponse`

```jsonc
{ "token": "eyJhbGc...", "expiresIn": 86400000 }
```

> **Response KHÔNG chứa thông tin user.** `buildSessionFromAuthPayload` (`src/utils/auth.js`) xử lý được: nó nhận cả `accessToken` lẫn `token`, và khi thiếu `user` thì đọc role từ chính JWT. Cần thông tin user đầy đủ thì gọi `GET /auth/me` sau khi đăng nhập.

## POST `/auth/register`

Request — `RegisterRequest`

```jsonc
{ "email": "a@b.com", "phone": "0912345678", "password": "123456" }
```

Ràng buộc backend:

| Field | Ràng buộc |
|---|---|
| `email` | Bắt buộc, đúng định dạng email |
| `phone` | Regex `^(0[3579])[0-9]{8}$` — **đúng 10 số**, đầu số 03/05/07/08/09 |
| `password` | 6–100 ký tự |

> ⚠️ **`validatePhone` của mobile đang lỏng hơn backend.** `src/utils/validators.js` dùng `/^[0-9]{10,11}$/` — cho qua số 11 chữ số và mọi đầu số. Người dùng nhập `0123456789` sẽ qua client rồi bị backend từ chối. Xem mục "Việc cần làm" cuối file.

## Quên mật khẩu — ba bước

```
POST /auth/forgot-password   { email }
POST /auth/verify-otp        { email, otp }
POST /auth/reset-password    { email, otp, newPassword }
```

`newPassword` 6–100 ký tự. Lưu ý `reset-password` cần **cả** `otp` lẫn `email`, không chỉ token.

## POST `/auth/change-password`

```jsonc
{ "oldPassword": "...", "newPassword": "..." }
```

## GET `/auth/me` — `UserResponse`

```jsonc
{
  "id": 1,
  "email": "a@b.com",
  "phone": "0912345678",
  "role": "PLAYER",
  "status": "ACTIVE",
  "profileCompleted": false
}
```

> `profileCompleted` cho biết Player đã tạo hồ sơ chưa. Player mới đăng ký có `false` — luồng đúng là đẩy sang màn tạo hồ sơ trước khi cho đăng ký giải.

---

# Hồ sơ người dùng

## GET `/profile` — `UserProfileResponse`

```jsonc
{
  "email": "a@b.com",
  "phone": "0912345678",
  "fullName": "Nguyễn Văn A",
  "displayName": "Player A",
  "avatarUrl": "https://minio.../avatars/abc.jpg?X-Amz-...",  // presigned URL
  "dateOfBirth": "1998-05-15",     // LocalDate, dạng yyyy-MM-dd
  "gender": "MALE",
  "billiardRank": "AMATEUR",       // chỉ có với tài khoản PLAYER
  "bio": "..."
}
```

**404 kèm mã `PROFILE_002` khi tài khoản chưa tạo hồ sơ.** Đây là trạng thái bình thường của tài khoản mới, không được hiển thị như lỗi.

`avatarUrl` trong response là **presigned URL sinh mới mỗi lần GET**, có hạn dùng — đừng đem lưu lại rồi gửi ngược lên.

## PUT `/profile` và POST `/player/profile` — `UserProfileRequest`

```jsonc
{
  "fullName": "Nguyễn Văn A",      // bắt buộc
  "displayName": "Player A",
  "phone": "0912345678",
  "avatarUrl": "avatars/a1b2c3.jpg",  // objectKey của MinIO, KHÔNG phải URL
  "dateOfBirth": "1998-05-15",
  "gender": "MALE",
  "billiardRank": "AMATEUR",
  "bio": "..."
}
```

Ba cái bẫy của DTO này:

1. **`avatarUrl` nhận objectKey, không nhận URL.** Tên trường đọc như URL nhưng giá trị phải là `objectKey` lấy từ `POST /storage/images`. Gửi presigned URL vào đây thì lần đọc sau ảnh hỏng.
2. **`billiardRank` chỉ dành cho PLAYER.** Role khác gửi kèm giá trị khác rỗng sẽ bị từ chối.
3. **`phone` theo regex `^(0[3|5|7|8|9])[0-9]{8}$`** — đúng 10 số. Chặt hơn `validatePhone` của mobile.

Trường trống thì bỏ hẳn khỏi body, đừng gửi chuỗi rỗng — `buildProfileBody` trong `src/components/profile/profileFormUtils.js` đã lo phần này.

`gender`: `MALE` · `FEMALE` · `OTHER`.
`billiardRank`: `UNRANKED` · `BEGINNER` · `AMATEUR` · `SEMI_PRO` · `PRO`.

## POST `/storage/images` — `ImageUploadResponse`

Request: multipart, hai phần `file` và `folder` (mobile dùng `"avatars"`).

```jsonc
{ "objectKey": "avatars/a1b2c3.jpg", "url": "https://minio.../..." }
```

`url` chỉ để xem trước ngay sau khi tải lên; thứ đem lưu vào hồ sơ là `objectKey`.

---

# Tin tức

## GET `/news` — trang của `NewsPostResponse`

## GET `/news/{slug}` — `NewsPostResponse`

```jsonc
{
  "id": 1,
  "title": "...",
  "slug": "tieu-de-bai-viet",
  "thumbnailUrl": "...",
  "content": "<p>HTML</p>",
  "status": "PUBLISHED",
  "categoryId": 3,
  "categoryName": "Giải đấu",
  "tags": ["pool", "9-ball"],
  "tagIds": [1, 2],
  "publishedAt": "2026-07-28T10:00:00Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**`content` là HTML** (web dùng rich text editor và render bằng `dangerouslySetInnerHTML`). Đã giải quyết ngày 2026-07-29: mobile tự chuyển HTML sang component gốc bằng `parseHtmlBlocks` trong `src/utils/html.js`, không cài WebView cũng không cài `react-native-render-html`. Render ở `src/components/news/RichText.jsx`.

Phủ: đoạn văn, h1–h6, đậm, nghiêng, link, danh sách, ảnh, trích dẫn, `<hr>`, `<br>`. Không phủ: bảng, iframe, video nhúng — mất định dạng nhưng **chữ bên trong vẫn giữ**, bài viết không bao giờ trống.

Chi tiết bài lấy theo **`slug`**, không phải `id`.

`tags` là mảng **chuỗi** (`["pool", "9-ball"]`), còn `tagIds` là mảng số — đừng nhầm khi render chip.

## GET `/news` — tham số lọc

`categoryId` (số), `search` (chuỗi), `page`, `size`. Không có tham số sắp xếp.

## GET `/news/categories` — `NewsCategoryResponse[]`

```jsonc
{ "id": 1, "name": "Giải đấu", "slug": "giai-dau", "status": "ACTIVE", "createdAt": "..." }
```

Mảng trần, không phân trang. Trả về cả chuyên mục `INACTIVE` — lọc ở client trước khi dựng hàng chip.

---

# Giải đấu

## GET `/tournaments` — trang của `TournamentListItemResponse`

```jsonc
{
  "id": 1,
  "name": "Giải bi-a mùa hè 2026",
  "thumbnailUrl": "...",
  "gameType": "EIGHT_BALL",
  "format": "SINGLE_ELIMINATION",
  "formatName": "Loại trực tiếp",
  "participantType": "SINGLE",
  "status": "OPEN_FOR_REGISTRATION",
  "maxParticipants": 32,
  "tableCount": 4,
  "entryFee": 200000,
  "isRegister": false,
  "configComplete": true,
  "approvedCount": 18,
  "registrationDeadline": "...",
  "startAt": "...",
  "endAt": "...",
  "createdAt": "...",
  "branchId": 2,
  "venueName": "CLB Bi-a ABC",
  "venueAddress": "123 Nguyễn Trãi"
}
```

Ghi chú:

- `isRegister` — người đang đăng nhập đã đăng ký giải này chưa. Dùng để đổi nút "Đăng ký" thành "Đã đăng ký".
- `approvedCount` / `maxParticipants` — `getTournamentBadge` dùng cặp này để tính "Hết slot".
- `entryFee` là số tiền VND, không phải chuỗi. Format bằng `toLocaleString("vi-VN")`.
- `startAt` / `endAt` — dùng `fmtDateRange(startAt, endAt)`.
- Dùng `formatName` để hiển thị, `format` là mã.

## GET `/tournaments/{id}` — `TournamentDetailResponse`

Có mọi field của list item, cộng thêm:

```jsonc
{
  "description": "...",
  "prizePool": 5000000,
  "prizeDescription": "...",
  "isPublicRatio": true,
  "isShowTournament": true,
  "remainingSlots": 14,
  "registrationFormTemplateId": 3,
  "registrationFormTemplateCode": "...",
  "registrationFormTemplateName": "...",
  "bannerUrl": "...",
  "venue": { },                    // BranchVenueResponse
  "configSummary": {
    "seedingMethod": "RANDOM",
    "bracketSize": 32,
    "thirdPlaceMatch": true,
    "breakRule": "...",
    "finalRaceTo": 7
  }
}
```

`remainingSlots` có sẵn — đừng tự tính `maxParticipants - approvedCount`.

Detail có `venue` là object; list item chỉ có `venueName` / `venueAddress` phẳng.

## GET `/tournaments/{id}/stages` — `StageWithMatchesResponse[]`

```jsonc
{
  "id": 1, "tournamentId": 1, "name": "Vòng bảng",
  "stageType": "GROUP", "orderNo": 1, "status": "...",
  "peRoundNo": null, "peActiveCount": null, "peEliminateCount": null,
  "matches": [ /* MatchResponse */ ]
}
```

## `MatchResponse`

```jsonc
{
  "id": 10,
  "matchCode": "R1M3",
  "tournamentId": 1, "tournamentName": "...",
  "stageId": 1, "stageName": "Vòng 1", "stageType": "KNOCKOUT",
  "bracketType": "WINNER", "roundNo": 1, "positionNo": 3,
  "raceTo": 5,
  "status": "PENDING",
  "isBye": false,
  "scheduledAt": "...", "estimatedEndAt": "...", "scheduleLocked": false,
  "player1": { "id": 5, "displayName": "Nguyễn A", "seedNo": 1, "avatarUrl": "..." },
  "player2": { },
  "player1Score": 0, "player2Score": 0,
  "winner": null, "loser": null,
  "nextMatchWinId": 20, "nextMatchLoseId": null,
  "winSlot": "P1", "loseSlot": null,
  "tableNo": 3, "tableId": 7, "tableName": "Bàn 3", "tableNumber": 3,
  "assignedStaff": { }
}
```

`player1` / `player2` / `winner` / `loser` đều là `ParticipantBriefResponse` và **có thể `null`** (trận chưa xác định đối thủ). Luôn kiểm trước khi đọc `.displayName`.

Có cả `tableNo`, `tableName`, `tableNumber` — trùng lặp. Ưu tiên `tableName` để hiển thị.

## `ParticipantBriefResponse`

```jsonc
{ "id": 5, "displayName": "Nguyễn Văn A", "seedNo": 1, "avatarUrl": "..." }
```

## Nhóm `/staff/**` — trọng tài

Toàn nhóm bị `SecurityConfig` chặn bằng `hasRole("STAFF")`, và mỗi lời gọi còn qua
`assertStaffAssigned`: trọng tài chỉ thao tác được trên trận mà `assignedStaff` đúng là mình.
Sai người thì nhận `MATCH_NOT_ASSIGNED` chứ không phải 403.

| Endpoint | Body | Trả về |
|---|---|---|
| `GET /staff/matches` | — (query `status`, `tournamentName`, `tournamentId`) | `MatchResponse[]` |
| `PATCH /staff/matches/{id}/start` | — | `MatchResponse` |
| `PATCH /staff/matches/{id}/score/increment` | `{ playerSlot: 1\|2, delta: 1\|-1 }` | `IncrementScoreResponse` |
| `POST /staff/matches/{id}/complete` | `{ winnerParticipantId, confirmEarlyEnd }` | `MatchResponse` |
| `POST /staff/matches/{id}/walkover` | `{ winnerParticipantId }` | `MatchResponse` |

```jsonc
// IncrementScoreResponse
{
  "match": { /* MatchResponse */ },
  "suggestComplete": true,        // đã có người đạt raceTo
  "suggestedWinnerId": 5          // participantId, null khi hoà
}
```

Ba ràng buộc của backend mà client phải biết trước, nếu không sẽ đâm vào lỗi khó hiểu:

- **`delta` chỉ nhận `1` hoặc `-1`.** Gửi tỷ số tuyệt đối là sai API — dùng delta để hai máy cùng
  chấm một trận không ghi đè nhau.
- **Đã có người đạt `raceTo` thì không cộng thêm được** (`MATCH_SCORE_LOCKED`), nhưng vẫn trừ được
  để hoàn tác. Điểm ngoài khoảng `0..raceTo` trả `MATCH_SCORE_OUT_OF_RANGE`.
- **`confirmEarlyEnd` bắt buộc `true` khi chưa ai đạt `raceTo`**, nếu không nhận
  `MATCH_EARLY_END_NOT_CONFIRMED`. Bản web đang quên field này — xem
  [11-changelog.md](11-changelog.md), mục 2026-08-17.

Ngoài ra mọi thao tác đều đòi giải đang chạy (`assertMatchPlayable`): trạng thái giải phải là
`IN_PROGRESS` hoặc `FINAL_BRACKET_READY`, riêng thể thức loại kép còn chấp nhận `DRAW_DONE`.

## GET `/tournaments/{id}/standings` — `StandingsEntryResponse[]`

```jsonc
{
  "rank": 1, "participantId": 5, "displayName": "Nguyễn A",
  "wins": 3, "losses": 0, "matchesPlayed": 3,
  "framesWon": 15, "framesLost": 4, "frameDiff": 11,
  "advancesToPlayoff": true
}
```

## GET `/tournaments/{id}/rankings` — `TournamentRankingResponse`

**Là object, không phải mảng.** Trước đây file này ghi sai thành mảng — sửa ngày 2026-07-29 sau khi đọc `MatchController.rankingsPublic` và `dto/response/TournamentRankingResponse.java`.

```jsonc
{
  "tournamentId": 1,
  "tournamentStatus": "COMPLETED",
  "isOfficial": true,          // true khi giải đã COMPLETED
  "entries": [
    {
      "sortOrder": 1, "rankLabel": "#1",
      "rankFrom": 1, "rankTo": 1,
      "participantId": 5, "displayName": "Nguyễn A", "note": "Vô địch"
    }
  ]
}
```

`isOfficial` quyết định nhãn "Kết quả chính thức" hay "Xếp hạng tạm thời" — đừng bóc phẳng lấy mỗi `entries`.

Hạng đồng vị dùng `rankFrom`–`rankTo` (ví dụ đồng hạng 5–8). Hiển thị `rankLabel`, đừng tự sinh chuỗi.

> **Entry không có trường ảnh.** `RankingTab.jsx` bên web đọc `player.avatarUrl` nhưng DTO không có field đó, nên nhánh hiện ảnh ở web không bao giờ chạy. Mobile chỉ dựng avatar chữ cái đầu.

## GET `/tournaments/{id}/participants` — `ParticipantResponse[]`

```jsonc
{
  "id": 5, "tournamentId": 1, "tournamentName": "...",
  "registrationId": 12, "userId": 30,
  "participantType": "SINGLE",
  "displayName": "Nguyễn Văn A",
  "phone": "0901234567",
  "seedNo": 3,
  "status": "ACTIVE",
  "source": "...",
  "avtarUrl": "...",
  "members": [ { "fullName": "...", "phone": "...", "role": "..." } ]
}
```

> **`avtarUrl`, không phải `avatarUrl`.** Lỗi chính tả nằm ở DTO backend. Web viết `p.avatarUrl || p.avtarUrl` nên vẫn ra ảnh; đọc mỗi `avatarUrl` thì mọi cơ thủ đều rơi vào ảnh dự phòng.

`members` chỉ có giá trị với participant đôi/đội. Mảng trần, không phân trang, không có tham số tìm kiếm — lọc theo tên phải làm tại client.

---

# Đăng ký giải

## GET `/player/tournaments/{id}/registration-form` — `RegistrationFormPreviewResponse`

Đây là DTO **quan trọng nhất** cho màn đăng ký, vì form là động.

```jsonc
{
  "templateId": 3, "templateCode": "...", "templateName": "...", "templateDescription": "...",
  "tournamentId": 1, "tournamentName": "...",
  "participantType": "SINGLE",
  "entryFee": 200000,
  "isReady": true,
  "fields": [
    {
      "fieldKey": "full_name",
      "label": "Họ và tên",
      "description": "...",
      "dataType": "STRING",
      "uiComponent": "TEXT",
      "enumOptions": null,
      "minValue": null,
      "maxValue": null,
      "placeholder": "Nhập họ tên",
      "validationRegex": null,
      "defaultValue": null,
      "isRequired": true,
      "sortOrder": 1
    }
  ]
}
```

Cách render:

1. Sắp `fields` theo `sortOrder`.
2. Chọn component theo `uiComponent` / `dataType` (TEXT → `Input`, ENUM → chọn từ `enumOptions`, INT → bàn phím số với `minValue`/`maxValue`, BOOLEAN → switch).
3. `isRequired` quyết định bắt buộc; `validationRegex` để validate thêm.
4. `isReady = false` → giải chưa gắn template, **không cho đăng ký**.

Tham khảo cách web làm: `SU26_SEP490_G2_FE/src/components/registration-form/RegistrationDynamicForm.jsx`.

## POST `/player/tournaments/{id}/registrations`

Request — `SubmitTournamentRegistrationRequest`

```jsonc
{
  "registrationType": "SINGLE",     // chỉ nhận SINGLE hoặc DOUBLE
  "note": "...",
  "fieldValues": [
    { "fieldKey": "full_name", "value": "Nguyễn Văn A" }
  ]
}
```

**Mọi `value` đều là chuỗi**, kể cả số và boolean. `fieldKey` phải khớp `fieldKey` từ form template.

### Bốn giới hạn khiến nhiều ý tưởng về màn này không làm được

Ghi lại ở đây (khảo sát 2026-08-10) để khỏi phải dò lại backend mỗi lần có người đề xuất.

**1. Một tài khoản chỉ đăng ký được MỘT lần cho một giải.**
`RegistrationServiceImpl.java:102` — `existsByTournamentIdAndUserId` ném `REGISTRATION_ALREADY_EXISTS`. Nên **không có cách nào đăng ký hộ nhiều người** bằng một tài khoản.

**2. Số người chơi cố định theo template, không thêm động được.**
Hai template có sẵn (`DataInitializer.java:412-440`) chỉ có bốn key: `player_full_name`, `player_phone`, `player2_full_name`, `player2_phone`. **Không có key nào cho người thứ ba**, và gửi key lạ thì `RegistrationFormServiceImpl.java:122` từ chối cả đơn.

**3. Mọi trường của hai template đó đều bắt buộc.**
`DataInitializer.java:455` đặt `isRequired(true)` cho tất cả; `RegistrationFormServiceImpl.java:132` ném `REG_FORM_VALIDATION_FAILED` nếu thiếu. Ẩn bớt ô trên giao diện không giúp bỏ qua được — người dùng vẫn phải điền đủ mới gửi được.

**4. `registrationType` chỉ nhận `SINGLE` hoặc `DOUBLE`.**

> Muốn vượt qua bốn giới hạn này thì phải thêm bảng và endpoint mới bên backend. Sửa bảng hay service cũ là vi phạm ràng buộc đặt từ 2026-08-07.

## GET `/player/registrations` — `TournamentRegistrationResponse`

```jsonc
{
  "id": 12,
  "tournamentId": 1, "tournamentName": "...",
  "userId": 5,
  "registrationType": "SINGLE",
  "playerFullName": "Nguyễn Văn A",
  "playerPhone": "0912345678",
  "status": "PENDING_PAYMENT",
  "note": null,
  "createdAt": "...",
  "fieldValues": [
    { "fieldKey": "full_name", "label": "Họ và tên", "value": "Nguyễn Văn A" }
  ]
}
```

Response có thêm `label` trong `fieldValues` (request thì không) — hiển thị được ngay mà không cần tải lại template.

`GET /player/registrations/{id}` trả **đúng DTO này**, không phải một DTO chi tiết riêng — danh sách và chi tiết dùng chung shape. `DELETE /player/registrations/{id}` trả `data` rỗng, chỉ cần bắt lỗi.

> **Cảnh báo — `rejectedReason` không có trong response.** `MyRegistrationsPage.jsx` bên web render `detail.rejectedReason` nhưng `TournamentRegistrationResponse.java` không có trường đó; nó chỉ tồn tại ở `entity/Registration.java`. Khối "Lý do không được tham dự" của web vì vậy không bao giờ hiện. Mobile cố ý bỏ khối này. Muốn có thì backend phải map thêm trường ra DTO.

Đã nối trong `src/api/playerRegistrationApi.js`. Nhãn và màu badge: `src/constants/registration.js`.

---

# Thanh toán

## POST `/player/registrations/{id}/checkout` — `CheckoutResponse`

```jsonc
{
  "paymentId": 3, "registrationId": 12, "orderCode": 1722153600,
  "amount": 200000,
  "checkoutUrl": "https://pay.payos.vn/...",
  "description": "..."
}
```

Mở `checkoutUrl` bằng `expo-linking` / `expo-web-browser`, rồi bắt deep link quay lại. Cần spec riêng.

## GET `/player/payments` — `PaymentHistoryResponse`

```jsonc
{
  "id": 3, "registrationId": 12,
  "tournamentId": 1, "tournamentName": "...",
  "playerName": "Nguyễn Văn A",
  "amount": 200000,
  "paymentMethod": "PAYOS",
  "status": "SUCCESS",
  "statusLabel": "Thành công",
  "transactionCode": "...",
  "checkoutUrl": "...",
  "paidAt": "...", "createdAt": "..."
}
```

Có sẵn `statusLabel` tiếng Việt — dùng luôn, đừng tự map từ `status`.

---

# Hồ sơ

## GET/PUT `/profile` — `UserProfileResponse` / `UserProfileRequest`

```jsonc
{
  "email": "a@b.com",
  "phone": "0912345678",
  "fullName": "Nguyễn Văn A",
  "displayName": "A Nguyen",
  "avatarUrl": "avatars/a1b2c3d4.jpg",
  "dateOfBirth": "1998-05-20",
  "gender": "MALE",
  "billiardRank": "B",
  "bio": "..."
}
```

## GET/POST `/player/profile` — `PlayerProfileResponse` / `CreatePlayerProfileRequest`

Giống trên nhưng có `userId`, **không có** `email` và `phone`.

Ràng buộc: `fullName` bắt buộc; `phone` cùng regex như đăng ký; `dateOfBirth` không được ở tương lai; định dạng `YYYY-MM-DD` (`LocalDate`, không phải Instant).

> `avatarUrl` là **đường dẫn tương đối** (`avatars/xxx.jpg`), không phải URL đầy đủ. Lấy URL hiển thị qua `GET /storage/images/url`. Upload ảnh: `POST /storage/images` (multipart). Xem `controller/StorageController.java`.

---

# Chi nhánh

## GET `/branches` — trang của `BranchListItemResponse`

```jsonc
{
  "id": 1, "name": "CLB ABC", "address": "123 Nguyễn Trãi",
  "phone": "0281234567", "description": "...",
  "status": "ACTIVE", "thumbnailUrl": "..."
}
```

Tham số: `search` (khớp tên hoặc địa chỉ), `page`, `size`.

**Backend chỉ trả chi nhánh `ACTIVE`** ở cả danh sách lẫn chi tiết — không phải lọc theo `status` ở client. Chi nhánh đã đóng trả 404 ở màn chi tiết.

## GET `/branches/{id}` — `BranchResponse`

```jsonc
{
  "id": 1, "name": "CLB ABC", "address": "123 Nguyễn Trãi",
  "phone": "0281234567", "description": "...",
  "status": "ACTIVE",
  "images": [ { "key": "branches/a1b2.jpg", "url": "https://minio/..." } ],
  "createdAt": "...", "updatedAt": "..."
}
```

> **Sửa ngày 2026-07-29:** file này từng ghi `BranchResponse` "có ảnh và bàn". Sai — DTO **không có danh sách bàn**, và không có endpoint công khai nào trả bàn của chi nhánh. Chỉ có `images`.

Khác `BranchListItemResponse`: chi tiết có `images` + `createdAt`/`updatedAt` nhưng **không có `thumbnailUrl`** — ảnh bìa ở màn chi tiết lấy từ `images[0].url`.

`key` của ảnh dùng để cập nhật lại danh sách (màn quản trị), `url` để hiển thị.

---

# Quy ước kiểu dữ liệu

| Kiểu Java | JSON | Xử lý ở mobile |
|---|---|---|
| `Instant` | Chuỗi ISO-8601 UTC (`2026-07-28T10:00:00Z`) | `fmtDateShort`, `fmtDateRange` |
| `LocalDate` | `"1998-05-20"` | Không có giờ — đừng đưa qua `new Date()` rồi format lại theo timezone |
| `BigDecimal` | Số (`200000`) | `Number(v).toLocaleString("vi-VN")` |
| `Long` (id) | Số | `String(id)` khi làm `keyExtractor` |
| `Boolean` | `true`/`false`/`null` | Ba trạng thái — `null` khác `false` |

**Mọi field đều có thể `null`.** Backend dùng `@JsonInclude(NON_NULL)` ở envelope, nhưng DTO con thì không — an toàn nhất là luôn kiểm trước khi đọc field lồng nhau (`match.player1?.displayName`).

---

# DTO chưa khảo sát

Những DTO sau tồn tại nhưng chưa cần cho luồng PLAYER. Khi làm tới thì đọc trực tiếp trong `dto/response/` rồi bổ sung vào file này:

`PlayerPublicProfileResponse` (hồ sơ cơ thủ công khai), `ParticipantResponse`, `MatchStatsResponse`, `MatchScoreEventResponse`, `MatchUpdateMessage` (WebSocket), `BranchResponse`, `BilliardTableResponse`, `DashboardStatsResponse`, và toàn bộ nhóm `Format*`, `Email*`, `Analytics*`.

---

# Việc cần làm

Sai lệch đã phát hiện giữa mobile và backend:

| Vấn đề | Chi tiết |
|---|---|
| `validatePhone` lỏng hơn backend | Mobile: `/^[0-9]{10,11}$/`. Backend: `^(0[3579])[0-9]{8}$`. Nên siết mobile cho khớp, kèm thông báo "Số điện thoại không hợp lệ" |
| Màn chi tiết tin cần render HTML | `content` là HTML, chưa có thư viện nào trong `package.json` |
| `parsePagedResponse` bỏ `isLast` | Không sai, nhưng infinite scroll phải tự tính `page + 1 < totalPages` |
| `getRoleLabel` lệch nhãn backend | Xem [09](09-backend-reference.md), mục RoleCode |
