# Tham chiếu Backend

Cập nhật: 2026-07-28

Danh sách endpoint và enum trạng thái, trích từ controller thật của `SU26_SEP490_G2_BE`.

**Đây là bản tra cứu, không phải hợp đồng.** Backend đổi thì file này lỗi thời. Trước khi nối một endpoint, mở controller tương ứng đọc lại request/response — đường dẫn file ghi ở mỗi mục.

> File này trả lời "gọi đường dẫn nào". Câu hỏi "response có field gì" nằm ở [10-data-contracts.md](10-data-contracts.md).

Backend: `D:\HocTap\SEP490_G2_BiliardsManager\SU26_SEP490_G2_BE\src\main\java\com\capstone\su26_sep490_g2_be\`

---

# Quy ước chung

**Base URL:** `${EXPO_PUBLIC_API_URL}/api/v1` — `src/constants/config.js` tự nối `/api/v1`, nên đường dẫn trong module API viết **không** kèm phần đó.

**Envelope:** mọi phản hồi bọc trong `{ success, message, data }`. Dùng `getApiData(res)` để bóc.

**Phân trang:** Spring `Page` nằm trong `data` — `content`, `page`/`number`, `size`, `totalElements`, `totalPages`. `page` bắt đầu từ **0**. Dùng `parsePagedResponse`.

**Xác thực:** `Authorization: Bearer <token>`, `axiosClient` tự gắn.

**Phân quyền theo tiền tố:**

| Tiền tố | Role |
|---|---|
| `/auth/**` | Công khai |
| `/news`, `/tournaments`, `/branches`, `/participants` | Công khai (đọc) |
| `/player/**` | PLAYER |
| `/staff/**` | STAFF |
| `/manager/**` | MANAGER |
| `/owner/**` | OWNER |
| `/admin/**` | ADMIN |

---

# Auth

`controller/AuthController.java` — `/api/v1/auth`

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| POST | `/auth/login` | Đăng nhập |
| GET | `/auth/me` | Lấy thông tin phiên hiện tại |
| POST | `/auth/register` | Đăng ký tài khoản PLAYER |
| POST | `/auth/forgot-password` | Gửi OTP về email |
| POST | `/auth/verify-otp` | Xác thực OTP |
| POST | `/auth/reset-password` | Đặt lại mật khẩu sau khi xác thực OTP |
| POST | `/auth/change-password` | Đổi mật khẩu (đã đăng nhập) — body `{ oldPassword, newPassword }`, mật khẩu mới 6–100 ký tự |

Đã nối trong `src/api/authApi.js` (còn thiếu `verify-otp`).

Phản hồi đăng nhập được xử lý bởi `buildSessionFromAuthPayload` trong `src/utils/auth.js` — hàm này chấp nhận cả `accessToken` lẫn `token`, và nếu payload thiếu role thì đọc role từ chính JWT.

Luồng quên mật khẩu là **ba bước**: `forgot-password` → `verify-otp` → `reset-password`.

---

# Tin tức

`controller/NewsController.java` — phần công khai

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| GET | `/news` | Bài đã xuất bản, phân trang |
| GET | `/news/{slug}` | Chi tiết bài — **theo slug, không phải id** |
| GET | `/news/categories` | Danh mục bài viết |

Đã nối trong `src/api/newsApi.js` (mới có 2 hàm đầu).

`controller/NewsTagController.java` — `/api/v1/shared/news/tags`: GET danh sách thẻ.

Các endpoint `/owner/news/**`, `/manager/news/**` là CMS, không dùng trên mobile.

---

# Giải đấu — công khai

`controller/PublicTournamentController.java` — `/api/v1/tournaments`

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| GET | `/tournaments` | Danh sách giải công khai, phân trang |
| GET | `/tournaments/{id}` | Chi tiết giải |

`controller/MatchController.java` và `controller/ParticipantController.java` — phần công khai (không cần role):

| Method | Đường dẫn | Dùng cho | Mobile |
|---|---|---|---|
| GET | `/tournaments/{id}/participants` | Cơ thủ tham gia giải | ✅ tab Cơ thủ |
| GET | `/tournaments/{id}/matches` | Danh sách trận | ✅ tab Trận đấu + Trực tiếp |
| GET | `/tournaments/{id}/rankings` | Xếp hạng chung cuộc | ✅ tab Xếp hạng |
| GET | `/tournaments/{id}/stages` | Các vòng của giải | chưa dùng |
| GET | `/tournaments/{id}/standings` | Bảng xếp hạng vòng bảng | chưa dùng |
| GET | `/tournaments/{id}/stage-standings` | Xếp hạng theo vòng | chưa dùng |
| GET | `/matches/{matchId}` | Chi tiết một trận | chưa dùng |

Năm endpoint có dấu ✅ đã nối trong `src/api/publicTournamentApi.js` (kể cả hai endpoint `/tournaments` ở bảng trên).

Mobile gom nhóm trận theo vòng từ `/matches` (mảng phẳng, mỗi trận có sẵn `stageId` / `stageType` / `roundNo`) thay vì đọc `/stages` như web — tab Trực tiếp cũng cần đúng endpoint đó, một nguồn cho hai tab thì ít chỗ sai hơn.

**WebSocket dùng chung với web** (từ 2026-08-08). Backend khai endpoint `/ws` trong `WebSocketConfig` **không kèm `.withSockJS()`** → WebSocket thuần, `@stomp/stompjs` nối thẳng, không cần `sockjs-client`.

| Thứ | Giá trị |
|---|---|
| Endpoint | `ws://<host>:8080/ws` (`getWebSocketUrl()` tự đổi `http`→`ws`) |
| Topic tỷ số | `/topic/tournament/{id}/matches` |
| Topic bracket | `/topic/tournament/{id}/bracket` |
| Hook | `src/hooks/useTournamentSocket.js` — **đừng tự dựng `Client` mới** |

Payload có hai dạng trên cả hai topic: một trận (`MatchResponse`, hoặc bọc trong `{ match }`), hoặc `{ type: "BRACKET_SYNC", matches: [...] }` khi bốc thăm lại / chuyển giai đoạn.

---

# Người chơi (PLAYER)

`controller/PlayerRegistrationController.java` — `/api/v1/player`

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| GET | `/player/tournaments` | Giải đấu dưới góc nhìn player |
| GET | `/player/tournaments/{id}` | Chi tiết giải |
| GET | `/player/tournaments/{id}/registration-form` | **Form đăng ký động** của giải |
| GET | `/player/tournaments/{id}/my-registration` | Đăng ký của tôi cho giải này — trả `null` kèm 200 khi chưa đăng ký, không phải 404 |
| POST | `/player/tournaments/{id}/registrations` | Nộp đăng ký |
| GET | `/player/registrations` | Tất cả đăng ký của tôi |
| GET | `/player/registrations/{id}` | Chi tiết một đăng ký |
| DELETE | `/player/registrations/{id}` | Huỷ đăng ký |

**Form đăng ký là động.** Admin định nghĩa template (xem `/admin/registration-form/templates` trên web), nên màn đăng ký giải phải render field theo dữ liệu trả về từ `/registration-form`, **không** hardcode danh sách trường. Tham khảo cách web làm: `SU26_SEP490_G2_FE/src/components/registration-form/RegistrationDynamicForm.jsx`.

---

# Hồ sơ người dùng

Có hai controller đụng tới hồ sơ và chúng **không thay thế cho nhau** — đọc kỹ trước khi nối:

| Method | Đường dẫn | Controller | Role | Dùng cho |
|---|---|---|---|---|
| GET | `/profile` | `ProfileController` | Mọi role | Đọc hồ sơ của tôi. **404 + mã `PROFILE_002` khi chưa có hồ sơ** — đây là trạng thái bình thường của tài khoản mới, không phải lỗi |
| PUT | `/profile` | `ProfileController` | Mọi role | **Sửa hồ sơ — kể cả PLAYER** |
| POST | `/player/profile` | `PlayerController` | PLAYER | **Chỉ tạo lần đầu.** 409 nếu đã có |
| GET | `/player/profile` | `PlayerController` | PLAYER | Hồ sơ dưới góc nhìn player, mobile chưa dùng |

Nói gọn: **tạo** đi qua `/player/profile`, **đọc và sửa** đi qua `/profile`.

Đã nối trong `src/api/profileApi.js`.

Hai ràng buộc của backend hay làm request bị từ chối:

- `billiardRank` **chỉ được gửi khi tài khoản là PLAYER**. Role khác gửi kèm giá trị khác rỗng thì báo lỗi.
- `phone` phải khớp `^(0[3|5|7|8|9])[0-9]{8}$` — chặt hơn `validatePhone` trong `src/utils/validators.js` (10–11 số bất kỳ). Mobile dùng `VN_PHONE_PATTERN` trong `src/constants/profile.js` cho đúng.

## Ảnh đại diện

`controller/StorageController.java` — `/api/v1/storage`:

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| POST | `/storage/images` | Tải ảnh lên MinIO, multipart `file` + `folder`. Trả `{ objectKey, url }` |
| GET | `/storage/images/url?objectKey=` | Sinh lại presigned URL |

Luồng đổi ảnh: upload lấy `objectKey` → gửi `objectKey` vào body hồ sơ **dưới tên trường `avatarUrl`**. Gửi presigned URL vào đó thì ảnh hỏng ở lần đọc sau, vì `GET /profile` sinh URL mới từ object key lưu trong DB.

Trên mobile phần tử file của FormData phải là `{ uri, name, type }` chứ không phải đối tượng `File` như trình duyệt — xem `src/api/storageApi.js`. Chọn ảnh dùng `expo-image-picker` (thêm vào project ngày 2026-07-29).

---

# Thanh toán

`controller/PaymentController.java`

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| POST | `/player/registrations/{id}/checkout` | Tạo link thanh toán PayOS |
| GET | `/player/payments` | Lịch sử thanh toán của tôi |
| POST | `/player/payments/confirm-return` | Xác nhận sau khi PayOS redirect về |
| POST | `/payments/payos/webhook` | PayOS gọi — không phải việc của client |

Luồng trên mobile cần deep link để quay lại app sau khi thanh toán trên trình duyệt (`expo-linking` đã có sẵn). **Phải có spec riêng trước khi làm.**

---

# Chi nhánh và cơ thủ

`controller/PublicBranchController.java` — `/api/v1/branches`:

| Method | Đường dẫn | Dùng cho |
|---|---|---|
| GET | `/branches` | Danh sách chi nhánh, tham số `search` / `page` / `size` |
| GET | `/branches/{id}` | Chi tiết, kèm danh sách ảnh |

Đã nối trong `src/api/publicBranchApi.js`. **Cả hai chỉ trả chi nhánh `ACTIVE`** — client không phải lọc lại.

Đừng nhầm với `/owner/branches` và `/manager/branches`: đó là nhóm quản trị (tạo, sửa, đổi trạng thái), mobile không dùng.

`controller/PublicParticipantController.java` — `/api/v1/participants`:

| Method | Đường dẫn |
|---|---|
| GET | `/participants/{participantId}/profile` |
| GET | `/participants/user/{userId}/profile` |

Hai đường dẫn tương ứng hai route của web: `/event/players/:participantId` và `/event/players/user/:userId`.

---

# Staff — chấm điểm

`controller/StaffController.java` và phần `/staff/**` trong `controller/MatchController.java`.

Ví dụ: `PATCH /staff/matches/{matchId}/start`. Còn nhiều endpoint khác cho cập nhật tỷ số.

Nhóm này dùng WebSocket realtime (web có `SocketConnectionBadge`, `SocketReconnectBanner`). **Cần thiết kế riêng**, không dựng theo khuôn màn thông thường.

---

# Enum trạng thái

Nhãn tiếng Việt lấy thẳng từ backend (`enums/*.java`, trường `displayName`) — dùng đúng nhãn này, đừng tự dịch lại.

## TournamentStatus

| Mã | Nhãn |
|---|---|
| `DRAFT` | Nháp |
| `OPEN_FOR_REGISTRATION` | Mở đăng ký |
| `REGISTRATION_CLOSED` | Đóng đăng ký |
| `DRAW_PREVIEW` | Xem trước bốc thăm |
| `DRAW_DONE` | Đã bốc thăm |
| `FINAL_BRACKET_READY` | Sẵn sàng chung kết |
| `IN_PROGRESS` | Đang diễn ra |
| `COMPLETED` | Hoàn thành |
| `CANCELLED` | Đã hủy |

Mobile đã có `getTournamentBadge` trong `src/constants/tournament.js` — nó **chỉ phủ 6 trạng thái** hay gặp trên trang công khai, và xử lý thêm trường hợp "Hết slot". Ba trạng thái `DRAFT`, `DRAW_PREVIEW`, `FINAL_BRACKET_READY` sẽ rơi vào nhánh mặc định (hiện mã thô). Bổ sung khi cần.

## RegistrationStatus

| Mã | Nhãn |
|---|---|
| `PENDING_PAYMENT` | Chờ thanh toán |
| `PAID` | Đã thanh toán |
| `APPROVED` | Tham gia chính thức |
| `REJECTED` | Không được tham dự |
| `CANCELLED` | Đã hủy |

## PaymentStatus

| Mã | Nhãn |
|---|---|
| `PENDING` | Chờ thanh toán |
| `SUCCESS` | Thành công |
| `FAILED` | Thất bại |
| `CANCELLED` | Đã hủy |

## MatchStatus

| Mã | Nhãn |
|---|---|
| `PENDING` | Chờ đấu |
| `IN_PROGRESS` | Đang đấu |
| `COMPLETED` | Hoàn thành |
| `BYE` | BYE |
| `WALKOVER` | Walkover |

`COMPLETED`, `BYE`, `WALKOVER` đều tính là trận đã có kết quả (backend: `isResolved()`).

## ParticipantStatus

`ACTIVE` (Đang tham gia) · `INACTIVE` (Không còn thi đấu) · `WITHDRAWN` (Đã rút lui)

## NewsPostStatus

`DRAFT` (Nháp) · `PUBLISHED` (Đã xuất bản) · `HIDDEN` (Ẩn)

Endpoint công khai `/news` chỉ trả bài `PUBLISHED`.

## RoleCode

| Mã | Nhãn |
|---|---|
| `ADMIN` | Quản trị viên |
| `OWNER` | Chủ chuỗi quán |
| `MANAGER` | Quản lý cơ sở |
| `STAFF` | Nhân viên / Trọng tài |
| `PLAYER` | Cơ thủ |

> Mobile có `getRoleLabel` trong `src/utils/auth.js` nhưng dùng nhãn hơi khác backend ("Chủ câu lạc bộ", "Người chơi"). Không sai, chỉ là không đồng bộ — thống nhất khi làm màn hiển thị role.

---

# Enum khác

Còn nhiều enum trong `enums/`: `TournamentFormat`, `TournamentStageType`, `TournamentStageStatus`, `SeedingMethod`, `ParticipantType`, `RegistrationType`, `MatchCode`, `FieldSource`, `ErrorCode`… Phần lớn phục vụ cấu hình giải, chưa cần trên mobile. Đọc trực tiếp trong `enums/` khi cần.

---

# Khi endpoint chưa tồn tại

Không tự chế đường dẫn, không mock dữ liệu rồi để đó. Báo cho người dùng biết endpoint còn thiếu và dừng phần đó lại — làm nốt những phần khác trước.

Xem thêm: `BTMS-Tournament-Config-API.md` ở thư mục gốc dự án.
