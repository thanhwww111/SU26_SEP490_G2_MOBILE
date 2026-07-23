# BTMS Mobile

App di động của hệ thống quản lý giải đấu billiards (SEP490_G2), dùng chung backend
Spring Boot với FE web.

Xây bằng **Expo SDK 54** + **React Native 0.81** + **expo-router** + **NativeWind**.

> **Đừng tự nâng SDK.** Expo Go trên App Store / Play Store chỉ chạy được đúng một
> phiên bản SDK. Project phải khớp với bản Expo Go mà cả nhóm đang cài, nếu không sẽ
> gặp lỗi *"Project is incompatible with this version of Expo Go"*. Khi nào muốn nâng
> thì cả nhóm cùng cập nhật Expo Go rồi nâng SDK một lượt.

---

## Yêu cầu máy

| Thành phần | Ghi chú |
|---|---|
| Node.js 20+ | Đã có sẵn nếu bạn chạy được FE web |
| Điện thoại Android/iOS | Cài app **Expo Go** từ Play Store / App Store |
| Android Studio | **Không bắt buộc** — chỉ cần khi muốn dùng emulator |

Máy tính và điện thoại phải **cùng một mạng Wi-Fi**.

---

## Chạy lần đầu

```bash
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

Mở `.env`, thay IP bằng IP LAN của máy bạn:

```
EXPO_PUBLIC_API_URL=http://192.168.1.14:8080
```

Lấy IP: mở PowerShell, chạy `ipconfig`, tìm dòng **IPv4 Address** của card Wi-Fi.

> **Không dùng `localhost`.** Điện thoại sẽ hiểu `localhost` là chính nó chứ không
> phải laptop của bạn, và mọi request API sẽ fail.

Sau đó:

```bash
npm start
```

Terminal hiện mã QR:
- **Android**: mở app Expo Go → *Scan QR code*
- **iOS**: mở app Camera → quét QR → bấm thông báo hiện ra

Sửa code trong VS Code → nhấn save → app tự reload.

---

## Chạy hằng ngày

```bash
npm start
```

Phím tắt trong terminal khi Metro đang chạy:

| Phím | Tác dụng |
|---|---|
| `r` | Reload app |
| `j` | Mở debugger |
| `m` | Bật/tắt menu dev trên thiết bị |
| `?` | Xem toàn bộ phím tắt |

---

## Kết nối backend

Backend phải chạy trước (`SU26_SEP490_G2_BE`, cổng 8080). Ba việc cần kiểm tra khi
điện thoại không gọi được API:

1. **Đúng IP** — IP LAN đổi mỗi khi bạn đổi mạng Wi-Fi. Sửa lại `.env` rồi khởi động
   lại Metro (`npm start`), vì biến môi trường chỉ đọc lúc khởi động.
2. **Firewall Windows** — mặc định Windows chặn kết nối từ máy khác vào cổng 8080.
   Mở cổng bằng PowerShell **quyền Administrator**:
   ```powershell
   New-NetFirewallRule -DisplayName "Spring Boot 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```
3. **CORS ở backend** — cấu hình CORS phải cho phép origin từ app. Trong lúc dev có
   thể tạm cho phép `*`.

Cách kiểm tra nhanh: mở trình duyệt **trên điện thoại**, vào
`http://192.168.1.14:8080/api/v1/...`. Nếu trình duyệt điện thoại không vào được thì
vấn đề nằm ở mạng/firewall chứ không phải code.

Màn hình Login hiển thị sẵn URL API đang dùng ở cuối trang để bạn đối chiếu.

---

## Cấu trúc thư mục

```
app/                    # Màn hình — expo-router định tuyến theo tên file
├── _layout.jsx         # Layout gốc: khôi phục phiên đăng nhập, khai báo Stack
├── index.jsx           # Điều hướng theo trạng thái đăng nhập
├── login.jsx           # Màn hình đăng nhập  →  /login
└── (app)/              # Nhóm màn hình cần đăng nhập
    ├── _layout.jsx     # Guard: chưa đăng nhập thì đẩy về /login
    └── home.jsx        # Trang chủ  →  /(app)/home

src/
├── api/                # Gọi API — port từ FE web, giữ nguyên cấu trúc
│   ├── axiosClient.js  # Instance axios + interceptor gắn token / bắt lỗi 401
│   └── authApi.js
├── components/         # Component dùng lại nhiều nơi
├── constants/          # Hằng số: role, key lưu trữ, URL backend
├── store/              # State toàn cục bằng zustand
│   └── authStore.js
└── utils/
    ├── auth.js         # Chuẩn hoá role, decode JWT, lưu/đọc phiên
    ├── storage.js      # SecureStore (native) / localStorage (web)
    └── apiError.js
```

### Thêm màn hình mới

Tạo file trong `app/(app)/`. Tên file chính là đường dẫn:

```
app/(app)/tournaments.jsx        →  /(app)/tournaments
app/(app)/tournaments/[id].jsx   →  /(app)/tournaments/123
```

Điều hướng:

```jsx
import { useRouter } from "expo-router";

const router = useRouter();
router.push("/(app)/tournaments");
```

---

## Khác biệt so với FE web

Code trong `src/` cố ý giữ giống FE web nhất có thể, nhưng có bốn điểm khác biệt
bắt buộc:

| Chủ đề | FE web | Mobile |
|---|---|---|
| Lưu token | `localStorage` (đồng bộ) | `expo-secure-store` (**bất đồng bộ** — phải `await`) |
| Điều hướng khi 401 | `window.location.href` | Guard trong `app/(app)/_layout.jsx` tự đẩy về Login |
| Biến môi trường | `REACT_APP_*` | `EXPO_PUBLIC_*` |
| Styling | Tailwind + SCSS | NativeWind — cú pháp `className` giống hệt, nhưng chỉ hỗ trợ các thuộc tính CSS mà React Native có |

Về NativeWind: dùng `View`/`Text`/`Pressable` thay cho `div`/`span`/`button`. Không có
`hover`, không có CSS grid; layout mặc định là flex column. Mọi chuỗi text **bắt buộc**
nằm trong `<Text>`.

---

## Build file APK

Không cần Android Studio — build trên cloud của Expo:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Build xong tải APK về từ link EAS in ra.
