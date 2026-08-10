# Theo dõi giải / cơ thủ + thông báo — thiết kế để dành

**Trạng thái: CHƯA LÀM. Đã chốt thiết kế, hoãn thi công.**

Nhóm đang tập trung hoàn thiện sản phẩm nên không làm đợt này. Tài liệu viết đủ chi tiết để lúc cần chỉ việc mở ra code, không phải khảo sát lại backend từ đầu — mọi thứ dưới đây đã được kiểm chứng trên mã nguồn ngày 2026-08-10.

**Phạm vi đã chốt: làm cả ba tầng.**

---

## 1. Tính năng

Người dùng theo dõi một **giải đấu** hoặc một **cơ thủ**, rồi nhận thông báo khi có diễn biến — chủ yếu để tiện theo dõi đối thủ.

### Cố ý bỏ: theo dõi một trận đấu lẻ

Yêu cầu ban đầu nêu ba thứ (giải, trận, cơ thủ). Trận lẻ bị loại vì nó chỉ báo được đúng một lần rồi hết ý nghĩa, trong khi vẫn phải mang thêm một `targetType`, thêm nút, thêm màn quản lý. Theo dõi cơ thủ đã phủ được nhu cầu "xem đối thủ đá thế nào".

### Ba tầng

| Tầng | Khi nào | Cơ chế | Nền tảng |
|---|---|---|---|
| 1 | Đang mở app/tab | WebSocket có sẵn | mobile + web |
| 2 | App đóng, biết trước giờ | Hẹn giờ cục bộ trên máy | chỉ mobile |
| 3 | App đóng, sự kiện bất ngờ | Server đẩy qua Expo Push | chỉ mobile |

**Tầng 2 không thừa dù đã có tầng 3.** Push thật cần development build EAS và `extra.eas.projectId` — `app.json` hiện chưa có, và Expo đã gỡ remote push khỏi Expo Go từ SDK 53. Chừng nào nhóm còn chạy Expo Go thì tầng 2 là thứ duy nhất hoạt động khi app đóng.

**Web chỉ được tầng 1.** Web push cần service worker + VAPID + luồng gửi riêng bên backend — đó là một dự án riêng, cố ý không gộp vào đây.

---

## 2. Hạ tầng đã có sẵn — không phải dựng lại

Kiểm chứng ngày 2026-08-10:

| Thứ | Ở đâu | Ghi chú |
|---|---|---|
| WebSocket công khai | `MatchBroadcastService.java:60,64` | `/topic/tournament/{id}/matches` và `/bracket`. **Không cần đăng nhập** — client subscribe giải nào cũng được |
| Gửi push | `ExpoPushService.java:20` | `sendToUsers(List<Long> userIds, title, body, data)` — ký sẵn đúng thứ cần |
| Sự kiện nghiệp vụ | `MailDomainEvent.java` | record có `eventType`, `tournamentId`, `variables`, `entityKey` (dạng `"MATCH-12"`) |
| Mẫu listener | `NotificationPushListener.java` | Đã có một listener kiểu này chạy production, chép cấu trúc của nó |
| Lưu device token | `DeviceToken.java`, `POST /notifications/device-token` | Mobile đã đăng ký token qua `usePushNotifications.js` |
| API công khai | `publicTournamentApi.js` | `getPublicMatches`, `listPublicParticipants`, `getPublicStages` |
| Thư viện thông báo | `expo-notifications` ~0.32.17 | Đã cài, đã có luồng xin quyền + kênh Android |

**Sự kiện cần dùng đã có đủ, không phải thêm `EmailEventType` mới:**
`MATCH_COMPLETED` · `MATCH_STARTING_SOON` · `MATCH_SCHEDULED_REMINDER` · `TOURNAMENT_DRAW_COMPLETED` · `TOURNAMENT_STATUS_CHANGED`

---

## 3. Backend — thêm mới, không sửa gì

### Vì sao được phép

Ràng buộc 07/08 cấm sửa DB và file BE đang chạy. Thiết kế này **không sửa file nào** — chỉ thêm bốn file mới và một bảng mới.

Rủi ro thật của ràng buộc đó nằm ở `ALTER TABLE`: BE dùng `ddl-auto: update` và không có Flyway/Liquibase, nên sửa entity cũ sinh ALTER trên dữ liệu thật. Entity **mới** chỉ sinh `CREATE TABLE` — không chạm dòng dữ liệu nào đang có. Gỡ bỏ cũng chỉ cần `DROP TABLE`.

`MailDomainEvent` vốn được thiết kế cho đúng việc này; chú thích trong file ghi rõ *"thêm listener mới không cần sửa nơi phát"*.

### Bảng mới

```sql
CREATE TABLE user_follows (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT      NOT NULL,
  target_type VARCHAR(20) NOT NULL,   -- TOURNAMENT | PLAYER
  target_id   BIGINT      NOT NULL,
  created_at  DATETIME    NOT NULL,
  UNIQUE KEY uk_follow (user_id, target_type, target_id),
  KEY idx_target (target_type, target_id)
);
```

`user_id` để **kiểu `Long` thường, KHÔNG dùng `@ManyToOne` sang `User`** — để Hibernate không có cớ đụng vào bảng `users`. Chỉ số `idx_target` phục vụ truy vấn ngược (cho target → ra danh sách người theo dõi), đó là truy vấn nóng nhất của listener.

`target_id` khi `targetType = PLAYER` là **`userId` của cơ thủ**, không phải `participantId` — participant chỉ tồn tại trong phạm vi một giải, theo dõi kiểu đó thì hết giải là mất.

### Bốn file mới

| File | Việc |
|---|---|
| `entity/UserFollow.java` | Entity theo schema trên |
| `repository/UserFollowRepository.java` | `findByUserId`, `findUserIdsByTargetTypeAndTargetId`, `existsBy...`, `deleteBy...` |
| `controller/FollowController.java` | `GET /follows` · `POST /follows` · `DELETE /follows/{type}/{id}` |
| `service/impl/FollowPushListener.java` | Nghe `MailDomainEvent`, tra người theo dõi, gọi `ExpoPushService.sendToUsers` |

### Listener hoạt động thế nào

```
MailDomainEvent tới
   │
   ├── tournamentId ──────────► ai theo dõi GIẢI này?
   │
   └── entityKey "MATCH-{id}" ─► tra 2 participant của trận
                                  └─► userId của họ
                                       └─► ai theo dõi CƠ THỦ này?
   │
   ▼
gộp hai danh sách, loại trùng
   │
   ▼
TRỪ những người đã nhận qua NotificationPushListener
(người trong cuộc — không để họ nhận hai lần cùng một tin)
   │
   ▼
ExpoPushService.sendToUsers(...)
```

Cần một repository **mới** trên entity `Match`/`Participant` cũ để tra người chơi của trận — Spring Data cho phép nhiều repository trên cùng entity, nên không phải thêm method vào repository cũ.

Bốn điểm phải cẩn thận khi viết listener, chép theo `NotificationPushListener`:

- **Không đánh `@Transactional`** — listener kia cố ý không đánh, làm khác sẽ giữ transaction nghiệp vụ mở lâu hơn cần thiết
- Dùng `@TransactionalEventListener(phase = AFTER_COMMIT)` — chưa commit mà đã đẩy push thì người dùng bấm vào thông báo lại thấy dữ liệu cũ
- `@Async` — gọi Expo Push là I/O mạng, đừng chặn luồng nghiệp vụ
- Nuốt mọi lỗi và ghi log — push hỏng không được làm hỏng việc ghi nhận tỉ số

---

## 4. Mobile

### Tầng 1 — đang mở app

`useTournamentSocket` hiện chỉ nghe **một** giải. Cần một hook mới nghe **nhiều** giải cùng lúc (các giải đang theo dõi + giải chứa cơ thủ đang theo dõi), lọc bản tin rồi hiện thông báo trong app.

Chưa có thư viện toast trong project — thông báo dạng dải trượt từ trên xuống phải tự dựng, hoặc dùng `Notifications.presentNotificationAsync` cho thống nhất với tầng 2.

### Tầng 2 — hẹn giờ cục bộ

`Notifications.scheduleNotificationAsync` với trigger thời gian. Mỗi lần mở app:

1. Đọc `GET /follows`
2. Với mỗi giải đang theo dõi, gọi `getPublicMatches` lấy trận có `scheduledAt` trong tương lai
3. Lọc trận có cơ thủ đang theo dõi (hoặc mọi trận nếu đang theo dõi cả giải)
4. `cancelAllScheduledNotificationsAsync` rồi đặt lại — tránh trùng khi lịch đổi
5. Đặt lịch trước giờ đấu 15 phút

Giới hạn cố hữu: lịch chỉ được làm mới lúc mở app. Ban tổ chức dời trận sau đó thì thông báo vẫn bắn theo giờ cũ. **Nêu rõ giới hạn này trong phần cài đặt của app**, đừng để người dùng tưởng nó chính xác tuyệt đối.

### Tầng 3 — nhận push

Không phải viết gì thêm ở mobile: `usePushNotifications.js` đã đăng ký device token và đã có listener xử lý khi chạm vào thông báo. Chỉ cần bảo đảm `data` trong payload có `tournamentId` / `matchId` để điều hướng đúng màn.

### Giao diện

- Nút ☆ ở màn chi tiết giải (`TournamentDetail`) và màn hồ sơ cơ thủ (`PlayerProfileView`)
- Màn "Đang theo dõi" trong drawer, dựng theo khuôn ở `docs/mobile/05-screen-template.md`
- Trạng thái nút đọc từ `GET /follows` tải một lần rồi giữ trong store Zustand — đừng gọi API kiểm tra riêng cho từng nút

---

## 5. Frontend web

Chỉ tầng 1: nút theo dõi, màn danh sách đang theo dõi, thông báo trong tab qua WebSocket (`@stomp/stompjs` đã có sẵn, dùng chung version với mobile).

Web push cố ý **không** làm — xem lý do ở mục 1.

---

## 6. Thứ tự thi công gợi ý

1. **BE**: entity + repository + controller. Test bằng Swagger, chưa cần client.
2. **Mobile tầng 1**: nút theo dõi + màn danh sách + socket nhiều giải. Đây là phần thấy được ngay.
3. **Mobile tầng 2**: hẹn giờ cục bộ. Chạy được trong Expo Go nên kiểm chứng được ngay.
4. **BE listener** (tầng 3) + kiểm thử bằng development build.
5. **Web tầng 1**.

Dừng lại được sau bất kỳ bước nào — mỗi bước tự nó đã có ích.

---

## 7. Phải kiểm chứng trên máy thật trước khi tin

- **Hẹn giờ cục bộ có chạy trong Expo Go SDK 54 không.** Expo gỡ *remote* push khỏi Expo Go từ SDK 53; local notification về lý thuyết vẫn chạy, nhưng chưa ai trong nhóm thử. Nếu không chạy thì tầng 2 mất giá trị và phải đẩy nhanh development build.
- **iOS giới hạn 64 thông báo hẹn giờ cùng lúc.** Người theo dõi nhiều giải sẽ chạm trần — phải cắt bớt, chỉ đặt lịch cho N trận gần nhất.
- **Quyền thông báo bị từ chối** thì tầng 2 và 3 im lặng. Cần màn giải thích trước khi xin quyền, đừng xin trần trụi lúc vừa mở app.

## 8. Việc cố ý KHÔNG làm

- Theo dõi một trận đấu lẻ (lý do ở mục 1)
- Web push
- Đồng bộ danh sách theo dõi sang tài khoản mạng xã hội, chia sẻ danh sách
- Thông báo theo ngưỡng ("báo khi Hùng dẫn trước 3 ván") — đủ đất cho một spec riêng
