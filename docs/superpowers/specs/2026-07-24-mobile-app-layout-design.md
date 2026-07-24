# Thiết kế: Layout chung cho nhóm màn (app)

Ngày: 2026-07-24

## Mục tiêu

Dựng header, navbar dạng drawer, footer và menu hồ sơ cho các màn sau đăng nhập, bám
layout của web FE (`SU26_SEP490_G2_FE/src/components/layouts/`).

## Phạm vi: vì sao tách đợt

Yêu cầu ban đầu gộp ba việc độc lập. Đã chốt tách:

| Đợt | Nội dung | Trạng thái |
| --- | --- | --- |
| 1 | Header + Drawer + Footer + menu hồ sơ | đợt này |
| 2 | Dark mode | sau — chạm vào ~20 file đã viết, gộp vào đây sẽ khó review |
| 3 | Các màn mà navbar trỏ tới (tin tức, giải đấu, cơ sở, 3 màn player) | sau |

Navbar của web có 6 mục, menu hồ sơ có thêm 3 mục cho player. **Cả 9 mục đều chưa có màn
tương ứng trên mobile** (bản thân web cũng để `path: null` cho 3 mục). Vì vậy đợt này
drawer chỉ hiện mục đã có màn thật.

## Cấu trúc

```
app/(app)/_layout.jsx        guard + AppHeader + Stack + AppDrawer + ProfileMenu

src/components/layout/
  navItems.js       khai báo mục điều hướng dùng chung
  AppHeader.jsx     hamburger (hoặc nút quay lại) | logo | avatar
  AppDrawer.jsx     Modal trượt từ trái
  ProfileMenu.jsx   Modal dropdown góc phải
  AppFooter.jsx     link + logo CAPS. + địa chỉ + social
```

**Footer không đặt trong layout** mà nằm cuối `ScrollView` của từng màn. Giống web: footer
phải cuộn tới mới thấy, không dính đáy màn hình.

**Drawer và dropdown dùng `Modal`, không dùng `View` absolute.** Header có chiều cao cố
định nên dropdown đặt absolute bên trong sẽ bị cắt mất.

Đã loại hai hướng khác: mỗi màn tự render header/footer (lặp ở mọi màn mới, dễ quên), và
dùng `expo-router/drawer` (được cử chỉ vuốt nhưng phải thêm `@react-navigation/drawer` +
`react-native-gesture-handler`, lại khó bám giao diện web vì thư viện có style riêng).

## Nút trái của header

`AppHeader` đổi nút trái theo màn đang mở, xác định bằng `useSegments()`:

- Đang ở `home` → nút hamburger, mở drawer
- Màn khác → nút quay lại, gọi `router.back()`

Cách này tránh việc màn con phải tự dựng header riêng (sẽ thành hai header chồng nhau).

## Nội dung điều hướng

`navItems.js` khai báo cả 6 mục của web, mỗi mục có cờ `ready` đánh dấu đã có màn hay
chưa. Drawer chỉ render mục `ready: true`. Khi làm xong màn mới chỉ cần bật cờ, không
phải sửa `AppDrawer`.

Đợt này `ready: true` cho: **Trang chủ** (`/(app)/home`) và **Hồ sơ** (`/(app)/profile`).

Dropdown hồ sơ: **Hồ sơ** → `/(app)/profile`, gạch ngang, **Đăng xuất** → `logout()` rồi
`replace("/login")`.

Cuối drawer chừa sẵn khoảng trống cho nút chuyển sáng/tối của đợt 2 — chưa đặt nút.

## Footer

Web có 16 link chia 4 cột. Mobile xếp **1 cột dọc, gom thành 2 nhóm** (điều hướng và pháp
lý), rồi tới logo `CAPS.`, địa chỉ Matchroom, dòng bản quyền, hàng icon mạng xã hội. Giữ
nguyên chữ tiếng Việt của web.

Link footer bên web đều là `href="/"` — chưa trỏ đâu cả. Bản mobile để chúng **không bấm
được** thay vì bấm vào không phản ứng.

## Màu

Web dùng ba sắc đỏ khác nhau cho cùng dấu chấm sau logo: `#EF342A` ở Header, `text-red-500`
ở Footer, `#e8471a` ở trang Auth. Bản mobile dùng thống nhất một màu `accent` (`#e8471a`)
đã khai trong `tailwind.config.js`.

## Kiểm chứng

Đăng nhập rồi: mở drawer từ hamburger và đóng bằng nút X hoặc chạm ra ngoài; bấm avatar
mở dropdown, vào được màn hồ sơ, nút trái đổi thành mũi tên quay lại; đăng xuất từ dropdown
về đúng màn login; cuộn hết trang chủ thấy footer.
