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

// Đúng
<View className="mt-4">
<Text className="text-navy-700">
```

Khi RN bắt buộc dùng giá trị JS (màu icon, `placeholderTextColor`, `ActivityIndicator`), lấy từ `src/theme/tokens.js`:

```jsx
import { colors, iconSize } from "../../theme/tokens";

<ChevronLeft size={iconSize.lg} color={colors.brand} />
<TextInput placeholderTextColor={colors.textPlaceholder} />
```

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

## Trung tính

Web dùng đúng thang `slate` mặc định của Tailwind, nên **mobile không định nghĩa lại màu xám**. Dùng thẳng `slate-*`:

| Vai trò | Class | Hex |
|---|---|---|
| Nền màn | `bg-white` | `#FFFFFF` |
| Nền phụ | `bg-slate-50` | `#F8FAFC` |
| Nền chìm (khối trong card) | `bg-slate-100` | `#F1F5F9` |
| Viền | `border-slate-200` | `#E2E8F0` |
| Viền đậm (ô nhập) | `border-slate-300` | `#CBD5E1` |
| Chữ chính | `text-slate-900` | `#0F172A` |
| Chữ phụ | `text-slate-600` | `#475569` |
| Chữ mờ | `text-slate-500` | `#64748B` |
| Placeholder | `text-slate-400` | `#94A3B8` |
| Chữ bị vô hiệu | `text-slate-300` | `#CBD5E1` |

Không dùng thang `gray-*`, `zinc-*`, `neutral-*` — chúng lệch sắc so với web.

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

## `brand-*` và `topPlayers.js`

`brand-50 → brand-700` là nhóm xanh dương còn sót từ trước khi có design system, hiện chỉ dùng ở `app/(app)/profile.jsx`. **Không dùng cho màn mới.**

`src/constants/topPlayers.js` có trường `accent` chứa nhiều mã màu — đó là **dữ liệu mock** cho khối Top tay cơ, không phải token giao diện. Giữ nguyên.

---

# Phần 3 — Chữ

## Font

Dùng font mặc định của hệ điều hành. Không import font mới khi chưa có quyết định chung của nhóm.

## Thang cỡ chữ

| Vai trò | Class | px | Đậm |
|---|---|---|---|
| Display | `text-[32px]` | 32 | `font-black` |
| Title | `text-3xl` | 30 | `font-bold` |
| Heading | `text-2xl` | 24 | `font-bold` |
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

Chưa triển khai. Nhưng token đã đặt tên theo **vai trò** (`surface`, `textSecondary`, `border`) chứ không theo tên màu, nên khi làm chỉ cần bổ sung bảng giá trị thứ hai trong `tokens.js`, không phải sửa từng màn.

Điều kiện để chuyện đó khả thi: **màn không được hardcode màu**. Đây là lý do thật sự của quy tắc "không hardcode" ở Phần 1.

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
| `src/components/Button.jsx` | `spinnerColor` hardcode `#1a2a4a` → nên dùng `colors.brand` |
| `src/components/Input.jsx` | `placeholderTextColor` và màu icon hardcode → nên dùng `colors.textPlaceholder`, `colors.textInverseMuted` |
| `src/components/layout/AppHeader.jsx` | Màu icon hardcode `#1a2a4a` → `colors.brand` |
| `src/components/home/SectionState.jsx` | Màu `ActivityIndicator` hardcode → `colors.brand` |
| `app/(app)/profile.jsx` | Dùng `bg-brand-100` (nhóm màu cũ) |
| `app/_layout.jsx` | Màu `ActivityIndicator` hardcode `#2563eb` → nên dùng `colors.brand` |
| `src/constants/tournament.js` | Màu badge hardcode hex → nên chuyển sang token |
| `src/components/home/SectionHeader.jsx` | Tiêu đề dùng `text-base font-bold` — khớp thang, giữ nguyên |

---

# Ngoài phạm vi

Tài liệu này **không** quy định business logic, API, state management, navigation flow. Xem [02](02-development-workflow.md), [04](04-api-integration.md).
