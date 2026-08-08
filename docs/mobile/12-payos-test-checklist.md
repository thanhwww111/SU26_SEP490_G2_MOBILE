# Checklist kiểm thử thanh toán PayOS trên thiết bị thật

Cập nhật: 2026-08-08

> Đợt 2026-08-08 (b) thêm ba thứ nữa cũng chỉ kiểm được trên máy thật: bộ chọn ngày (`DateField`, hai nhánh Android/iOS), WebSocket tỷ số trực tiếp (`useTournamentSocket` — nối tới IP LAN, xuống nền rồi lên lại, rớt mạng rồi nối lại), và luồng OTP 3 bước (cần email thật). Chạy cùng lúc với checklist này cho đỡ mất công dựng môi trường hai lần.

Luồng thanh toán là chỗ **không kiểm được bằng bundle hay test hàm thuần**: nó phụ thuộc vào cách hệ điều hành xử lý trình duyệt trong app và vòng đời tiền cảnh/nền. Chạy hết checklist này trước khi đưa bản build cho người dùng thật.

Code liên quan: `src/hooks/usePayOsCheckout.js`, `src/api/paymentApi.js`.

---

## Chuẩn bị

1. Backend chạy được từ điện thoại: `EXPO_PUBLIC_API_URL` là **IP LAN**, không phải `localhost`.
2. Có tài khoản PLAYER và **một giải đang mở đăng ký, có phí > 0**.
3. PayOS đang ở chế độ sandbox và webhook trỏ đúng về backend đang chạy. Webhook hỏng thì kịch bản 3 và 5 sẽ cho kết quả sai mà không phải lỗi mobile.
4. Mở log backend song song — cần thấy `confirm-return` được gọi mấy lần.

> Thông báo đẩy không chạy trong Expo Go, nhưng thanh toán thì có. Vẫn nên thử trên development build vì đó là thứ người dùng sẽ cài.

---

## Kịch bản

Cột cuối là thứ phải thấy. Đánh dấu khi đã tự tay chạy.

### 1. Đường thẳng — trả tiền rồi đóng trình duyệt

- [ ] Đăng ký giải có phí → PayOS mở trong app → thanh toán thành công → **đóng trình duyệt bằng nút X**.
- [ ] Kỳ vọng: màn kết quả hiện ngay trạng thái đã thanh toán, không phải kéo refresh.
- [ ] Log backend: `confirm-return` được gọi **đúng một lần**.

### 2. Bỏ ngang — đóng trình duyệt mà chưa trả

- [ ] Mở PayOS rồi đóng luôn.
- [ ] Kỳ vọng: đăng ký nằm ở **chờ thanh toán**, không báo lỗi đỏ, và trả lại được từ màn "Đăng ký của tôi".

### 3. Rời app giữa chừng — đây là ca hook sinh ra để xử lý

- [ ] Thanh toán xong trên PayOS, **KHÔNG đóng trình duyệt**, bấm nút Home.
- [ ] Mở lại app từ đa nhiệm.
- [ ] Kỳ vọng: app tự đối chiếu khi trở lại tiền cảnh, trạng thái chuyển sang đã thanh toán mà không cần thao tác gì.
- [ ] Log backend: `confirm-return` được gọi, và **không gọi lặp** mỗi lần chuyển tiền cảnh sau đó.

### 4. App bị đóng hẳn giữa chừng

- [ ] Thanh toán xong, không đóng trình duyệt, **vuốt tắt app** khỏi đa nhiệm.
- [ ] Mở lại app từ icon, vào màn "Đăng ký của tôi".
- [ ] Kỳ vọng: mã đơn treo được đọc lại từ bộ nhớ, đối chiếu chạy, trạng thái đúng.
- [ ] Đây là ca dễ hỏng nhất — nếu sai, kiểm tra `PENDING_ORDER_KEY` có ghi được không (SecureStore trên máy chưa đặt khoá màn hình đôi khi từ chối ghi).

### 5. Mất mạng giữa lúc đối chiếu

- [ ] Thanh toán xong → tắt Wi-Fi và dữ liệu di động → đóng trình duyệt.
- [ ] Kỳ vọng: app **không văng, không hiện lỗi đỏ chặn màn**. Trạng thái có thể còn cũ.
- [ ] Bật mạng lại, chuyển app sang nền rồi quay lại.
- [ ] Kỳ vọng: lần này đối chiếu chạy được... **hoặc không** — mã đơn đã bị xoá ở lần thất bại trước. Nếu trạng thái vẫn cũ, kéo refresh phải ra đúng (webhook đã cập nhật server). Ghi lại kết quả thực tế: đây là chỗ đánh đổi có chủ ý, xoá khoá sớm để tránh đối chiếu lặp vô hạn.

### 6. Trả tiền lần hai cho cùng một đăng ký

- [ ] Từ "Đăng ký của tôi", bấm thanh toán cho đăng ký **đã trả rồi**.
- [ ] Kỳ vọng: backend chặn hoặc trả về trạng thái đã thanh toán, app không tạo đơn trùng.

### 7. Giải miễn phí

- [ ] Đăng ký giải có `entryFee = 0`.
- [ ] Kỳ vọng: **không mở trình duyệt**, vào thẳng màn kết quả.

---

## Ghi lại kết quả

Kịch bản nào lệch kỳ vọng thì ghi vào `docs/mobile/11-changelog.md` kèm máy và phiên bản hệ điều hành — hành vi trình duyệt trong app khác nhau đáng kể giữa Android và iOS, và giữa các bản Android của từng hãng.
