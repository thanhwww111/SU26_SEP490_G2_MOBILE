---
description: Dựng một màn mới cho app mobile theo đúng quy chuẩn docs/mobile/
argument-hint: <tên màn, ví dụ "danh sách giải đấu" hoặc "chi tiết tin tức">
---

Dựng màn mới: **$1**

Làm theo đúng thứ tự dưới đây. Không nhảy bước, không tự thiết kế giao diện.

## Bước 1 — Định vị (đọc, chưa viết code)

1. Đọc `docs/mobile/07-web-mapping.md`, tìm dòng ứng với màn này. Ghi nhận: route web, file web cần đọc, route mobile dự kiến.
2. **Không tìm thấy dòng nào** → dừng lại, hỏi người dùng. Mobile không tự định nghĩa giao diện mới.
3. Mở file web tương ứng trong `../SU26_SEP490_G2_FE/src/`. Đọc bố cục, thứ tự khối, màu, cách xử lý loading/empty/error.

## Bước 2 — Xác minh API và dữ liệu

1. Tra endpoint trong `docs/mobile/09-backend-reference.md`.
2. Tra shape response trong `docs/mobile/10-data-contracts.md` — lấy **tên field thật**, đừng đoán.
3. Nếu DTO không có trong `10-data-contracts.md`: đọc thẳng file DTO trong
   `../SU26_SEP490_G2_BE/src/main/java/com/capstone/su26_sep490_g2_be/dto/`,
   rồi **bổ sung vào `10-data-contracts.md`** để lần sau khỏi đọc lại.
4. Endpoint chưa tồn tại → báo người dùng, dừng phần đó. Không chế đường dẫn, không mock rồi để đó.

Báo cáo ngắn gọn cho người dùng trước khi viết code:
- Endpoint sẽ dùng
- Field sẽ hiển thị
- Component tái dùng được
- Component phải tạo mới
- Điều gì còn thiếu hoặc chưa chắc

## Bước 3 — Viết code

Theo khuôn trong `docs/mobile/05-screen-template.md`, dùng snippet có sẵn từ `docs/mobile/08-reusable-patterns.md`.

Thứ tự:

1. **Module API** trong `src/api/` — nếu chưa có. Đúng pattern `axiosClient` + `getApiData` + `parsePagedResponse`.
2. **Component tải dữ liệu** trong `src/components/<feature>/` — chứa `useEffect` với cờ `alive`, xử lý đủ loading/data/empty/error.
3. **File màn** trong `app/(app)/` — chỉ lắp ráp, không chứa logic tải dữ liệu.
4. **Điều hướng** — thêm mục vào `src/components/layout/navItems.js` nếu màn cần xuất hiện trong drawer.

Ràng buộc bắt buộc:

- Màu, spacing, cỡ chữ lấy từ token (`className` hoặc `src/theme/tokens.js`). **Không hardcode hex.**
- Không tự dựng header — `app/(app)/_layout.jsx` đã dựng.
- Không lồng `FlatList` trong `ScrollView`.
- Ảnh dùng `RemoteImage`, không dùng `<Image>` trần.
- Chữ có thể dài phải có `numberOfLines`.
- Vùng chạm ≥ 44×44, bù bằng `hitSlop` nếu icon nhỏ.
- Comment bằng tiếng Việt, giải thích **tại sao**, khớp phong cách các file hiện có.

## Bước 4 — Tự kiểm

Chạy checklist ở `docs/mobile/05-screen-template.md`, Bước 7.

Sau đó báo cáo trung thực:
- Đã kiểm chứng được gì (và bằng cách nào)
- Chưa kiểm chứng được gì
- Phần nào bỏ dở và vì sao

**Không nói "đã xong" nếu chưa chạy thử trên máy thật.** Nói rõ là code đã viết xong nhưng chưa chạy.

## Bước 5 — Cập nhật tài liệu

1. `docs/mobile/07-web-mapping.md` — đổi trạng thái màn từ 🎯/⏳ sang ✅, điền route mobile thật.
2. `docs/mobile/10-data-contracts.md` — bổ sung DTO mới gặp.
3. `docs/mobile/08-reusable-patterns.md` — nếu vừa viết một pattern sẽ lặp lại ở màn khác.

Bước này hay bị quên. Nó là lý do lần sau dựng màn nhanh hơn lần này.

---

## Khi màn đủ phức tạp

Màn có nhiều tab, nhiều luồng con, hoặc đụng WebSocket / deep link / thanh toán thì **viết spec trước khi code**, lưu ở `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`:

```markdown
# <Tên màn>

## Mục đích
Màn này giải quyết việc gì cho người dùng nào.

## Tham chiếu web
Route + file web tương ứng. Khác biệt so với web và lý do.

## Route
Đường dẫn mobile, tham số, vào từ đâu, ra đi đâu.

## API
| Endpoint | Method | Dùng cho | Response DTO |

## Component
Tái dùng: ...
Tạo mới: ... (kèm lý do vì sao không tái dùng được)

## Luồng dữ liệu
Tải lúc nào, phân trang ra sao, làm mới thế nào.

## Trạng thái
Loading / Data / Empty / Error — mỗi cái hiển thị gì.

## Rủi ro đã biết
Những chỗ có thể sai, phụ thuộc chưa sẵn sàng.

## Cách kiểm chứng
Các bước để xác nhận màn chạy đúng.
```
