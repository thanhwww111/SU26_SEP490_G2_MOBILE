# Tài liệu Mobile — BTMS

Bộ tài liệu chuẩn cho app mobile. Mục tiêu: mọi màn mới, dù ai làm — người hay AI agent — đều ra cùng một kiểu.

---

## Đọc theo thứ tự nào

**Lần đầu vào project:** đọc [02](02-development-workflow.md) → [01](01-design-system.md). Hai file này giải thích *tại sao* mọi thứ được làm theo cách hiện tại.

**Sắp làm một màn:** mở thẳng [05](05-screen-template.md), tra [01](01-design-system.md) khi cần màu hoặc cỡ chữ.

**Là AI agent:** đọc [06](06-agent.md) trước tiên — có danh sách những chỗ tài liệu cũ trong repo đang ghi sai.

---

## Các file

| File | Nội dung | Ngôn ngữ |
|---|---|---|
| [01-design-system.md](01-design-system.md) | Màu, chữ, spacing, bo góc, bóng đổ, quy cách component. **Nguồn sự thật về giao diện.** | Tiếng Việt |
| [02-development-workflow.md](02-development-workflow.md) | Thứ tự làm một tính năng, từ API tới merge. Definition of Done. | English |
| [03-component-guidelines.md](03-component-guidelines.md) | Cách dựng và tổ chức component. Phân loại, đặt tên, checklist review. | English |
| [04-api-integration.md](04-api-integration.md) | Kiến trúc tầng gọi API, pattern `axiosClient`, xử lý lỗi và phân trang. | English |
| [05-screen-template.md](05-screen-template.md) | Khuôn code để dựng màn mới, kèm checklist tự kiểm trước PR. | Tiếng Việt |
| [06-agent.md](06-agent.md) | Quy tắc cho AI agent + những sự thật về project cần kiểm chứng. | Tiếng Việt |
| [07-web-mapping.md](07-web-mapping.md) | Màn nào của web ứng với màn nào của mobile, màn nào không đưa lên. | Tiếng Việt |
| [08-reusable-patterns.md](08-reusable-patterns.md) | Snippet hay dùng: gọi API, phân trang, form, badge, điều hướng. | Tiếng Việt |
| [09-backend-reference.md](09-backend-reference.md) | Endpoint và enum trạng thái, trích từ controller thật. | Tiếng Việt |
| [10-data-contracts.md](10-data-contracts.md) | Shape DTO thật: response có field gì, request cần gì. | Tiếng Việt |
| [11-changelog.md](11-changelog.md) | Nhật ký: màn nào đã dựng, quyết định gì, còn nợ gì. | Tiếng Việt |
| [12-payos-test-checklist.md](12-payos-test-checklist.md) | Bảy kịch bản phải tự tay chạy trên máy thật trước khi phát hành bản có thanh toán. | Tiếng Việt |

Spec của từng tính năng nằm riêng ở `docs/superpowers/specs/`.

## Dựng màn mới bằng một lệnh

```
/new-screen danh sách giải đấu
```

Slash command (`.claude/commands/new-screen.md`) chạy đúng quy trình: tra web-mapping → xác minh endpoint và DTO → viết code theo khuôn → tự kiểm → cập nhật lại tài liệu.

## Tra nhanh

| Cần gì | Mở file |
|---|---|
| "Màn này web làm thế nào?" | [07](07-web-mapping.md) |
| "Response có field tên gì?" | [10](10-data-contracts.md) |
| "Request gửi lên cần gì?" | [10](10-data-contracts.md) |
| "Gọi API phân trang viết sao?" | [08](08-reusable-patterns.md) |
| "Endpoint đăng ký giải là gì?" | [09](09-backend-reference.md) |
| "Nhãn tiếng Việt của `PENDING_PAYMENT`?" | [09](09-backend-reference.md) |
| "Màu nút chính là gì?" | [01](01-design-system.md) |
| "Bắt đầu màn mới từ đâu?" | [05](05-screen-template.md) |
| "Sắp phát hành bản có thanh toán, phải thử gì?" | [12](12-payos-test-checklist.md) |

---

## Ba điều quan trọng nhất

Nếu chỉ nhớ được ba điều:

1. **Web FE là chuẩn giao diện.** Mobile không tự thiết kế. Không có màn tương ứng trên web thì hỏi nhóm.
2. **Không hardcode màu, spacing, cỡ chữ.** Dùng class Tailwind, hoặc `src/theme/tokens.js` khi React Native đòi giá trị JS.
3. **Mỗi màn có dữ liệu phải xử lý đủ bốn trạng thái**: loading, data, empty, error. Và một khối lỗi không được kéo sập cả màn.

---

## Token sống ở đâu

Tài liệu mô tả, code định nghĩa. Hai file này phải luôn khớp nhau:

| File | Chứa gì |
|---|---|
| `tailwind.config.js` | Màu dùng qua `className`: `navy-*`, `accent`, `gold`, `success`… |
| `src/theme/tokens.js` | Màu dùng qua prop JS: `colors`, `iconSize`, `shadow`, `scrim` |

Sửa một bên mà quên bên kia thì màu icon sẽ lệch màu chữ ngay cạnh nó.

Màu trung tính (xám) **không định nghĩa lại** — web dùng đúng thang `slate` mặc định của Tailwind nên mobile dùng thẳng `slate-50` → `slate-900`.

---

## Trạng thái hiện tại

Cập nhật: 2026-07-29. Chi tiết từng đợt làm nằm ở [11-changelog.md](11-changelog.md).

**Đã có:**

| Nhóm | Màn |
|---|---|
| Auth | Đăng nhập, đăng ký, quên/đặt lại mật khẩu |
| Trang chủ | Banner, tin tức, lịch thi đấu, top tay cơ |
| Giải đấu | Danh sách `/event`, chi tiết `/event/[id]` (5 tab) |
| Tin tức | Danh sách `/news`, chi tiết `/news/[slug]` |
| Cơ sở | Danh sách `/branches`, chi tiết `/branches/[id]` |
| Cá nhân | Hồ sơ (sửa thông tin, đổi ảnh, đổi mật khẩu), đăng ký giải của tôi |
| Giao diện | Dark mode cho toàn nhóm `(app)` — Tự động / Sáng / Tối trong menu hồ sơ |

**Ưu tiên tiếp theo** — vẫn là luồng PLAYER:

1. Đăng ký giải `/player/tournaments/:id/register` — form động, đọc field từ API.
2. Lịch thi đấu cá nhân `/player/matches`.
3. Lịch sử thanh toán `/player/payments` — cần deep link PayOS, phải có spec riêng.

**Chặn bởi web:** ba mục `Tỷ Số Trực Tiếp`, `Bảng Xếp Hạng`, `Cơ Thủ` trong drawer còn trống vì **web cũng chưa dựng**. Mobile không tự định nghĩa giao diện mới — cần nhóm chốt thiết kế trước.

Các role còn lại (OWNER, MANAGER, STAFF, ADMIN) làm sau, và không phải màn nào của web cũng cần lên mobile.
