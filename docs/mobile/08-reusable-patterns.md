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

# 3b. Tải lại khi quay lại màn

Bản gốc: `src/components/registration/MyRegistrationList.jsx`.

`useEffect` chỉ chạy lúc gắn component. Màn danh sách mà người dùng có thể đi sang màn chi tiết rồi **thay đổi dữ liệu ở đó** (huỷ, sửa, thanh toán) thì phải tải lại khi quay về, nếu không danh sách hiện trạng thái cũ.

```jsx
import { useFocusEffect } from "expo-router";

const alive = useRef(true);
const loadedOnce = useRef(false);

useFocusEffect(
  useCallback(() => {
    alive.current = true;

    (async () => {
      // Lần focus đầu mới hiện spinner; các lần sau tải ngầm cho đỡ nháy trắng
      if (!loadedOnce.current) setLoading(true);
      try {
        await loadPage(0);
        loadedOnce.current = true;
      } catch (e) {
        if (alive.current) setError(e.message);
      } finally {
        if (alive.current) setLoading(false);
      }
    })();

    return () => {
      alive.current = false;
    };
  }, [loadPage])
);
```

Cờ `alive` để ở `useRef` chứ không phải biến cục bộ, vì `handleRefresh` và `handleLoadMore` ở ngoài effect cũng phải đọc chung một cờ.

Đánh đổi: mỗi lần focus lại sẽ reset về trang 0, mất các trang đã tải thêm. Chấp nhận được — đúng còn hơn giữ được vị trí cuộn.

Màn không có màn con sửa dữ liệu thì cứ dùng `useEffect` như mục 1, đừng dùng cái này cho mọi thứ.

---

# 4. Kéo để làm mới

**Mọi vùng cuộn có dữ liệu từ API đều phải nhận cử chỉ này.** Người dùng mobile không có nút F5; nghi dữ liệu cũ là họ vuốt xuống theo phản xạ, màn nào không đáp lại thì trông như treo.

Bản gốc: `src/hooks/useRefresh.jsx`.

```jsx
import { useRefresh } from "../../hooks/useRefresh";

const refresh = useCallback(() => load({ silent: true }), [load]);
const { refreshControl } = useRefresh(refresh);

<ScrollView refreshControl={refreshControl}>…</ScrollView>
```

Hook lo ba việc: state `refreshing`, nuốt lỗi để một promise bị từ chối không bật màn đỏ, và đặt màu vòng xoay theo `colors.brand` — ba prop màu của `RefreshControl` tên khác nhau giữa iOS và Android nên rất dễ quên một nửa.

**Hàm `load` phải nhận cờ `silent`:**

```jsx
const load = useCallback(async ({ silent = false } = {}) => {
  if (!silent) setLoading(true);   // nhánh loading thay CẢ màn bằng vòng quay
  setError("");
  try {
    const data = await api.getSomething(id);
    if (alive.current) setData(data);
  } catch (e) {
    if (alive.current && !silent) setError(e.message);   // hỏng thì giữ nội dung cũ
  } finally {
    if (alive.current) setLoading(false);
  }
}, [id]);
```

Hai chỗ `!silent` đều quan trọng. Thiếu chỗ đầu: vuốt xong nội dung biến mất, thay bằng vòng quay — hai vòng quay chồng nhau. Thiếu chỗ sau: mạng chập một nhịp là bài đang đọc bị thay bằng trang lỗi. Cùng lựa chọn với `app/(app)/staff/matches.jsx` từ trước.

Nút "Thử lại" trong nhánh lỗi phải gọi `onPress={() => load()}`, **không** phải `onPress={load}` — truyền thẳng thì `load` nhận object sự kiện chạm làm tham số đầu.

**`FlatList` / `SectionList`** đã có state `refreshing` riêng thì giữ nguyên logic, chỉ đổi cặp prop sang `refreshControl` để lấy đúng màu:

```jsx
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors.brand}
      colors={[colors.brand]}
      progressBackgroundColor={colors.surface}
    />
  }
  ...
/>
```

**Màn nhiều tab** (`TabScreen`) nhận `onRefresh` làm prop; tab nào không truyền thì không nhận cử chỉ — kéo ra một vòng xoay chớp rồi tắt mà dữ liệu y nguyên là lời hứa suông.

**Trang chủ** là ca riêng: dữ liệu nằm ở ba khối con, mỗi khối một endpoint. `app/(app)/home.jsx` tăng `refreshKey` cho cả ba chạy lại, rồi đếm đủ ba tiếng `onLoaded` mới tắt vòng xoay (kèm hẹn giờ 20 giây làm lưới an toàn).

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

# 6b. Số liệu

`src/utils/format.js`:

```jsx
import { fmtCurrency, initialsOf, splitName } from "../../utils/format";

fmtCurrency(tournament.entryFee)    // "200.000 đ"; null hoặc 0 → "Miễn phí"
initialsOf("Nguyễn Văn A")          // "NA" — avatar dự phòng
splitName("Nguyễn Văn A")           // { first: "Nguyễn Văn", last: "A" }
```

`splitName` phục vụ kiểu hiển thị tên của web: phần đầu chữ thường, họ cuối IN HOA đậm. Đã gói sẵn trong `src/components/tournament/PlayerName.jsx`.

---

# 7. Ngày tháng

`src/utils/date.js`:

```jsx
import { fmtDateShort, fmtDateTime, fmtDateRange } from "../../utils/date";

fmtDateShort(post.publishedAt)                  // "28/07/2026", hoặc null nếu thiếu/sai
fmtDateTime(registration.createdAt)             // "28/07/2026 14:30", hoặc null
fmtDateRange(t.startDate, t.endDate)            // "01/06/2026 – 05/06/2026", hoặc "—"
```

Dùng `fmtDateTime` cho mốc thao tác (ngày đăng ký, ngày thanh toán) — trong cùng một ngày có thể có nhiều bản ghi, chỉ hiện ngày thì không phân biệt được.

`fmtDateShort` và `fmtDateTime` trả `null` khi ngày rỗng hoặc không parse được — nhớ kiểm trước khi render:

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

# 11b. Chọn ảnh và tải lên

Bản gốc: `src/components/profile/ProfileContent.jsx` + `src/api/storageApi.js`.

```jsx
import * as ImagePicker from "expo-image-picker";

const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (!permission.granted) { /* báo inline, đừng im lặng */ return; }

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});
if (result.canceled) return;

const asset = result.assets[0];   // { uri, fileName, mimeType, fileSize }
const { objectKey } = await storageApi.uploadImage({
  uri: asset.uri,
  name: asset.fileName || "upload.jpg",
  type: asset.mimeType || "image/jpeg",
});
```

Ba chỗ khác web, sai là hỏng:

- **FormData nhận `{ uri, name, type }`**, không phải đối tượng `File` — React Native không có `File`.
- **Đừng tự đặt header `Content-Type`** cho request multipart: để axios sinh kèm `boundary`, đặt tay sẽ thiếu boundary và backend không tách được file.
- **Người dùng có thể từ chối quyền** — trình duyệt không có bước này. Từ chối thì báo inline kèm hướng dẫn bật lại trong Cài đặt.

Kiểm `mimeType` và `fileSize` trước khi tải lên; cả hai đều có thể `undefined` nên chỉ kiểm khi có giá trị.

---

# 11c. Chọn một trong danh sách ngắn

`src/components/OptionPicker.jsx` — thay `<select>` của web.

```jsx
<OptionPicker
  label="Giới tính"
  options={GENDER_OPTIONS}     // [{ value, label }]
  value={form.gender}
  onChange={(v) => onChange({ gender: v })}
  disabled={saving}
/>
```

React Native không có select gốc, `@react-native-picker/picker` thì mỗi hệ điều hành một kiểu. Với 3–5 mục thì bày hết thành chip: nhanh hơn một chạm và thấy ngay có những lựa chọn nào. Danh sách dài hơn thì đừng dùng cái này — cân nhắc màn chọn riêng.

---

# 11d. Nội dung HTML từ backend

Bài viết (`NewsPostResponse.content`) là HTML. React Native không có DOM, nên project tự chuyển sang component gốc:

```jsx
import RichText from "../news/RichText";

<RichText html={post.content} />
```

Phân tích nằm ở `src/utils/html.js` — hàm thuần, có test:

```js
parseHtmlBlocks(html)   // → [{ type: "paragraph" | "heading" | "list" | "image" | "quote" | "rule", ... }]
htmlToPlainText(html)   // → chữ thuần, dùng khi cần đoạn tóm tắt
decodeEntities(str)     // → giải mã &amp; &#39; &nbsp; ...
```

**Vì sao không dùng thư viện:** `react-native-webview` khiến chữ không theo design system và phải đo chiều cao thủ công khi nhúng vào trang cuộn; `react-native-render-html` ngừng bảo trì từ 2022. Phạm vi HTML mà một trình soạn thảo sinh ra đủ hẹp để tự xử lý.

**Phủ:** `p`, `h1`–`h6`, `strong`/`b`, `em`/`i`, `a`, `ul`/`ol`/`li`, `img`, `blockquote`, `hr`, `br`, entity.
**Không phủ:** bảng, `iframe`, video nhúng. Những thẻ này bị bỏ nhưng **chữ bên trong vẫn giữ** — mất định dạng chứ không mất nội dung.

Parser dùng stack thật, không dùng regex cắt khối: nội dung soạn thảo hay lồng `div` trong `div` và regex lười sẽ khớp nhầm thẻ đóng của lớp trong. Nếu cần mở rộng (thêm thẻ, thêm kiểu khối) thì sửa `src/utils/html.js` **và bổ sung test** — file này đang có 34 ca, kể cả HTML hỏng và thẻ chưa đóng.

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

# 13b. Xác nhận hành động không hoàn tác được

`src/components/ConfirmSheet.jsx` — thay `ConfirmModal` của web. Trượt lên từ đáy để hai nút nằm trong tầm ngón cái.

```jsx
<ConfirmSheet
  visible={confirmOpen}
  title="Xác nhận hủy đăng ký"
  message="Hủy đăng ký này? Bạn sẽ phải đăng ký lại từ đầu nếu đổi ý."
  confirmText="Hủy đăng ký"
  cancelText="Giữ đăng ký"
  confirmVariant="danger"
  loading={submitting}
  onConfirm={handleConfirm}
  onCancel={() => setConfirmOpen(false)}
/>
```

Trong lúc `loading`, cả lớp nền lẫn nút huỷ đều bị khoá — bằng không người dùng đóng sheet giữa lúc request đang chạy và không biết kết quả ra sao.

Lỗi trả về **không** hiện trong sheet: đóng sheet rồi hiện `FormError` ngay trong màn, vì lỗi thường nói về trạng thái của cả bản ghi chứ không riêng thao tác xác nhận.

`Button` có sẵn `variant="danger"` (nền đỏ) cho đúng nhóm này.

---

# 13c. Ô tìm kiếm

`src/components/SearchField.jsx` — pill có icon kính lúp và nút xoá. Khác `Input`: đây là bộ lọc, không phải field của form (không nhãn, không validate).

```jsx
<SearchField
  value={searchInput}
  onChangeText={setSearchInput}
  onSubmit={handleSubmitSearch}   // bỏ prop này nếu lọc tại chỗ
  placeholder="Tìm giải đấu..."
/>
```

**Lọc bằng API thì phải có `onSubmit`**, đừng gọi API trong `onChangeText` — mỗi ký tự một request là quá tốn trên mạng di động. `onSubmit` chạy khi bấm nút tìm trên bàn phím và khi bấm nút xoá, luôn nhận từ khoá dưới dạng chuỗi.

**Lọc tại chỗ** (mảng đã tải sẵn, như tab Cơ thủ) thì chỉ cần `onChangeText` + `useMemo`.

---

# 13d. Màn nhiều tab

Bản gốc: `src/components/tournament/TournamentDetail.jsx`.

Chỉ mount tab đã được mở, và giữ lại tab đã mount bằng `display: none` — chuyển qua chuyển lại không gọi lại API:

```jsx
const [activeTab, setActiveTab] = useState("info");
const [visited, setVisited] = useState({ info: true });

const handleChangeTab = (tabId) => {
  setActiveTab(tabId);
  setVisited((prev) => (prev[tabId] ? prev : { ...prev, [tabId]: true }));
  scrollRef.current?.scrollTo({ y: 0, animated: false });
};

{tabs.map((tab) =>
  visited[tab.id] ? (
    <View key={tab.id} style={tab.id === activeTab ? undefined : styles.hidden}>
      {renderTab(tab.id)}
    </View>
  ) : null
)}

const styles = StyleSheet.create({ hidden: { display: "none" } });
```

Ba điểm bắt buộc:

- **Cuộn về đầu khi đổi tab** — giữ nguyên vị trí cuộn thì nội dung mới hiện ra giữa chừng.
- **Unmount thì mất dữ liệu**, nên đừng tháo tab ra khỏi cây chỉ vì nó đang ẩn.
- Tab nào có bộ đếm hoặc polling thì truyền cờ `active` xuống để nó **dừng khi bị ẩn** — tab ẩn vẫn gọi API là bắt người dùng trả tiền 3G cho dữ liệu họ không xem.

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
import { iconSize, shadow } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

const colors = useThemeColors();

<ActivityIndicator color={colors.brand} />
<TextInput placeholderTextColor={colors.faint} />
<ChevronLeft size={iconSize.lg} color={colors.brand} />
<View style={shadow.overlay} className="rounded-2xl bg-surface" />
```

Không gõ hex thẳng vào prop, và **không import `lightColors` / `darkColors` thẳng** — làm vậy là khoá cứng một chế độ. Hàm thuần không gọi được hook thì nhận màu qua prop từ component cha.

Danh sách token đầy đủ: [01-design-system.md](01-design-system.md), Phần 9.

---

# 16. Màu theo chế độ sáng/tối

App có dark mode cho toàn bộ nhóm `(app)`; nhóm `(auth)` khoá ở chế độ Sáng.

**Dùng token vai trò thay cho tên màu.** Đây là toàn bộ việc phải nhớ khi dựng màn mới — không cần viết `dark:` ở đâu cả:

```jsx
// Sai — trắng cả ở chế độ tối
<View className="bg-white border-slate-200">
  <Text className="text-slate-900">Tiêu đề</Text>
  <Text className="text-slate-500">Chú thích</Text>
</View>

// Đúng — tự đổi theo chế độ
<View className="bg-surface border-line">
  <Text className="text-content">Tiêu đề</Text>
  <Text className="text-muted">Chú thích</Text>
</View>
```

Bảng đối chiếu `slate-*` → token nằm ở [01, Phần 2](01-design-system.md).

**Khối cố ý tối thì giữ màu tuyệt đối.** Hero, footer, thanh tab, badge, lớp nền mờ sau menu, nút trên nền tối đã tối sẵn ở cả hai chế độ:

```jsx
<View className="bg-navy-900">
  <Text className="text-white">Vẫn trắng ở cả hai chế độ</Text>
  <Pressable className="border border-white/40 active:bg-white/10" />
</View>
```

Đổi những chỗ này sang token là sai — nút trắng trên nền tối mà đổi theo chế độ sẽ tan vào nền.

**Đọc chế độ hiện tại** khi cần rẽ nhánh (StatusBar, chọn ảnh minh hoạ):

```jsx
import { useIsDarkMode } from "../../theme/useThemeColors";

const isDark = useIsDarkMode();
<StatusBar style={isDark ? "light" : "dark"} />
```

**Khoá một vùng ở chế độ Sáng:**

```jsx
import LightThemeScope from "../../src/theme/LightThemeScope";

<LightThemeScope>{children}</LightThemeScope>
```

Nó khoá cả `className` (qua `vars()`) lẫn prop JS (qua context). Thiếu vế thứ hai thì icon vẫn lấy màu tối trong khi nền quanh nó đã sáng.

**Đổi chế độ:**

```jsx
import { useThemeStore } from "../../store/themeStore";

const mode = useThemeStore((s) => s.mode);       // "system" | "light" | "dark"
const setMode = useThemeStore((s) => s.setMode);
```

Chỉ `themeStore` được gọi `colorScheme.set()`; nơi khác chỉ đọc.

---

# Chống chỉ định

| Đừng viết | Lý do |
|---|---|
| `axios.get(...)` trong component | Mất token và xử lý lỗi chung |
| `useAuthStore()` không selector | Render lại thừa |
| `<Image source={{ uri }} />` trần | Vỡ khi URL null hoặc hỏng |
| `FlatList` trong `ScrollView` | Cuộn giật, mất ảo hoá |
| `color="#1a2a4a"` | Không đổi theo chế độ sáng/tối |
| `bg-white`, `text-slate-900` cho nền/chữ thường | Trắng cả ở chế độ tối — dùng `bg-surface`, `text-content` |
| `import { lightColors }` trong màn | Khoá cứng một chế độ — dùng `useThemeColors()` |
| Viết `dark:` thủ công | Không cần: token đã tự đổi. Viết thêm chỉ tổ lệch |
| `className="shadow-md"` | Không chạy đúng trên native |
| `className="hover:bg-slate-100"` | Native không có hover, dùng `active:` |
| `router.push` sau khi đăng nhập | Back về được màn đăng nhập |
| Coi `[]` là lỗi | Người dùng thấy "lỗi" khi chỉ là chưa có dữ liệu |
