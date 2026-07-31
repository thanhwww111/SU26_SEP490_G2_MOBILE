# Khuôn dựng màn mới

Cập nhật: 2026-07-28

Tài liệu này là bản hướng dẫn thao tác. Lý thuyết nằm ở [01-design-system.md](01-design-system.md) (trông thế nào), [02-development-workflow.md](02-development-workflow.md) (thứ tự làm) và [03-component-guidelines.md](03-component-guidelines.md) (dựng component ra sao).

---

# Trước khi mở editor

Ba câu hỏi phải trả lời được, nếu không thì chưa code:

1. **API đã có chưa?** Endpoint, request, response, phân trang, mã lỗi. Chưa có thì chờ backend — xem [02, Step 1](02-development-workflow.md).
2. **Web FE có màn tương ứng không?** Có thì mở ra xem, bám theo. Không có thì phải hỏi nhóm trước khi tự thiết kế.
3. **Đã có spec chưa?** Màn phức tạp cần một file trong `docs/superpowers/specs/`.

---

# Bước 1 — Đặt route

Route nằm ở `app/`, dùng expo-router (file-based routing).

| Nhóm | Đường dẫn | Dùng cho |
|---|---|---|
| `(auth)` | `app/(auth)/*.jsx` | Màn chưa đăng nhập |
| `(app)` | `app/(app)/*.jsx` | Màn đã đăng nhập, có header + drawer |

Ví dụ, màn danh sách giải đấu → `app/(app)/tournaments.jsx`, đường dẫn điều hướng là `/(app)/tournaments`.

Màn chi tiết có tham số → `app/(app)/tournaments/[id].jsx`, đọc tham số bằng `useLocalSearchParams()`.

**Màn trong `(app)` không tự dựng header.** `app/(app)/_layout.jsx` đã dựng `AppHeader` cho cả nhóm; tự dựng thêm sẽ thành hai header chồng nhau. Layout tự đổi nút trái thành mũi tên quay lại cho mọi màn khác `home`.

Muốn màn hiện trong drawer thì thêm mục vào `src/components/layout/navItems.js`, **không** hardcode trong `AppDrawer`.

---

# Bước 2 — Viết file màn

File trong `app/` chỉ **lắp ráp**: bố cục, điều hướng, state cục bộ. Logic tải dữ liệu nằm ở component trong `src/components/<feature>/`.

```jsx
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";

import TournamentListSection from "../../src/components/tournament/TournamentListSection";
import AppFooter from "../../src/components/layout/AppFooter";

/**
 * Danh sách giải đấu công khai, bám trang /event của FE web.
 *
 * Header do app/(app)/_layout.jsx dựng nên màn này không tự dựng.
 * Footer đặt cuối ScrollView để cuộn tới mới thấy, giống web.
 */
export default function TournamentsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-canvas">
      <TournamentListSection
        onPressItem={(item) => router.push(`/(app)/tournaments/${item.id}`)}
      />
      <AppFooter />
    </ScrollView>
  );
}
```

Lưu ý: **footer không dính đáy màn**, nó cuộn cùng nội dung — đặt cuối `ScrollView`, không đặt trong `_layout`.

---

# Bước 3 — Viết component tải dữ liệu

Đây là nơi gọi API và xử lý bốn trạng thái. Khuôn dưới đây lấy từ `src/components/home/NewsSection.jsx` đang chạy trong repo.

```jsx
import { useEffect, useState } from "react";
import { View } from "react-native";

import SectionHeader from "../home/SectionHeader";
import SectionState from "../home/SectionState";
import * as tournamentApi from "../../api/publicTournamentApi";

const PAGE_SIZE = 10;

export default function TournamentListSection({ onPressItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const page = await tournamentApi.listPublicTournaments({
          page: 0,
          size: PAGE_SIZE,
        });
        if (alive) setItems(page.content);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // Màn có thể bị rời trước khi request xong — tránh set state lên component đã gỡ
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View className="px-4 pt-6">
      <SectionHeader title="Giải đấu" actionLabel="Tất cả" />

      {loading || error || items.length === 0 ? (
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có giải đấu."
        />
      ) : (
        items.map((item) => (
          <TournamentCard
            key={item.id}
            item={item}
            onPress={() => onPressItem?.(item)}
          />
        ))
      )}
    </View>
  );
}
```

Ba điểm bắt buộc trong khuôn này:

- **Cờ `alive`** để không set state sau khi component đã bị gỡ.
- **`error.message`** dùng thẳng được, vì `axiosClient` đã bọc lỗi backend thành `Error` có message tiếng Việt.
- **Rỗng không phải lỗi** — `items.length === 0` đi vào `emptyMessage`, không đi vào `error`.

---

# Bước 4 — Bốn trạng thái

| Trạng thái | Hiển thị |
|---|---|
| Loading | `SectionState loading` — spinner trong phạm vi khối, **không** phủ cả màn |
| Data | Nội dung thật |
| Empty | "Chưa có …" — không để màn trắng |
| Error | Thông báo lỗi trong phạm vi khối, kèm nút thử lại nếu có thể |

Một khối lỗi **không được kéo sập cả màn**. Trang chủ là ví dụ: Tin tức lỗi thì Lịch thi đấu và Top tay cơ vẫn chạy.

Project **chưa cài thư viện toast** — mọi thông báo đều inline.

---

# Bước 5 — Màn danh sách dài

Với danh sách ngắn, cố định (top 5, top 10) thì `.map()` trong `ScrollView` là đủ.

Với danh sách dài hoặc có phân trang, dùng `FlatList`:

```jsx
<FlatList
  data={items}
  keyExtractor={(item) => String(item.id)}
  renderItem={({ item }) => <TournamentCard item={item} onPress={...} />}
  contentContainerClassName="px-4 pb-6"
  ItemSeparatorComponent={() => <View className="h-3" />}
  ListEmptyComponent={<SectionState emptyMessage="Chưa có giải đấu." />}
  refreshing={refreshing}
  onRefresh={handleRefresh}
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.5}
/>
```

**Không lồng `FlatList` trong `ScrollView`** — cuộn sẽ xung đột và mất ảo hoá. Màn nào có `FlatList` thì `FlatList` chính là vùng cuộn, footer đặt vào `ListFooterComponent`.

Tham số phân trang xây bằng `src/utils/pagination.js`, khớp với backend: `page` bắt đầu từ 0, response có `content` / `page` / `size` / `totalElements` / `totalPages`. Đổi bộ lọc thì reset `page` về 0.

---

# Bước 6 — Form

```jsx
const [values, setValues] = useState({ email: "" });
const [touched, setTouched] = useState({});
const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);

<Input
  label="Email"
  value={values.email}
  onChangeText={(v) => setValues((s) => ({ ...s, email: v }))}
  onBlur={() => setTouched((s) => ({ ...s, email: true }))}
  error={errors.email}
  touched={touched.email}
  keyboardType="email-address"
  autoCapitalize="none"
/>

<Button title="Gửi" loadingTitle="Đang gửi..." loading={submitting} onPress={submit} />
```

Quy tắc:

- Lỗi **chỉ hiện sau khi field đã `touched`**.
- Validate nằm ở màn/form, không nằm trong `Input` — dùng `src/utils/validators.js`.
- Validate ở client chỉ để cải thiện trải nghiệm; **validate nghiệp vụ là việc của backend**.
- Khoá nút trong lúc `submitting` để tránh gửi hai lần.
- Form dài phải bọc `KeyboardAvoidingView` để bàn phím không che ô nhập.

---

# Bước 7 — Tự kiểm trước khi mở PR

Chạy `npm start`, mở trên máy thật, kiểm:

- [ ] Điều hướng vào ra đúng, nút back hoạt động.
- [ ] Loading hiện đúng phạm vi, không phủ cả màn.
- [ ] Tắt Wi-Fi → hiện lỗi tử tế, không crash.
- [ ] Tài khoản không có dữ liệu → hiện Empty, không phải màn trắng.
- [ ] Ảnh hỏng / `null` → hiện fallback.
- [ ] Chữ dài, tên dài → không tràn, không vỡ layout (`numberOfLines`).
- [ ] Không có màu hardcode trong file màn.
- [ ] **Không còn `bg-white` / `text-slate-*` / `border-slate-*`** — dùng token vai trò (`bg-surface`, `text-content`, `border-line`). Xem [01, Phần 2](01-design-system.md).
- [ ] **Xem lại màn ở chế độ Tối** (menu hồ sơ → Giao diện). Chữ có đọc được không, thẻ có tách khỏi nền không, ảnh có bị chói không.
- [ ] Cỡ chữ nằm trong thang ở [01, Phần 3](01-design-system.md).
- [ ] Vùng chạm ≥ 44×44.
- [ ] Đối chiếu cạnh màn tương ứng trên web — bố cục và màu có khớp không.

Chưa tick đủ thì màn **chưa xong**, kể cả khi nó đã chạy được.

---

# Những lỗi hay gặp

| Lỗi | Hậu quả |
|---|---|
| Tự dựng header trong màn thuộc `(app)` | Hai header chồng nhau |
| `FlatList` lồng trong `ScrollView` | Cuộn giật, mất ảo hoá |
| Dùng `localhost` trong `EXPO_PUBLIC_API_URL` | Mọi request fail trên máy thật |
| Gọi `axios` thẳng trong component | Mất token, mất xử lý lỗi chung |
| Coi mảng rỗng là lỗi | Người dùng thấy "Đã xảy ra lỗi" khi thật ra chưa có dữ liệu |
| Hardcode hex trong `color` của icon | Lệch màu khi làm Dark Mode |
| Dùng class `shadow-md` | Không chạy đúng trên native — xem [01, Phần 4](01-design-system.md) |
