# Design System — Mobile App

Cập nhật: 2026-07-28

## Mục tiêu

Đây là **nguồn sự thật duy nhất** về giao diện của app mobile. Mọi màn mới phải tuân theo tài liệu này thay vì tự quyết định màu sắc, spacing, typography hay component.

- Đồng nhất giao diện giữa các màn.
- Bám sát nhận diện của Web FE.
- Tăng khả năng tái sử dụng component.
- Giúp AI Agent và developer tạo màn mới theo cùng một tiêu chuẩn.
- Chuẩn bị sẵn nền tảng cho Dark Mode và các role khác.

Tài liệu này nói **trông như thế nào**. Cách dựng và tổ chức component nằm ở [03-component-guidelines.md](03-component-guidelines.md); quy trình làm một màn nằm ở [02-development-workflow.md](02-development-workflow.md).

---

# Phần 1 — Triết lý

## Web FE là chuẩn

Mobile **không tự thiết kế giao diện**. Nếu Web FE đã có màn tương ứng thì mobile bám theo màu sắc, typography, khoảng cách, icon, bố cục và hành vi.

Mobile chỉ được đổi layout khi kích thước màn hình không cho phép, khi thao tác cảm ứng đòi hỏi khác, hoặc khi web dùng layout nhiều cột.

Web

```
Banner | News
Schedule | Ranking
```

Mobile

```
Banner
News
Schedule
Ranking
```

Không đổi màu hay style chỉ vì "đẹp hơn".

> **Ngoại lệ đã ghi nhận: cỡ chữ.** Trang public của web dùng rất nhiều `text-[9px]`, `text-[10px]`, `text-[11px]` — hợp lý trên màn desktop dày đặc thông tin, nhưng bê nguyên sang điện thoại thì không đọc nổi. Mobile dùng thang chữ riêng ở Phần 3. Đây là ngoại lệ **duy nhất** được phép lệch khỏi web mà không cần hỏi.

## Component trước, màn hình sau

Mọi UI đều dựng từ component. Không copy cùng một đoạn UI ở nhiều màn.

Đúng: một `Button` dùng chung cho Login, Register, Forgot Password.
Sai: mỗi màn có một nút riêng.

## Không hardcode

Không hardcode màu, font, spacing, border radius, shadow.

```jsx
// Sai
<View style={{ marginTop: 17 }}>
<Text style={{ color: "#1a2a4a" }}>
<Text className="text-navy-700">   // navy cứng → chìm hẳn ở chế độ tối

// Đúng
<View className="mt-4">
<Text className="text-content">
```

Khi RN bắt buộc dùng giá trị JS (màu icon, `placeholderTextColor`, `ActivityIndicator`), lấy từ hook `useThemeColors()`:

```jsx
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

const colors = useThemeColors();

<ChevronLeft size={iconSize.lg} color={colors.brand} />
<TextInput placeholderTextColor={colors.faint} />
```

**Đừng import bảng màu thẳng** (`lightColors` / `darkColors`) — làm vậy là khoá cứng một chế độ. Hàm thuần không gọi được hook thì nhận màu qua prop từ component cha.

## Ưu tiên đơn giản

Không tạo animation hoặc hiệu ứng nếu Web FE không có. Không thêm gradient, glassmorphism, neumorphism, animation phức tạp. Mục tiêu là đồng nhất, không phải sáng tạo.

---

# Phần 2 — Màu

## Cách đọc bảng màu

Màu được chia ba tầng. Màn hình chỉ chạm tầng 2.

| Tầng | Là gì | Ở đâu |
|---|---|---|
| Primitive | Hex thô | Bảng dưới đây |
| Semantic | Vai trò: nền, viền, chữ phụ… | `tailwind.config.js` + `src/theme/tokens.js` |
| Component | Nút, thẻ, nhãn | Phần 6 |

Hai file `tailwind.config.js` và `src/theme/tokens.js` **phải luôn khớp nhau**. Sửa một bên thì sửa cả bên kia.

## Navy — màu thương hiệu

| Token | Hex | Dùng cho |
|---|---|---|
| `navy-900` | `#0D1B2E` | Nền tối: hero, footer, section đảo màu |
| `navy-800` | `#1E2D4A` | Khối nổi đặt trên nền `navy-900` |
| `navy-700` | `#1A2A4A` | Nút chính, tiêu đề, icon |
| `navy-600` | `#243660` | `navy-700` lúc đang nhấn |
| `navy-500` | `#8A99B5` | Chữ phụ trên nền tối |

```jsx
<View className="bg-navy-900">
  <Text className="text-white">Tiêu đề</Text>
  <Text className="text-navy-500">Chú thích</Text>
</View>
```

## Accent

| Token | Hex | Dùng cho |
|---|---|---|
| `accent` | `#EF342A` | Dấu chấm sau logo, nhãn, link, mục đang chọn |
| `accent-pressed` | `#C92A21` | Lúc đang nhấn |

Toàn app chỉ có **một màu accent duy nhất**.

> Web hiện có hai sắc đỏ: `#EF342A` ở trang public (Header, Home, News, Event) và `#e8471a` ở trang Auth. Nhóm đã chốt lấy `#EF342A` vì đó là màu người dùng nhìn thấy ở hầu hết giao diện.

## Trung tính — dùng token vai trò, không dùng `slate-*`

> **Đổi từ 2026-07-29.** Trước đây mục này bảo dùng thẳng `slate-*`. Từ khi có dark mode thì **không được nữa**: `bg-white` sẽ trắng cả ở chế độ tối. Dùng token vai trò để màu tự đổi.

| Vai trò | Class | Sáng | Tối |
|---|---|---|---|
| Nền màn | `bg-canvas` | `#F8FAFC` | `#070D18` |
| Nền thẻ, khối | `bg-surface` | `#FFFFFF` | `#0F1E33` |
| Lớp phủ nổi trên nội dung | `bg-surface-raised` | `#FFFFFF` | `#18293F` |
| Nền chìm (khối trong card) | `bg-sunken` | `#F1F5F9` | `#16243A` |
| Nền chờ ảnh | `bg-sunken-strong` | `#E2E8F0` | `#1F3049` |
| Kẻ giữa các dòng | `border-line-soft` | `#F1F5F9` | `#1A2942` |
| Viền thẻ | `border-line` | `#E2E8F0` | `#273B57` |
| Viền ô nhập | `border-line-strong` | `#CBD5E1` | `#3A5175` |
| Chữ chính | `text-content` | `#0F172A` | `#F1F5F9` |
| Chữ phụ | `text-content-2` | `#334155` | `#C7D2DE` |
| Chữ mờ | `text-muted` | `#64748B` | `#94A3B8` |
| Mờ nhất | `text-faint` | `#94A3B8` | `#6B7A8F` |
| Bị vô hiệu | `text-disabled` | `#CBD5E1` | `#3A4A60` |

Giá trị định nghĩa ở `global.css`. Chi tiết và các trường hợp ngoại lệ: Phần 9.

Không dùng thang `gray-*`, `zinc-*`, `neutral-*` — chúng lệch sắc so với web. Cũng đừng quay lại `slate-*` cho những vai trò ở bảng trên.

## Trạng thái

| Token | Hex | Dùng cho |
|---|---|---|
| `success` | `#16A34A` | Thành công, đã duyệt |
| `warning` | `#D97706` | Cảnh báo, chờ xử lý |
| `danger` | `#DC2626` | Lỗi, huỷ, xoá |
| `info` | `#2563EB` | Thông tin trung tính |

Màu trạng thái **chỉ dùng cho trạng thái**. Không dùng `danger` làm màu trang trí.

## Vàng huy chương

`gold` = `#C9A227` — chỉ dùng cho thứ hạng và podium.

## `brand-*` và dải màu của khối Top tay cơ

`brand-50 → brand-700` là nhóm xanh dương còn sót từ trước khi có design system, hiện chỉ dùng ở `app/(app)/profile.jsx`. **Không dùng cho màn mới.**

`RANK_ACCENTS` trong `src/constants/leaderboard.js` là tám mã màu cho vạch dưới ảnh cơ thủ ở khối Top tay cơ, xoay vòng theo thứ hạng. Đây là **ngoại lệ có chủ đích** với luật một accent ở trên: khối Ranked của web vốn nhiều màu (`--accent-*` trong `FE/src/styles/variables.css`), và mobile bám theo. Chỉ dùng cho đúng khối đó, không mở rộng sang chỗ khác.

> **Đổi từ 2026-08-06.** Mục này trước đây nói về `src/constants/topPlayers.js` — mảng 9 cơ thủ tĩnh với trường `accent`. File đó đã xoá khi khối Top tay cơ chuyển sang gọi `GET /leaderboard`. Dải màu được giữ lại nhưng tách khỏi dữ liệu, vì giờ dữ liệu đến từ backend còn màu thì vẫn là quyết định giao diện.

---

# Phần 3 — Chữ

## Font

> **Đổi từ 2026-08-10.** Trước đây mục này ghi "dùng font mặc định của hệ điều hành". Không còn đúng: app nạp font riêng để khớp web.

| Vai trò | Font | Class |
|---|---|---|
| Chữ thường | **Be Vietnam Pro** 400/500/600/700/800 | mặc định, không phải gõ gì |
| Tiêu đề, logo | **Oswald** 500/600, nghiêng sẵn | `font-display`, `font-display-bold` |
| Tiêu đề đứng thẳng | Oswald 500 | `font-display-upright` |
| Chữ nghiêng | Be Vietnam Pro Italic 400/700 | `font-italic`, `font-bold-italic` |

### Vì sao không phải Poppins như web

Web khai báo `--font-sans: "Poppins", "Be Vietnam Pro", ...`. Nhưng **Poppins thiếu khoảng U+1EA0–1EF1** — phần lớn nguyên âm có dấu tiếng Việt (ế ộ ữ ầ ắ ị ọ). Trình duyệt thay glyph thiếu bằng font kế tiếp trong stack, nên **chữ có dấu trên web thực chất đang hiện bằng Be Vietnam Pro**.

React Native không có cơ chế thay glyph từng ký tự: `fontFamily` chỉ nhận một tên, ký tự thiếu rơi thẳng xuống font hệ thống. Đặt Poppins sẽ cho ra chữ lệch kiểu ngay giữa một từ. Nội dung app gần như toàn tiếng Việt có dấu, nên mobile dùng thẳng font dự phòng — kết quả trùng với những gì web hiện ra.

Phần tiêu đề thì **web đã theo mobile**: từ 2026-08-10 web bỏ Bebas Neue, dùng Oswald một mình. Bebas cũng thiếu đúng khoảng đó, và vì nó là font display cỡ lớn nên chỗ nối lộ hẳn — tiêu đề tiếng Việt bị thụt lên thụt xuống giữa dòng. Hai bên giờ dùng chung Oswald.

Chi tiết: `src/theme/fonts.js`.

### Tiêu đề nghiêng sẵn

`font-display` đã gói sẵn `skewX(-14deg)` — không phải gõ thêm gì. Web đặt `font-style: italic` cho h1–h6 nhưng Oswald không có bản nghiêng thật, nên trình duyệt tự nghiêng lấy (synthetic oblique, mặc định 14 độ). React Native bỏ qua `fontStyle` với font nạp lúc chạy, nên phải tự làm cùng phép biến hình đó.

`skewX` không đổi kích thước ô chữ, chỉ nghiêng nội dung — chữ có thể ăn lẹm ra ngoài mép vài điểm ảnh. Chỗ nào sát mép màn hoặc nằm trong ô hẹp có cắt nội dung thì dùng `font-display-upright`.

### Độ đậm đổi họ font, không đổi `font-weight`

Expo Go không cho nhúng font ở tầng native, phải nạp lúc chạy, nên **mỗi độ đậm là một họ riêng**. Đặt `font-weight: 700` lên `BeVietnamPro_400Regular` chỉ khiến iOS bôi đậm giả, nét bết lại.

Plugin trong `tailwind.config.js` ghi đè sẵn các lớp Tailwind, nên **viết `font-bold` như bình thường** — không phải nhớ tên font:

| Gõ | Nhận được |
|---|---|
| *(không gõ gì)* | `BeVietnamPro_400Regular` — gắn kèm mọi lớp `text-*` |
| `font-medium` / `font-semibold` | 500 Medium / 600 SemiBold |
| `font-bold` | 700 Bold |
| `font-black` | 800 ExtraBold — web cũng chỉ nạp tới 800 |

**Không dùng lớp `italic` của Tailwind.** Với font nạp lúc chạy, React Native bỏ qua `font-style` — chữ vẫn đứng thẳng. Dùng `font-italic` / `font-bold-italic` (họ font nghiêng thật), hoặc `font-display` cho tiêu đề (nghiêng bằng `skewX`).

**Đậm và nghiêng phải gộp một lớp.** Gõ `font-bold font-italic` thì lớp sau đè lớp trước và mất vế kia.

### Chỗ duy nhất font không tự phủ

Plugin móc `fontFamily` vào các lớp `text-*` **cỡ chữ** (`text-sm`, `text-2xl`…), không phải lớp `text-*` **màu** (`text-content`). Một `<Text>` chỉ có màu mà không có cỡ chữ sẽ ra font hệ thống — trừ khi nó lồng trong `<Text>` cha đã có cỡ, vì Text lồng Text thì kế thừa.

## Thang cỡ chữ

| Vai trò | Class | px | Đậm |
|---|---|---|---|
| Display | `text-[32px]` | 32 | `font-display` |
| Title | `text-3xl` | 30 | `font-display` |
| Heading | `text-2xl` | 24 | `font-display` (tiêu đề màn) / `font-bold` (chữ thường) |
| Sub heading | `text-xl` | 20 | `font-semibold` |
| Section title | `text-base` | 16 | `font-bold` |
| Body | `text-base` | 16 | `font-normal` |
| Small | `text-sm` | 14 | `font-normal` |
| Caption | `text-xs` | 12 | `font-normal` |
| Overline | `text-overline` | 11 | `font-bold` + `uppercase` |

## Quy tắc

**Không dùng cỡ lẻ.** Sai: 15, 17, 18, 19. Đúng: 11, 12, 14, 16, 20, 24, 30, 32.

**11px chỉ dành cho overline** — chữ IN HOA, có giãn chữ, độ dài ngắn (nhãn trạng thái, tên chuyên mục). Class `text-overline` đã gói sẵn cỡ chữ, line-height và letter-spacing:

```jsx
<Text className="text-overline font-bold uppercase text-accent">Tin mới</Text>
```

**Không có chữ nào nhỏ hơn 11px.** Web có `text-[9px]` và `text-[10px]`; mobile không được copy.

**Body là 16, không phải 14.** 14 dành cho nhãn, metadata, chữ trong nút. Đoạn văn người dùng phải đọc thì để 16.

---

# Phần 4 — Khoảng cách, bo góc, bóng đổ

## Spacing

Chỉ dùng bội số 4: `1` (4) `2` (8) `3` (12) `4` (16) `5` (20) `6` (24) `8` (32) `10` (40) `12` (48) `16` (64).

Quy ước cố định:

| Chỗ | Giá trị |
|---|---|
| Lề ngang của màn | `px-4` |
| Khoảng cách giữa các section | `gap-6` hoặc `mt-6` |
| Padding trong card | `p-4` |
| Khoảng cách giữa các dòng trong danh sách | `gap-3` |
| Khoảng cách nhãn → ô nhập | `mb-1` |

## Bo góc

| Cấp | Class | px | Dùng cho |
|---|---|---|---|
| Small | `rounded-lg` | 8 | Ô nhập, chip, nhãn |
| Medium | `rounded-xl` | 12 | Card, khối |
| Large | `rounded-2xl` | 16 | Card lớn, bottom sheet |
| Pill | `rounded-full` | ∞ | Nút, avatar |

## Bóng đổ — khác web nhiều nhất

**React Native không có `box-shadow`.** iOS đọc `shadowColor/Offset/Opacity/Radius`, Android chỉ đọc `elevation`. Các class `shadow-sm`, `shadow-md`, `shadow-lg` của Tailwind **không chạy đúng trên native**.

Vì vậy:

1. **Card tách khối bằng viền, không bằng bóng.** Dùng `border border-slate-200`. Đây cũng là cách web đang làm (`.admin-card` có viền + bóng rất nhẹ).
2. **Bóng chỉ dành cho lớp nổi lên trên nội dung** — drawer, modal, bottom sheet, thanh hành động dính đáy.
3. Khi cần bóng, lấy từ `tokens.js` và truyền qua `style`:

```jsx
import { shadow } from "../../theme/tokens";

<View style={shadow.overlay} className="rounded-2xl bg-white p-4">
```

Chỉ có hai cấp: `shadow.raised` (lớp dính mép màn) và `shadow.overlay` (lớp phủ). Không tạo thêm cấp.

---

# Phần 5 — Bố cục

## Khung app

```
Header  ← dựng ở app/(app)/_layout.jsx
Content
Footer  ← đặt cuối ScrollView
```

Footer chỉ xuất hiện khi cuộn tới, **không** dính đáy màn.

Màn nằm trong nhóm `(app)` **không được tự dựng Header** — sẽ thành hai header chồng nhau.

## Màn form

```
Fields → Primary Button → Secondary Action
```

## Màn danh sách

```
Search → Filter → List → Pagination
```

Chưa có Search hoặc Filter thì bỏ, không để chỗ trống.

## Màn chi tiết

```
Banner → Information → Action
```

## Responsive

Ưu tiên điện thoại. Chưa tối ưu tablet. Layout nhiều cột trên web → một cột trên mobile.

---

# Phần 6 — Component

Phần này quy định **hình thức**. Cách viết và tổ chức xem [03-component-guidelines.md](03-component-guidelines.md).

## Đã có trong repo

| Component | Đường dẫn |
|---|---|
| `Button` | `src/components/Button.jsx` |
| `Input` | `src/components/Input.jsx` |
| `SearchField` | `src/components/SearchField.jsx` |
| `OptionPicker` | `src/components/OptionPicker.jsx` |
| `ConfirmSheet` | `src/components/ConfirmSheet.jsx` |
| `SectionCard` | `src/components/tournament/SectionCard.jsx` |
| `AppHeader` | `src/components/layout/AppHeader.jsx` |
| `AppFooter` | `src/components/layout/AppFooter.jsx` |
| `AppDrawer` | `src/components/layout/AppDrawer.jsx` |
| `SectionHeader` | `src/components/home/SectionHeader.jsx` |
| `SectionState` | `src/components/home/SectionState.jsx` |
| `RemoteImage` | `src/components/home/RemoteImage.jsx` |
| `FormError` / `FormSuccess` | `src/components/auth/` |

## Button

Variant: `primary`, `light`, `ghost`, `outline`, `danger`.

| Variant | Nền | Chữ | Dùng khi |
|---|---|---|---|
| `primary` | `navy-700` | trắng | Hành động chính trên nền sáng |
| `light` | trắng | `navy-700` | Hành động chính trên nền tối |
| `outline` | trong suốt + viền `slate-300` | `slate-700` | Hành động phụ trên nền sáng |
| `ghost` | trong suốt + viền trắng mờ | trắng | Hành động phụ trên nền tối |
| `danger` | `danger` | trắng | Xoá, huỷ |

Cao 48 (`h-12`), bo `rounded-full`, chữ `text-sm font-semibold`.

Trạng thái bắt buộc: default / pressed (`active:bg-navy-600`) / disabled (`bg-slate-400`) / loading (spinner + chữ tuỳ chọn).

**Một màn chỉ có một nút `primary`.** Các nút còn lại dùng `outline` hoặc `ghost`.

## Input

Gồm label, ô nhập, chữ lỗi. Cao 40 (`h-10`), bo `rounded-lg`, viền `slate-300`, nền `slate-50`.

Có `multiline` cho ô mô tả nhiều dòng — cao 96 (`h-24`) và tự ép chữ lên đỉnh ô (Android mặc định canh giữa). Đừng truyền `style={{ height }}` để tự kéo cao.

Lỗi **chỉ hiện sau khi field đã `touched`** — không để vừa mở màn đã đỏ lòm.

Có `tone="dark"` cho form đặt trên nền tối.

Không tạo Input riêng ở từng màn.

## Card

Container chính: `rounded-xl border border-slate-200 bg-white p-4`.

**Không lồng Card trong Card.** Cần phân tầng thì dùng nền `bg-slate-100` cho khối con.

## StatusBadge

Nhãn trạng thái: `rounded-full px-2 py-0.5 text-overline font-bold uppercase`, màu nền là màu trạng thái pha loãng, màu chữ là màu trạng thái đậm.

Trạng thái nghiệp vụ (giải đấu, đăng ký, thanh toán) phải dùng đúng nhãn tiếng Việt như web.

## SectionHeader

Tiêu đề khối bên trái, nút "Tất cả" bên phải. Có biến thể `dark` cho khối trên nền tối.

Nếu màn đích chưa tồn tại thì **ẩn hẳn nút**, không để nút bấm vào mà không phản ứng.

## Avatar

Hình tròn. Không có ảnh thì hiện fallback (chữ cái đầu hoặc icon `User`).

## Image

| Loại | Tỷ lệ |
|---|---|
| Banner | 16:9 |
| Thumbnail | 4:3 |
| Avatar | 1:1 |

Ảnh lỗi → fallback asset. Không bao giờ giả định URL ảnh từ backend luôn hợp lệ.

## Icon

Chỉ dùng **lucide-react-native**. Không trộn Material, Ionicons, FontAwesome.

Kích thước lấy từ `iconSize` (16 / 20 / 24), màu lấy từ `colors`.

---

# Phần 7 — Trạng thái giao diện

## Loading

Không loading toàn màn nếu chỉ một section đang tải.

```
Banner ✓
News   (loading)
Lịch   ✓
Ranking ✓
```

Spinner toàn màn chỉ chấp nhận khi cả màn phụ thuộc vào đúng một request.

## Skeleton

Skeleton phải giữ đúng kích thước component thật, để layout không nhảy khi dữ liệu về.

## Empty

Mỗi màn có dữ liệu đều phải có Empty State. Không để màn trắng.

Dữ liệu rỗng **không phải là lỗi** — hiện "Chưa có dữ liệu", không hiện "Đã xảy ra lỗi".

## Error

Lỗi hiển thị trong phạm vi component, không kéo sập cả màn.

```
News lỗi → News hiện lỗi, Lịch thi đấu vẫn chạy
```

Kèm theo nút thử lại khi có thể.

> Project **chưa cài thư viện toast**. Mọi thông báo hiện tại đều hiển thị inline (`FormError`, `SectionState`). Đừng viết code gọi toast.

## Success

Hiển thị bằng `FormSuccess` hoặc điều hướng sang màn tiếp theo.

---

# Phần 8 — Khả năng tiếp cận

- Vùng chạm tối thiểu **44×44**. Nút nhỏ hơn thì bù bằng `hitSlop`.
- Dùng `Pressable`, không dùng `<Text onPress>` cho hành động.
- Icon đứng một mình phải có `accessibilityLabel`.
- Không dùng riêng màu để truyền đạt thông tin — luôn kèm chữ hoặc icon.

---

# Phần 9 — Dark Mode

**Đã triển khai** ngày 2026-07-29 cho toàn bộ nhóm `(app)`. Nhóm `(auth)` bị khoá ở chế độ Sáng.

> Bản trước của mục này viết "chỉ cần bổ sung bảng giá trị thứ hai trong `tokens.js`, không phải sửa từng màn". **Sai một nửa.** Điều đó đúng với màu truyền qua prop JS, nhưng phía `className` thì mọi màn đang gõ thẳng `bg-white`, `text-slate-900` — không có gì để đổi. Thực tế phải chuyển 442 chỗ ở 51 file sang token vai trò. Ghi lại đây để lần sau đừng ước lượng nhầm.

## Hai đường dẫn màu

| Dùng qua | Lấy từ | Ví dụ |
|---|---|---|
| `className` | Biến CSS ở `global.css` | `bg-surface`, `text-content` |
| Prop JS | Hook `useThemeColors()` | `color={colors.brand}` |

Cả hai phải khớp nhau. Sửa `global.css` thì sửa `src/theme/tokens.js`, và ngược lại.

## Bảng token — dùng cái này, đừng dùng `slate-*` nữa

| Token | Sáng | Tối | Thay cho |
|---|---|---|---|
| `canvas` | `#F8FAFC` | `#0A1220` | `bg-slate-50` — nền màn |
| `surface` | `#FFFFFF` | `#131C2E` | `bg-white` — nền thẻ, khối |
| `surface-raised` | `#FFFFFF` | `#1D2739` | lớp phủ: drawer, menu, bottom sheet |
| `sunken` | `#F1F5F9` | `#1A2333` | `bg-slate-100` — khối chìm trong thẻ |
| `sunken-strong` | `#E2E8F0` | `#232C3D` | `bg-slate-200` — nền chờ ảnh |
| `line-soft` | `#F1F5F9` | `#1E2839` | `border-slate-100` |
| `line` | `#E2E8F0` | `#2A3446` | `border-slate-200` — viền thẻ |
| `line-strong` | `#CBD5E1` | `#3D4759` | `border-slate-300` — viền ô nhập |
| `content` | `#0F172A` | `#F8FAFC` | `text-slate-900` — chữ chính |
| `content-2` | `#334155` | `#CFD5DE` | `text-slate-700`, `slate-600` — chữ phụ |
| `muted` | `#64748B` | `#9AA2AF` | `text-slate-500` — chú thích |
| `faint` | `#94A3B8` | `#7C8491` | `text-slate-400` — mờ nhất |
| `disabled` | `#CBD5E1` | `#464E5C` | `text-slate-300` — bị vô hiệu |

## Chế độ tối phải ĐEN SÂU, không được ngả xanh

> **Sửa 2026-08-10.** Thang tối trước đó tăng độ sáng chủ yếu ở kênh xanh, nên càng lên lớp cao càng xanh. Đo bằng hiệu **B − R**: viền đậm lệch tới **59** trong khi web giữ khoảng **24** ở mọi lớp. Kết quả là app trông "xanh đậm" chứ không "đen sâu" như web.

Web tăng độ sáng bằng cách **pha trắng** lên nền — `rgba(255,255,255,.03)`, `dark:border-white/10` (dùng 80 lần), `dark:text-white/60`. Cộng đều cả ba kênh nên sắc độ giữ nguyên xuyên suốt.

**Quy tắc: mọi bậc tối phải có `B − R` nằm trong khoảng 18–28.** Thêm màu tối mới thì kiểm lại con số này trước khi commit. Đừng "làm sáng lên" bằng cách tăng riêng kênh xanh.

`canvas` và `surface` lấy **đúng** giá trị của web (`src/styles/global.css` bên FE, dòng 168 và 224). Hai giá trị đó chỉ cách nhau khoảng 11 điểm độ sáng, nên thứ tách thẻ khỏi nền là **viền**, không phải chênh lệch nền — đúng như web vẫn làm.

Thứ tự các lớp, sáng dần:

```
canvas (#0A1220)  ← nền màn, lùi xa nhất
  surface (#131C2E)      ← thẻ, khối nội dung
    surface-raised (#1D2739)  ← drawer, menu hồ sơ, bottom sheet
```

**Khi dựng lớp phủ mới** (menu, sheet, popover) thì dùng `bg-surface-raised`, đừng dùng `bg-surface` — bằng không nó sẽ cùng màu với thẻ nằm dưới và trông như dán phẳng vào trang.

Bốn bậc chữ trên nền thẻ đều đạt **WCAG AA** (≥ 4.5:1). `faint` đúng 4.51 — đừng hạ tối hơn nữa, bản trước chỉ được 3.83 nên chú thích và mốc thời gian khó đọc.
| `tint-danger/success/warning` | thang `50` | nền sẫm | `bg-red-50`, `bg-green-50`… |

Bên JS, tên viết kiểu camelCase: `colors.sunkenStrong`, `colors.lineStrong`, `colors.content2`.

## Màu KHÔNG đổi theo chế độ

Thương hiệu và trạng thái giữ nguyên ở cả hai chế độ — đỏ vẫn là lỗi, xanh vẫn là thành công:

`accent` · `gold` · `success` · `warning` · `danger` · `info` · `navy-*`

**Riêng `brand` thì có đổi**: navy-700 đặt trên nền `#0A1220` gần như chìm hẳn, nên ở chế độ tối nó sáng lên thành `#8FB0DC`. Đây là màu của icon và spinner, không phải màu nền nút.

## Khối cố ý tối

Hero, footer, thanh tab, badge trạng thái, lớp nền mờ sau menu, nút `light`/`ghost` — những chỗ này **đã tối sẵn ở cả hai chế độ**, nên vẫn dùng màu tuyệt đối (`bg-navy-900`, `text-white`, `border-white/40`). Đổi chúng sang token là sai: nút trắng trên nền tối mà đổi theo chế độ sẽ tự tan vào nền.

## Ba chế độ người dùng chọn được

`Tự động` (theo hệ điều hành, mặc định) · `Sáng` · `Tối`.

Nằm trong menu hồ sơ ở header, dạng **một dòng chạm để xoay vòng** (Tự động → Sáng → Tối → Tự động), trạng thái hiện tại hiện bên phải. Không tách thành khối ba nút riêng: menu này toàn dòng chạm-để-làm-gì-đó, một khối lựa chọn chen vào giữa làm gãy nhịp đọc và chiếm chỗ gấp ba.

Chạm xong menu **không đóng** — người dùng thường chạm vài lần để so sánh.

Khác web: `themeStore.js` bên đó cố ý luôn mặc định Sáng và bỏ qua cài đặt hệ thống. Trên trình duyệt điều đó hợp lý; trên điện thoại thì người dùng đã bật dark mode toàn máy sẽ mong app theo.

## Vì sao không viết `dark:` ở từng class

Cách phổ biến của Tailwind là `bg-white dark:bg-navy-900`. Không chọn cách đó vì dự án còn nhiều màn chưa làm — mỗi màn mới sẽ là một cơ hội quên `dark:`, và app nửa sáng nửa tối còn tệ hơn không có dark mode. Với token vai trò, màn mới tự động đúng ở cả hai chế độ mà không phải nhớ gì thêm.

## Khoá một vùng ở chế độ Sáng

`src/theme/LightThemeScope.jsx`. Nhóm `(auth)` dùng nó vì `Input`/`Button`/`FormError` là component dùng chung với `(app)`.

Nó khoá **cả hai** đường màu: `vars()` cho `className`, và `ThemeLockContext` cho prop JS. Thiếu vế thứ hai thì icon vẫn lấy màu tối trong khi nền quanh nó đã sáng.

Web đã làm sẵn mẫu để tham khảo: `SU26_SEP490_G2_FE/src/pages/Event/eventTheme.css`.

---

# Phần 10 — Checklist màn mới

Một màn chỉ được xem là xong khi:

- [ ] Bám layout và màu của Web FE.
- [ ] Dùng component chung, không copy UI.
- [ ] Dùng design token, không hardcode màu / spacing / radius.
- [ ] Cỡ chữ nằm trong thang ở Phần 3, không có chữ dưới 11px.
- [ ] Có Loading.
- [ ] Có Empty.
- [ ] Có Error, và lỗi không kéo sập cả màn.
- [ ] Ảnh có fallback.
- [ ] Vùng chạm ≥ 44×44.
- [ ] Không tự dựng Header nếu nằm trong `(app)`.

Chi tiết từng bước: [05-screen-template.md](05-screen-template.md).

---

# Nợ kỹ thuật đã biết

Những chỗ dưới đây có sẵn từ trước khi có tài liệu này. Chúng vẫn chạy đúng, chỉ là chưa dùng token. **Không cần sửa gấp**, nhưng khi nào đụng vào file thì dọn luôn:

| File | Vấn đề |
|---|---|
| `src/constants/tournament.js` | Màu badge hardcode hex → nên chuyển sang token. Badge nền đặc chữ trắng nên vẫn đọc được ở cả hai chế độ, chưa gấp |
| `app/(app)/profile.jsx` | Đã dựng lại 2026-07-29, không còn dùng `bg-brand-100` |
| `src/components/icons/BrandIcons.jsx` | `color` mặc định `#000` — mọi nơi gọi đều truyền màu vào nên không lộ, nhưng giá trị mặc định vẫn nên là token |

Các mục hardcode màu ở `Button`, `Input`, `AppHeader`, `SectionState`, `app/_layout.jsx` **đã dọn xong** khi làm dark mode (2026-07-29).

Nợ còn lại của dark mode:

| Chỗ | Vấn đề |
|---|---|
| `shadow` trong `tokens.js` | Bóng đen trên nền tối gần như không thấy. **Đã xử lý 2026-08-06** bằng token `surface-raised`: lớp nổi sáng hơn thẻ bên dưới. Bóng vẫn giữ nguyên cho chế độ sáng |
| Ảnh hero | `HomeBanner` và `TournamentHero` phủ lớp tối cố định lên ảnh — hợp cả hai chế độ, nhưng ở chế độ tối có thể muốn phủ đậm hơn |

---

# Ngoài phạm vi

Tài liệu này **không** quy định business logic, API, state management, navigation flow. Xem [02](02-development-workflow.md), [04](04-api-integration.md).
