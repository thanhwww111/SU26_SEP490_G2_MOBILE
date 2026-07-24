# Thiết kế: 4 màn auth cho app mobile

Ngày: 2026-07-24

## Mục tiêu

Dựng 4 màn xác thực cho app mobile, bám nhận diện của web FE
(`SU26_SEP490_G2_FE/src/pages/Auth/`): login, register, forgot-password, reset-password.

## Phạm vi

Web FE có 3 file, trong đó `ForgotPasswordPage` gộp 2 bước bằng state (`step === 1` nhập
email, `step === 2` nhập OTP + mật khẩu mới). Bản mobile **tách bước 2 thành màn riêng**
vì điều hướng theo route hợp với expo-router hơn là đổi state trong một màn.

Mức độ bám UI: giữ nhận diện (nền navy, logo, nút pill), bỏ những thứ thuần web
(footer 4 cột thông tin Matchroom, các hover state).

**Sửa sau khi xem thực tế:** bỏ luôn card trắng — form đặt thẳng lên nền ảnh tối, trông
thoáng hơn hẳn trên màn hình điện thoại. Kéo theo toàn bộ màu chữ và ô nhập phải đảo:
`AuthScreen card={false}`, `Input tone="dark"`, `Button variant="light"` cho hành động
chính và `variant="ghost"` cho hành động phụ, `FormError`/`FormSuccess`/`TextLink` đều
có `tone="dark"`.

Cả 4 màn nối API thật ngay, không mock.

## Cấu trúc route

```
app/
  _layout.jsx          giữ nguyên (hydrate auth + WebPhoneFrame)
  index.jsx            giữ nguyên (redirect theo isAuthenticated)
  (auth)/
    _layout.jsx        Stack, headerShown: false
    login.jsx          chuyển từ app/login.jsx
    register.jsx
    forgot-password.jsx
    reset-password.jsx
  (app)/               giữ nguyên
```

`(auth)` là route group nên không đổi URL — vẫn là `/login`, `/register`,
`/forgot-password`, `/reset-password`. `app/index.jsx` đang redirect `/login` nên
không cần sửa.

## Component dùng chung

| Component | Vai trò | Phụ thuộc |
| --- | --- | --- |
| `src/components/auth/AuthScreen.jsx` | Khung chung: ScrollView nền navy + ảnh hero phủ tối, logo `CAPSTONE.`, câu chào, card trắng chứa `children`. Nhận prop `title`. Ảnh nền phải là `<Image>` với `width/height: "100%"` — xem ghi chú bên dưới. | `assets/auth-hero.jpg` |
| `src/components/Input.jsx` | Label + ô nhập + chữ lỗi. Prop `secure` bật nút con mắt. Gom logic đổi màu viền/nền khi lỗi. | lucide `Eye`/`EyeOff` |
| `src/components/Button.jsx` | Đã có. Variant `primary` đổi sang **pill** `rounded-full` nền `navy-700`. Thêm `light` (nền trắng, chữ navy) và `ghost` (viền trắng mờ, chữ trắng) cho form trên nền tối. `outline` giữ nguyên. | — |
| `src/components/auth/FormError.jsx` | Box đỏ báo lỗi submit ở đầu card. | — |
| `src/components/auth/FormSuccess.jsx` | Box xanh báo thành công (đặt lại mật khẩu xong). | lucide `CheckCircle2` |
| `src/components/auth/TextLink.jsx` | Link chữ trong form. Dùng `Pressable` + `hitSlop` chứ không `<Text onPress>`: chữ 12px chỉ cao ~16px, dưới ngưỡng chạm 44px. | — |
| `src/utils/validators.js` | `validateEmail`, `validatePassword`, `validatePhone`, `validateConfirmPassword`, `validateOtp`, `collectErrors`. Giữ nguyên thông báo tiếng Việt của web. | — |

Lý do tách: 4 màn giống nhau khoảng 70% ở phần khung và ô nhập. Web FE hiện lặp
`validateField` và `inputClass` ở cả 3 file — không lặp lại trên mobile.

## Bảng màu

Thêm vào `tailwind.config.js`:

```js
navy:   { 900: "#0d1b3e", 700: "#1a2a4a", 600: "#243660" },
accent: "#e8471a",   // dấu chấm cam sau logo
```

Giữ nguyên `brand-*` (xanh dương) vì màn Home đang dùng.

## Luồng dữ liệu

| Màn | Field | API | Thành công |
| --- | --- | --- | --- |
| login | email, password | `login` | `loginFromResponse` → `/(app)/home` |
| register | email, phone, password, confirmPassword, agreeTerms | `register` | về `/login` |
| forgot-password | email | `forgotPassword` | sang `/reset-password?email=...` |
| reset-password | otp, newPassword, confirmPassword | `resetPassword` | báo thành công 2s → về `/login` |

`reset-password` nhận `email` qua route param từ màn forgot.

## Xử lý lỗi

Cả 4 màn dùng chung pattern của web:

1. `data.success === false` → `throw new Error(data.message || <fallback>)`
2. `catch` → `setErrors({ submit: err.message })`
3. Hiện box đỏ ở đầu card

Validation chạy khi gõ (chỉ sau khi field đã `touched`) và chạy lại toàn bộ khi submit.

## Thay đổi ngoài phạm vi 4 màn

- `src/api/authApi.js`: thêm lại `register`, `forgotPassword`, `resetPassword` (đã xoá ở
  bước dọn rác vì lúc đó chưa có màn nào dùng). Endpoint giống web: `/auth/register`,
  `/auth/forgot-password`, `/auth/reset-password`.
- Copy `public/images/tournaments/action-1.jpg` của web FE sang `assets/auth-hero.jpg`.

## Bẫy đã gặp khi làm ảnh nền

Trên React Native Web, ảnh nền không chịu ràng buộc kích thước theo cách quen thuộc:

- `<ImageBackground className="flex-1">` — className không tới được container, ảnh render
  đúng kích thước gốc (1920x2880) và tràn khỏi màn hình.
- `<Image style={StyleSheet.absoluteFill} />` — vẫn hỏng. RN Web gán `width: 1920px;
  height: 2880px` vào style, mà width tường minh thắng cặp `left/right: 0`.
- Cách chạy đúng: `style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}`.

Triệu chứng dễ hiểu nhầm: nền trông như một mảng navy phẳng (thực ra là một góc nhỏ của
ảnh bị phóng to), rất dễ tưởng ảnh không load.

## Kiểm chứng

Chạy `npm run web`, đi qua cả 4 màn trong khung điện thoại: kiểm tra điều hướng giữa các
màn, validation từng field, và trạng thái lỗi khi submit. Backend có thể đang tắt — khi đó
xác nhận màn hiện lỗi mạng đúng chỗ thay vì crash.
