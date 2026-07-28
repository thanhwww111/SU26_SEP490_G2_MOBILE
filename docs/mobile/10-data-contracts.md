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

**`content` là HTML** (web dùng rich text editor). React Native không render HTML — màn chi tiết tin cần `react-native-render-html` hoặc `WebView`, **cả hai đều chưa cài**. Phải quyết định trước khi làm màn này.

Chi tiết bài lấy theo **`slug`**, không phải `id`.

## GET `/news/categories` — `NewsCategoryResponse[]`

```jsonc
{ "id": 1, "name": "Giải đấu", "slug": "giai-dau", "status": "ACTIVE", "createdAt": "..." }
```

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

## GET `/tournaments/{id}/standings` — `StandingsEntryResponse[]`

```jsonc
{
  "rank": 1, "participantId": 5, "displayName": "Nguyễn A",
  "wins": 3, "losses": 0, "matchesPlayed": 3,
  "framesWon": 15, "framesLost": 4, "frameDiff": 11,
  "advancesToPlayoff": true
}
```

## GET `/tournaments/{id}/rankings` — `TournamentRankingEntryResponse[]`

```jsonc
{
  "sortOrder": 1, "rankLabel": "Vô địch",
  "rankFrom": 1, "rankTo": 1,
  "participantId": 5, "displayName": "Nguyễn A", "note": null
}
```

Hạng đồng vị dùng `rankFrom`–`rankTo` (ví dụ đồng hạng 5–8). Hiển thị `rankLabel`, đừng tự sinh chuỗi.

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

## GET `/branches` — `BranchListItemResponse`

```jsonc
{
  "id": 1, "name": "CLB ABC", "address": "123 Nguyễn Trãi",
  "phone": "0281234567", "description": "...",
  "status": "ACTIVE", "thumbnailUrl": "..."
}
```

Chi tiết `/branches/{id}` trả `BranchResponse` (nhiều field hơn, có ảnh và bàn) — đọc DTO khi làm màn.

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
