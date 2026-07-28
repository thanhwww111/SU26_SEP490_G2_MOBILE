# Pattern tái dùng

Cập nhật: 2026-07-28

Những đoạn code lặp lại nhiều nhất, kèm chỗ chúng đang chạy trong repo. Copy từ đây thay vì tự viết lại — và khi sửa pattern thì sửa cả tài liệu này.

---

# 1. Gọi API trong component

Dùng ở mọi khối tải dữ liệu. Bản gốc: `src/components/home/NewsSection.jsx`.

```jsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      const page = await newsApi.listPublishedPosts({ page: 0, size: 5 });
      if (alive) setItems(page.content);
    } catch (e) {
      if (alive) setError(e.message);
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, []);
```

Cờ `alive` là bắt buộc: người dùng có thể rời màn trước khi request xong, set state lên component đã gỡ sẽ sinh cảnh báo và rò bộ nhớ.

`e.message` dùng thẳng được — `axiosClient` đã bọc lỗi backend thành `Error` có message tiếng Việt.

---

# 2. Viết một module API

Bản gốc: `src/api/newsApi.js`. Giữ đúng shape này cho mọi module mới.

```js
import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/** GET /news — bài viết đã xuất bản, phân trang */
export const listPublishedPosts = (params) =>
  axiosClient
    .get("/news", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/** GET /news/{slug} — chi tiết bài viết */
export const getPostBySlug = (slug) =>
  axiosClient.get(`/news/${slug}`).then((res) => getApiData(res));
```

- `getApiData` bóc lớp envelope `{ success, message, data }` của backend.
- `parsePagedResponse` ép cả mảng trần lẫn Spring `Page` về cùng một shape: `{ content, page, size, totalElements, totalPages }`.
- Endpoint viết **không** kèm `/api/v1` — `baseURL` đã có sẵn.
- Mỗi endpoint một hàm, một comment ghi rõ method + đường dẫn.

---

# 3. Phân trang

`page` bắt đầu từ **0**. `DEFAULT_PAGE_SIZE` là 10.

```jsx
const [page, setPage] = useState(0);
const [items, setItems] = useState([]);
const [hasMore, setHasMore] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);

const loadPage = async (nextPage) => {
  const res = await api.list({ page: nextPage, size: 10 });
  setItems((prev) => (nextPage === 0 ? res.content : [...prev, ...res.content]));
  setHasMore(nextPage + 1 < res.totalPages);
  setPage(nextPage);
};

const handleLoadMore = () => {
  if (loadingMore || !hasMore) return;
  setLoadingMore(true);
  loadPage(page + 1).finally(() => setLoadingMore(false));
};
```

**Đổi bộ lọc thì reset `page` về 0** và thay toàn bộ `items`, đừng nối thêm.

---

# 4. Kéo để làm mới

```jsx
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  try {
    await loadPage(0);
  } finally {
    setRefreshing(false);
  }
};

<FlatList refreshing={refreshing} onRefresh={handleRefresh} ... />
```

Với `ScrollView` thì dùng prop `refreshControl` kèm `<RefreshControl />`.

---

# 5. Bốn trạng thái

```jsx
{loading || error || items.length === 0 ? (
  <SectionState
    loading={loading}
    error={error}
    emptyMessage="Chưa có giải đấu."
  />
) : (
  items.map((item) => <TournamentCard key={item.id} item={item} />)
)}
```

`SectionState` (`src/components/home/SectionState.jsx`) ưu tiên `loading` → `error` → `emptyMessage`.

Mảng rỗng **không phải lỗi** — vào `emptyMessage`, không vào `error`.

---

# 6. Form

Bản gốc: các màn trong `app/(auth)/`.

```jsx
const [values, setValues] = useState({ email: "", password: "" });
const [touched, setTouched] = useState({});
const [errors, setErrors] = useState({});
const [submitting, setSubmitting] = useState(false);
const [formError, setFormError] = useState("");

const setField = (name) => (v) => setValues((s) => ({ ...s, [name]: v }));
const markTouched = (name) => () => setTouched((s) => ({ ...s, [name]: true }));

const submit = async () => {
  const found = collectErrors({
    email: () => validateEmail(values.email),
    password: () => validatePassword(values.password),
  });

  setErrors(found);
  setTouched({ email: true, password: true });
  if (Object.keys(found).length > 0) return;

  setSubmitting(true);
  setFormError("");
  try {
    await authApi.login(values);
    router.replace("/(app)/home");
  } catch (e) {
    setFormError(e.message);
  } finally {
    setSubmitting(false);
  }
};
```

Khi bấm gửi phải `setTouched` cho **mọi** field, nếu không lỗi của field chưa chạm sẽ không hiện.

## Validator có sẵn

`src/utils/validators.js`:

| Hàm | Trả về |
|---|---|
| `validateEmail(v)` | `"Email là bắt buộc"` / `"Email không hợp lệ"` / `null` |
| `validatePassword(v)` | Tối thiểu 6 ký tự (`MIN_PASSWORD_LENGTH`) |
| `validatePhone(v)` | 10–11 chữ số |
| `validateConfirmPassword(v, password)` | `"Mật khẩu không khớp"` |
| `validateOtp(v)` | |
| `collectErrors({ field: () => ... })` | Object lỗi, bỏ qua field trả `null` |

Thông báo giữ nguyên như FE web để hai nền tảng nói cùng một giọng. **Thêm rule mới thì thêm vào file này**, đừng viết regex rải rác trong màn.

---

# 7. Ngày tháng

`src/utils/date.js`:

```jsx
import { fmtDateShort, fmtDateRange } from "../../utils/date";

fmtDateShort(post.publishedAt)                  // "28/07/2026", hoặc null nếu thiếu/sai
fmtDateRange(t.startDate, t.endDate)            // "01/06/2026 – 05/06/2026", hoặc "—"
```

`fmtDateShort` trả `null` khi ngày rỗng hoặc không parse được — nhớ kiểm trước khi render:

```jsx
{fmtDateShort(post.publishedAt) ? (
  <Text className="mt-2 text-xs text-slate-400">{fmtDateShort(post.publishedAt)}</Text>
) : null}
```

---

# 8. Badge trạng thái giải đấu

`src/constants/tournament.js`:

```jsx
import { getTournamentBadge } from "../../constants/tournament";

const badge = getTournamentBadge(tournament);

<View style={{ backgroundColor: badge.bg }} className="rounded-full px-2 py-0.5">
  <Text className="text-overline font-bold uppercase text-white">{badge.label}</Text>
</View>
```

`getTournamentBadge` xử lý sẵn trường hợp giải còn mở đăng ký nhưng đã kín chỗ → trả `"Hết slot"` thay vì `"Mở đăng ký"`.

> Nợ kỹ thuật: file này hardcode mã màu. Khi nào dọn thì chuyển sang token trong `src/theme/tokens.js`.

---

# 9. Đọc phiên đăng nhập

```jsx
import { useAuthStore } from "../../store/authStore";

const user = useAuthStore((s) => s.user);
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
const logout = useAuthStore((s) => s.logout);
```

Chọn từng trường bằng selector, **đừng** lấy cả store (`useAuthStore()`) — sẽ render lại mỗi khi bất kỳ trường nào đổi.

Không cần tự đọc `SecureStore` trong màn: `app/_layout.jsx` đã hydrate phiên lúc mở app, và `axiosClient` tự gắn token.

`src/utils/auth.js` có sẵn `normalizeRole`, `getRoleLabel`, `extractRoleFromUser` khi cần hiển thị hoặc phân nhánh theo role.

---

# 10. Điều hướng

```jsx
import { useRouter, useLocalSearchParams } from "expo-router";

const router = useRouter();

router.push("/(app)/tournaments");          // thêm vào ngăn xếp, có nút back
router.replace("/(app)/home");              // thay thế, không back về được
router.back();

const { id } = useLocalSearchParams();      // đọc tham số từ [id].jsx
```

Sau khi đăng nhập hoặc đăng xuất dùng `replace`, không dùng `push` — nếu không người dùng bấm back sẽ quay lại màn đăng nhập.

---

# 11. Ảnh có fallback

```jsx
import RemoteImage from "../home/RemoteImage";

<RemoteImage uri={post.thumbnailUrl} className="h-48 w-full" />
```

`RemoteImage` xử lý sẵn `uri` rỗng, `null` và lỗi tải. **Không dùng `<Image source={{ uri }} />` trần** — backend có thể trả `null` hoặc URL hỏng.

---

# 12. Chữ dài

```jsx
<Text numberOfLines={2} className="text-base font-bold text-slate-900">
  {tournament.name}
</Text>
```

Tên giải, tiêu đề bài viết, tên người dùng đều có thể rất dài. Luôn đặt `numberOfLines`, và test bằng một chuỗi dài trước khi mở PR.

---

# 13. Danh sách

```jsx
<FlatList
  data={items}
  keyExtractor={(item) => String(item.id)}
  renderItem={({ item }) => <TournamentCard item={item} />}
  contentContainerClassName="px-4 pb-6"
  ItemSeparatorComponent={() => <View className="h-3" />}
  ListEmptyComponent={<SectionState emptyMessage="Chưa có dữ liệu." />}
/>
```

`keyExtractor` phải trả **chuỗi** — id từ backend là số, nhớ bọc `String()`.

**Không lồng `FlatList` trong `ScrollView`.**

---

# 14. Nút bấm nhỏ

```jsx
<Pressable
  onPress={onPress}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
>
  <Menu size={iconSize.md} color={colors.brand} />
</Pressable>
```

Vùng chạm tối thiểu 44×44. Icon nhỏ hơn thì bù bằng `hitSlop`. Luôn có phản hồi khi nhấn — `active:bg-*` hoặc `active:opacity-*`.

---

# 15. Màu qua prop JS

```jsx
import { colors, iconSize, shadow } from "../../theme/tokens";

<ActivityIndicator color={colors.brand} />
<TextInput placeholderTextColor={colors.textPlaceholder} />
<ChevronLeft size={iconSize.lg} color={colors.brand} />
<View style={shadow.overlay} className="rounded-2xl bg-white" />
```

Không gõ hex thẳng vào prop. Danh sách token đầy đủ: [01-design-system.md](01-design-system.md).

---

# Chống chỉ định

| Đừng viết | Lý do |
|---|---|
| `axios.get(...)` trong component | Mất token và xử lý lỗi chung |
| `useAuthStore()` không selector | Render lại thừa |
| `<Image source={{ uri }} />` trần | Vỡ khi URL null hoặc hỏng |
| `FlatList` trong `ScrollView` | Cuộn giật, mất ảo hoá |
| `color="#1a2a4a"` | Không đổi được khi làm Dark Mode |
| `className="shadow-md"` | Không chạy đúng trên native |
| `className="hover:bg-slate-100"` | Native không có hover, dùng `active:` |
| `router.push` sau khi đăng nhập | Back về được màn đăng nhập |
| Coi `[]` là lỗi | Người dùng thấy "lỗi" khi chỉ là chưa có dữ liệu |
