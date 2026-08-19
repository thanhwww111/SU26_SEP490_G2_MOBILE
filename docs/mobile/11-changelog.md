# Nhật ký màn hình

Ghi lại **màn nào đã dựng, quyết định gì, còn nợ gì**. Mục đích: người vào sau biết được vì sao code hiện tại trông như vậy mà không phải đọc lại toàn bộ diff.

Không ghi ở đây: chi tiết cách dùng component (xem [08](08-reusable-patterns.md)), shape dữ liệu (xem [10](10-data-contracts.md)).

---

# Đã thiết kế, CHƯA làm

**Theo dõi giải / cơ thủ + thông báo** — [spec đầy đủ](../superpowers/specs/2026-08-10-follow-and-notify-design.md), chốt 2026-08-10.

Người dùng theo dõi một giải hoặc một cơ thủ để tiện xem đối thủ, nhận thông báo ba tầng: realtime khi mở app (WebSocket có sẵn), hẹn giờ cục bộ khi app đóng, và push từ server khi có kết quả bất ngờ.

Gác lại vì nhóm đang tập trung hoàn thiện sản phẩm. **Đã chốt: làm cả ba tầng khi nào cần tới.** Spec đã khảo sát sẵn toàn bộ hạ tầng backend kèm `file:line`, nêu rõ bốn file BE cần thêm và vì sao thêm bảng mới không vi phạm ràng buộc 07/08 — mở ra là code được ngay, không phải dò lại.

---

# 2026-08-17 (d) — Tải ảnh trên mobile chưa bao giờ chạy: axios biến FormData thành `"null"`

Triệu chứng: đổi ảnh đại diện trên app không ăn, kể cả khi đã trỏ sang backend deploy. Nghi server
trước — nhưng upload thẳng bằng `curl` lên deploy trả **HTTP 200 trong 0,34s**, MinIO qua
`cdn.biliardtournament.cloud` chạy tốt. Lỗi nằm hoàn toàn ở client.

**Chuỗi nguyên nhân**, bốn mắt xích đều kiểm chứng được:

1. `src/api/axiosClient.js` khai `Content-Type: application/json` cho **toàn instance**.
2. axios 1.18.1 `transformRequest`: gặp FormData **mà header là JSON** thì không gửi nguyên trạng,
   nó chạy `JSON.stringify(formDataToJSON(data))`.
3. `formDataToJSON` chỉ làm việc khi FormData có `entries()`. Bản của React Native chỉ có
   `append`, `getAll`, `getParts` → hàm trả `null`.
4. Body gửi đi đúng bằng chuỗi `"null"`, Content-Type `application/json`. Backend không thấy part
   nào, `@RequestParam("file") MultipartFile` báo thiếu tham số.

Không chỗ nào ném lỗi để lần ra — đây là loại hỏng im lặng tệ nhất: mã vẫn chạy, request vẫn đi,
chỉ là nội dung rỗng.

**Web không dính** vì `FE/src/api/storageApi.js` ghi đè `Content-Type: multipart/form-data` ngay
tại lời gọi. Bản mobile thiếu đúng dòng đó — mà comment trong file lại còn dặn "KHÔNG tự đặt header
Content-Type", một lời khuyên đúng cho `fetch` thuần nhưng sai khi instance đã cài sẵn header JSON.

**Sửa hai lớp:**

- `src/api/storageApi.js` khai header multipart tại lời gọi, khớp với web.
- `src/api/axiosClient.js` thêm lưới an toàn: request nào có body là FormData thì tự đặt
  `Content-Type: multipart/form-data`. Nhận diện qua `getParts` chứ không phải `instanceof FormData`
  — bản web chạy FormData của trình duyệt, hai lớp khác nhau.

Giữ cả hai là cố ý: nơi gọi tự khai thì đọc code là hiểu, còn interceptor lo cho lần sau có ai thêm
một chỗ tải file mới mà quên.

**Cách tái hiện** (không cần chạy app): nạp `axios.defaults.transformRequest[0]` với một FormData
giả lập kiểu RN — header JSON cho ra `"null"`, header multipart giữ nguyên FormData.

---

# 2026-08-17 (c) — Bảng điểm dựng được cả hai hướng màn hình

Khoá ngang **không đáng tin để dựa vào**. Trên máy thật, `lockAsync(LANDSCAPE)` có lúc không ăn:
iPad bật multitasking bỏ qua nó, một số máy khoá xoay ở mức hệ thống cũng vậy. Khi đó bố cục
ngang bị nhét vào khổ dọc và vỡ — dòng thể thức bị cắt cụt, badge "Đang đánh" tràn khỏi panel,
tên cơ thủ mất đuôi.

Nên hướng màn hình giờ là thứ để **đọc** chứ không phải để ép. `[matchId].jsx` gọi
`useWindowDimensions()` và dựng hai bố cục đầy đủ, không cái nào là bản dự phòng méo mó:

| | Ngang | Dọc |
|---|---|---|
| Hai panel | cạnh nhau | xếp chồng |
| Đồng hồ | nổi ở tâm, panel chừa `centerGap` để né | một dải riêng giữa hai panel, không đè lên gì |
| Dòng thể thức ở thanh trên | cùng hàng với tên bàn | xuống hàng riêng |
| Nhãn chỉ báo kết nối | hiện đủ chữ | chỉ icon (`accessibilityLabel` vẫn giữ câu đầy đủ) |
| Thứ tự nút +1 / −1 | đối xứng gương | giống nhau ở cả hai panel |

Đối xứng gương chỉ có nghĩa khi hai panel nằm cạnh nhau, mỗi người một bên. Xếp chồng mà vẫn đảo
thì nút "+1" của hai cơ thủ nằm hai đầu khác nhau, trọng tài phải nhìn mới bấm đúng.

Khoá ngang vẫn giữ trong `(scoring)/_layout.jsx` vì ngang cho số to hơn — nhưng giờ nó là **ưu
tiên, không phải điều kiện**.

## Sheet chốt kết quả bị cắt mất nút xác nhận

Ở khổ ngang màn chỉ cao hơn 300pt, mà sheet có tiêu đề, tỷ số, hai lựa chọn, cảnh báo chốt sớm và
hai nút. `maxHeight: "92%"` không đủ: thẻ bên trong vẫn lấy chiều cao theo nội dung rồi tràn ra
ngoài, đẩy hai nút xuống dưới mép màn.

Phải có `flexShrink: 1` ở **cả** thẻ nội dung lẫn `ScrollView` bên trong — thiếu một trong hai thì
chuỗi cha-con không chỗ nào chịu co, và `maxHeight` chỉ cắt phần thừa chứ không ép co lại.

---

# 2026-08-17 (b) — WebSocket không bao giờ nối được với server deploy

Triệu chứng: màn chấm điểm treo ở "Đang kết nối…" mãi không đổi. Nghi tài khoản trước tiên —
nhưng `POST /auth/login` với `staff1@gmail.com` trả 200 và màn hình hiện đủ dữ liệu trận, nên
JWT, quyền STAFF lẫn phân công trận đều đúng. Lỗi nằm chỗ khác.

**Nguyên nhân: React Native tự thêm header `Origin`, và server từ chối đúng cái origin đó.**

`WebSocketModule.kt` (dòng 121-123) gọi `getDefaultOrigin()` khi lời gọi không tự đặt sẵn header
`origin`; hàm đó đổi `wss://api.biliardtournament.cloud/ws` thành `https://api.biliardtournament.cloud`.
Backend profile `prod` chỉ cho phép đúng một origin — của web FE, **không có nhãn `api.`**
(`application-prod.yml`, biến `CORS_ALLOWED_ORIGIN`). Spring chặn ở tầng CORS filter, trước cả
WebSocket handler.

Đo bằng `curl` ngày 2026-08-17:

| Origin gửi lên `/ws` | Kết quả |
|---|---|
| `https://biliardtournament.cloud` | **101** Switching Protocols |
| `https://api.biliardtournament.cloud` (RN tự thêm) | **403** |
| không gửi Origin | 101 |

**Không phải lỗi riêng của màn trọng tài.** `useTournamentSocket` dùng chung với tab Trực tiếp và
tab Trận đấu ở màn chi tiết giải — hai màn đó cũng chết lặng từ lúc app trỏ vào server deploy,
chỉ là chúng không có chỉ báo kết nối nên không ai nhận ra. Sửa ở hook là cả ba màn sống lại.

**Cách sửa:** `useTournamentSocket` tự dựng socket qua `webSocketFactory` để đặt được header
`origin`, giá trị lấy từ `getWebSocketOrigin()` — bỏ nhãn `api.` khỏi `EXPO_PUBLIC_API_URL`, hoặc
đọc thẳng `EXPO_PUBLIC_WS_ORIGIN` nếu quy ước tên miền khác đi. Bản web không đụng tới: trình
duyệt cấm script đặt `Origin`, và nó vốn đã gửi origin thật nằm trong allowlist.

Backend chạy trên máy (profile `dev`, allowlist `*`) không dính lỗi này — nên **thử trên máy local
sẽ không tái hiện được**, phải trỏ vào server deploy mới thấy.

> Cách xử lý căn cơ hơn là thêm `https://api.biliardtournament.cloud` vào `CORS_ALLOWED_ORIGIN` của
> server deploy, hoặc miễn CORS cho riêng `/ws`. Cả hai đều đụng cấu hình backend nên chưa làm —
> phía mobile tự lo được thì không cần chờ.

---

# 2026-08-17 — Khu vực trọng tài (STAFF)

Hai màn của web được đưa lên: **Trận của tôi** (`app/(app)/staff/matches.jsx`) và **Bảng điểm**
(`app/(scoring)/[matchId].jsx`). Đây là khu vực theo role đầu tiên của app — trước đó chỉ có nhóm
công khai và PLAYER.

Thiết kế đầy đủ: [`docs/superpowers/specs/2026-08-17-staff-screens-design.md`](../superpowers/specs/2026-08-17-staff-screens-design.md).

## Phải `npm install` sau khi pull

Thêm `expo-screen-orientation` (~9.0.9). Không cài thì màn chấm điểm không mở được.

## `app.json` đổi `orientation` từ `portrait` sang `default` — đừng đổi ngược lại

Cùng kiểu bẫy với `userInterfaceStyle` ghi ở [06](06-agent.md): khai `"portrait"` là bảo hệ điều
hành app chỉ hỗ trợ chế độ dọc, Info.plist và Manifest chỉ đăng ký đúng hướng đó, và
`lockAsync(LANDSCAPE)` **không có tác dụng trên bản build thật**. Trong Expo Go vẫn xoay được vì
Info.plist lúc đó là của chính Expo Go — nên nếu chỉ thử trên Expo Go thì tưởng chạy tốt, build ra
mới hỏng.

Đổi lại, `app/(app)/_layout.jsx` phải tự khoá `PORTRAIT_UP`. **Đừng gỡ lệnh đó** — 16 màn còn lại
đều dựng cho khổ dọc.

## Lỗi của web đã tránh: thiếu `confirmEarlyEnd`

`MatchServiceImpl.java:643-653` bắt buộc gửi `confirmEarlyEnd: true` khi chốt trận lúc chưa ai đạt
`raceTo`. `StaffScoringPage.jsx:376` bên web chỉ gửi `winnerParticipantId`, nên nút "Kết thúc trận"
của web khi chưa đủ điểm luôn trả lỗi `MATCH_EARLY_END_NOT_CONFIRMED`.

Mobile gửi đúng field và cảnh báo trước trong sheet. **Đây là chỗ mobile khớp API còn web thì
chưa** — nếu sau này ai sửa web, đừng "sửa cho giống web" theo chiều ngược lại.

## Ba chỗ cố ý không sao chép từ web

| Web có | Mobile bỏ | Vì sao |
|---|---|---|
| Ảnh cơ thủ tràn nền bảng điểm | bỏ hẳn | web làm mềm biên bằng giao hai gradient trong CSS mask (`maskComposite: intersect`); React Native không có `mask-image`, dựng lại sẽ ra đúng cái rìa chữ nhật web đã cố tránh. Trên màn 6 inch ảnh nền cũng chỉ làm số điểm khó đọc |
| Quầng sáng radial sau lưng cơ thủ | bỏ | cùng lý do — cần gradient |
| Tiếng bíp WebAudio của đồng hồ | đổi thành rung | chưa cài thư viện âm thanh; điện thoại nằm trên thành bàn giữa tiếng ồn của quán thì rung đáng tin hơn tiếng |

Trạng thái "đang tới lượt" và "đã thắng" vẫn phân biệt được bằng vạch nhấn mép trên và badge — hai
thứ web cũng có và không dựa vào gradient.

## Chỉ báo kết nối hiện ở mọi trạng thái

Bản đầu chỉ hiện chỉ báo khi đường truyền có vấn đề. Sai: lúc chạy tốt và lúc đã rớt từ lâu trông
y hệt nhau, trọng tài không có cách nào biết tỷ số vừa bấm đã sang tới màn hình khán giả chưa.
Giờ hiện luôn, **xanh lục khi đã kết nối** — bám `SocketConnectionBadge` của web, chỉ lấy bậc màu
sáng hơn vì thanh này nền tối.

Dùng icon sóng chứ không phải chấm tròn, và nhãn là "Đã kết nối" chứ không phải "Trực tiếp" của
`SOCKET_STATE_LABELS`: ngay cạnh đã có badge "Đang đấu" của trận, cũng chấm tròn cũng xanh lục —
hai tín hiệu giống hệt nhau nằm sát nhau thì phải đọc chữ mới phân biệt, mất luôn cái lợi của màu.

Chỉ báo này lập tức có ích: nó là thứ phơi ra lỗi CORS ở mục (b) bên trên, vốn đã âm thầm làm hỏng
tab Trực tiếp từ trước mà không ai biết.

## Tên và điểm căn giữa nửa panel, không dồn vào trong

Bản đầu bê nguyên cách web dồn nội dung về phía giữa màn, nên hai con số ríu vào mặt đồng hồ.
Web dồn vào giữa là vì mép ngoài đã có ảnh cơ thủ chiếm chỗ — mobile bỏ ảnh đó thì lý do cũng mất
theo. Giờ căn giữa, `centerGap` vẫn trừ vào cạnh phía trong trước khi căn nên tâm nội dung tự dịch
ra ngoài đúng nửa bề rộng đồng hồ, tên cơ thủ dài cũng không chui xuống dưới mặt đồng hồ.

## Thêm mới, dùng lại được cho role sau

- `getHomeRouteForRole` trong `src/utils/auth.js` — đích đến sau đăng nhập theo role, dùng ở cả
  `login.jsx` lẫn `app/index.jsx`.
- `useRequireStaff` (`src/hooks/`) — khuôn guard theo role, port từ `StaffRoute` của web.
- `STAFF_MENU` trong `ProfileMenu.jsx` — cùng quy tắc với `PLAYER_MENU`.

Thêm màn cho OWNER / MANAGER thì đi theo đúng ba chỗ này, đừng dựng lớp phân quyền thứ hai.

## Đồng hồ mỗi cú đánh

`src/utils/shotClock.js` port nguyên từ web (hàm thuần, dùng chung một bộ luật). Hook
`src/hooks/useShotClock.js` khác ba chỗ vì nền tảng: lưu trạng thái bất đồng bộ qua
`src/utils/storage.js` (có cờ `hydrated`, ghi gộp nhịp 400ms), rung thay tiếng bíp, và đọc lại
`Date.now()` khi app về tiền cảnh vì `setInterval` bị hệ điều hành bóp lúc xuống nền.

Mốc `endsAt` là thời điểm tuyệt đối chứ không phải bộ đếm lùi — nhờ vậy app xuống nền rồi quay lại
vẫn ra đúng giờ còn lại.

`expo-keep-awake` hoá ra **đã có sẵn** trong `node_modules` (dependency của `expo`), nên giữ sáng
màn hình suốt trận không tốn thư viện nào.

## Test

```
node scripts/test-referee-match.js
```

30 test cho `src/utils/refereeMatch.js` và `src/utils/shotClock.js`: thứ tự sắp xếp, cách nhóm, lọc
theo ngày, nhãn giờ, và luật đồng hồ. Chạy lại nếu sửa thứ tự hiển thị — nó phải khớp
`FE/src/utils/refereeMatch.js`, vì trọng tài nhìn cùng một danh sách trên hai thiết bị.

## Chưa chạy trên máy thật

Bundle sạch (`npx expo export --platform web`), 55 test xanh, nhưng **chưa mở trên thiết bị**.
Những chỗ chỉ kiểm được trên máy: khoá xoay ngang và trả về dọc, rung cảnh báo, giữ sáng màn hình,
WebSocket nhận bản tin từ máy khác chấm cùng trận, và trạng thái đồng hồ sau khi app xuống nền.

---

# 2026-08-10 (d) — Chế độ tối lấy đúng mốc: TRANG CHỦ, không phải `.dark body`

Bản (c) bên dưới chữa đúng cơ chế nhưng **lấy sai mốc**, nên app vẫn ngả xanh so với trang chủ web.

Nguồn nhầm lẫn: `global.css` bên FE có `.dark body { background: #0a1220 }` — trông như mốc chung của web. Nhưng `pages/Home/index.jsx` **ghi đè nó**:

```jsx
<div className="w-full bg-white dark:bg-[#0b0d12] ...">   // nền
<div className="... dark:bg-[#161a22] ...">                // thẻ
```

| | nền | B−R | thẻ | B−R |
|---|---|---|---|---|
| Trang chủ (mốc thật) | `#0b0d12` | **7** | `#161a22` | **12** |
| `.dark body` (mốc nhầm) | `#0a1220` | 22 | `#131c2e` | 27 |

Hiệu B−R 22 so với 7 là khác biệt mắt thấy rõ: một bên navy, một bên đen. Thang tối mobile giờ lấy đúng cặp của trang chủ, mọi bậc B−R nằm trong **5–17**.

Bốn bậc chữ vẫn đạt AA trên nền mới (thấp nhất là `faint`, 4.90:1).

**Repo FE cũng đồng bộ cùng lượt**: `global.css`, `admin.css`, `eventTheme.css`, `rankingsTheme.css` — toàn bộ đưa về thang đen của trang chủ. Trước đó mỗi khu một tông, và không khu nào khớp chính trang chủ.

---

# 2026-08-10 (c) — Chế độ tối hết ngả xanh

Phản hồi: "dark mode mobile chỉ là nền xanh đậm, không đen sâu có chiều sâu như web".

Đúng, và đo được. Hiệu **B − R** của từng bậc trong thang cũ: nền 17 → thẻ 36 → nền chờ 42 → viền 48 → viền đậm **59**. Web giữ khoảng **22–27** ở mọi lớp. Càng lên lớp cao mobile càng xanh, nên tổng thể ra tông navy chứ không ra đen.

**Nguyên nhân:** thang cũ làm sáng bằng cách tăng riêng kênh xanh. Web làm sáng bằng cách **pha trắng** (`rgba(255,255,255,.03)`, `dark:border-white/10`, `dark:text-white/60`) — cộng đều ba kênh nên sắc độ không đổi.

Thang mới pha trắng như web, **B − R nằm trong 21–28 ở mọi bậc**. `canvas` và `surface` lấy đúng giá trị web (`#0A1220`, `#131C2E`). Hai giá trị đó gần nhau nên việc tách thẻ khỏi nền chuyển sang trông cậy vào **viền** — cũng là cách web làm.

> Ghi chú này thay thế phần "Đổi từ 2026-08-06" trong [01 — Phần 9](01-design-system.md), chỗ giãn khoảng cách nền cho khỏi "phẳng lì". Vấn đề đó có thật nhưng cách chữa sai hướng: giãn bằng cách bơm thêm xanh. Lần này giãn bằng viền.

Nhân tiện sửa hai thứ:

- `faint` từ 3.83:1 lên **4.51:1** trên nền thẻ — bản cũ dưới ngưỡng AA nên chú thích và mốc thời gian khó đọc.
- Bảng token ở [01 — Phần 9](01-design-system.md) bị vỡ cấu trúc: năm dòng chữ (`content`, `muted`, `faint`…) nằm lạc sau đoạn văn thay vì trong bảng.

**Sửa màu tối thì sửa CẢ HAI file** — `global.css` và `src/theme/tokens.js` — nếu không màu icon lệch màu chữ ngay cạnh nó.

---

# 2026-08-10 (b) — Nút sáng/tối lên header, form đăng ký tự điền

## 1. Đổi giao diện chuyển từ menu hồ sơ ra header

`src/components/layout/ThemeToggle.jsx` mới, đặt cạnh chuông theo đúng thứ tự của web: đổi giao diện → thông báo → hồ sơ. Dòng "Giao diện" trong `ProfileMenu` bỏ hẳn — hai chỗ đổi cùng một thứ thì người dùng phải đoán chỗ nào mới đúng.

**Còn hai trạng thái Sáng ⇄ Tối như web**, không xoay vòng ba trạng thái nữa. Icon chỉ chỗ SẼ ĐẾN chứ không phải chỗ đang đứng (đang tối thì hiện mặt trời) — quy ước của `Header.jsx` bên web, đảo lại thì người quen web bấm nhầm.

Nút đọc chế độ đang hiển thị THẬT qua `useIsDarkMode()`, không đọc `mode` trong store. Hai thứ khác nhau khi `mode` là `"system"`: lúc đó store không biết máy đang sáng hay tối, mà nút thì phải hiện đúng icon ngay lần đầu mở app.

**`"system"` vẫn nằm trong store và vẫn là mặc định** — chỉ biến khỏi giao diện. Mở app lần đầu vẫn khớp cài đặt của máy; bấm nút một lần là chốt tường minh. Bỏ hẳn thì người để máy ở chế độ tối bị chói ngay lần mở đầu tiên.

Ba vùng của `AppHeader` nới từ `w-20` lên `w-[120px]` cho đủ ba nút, nếu không logo lệch khỏi tâm.

## 2. Form đăng ký giải tự điền thông tin người đăng ký

`TournamentRegisterView` gọi thêm `GET /profile` trong cụm `Promise.all` sẵn có, **bọc `.catch(() => null)` riêng** — tài khoản chưa tạo hồ sơ thì backend trả 404, mà thiếu hồ sơ thì form vẫn phải mở được.

Điền `player_full_name` và `player_phone`, **khớp bằng `fieldKey` chính xác chứ không suy từ `uiComponent`**: template giải đôi có `player2_phone` cũng là `PHONE_INPUT`, đoán theo kiểu ô thì số của người đăng ký chui thẳng vào ô đồng đội.

Điền đúng MỘT lần cho cả vòng đời màn (`prefilledOnce` ref). `useFocusEffect` gọi lại `load` mỗi lần quay lại màn; điền lại ở đó sẽ xoá sạch những gì người dùng vừa gõ — kể cả khi họ cố ý sửa tên để đăng ký hộ.

Ô vẫn sửa được bình thường, kèm một dòng nhắc "Đã điền sẵn từ hồ sơ của bạn — sửa lại nếu bạn đăng ký cho người khác". Không có dòng đó thì người đăng ký hộ sẽ tưởng form khoá cứng theo tài khoản.

**KHÔNG làm nút "Đăng ký hộ" và nút "Thêm người chơi"** dù ban đầu có yêu cầu. Backend chặn cả hai: một tài khoản chỉ đăng ký được một lần cho một giải, và số người chơi cố định theo template. Bốn giới hạn đầy đủ kèm file:line: [10 — POST /player/tournaments/{id}/registrations](10-data-contracts.md).

> **Repo FE đã port y hệt** (`src/pages/Player/TournamentRegisterPage.jsx`): cùng bảng `PREFILL_FROM_PROFILE`, cùng cách nuốt 404 của `getProfile`, cùng dòng nhắc. Sửa một bên thì sửa cả hai — lệch nhau thì cùng một người đăng ký trên hai thiết bị lại gặp hai form khác nhau. Bên web hồ sơ còn đè lên `defaultValue` của template, vì giá trị mặc định do Owner đặt là ví dụ chung cho mọi người.

---

# 2026-08-10 — Phông chữ riêng, bộ lọc dính, tỷ số to

Năm việc theo phản hồi khi dùng thử. **Thêm ba thư viện** — pull về nhớ `npm install`.

## 1. App có phông chữ riêng, thôi dùng font hệ điều hành

`expo-font` + `@expo-google-fonts/be-vietnam-pro` + `@expo-google-fonts/oswald`, nạp trong `app/_layout.jsx` bằng `useFonts`, gộp vào cổng chờ sẵn có nên không thêm màn chờ mới. Font hỏng thì vẫn cho vào app — chặn ở đó sẽ thành màn quay vô tận.

**Mobile KHÔNG dùng Poppins và Bebas Neue như web khai báo**, mà dùng thẳng hai font dự phòng Be Vietnam Pro và Oswald. Lý do và cách đổi độ đậm: [01 — Phần 3](01-design-system.md). Tóm tắt: hai font kia thiếu glyph tiếng Việt, web chỉ chạy được nhờ trình duyệt thay glyph từng ký tự — cơ chế mà React Native không có.

Không phải sửa 190 chỗ đang gõ `font-bold` / `font-black`: một plugin trong `tailwind.config.js` ghi đè các lớp đó để đổi `fontFamily` thay vì `fontWeight`.

**`src/theme/fonts.js` trỏ thẳng vào từng file `.ttf`, đừng đổi sang import theo tên gói.** `index.js` của `@expo-google-fonts/*` `require` sẵn mọi độ đậm kể cả bản nghiêng, nên import theo tên gói kéo cả 24 file vào bản dựng — đã đo bằng `expo export`: **2,95 MB thay vì 1,13 MB**.

**Tiêu đề nghiêng bằng `skewX(-14deg)` gói sẵn trong `font-display`.** React Native bỏ qua `fontStyle` với font nạp lúc chạy, mà Oswald cũng không có bản nghiêng thật — nên phải làm đúng phép biến hình trình duyệt dùng cho synthetic oblique. Chỗ nào nghiêng gây lẹm mép thì có `font-display-upright`.

### Kéo theo: repo FE bỏ Bebas Neue

Cùng ngày, `SU26_SEP490_G2_FE` đổi `--font-display` từ `"Bebas Neue", "Oswald", ...` sang `"Oswald", ...` và ngưng nạp Bebas Neue. Lý do giống hệt phần trên — Bebas thiếu glyph tiếng Việt — nhưng bên web hậu quả nhìn thấy rõ hơn vì tiêu đề cỡ lớn: trong "SÂN CHƠI BILLIARDS" thì Â và Ơ rơi sang Oswald, lệch cap-height nên chữ thụt lên thụt xuống.

Bên đó còn một lỗi thứ hai tự khỏi theo: Bebas Neue là font toàn chữ hoa, nên tiêu đề viết thường mà không có lớp `uppercase` (`Quản lý nhân viên`) hiện ra `QUảN Lý NHâN VIêN` — ký tự có dấu rơi sang Oswald nên giữ nguyên chữ thường. Dùng Oswald một mình thì hiện đúng như nội dung viết.

**Hai repo giờ dùng chung Oswald cho tiêu đề.** Chữ thường thì vẫn lệch tên font (web Poppins, mobile Be Vietnam Pro) nhưng trùng kết quả với chữ có dấu — xem [01](01-design-system.md).

**Nợ:** chưa chạy thử trên máy thật. Thứ tự ưu tiên giữa lớp `text-*` và `font-*` đã kiểm bằng cách dựng CSS ra xem, nhưng cách NativeWind nạp font lúc chạy thì chỉ thiết bị mới nói được. Cũng chưa đo lại chiều cao dòng: font mới có metrics khác font hệ thống nên mọi khối đo theo chiều cao chữ sẽ xê dịch nhẹ, Android có thể cần `includeFontPadding: false`.

## 2. Số thứ tự bị cắt cụt đầu

`RankingRow` và `RankedSection` đặt `<Text>` cỡ 12 cho dấu `#` **lồng trong** `<Text>` cỡ 24 cho số hạng. React Native gộp cả đoạn thành một dòng rồi lấy chiều cao dòng theo Text con nhỏ hơn, nên chữ số to bị cắt mất phần trên — hạng 1, 2, 3 cụt đầu còn hạng 4 thì không, vì nét chữ 4 nằm thấp hơn.

Sửa: tách thành hai `<Text>` anh em trong `<View className="flex-row items-baseline">`.

Bỏ luôn các bề ngang cố định quanh đó (`w-12`, `w-14` ở `StandingTable` và `RankingTab`) — giải đông người có hạng ba chữ số, và nhãn "Hiệu số" viết hoa có giãn chữ vốn đã gần chạm mép.

> Quét cả repo tìm mọi `<Text>` lồng lệch cỡ chữ, chỉ có đúng hai chỗ trên. **Đây là cái bẫy, không phải lỗi lẻ** — Text lồng Text mà khác cỡ chữ thì bao giờ cũng có nguy cơ này.

## 3. Tỷ số trận đấu: một hình thức cho cả ba màn

`src/components/match/MatchScore.jsx` mới. Trước đó tab Trận đấu dùng `3 - 1` cỡ 16, còn Lịch thi đấu của tôi dùng `3 — 1` cỡ 14 và chữ "vs" — cùng một dữ liệu mà mỗi màn một kiểu.

Nay cỡ 24, tách thành khối nền riêng, bên thắng tô màu. Tên cơ thủ cho xuống hai dòng vì khối tỷ số rộng hơn trước.

`MyMatchList` chuyển sang dùng chung `getWinnerSide` với tab Trận đấu — hàm đó có nhánh so tỷ số khi backend không gửi `winner`. Kèm theo đó, điểm khuyết hiện dấu gạch chứ không hiện `0` nữa; `0` là một kết quả thật.

## 4. Bộ lọc dính lại mép trên khi cuộn

**Bốn màn danh sách** (Bảng xếp hạng cơ thủ, Tin tức, Giải đấu, Chi nhánh) đổi `FlatList` → `SectionList`, bộ lọc làm section header nên tự dính. Chỉ có một section, `sections` không mang ý nghĩa nhóm. Nhớ bật `stickySectionHeadersEnabled` — Android mặc định tắt.

Hai điều chỉnh kéo theo: dòng đếm tổng ("64 cơ thủ") gộp vào phụ đề vì chỗ cũ của nó giờ là ranh giới dính; khoảng cách dưới bộ lọc chuyển thành `pt-4` của item đầu, vì để trong header thì nó dính theo.

## 5. Vùng cuộn của màn chi tiết giải chia lại theo tab

Trước: cả năm tab dùng chung một `ScrollView` ở `TournamentDetail`, nên bộ lọc nằm lọt trong vùng cuộn, không có cách nào giữ lại.

Nay `src/components/tournament/tabs/TabScreen.jsx` dựng khung hai tầng cho tab danh sách — bộ lọc trên, nội dung cuộn dưới — và `TournamentDetail` chỉ còn dựng `ScrollView` cho tab Thông tin, nơi ảnh bìa phải cuộn cùng nội dung. Thanh tên giải ở ba tab danh sách chuyển ra ngoài mọi vùng cuộn.

Hai hệ quả có lợi: mỗi tab nhớ vị trí cuộn riêng (đổi tab không bị ném về đầu danh sách — `scrollTo(0)` giờ chỉ chạy cho tab Thông tin), và hết cảnh danh sách dài nằm trong `ScrollView` của người khác.

Ở tab Trận đấu **chỉ ô tìm kiếm và chip vòng được giữ cố định**. Nút Lịch đấu/Bảng điểm và chip giai đoạn bấm một lần rồi thôi; nhét cả bốn cụm lên trên sẽ ăn gần 180 điểm ảnh.

---

# 2026-08-08 (b) — Ba khác biệt cuối cùng bị xoá bỏ

Ba chỗ trước đây được ghi là "khác web có chủ ý" nay làm cho giống hẳn, theo yêu cầu của nhóm. **Thêm hai thư viện** — pull về nhớ `npm install`.

## 1. Quên mật khẩu: 2 màn → 3 bước như web

Thêm `verify-otp.jsx` giữa `forgot-password` và `reset-password`, dùng endpoint `/auth/verify-otp` mà trước đây mobile bỏ không.

Trước: OTP và mật khẩu mới điền chung một màn, gõ nhầm OTP thì phải điền lại cả mật khẩu. Nay sai OTP biết ngay ở bước 2.

Web gộp ba bước trong một trang bằng biến `step`; mobile tách ba màn vì nút Quay lại của hệ điều hành phải lùi từng bước — gộp một màn thì bấm Quay lại là văng khỏi cả luồng. OTP chuyển tiếp sang bước 3 qua tham số route (backend cần cả `otp` lẫn `newPassword` trong một lời gọi). Vào thẳng bước 3 mà thiếu tham số thì bị đẩy về bước 1.

## 2. Ngày sinh: ô gõ tay → bộ chọn ngày của hệ điều hành

`@react-native-community/datetimepicker` (8.4.4, bản Expo SDK 54 pin) + `src/components/DateField.jsx`.

**Giá trị vào/ra vẫn là chuỗi `dd/mm/yyyy`**, không phải `Date` — cố ý, để `profileFormUtils` và `dateFieldToIso` không phải sửa gì; hai chỗ đó đã có sẵn phần đổi qua lại với ISO và đã được kiểm.

Hai nền tảng hành xử khác hẳn nên `DateField` phải tách nhánh: Android là hộp thoại hệ thống tự đóng, iOS là view nằm trong màn không tự đóng nên phải tự dựng khung + nút "Xong".

Dùng ở hồ sơ (chặn ngày tương lai) và ở trường `DATE_PICKER` của form đăng ký giải (không chặn — Owner có thể hỏi ngày dự kiến có mặt).

## 3. Tỷ số trực tiếp: poll 15 giây → WebSocket dùng chung với web

`@stomp/stompjs` `^7.3.0` — **đúng version web đang dùng**, để hai bản khách không bao giờ hiểu khác nhau về một bản tin.

Backend khai `/ws` không kèm `.withSockJS()` → WebSocket thuần, không cần `sockjs-client`.

`src/hooks/useTournamentSocket.js` port từ web, thêm hai thứ mà bản web không cần:

- **Theo vòng đời tiền cảnh.** Trình duyệt giữ tab sống khi người dùng chuyển tab; điện thoại thì hệ điều hành cắt socket khi app xuống nền. Không xử lý thì người dùng mở lại app thấy tỷ số đứng im mà tưởng trận chưa đánh. Hook tự ngắt khi xuống nền, nối lại khi quay lại.
- **`forceBinaryWSFrames` + `appendMissingNULLonIncoming`.** Bản WebSocket của React Native không xử lý khung văn bản giống trình duyệt; thiếu hai cờ này thì bản tin STOMP bị cắt cụt.

Không cần polyfill `TextEncoder`/`TextDecoder` dù stompjs v7 dùng cả hai: Hermes có sẵn `TextEncoder`, Expo cài `TextDecoder` vào global (`expo/src/winter/runtime.native.ts`). Đã kiểm ở SDK 54 — **nâng SDK thì kiểm lại**.

**Cả tab Trận đấu cũng nghe socket**, không riêng tab Trực tiếp. Nếu chỉ một tab nghe thì cùng một trận sẽ hiện hai tỷ số khác nhau tuỳ người dùng đang mở tab nào. Bảng điểm tự tính lại theo vì nó dựng từ chính mảng `stages` được socket cập nhật.

Nối lại sau khi rớt mạng thì tải lại toàn bộ từ REST — quãng mất kết nối có thể đã lỡ bản tin, đắp từng cái lên trạng thái cũ thì sai âm thầm. `BRACKET_SYNC` cũng tải lại thay vì đắp, vì lúc đó cấu trúc vòng đổi hẳn.

## Chưa chạy trên máy thật

Bundle sạch, nhưng **cả ba mục này đều chỉ kiểm được trên thiết bị**:

- Bộ chọn ngày: hai nhánh Android/iOS khác nhau hoàn toàn, phải thử cả hai.
- WebSocket: nối được tới IP LAN không, tỷ số có về thật không, và ba nhịp vòng đời (xuống nền → lên lại, rớt mạng → nối lại, đổi tab).
- Luồng OTP 3 bước: cần email thật để nhận mã.

---

# 2026-08-08 — Khép bốn khoảng cách còn lại so với web

Không có màn nào hoàn toàn mới trừ hồ sơ cơ thủ nhánh `participantId`; đợt này lấp bốn chỗ mobile còn thua web sau khi rà lại toàn bộ nhóm PLAYER.

## 1. Hồ sơ cơ thủ theo `participantId`

`app/(app)/players/participant/[participantId].jsx` + `getParticipantProfile` trong `publicPlayerApi`.

Trước đó tab Cơ thủ và tab Xếp hạng trong chi tiết giải là **chữ chết** — cả hai chỉ cầm `participantId` mà mobile mới có nhánh `userId`. Giờ bấm được cả hai.

`PlayerProfileView` nhận một trong hai khoá. Suất dự giải có gắn tài khoản thì chuyển tiếp sang nhánh `userId` bằng `router.replace` (không phải `push` — `push` sẽ tạo vòng lặp khi bấm Quay lại). Suất do ban tổ chức thêm tay thì `userId` là null, đọc thẳng hồ sơ trong phạm vi giải đó.

## 2. Tab Trận đấu: bảng điểm và bộ lọc

Đổi nguồn từ `/tournaments/{id}/matches` sang **`/tournaments/{id}/stages`**. Lý do: bảng điểm gộp xếp hạng theo thứ tự giai đoạn nên cần `orderNo`, chip giai đoạn cần `name` — mảng matches phẳng không có hai trường đó. Tab Trực tiếp vẫn dùng `/matches`, nó chỉ cần các trận đang đá.

Thêm: chuyển chế độ Lịch đấu / Bảng điểm, chip giai đoạn kèm đếm tiến độ (`3/8`), ô tìm tên cơ thủ, chip lọc vòng. Đủ cả ba bộ lọc của web.

Bảng điểm chỉ hiện khi giải có giai đoạn vòng tròn — giải loại trực tiếp thuần không có gì để tính, bày nút rỗng chỉ làm người dùng bấm hụt.

**`src/utils/standings.js` có test, và test phải chạy được sau mỗi lần sửa.** Thứ tự phân định hạng (thắng → hiệu số → đối đầu trực tiếp → ván thắng → tên) PHẢI khớp `BracketGenerationServiceImpl.computeStageStandings()` của backend; lệch nhau thì khán giả thấy một bảng còn hệ thống loại người theo bảng khác. Chạy: `node scripts/test-standings.js` (25 test).

Đây là lần đầu repo giữ lại file test thay vì xoá sau khi chạy — vì logic này ràng buộc với backend chứ không phải hàm tiện ích thông thường.

## 3. Thanh toán PayOS: chống mất bước đối chiếu

Gom logic trùng ở hai màn vào `src/hooks/usePayOsCheckout.js`.

Lỗi cũ: `openBrowserAsync` chỉ resolve khi người dùng **đóng** trình duyệt. Trả tiền xong rồi bấm Home, hoặc bị hệ điều hành thu hồi bộ nhớ, thì bước đối chiếu bị bỏ lỡ và app hiện trạng thái cũ — người dùng tưởng mình trả hụt. Tiền không mất (webhook PayOS vẫn cập nhật server), nhưng trải nghiệm thì hỏng.

Sửa: ghi mã đơn xuống bộ nhớ **trước khi** mở trình duyệt, rồi đối chiếu lại ở ba thời điểm — trình duyệt đóng, app trở lại tiền cảnh (`AppState`), và hook gắn lần đầu (bắt trường hợp app đã bị đóng hẳn giữa chừng). Khoá bị xoá ngay sau khi đọc nên hai nguồn gọi cùng lúc không đối chiếu hai lần.

## 4. Chi tiết trận trong Lịch thi đấu

`src/components/match/MatchDetailSheet.jsx` — web mở modal chi tiết trận; mobile đổi thành lớp trượt lên, dùng chung khuôn với `ConfirmSheet`. Dải chân thẻ vẫn đi thẳng sang giải đấu, không bắt qua hai bước.

**Dải chữ chạy của trang chủ: đã dựng rồi gỡ bỏ trong cùng ngày.** Ba dải Marquee của web được port sang `Animated.loop`, chạy được, nhưng nhóm chốt là không cần trên mobile — nó là chi tiết trang trí của landing page desktop, đặt lên màn hẹp chỉ tốn chiều cao và tốn pin cho một hoạt ảnh chạy không ngừng. Không dựng lại; xem mục "cố ý không sao chép từ web" ở [07](07-web-mapping.md).

## 5. Hai chỗ sót ra từ đợt rà soát lại

Rà toàn bộ nhóm PLAYER lần hai, đối chiếu từng màn với web, tìm thêm được hai chỗ:

- **Nút "Xem giải đấu" trong chi tiết đăng ký.** Web có trong modal; mobile bỏ vì lúc dựng (2026-08-07) route chi tiết giải chưa có. Route đã có từ 2026-07-29 — comment trong `RegistrationDetailSection` lỗi thời mà không ai để ý. Nay đủ ba hành động như web: thanh toán nốt, xem giải, huỷ.
- **Nút "Thanh toán" ngay trên thẻ đăng ký.** Web đặt ở dải chân thẻ; mobile bắt vào màn chi tiết mới trả được — thêm một bước cho việc gấp nhất màn này. Nay có luôn trên thẻ, dùng cùng `usePayOsCheckout`. Đây là ngoại lệ cố ý của quy tắc "cả thẻ là một vùng bấm": nút nằm ở dải chân, đủ xa vùng bấm chính.

## Component dùng chung mới

`src/components/ChipRow.jsx` — tách từ định nghĩa cục bộ trong `RankingFilterBar`, giờ dùng ở cả bộ lọc bảng xếp hạng lẫn tab Trận đấu. Có thêm `badge` cho chip giai đoạn.

## Chưa chạy trên máy thật

Cả đợt mới bundle sạch (`npx expo export --platform web`) và chạy test hàm thuần. Hai chỗ chỉ kiểm được trên thiết bị:

- `usePayOsCheckout`: phải thử đúng ba kịch bản rời app giữa lúc thanh toán — xem [12](12-payos-test-checklist.md).
- Bảng điểm với giải vòng tròn thật — test dùng dữ liệu tự dựng.

---

# 2026-08-07 (b) — Trọn luồng player: đăng ký giải, thanh toán, lịch thi đấu, lịch sử thanh toán

Bốn màn mới, bám đúng các trang tương ứng của FE web. Trước đó app xem được giải nhưng không đăng ký được — `InfoTab` phải thay nút bằng một ghi chú "đang được dựng".

| Màn mới | Web tương ứng |
|---|---|
| `app/(app)/register/[id].jsx` | `/player/tournaments/:id/register` |
| `app/(app)/payments.jsx` | `/player/payments` |
| `app/(app)/matches.jsx` | `/player/matches` |

Hai mục "Lịch thi đấu" và "Lịch sử thanh toán" trong `ProfileMenu` đã bỏ `path: null`.

## PayOS: vì sao không dùng deep link

`PayOSServiceImpl` đọc `returnUrl` từ **cấu hình server**, không nhận từ client. Nghĩa là PayOS luôn trả người dùng về URL của bản web, không có cách nào bắt nó quay về `btms://` mà không sửa backend.

Cách đi vòng, không phải sửa gì ở backend:

1. Mở `checkoutUrl` bằng `WebBrowser.openBrowserAsync` — trình duyệt trong app, biết được lúc người dùng đóng.
2. Đóng xong thì gọi `POST /player/payments/confirm-return?orderCode=...`. Endpoint này **hỏi thẳng PayOS** trạng thái đơn chứ không tin lời client, nên gọi nhiều lần hay bỏ ngang giữa chừng đều an toàn.
3. Tải lại đăng ký để hiện kết quả.

Kể cả bước 2 lỗi cũng không sao — webhook PayOS vẫn cập nhật ở phía server, lời gọi đó chỉ để người dùng thấy kết quả ngay thay vì phải chờ.

## Form đăng ký động

Owner cấu hình trường cho từng giải, nên form phải dựng từ `GET /player/tournaments/{id}/registration-form`. Hai chỗ lệch web do nền tảng:

- `SELECT`/`RADIO` → hàng chip `OptionPicker`, không phải thẻ select: trên điện thoại select bung ra bánh xe che nửa màn.
- `DATE_PICKER` → ô nhập `dd/mm/yyyy`, vì repo chưa có thư viện chọn ngày. `dateFieldToIso` đổi sang ISO trước khi gửi.

Client chỉ kiểm tra trường bắt buộc; mọi luật còn lại để backend quyết, tránh hai bên lệch nhau.

## Giải miễn phí đi đường khác

`RegistrationServiceImpl` tự xét duyệt ngay trong lời gọi tạo đăng ký khi `entryFee` bằng 0 — không qua PayOS. Nên phản hồi của `POST registrations` có thể đã là `APPROVED` hoặc `REJECTED` (hết suất), màn đăng ký phải xử lý luôn cả hai.

Nguồn duy nhất quyết định có phí hay không là `entryFee` trong form preview, đừng đoán từ chỗ khác.

## Trả tiền sau

`RegistrationDetailSection` có thêm nút "Thanh toán ngay" khi trạng thái là `PENDING_PAYMENT`, dùng lại đúng luồng PayOS trên. Người dùng bỏ ngang lúc đăng ký không phải làm lại từ đầu.

---

# 2026-08-07 — Thông báo: chuông trên header, màn danh sách, thông báo đẩy

Màn `notifications.jsx` và chuông ở `AppHeader`. **Không có màn tương ứng trên web** — trang `TournamentNotificationsPage` bên web là chỗ Owner/Manager gửi email theo giải, còn đây là góc nhìn của người nhận. Đây là ngoại lệ đầu tiên của luật "web là chuẩn giao diện", và có lý do: điện thoại là nơi duy nhất nhận được thông báo đẩy.

## Không có bảng thông báo trong DB

Danh sách dựng lại từ `email_send_logs` lọc theo `recipient_user_id` — mỗi email hệ thống đã gửi cho bạn là một thông báo. Dự án đã gần xong nên tránh thêm bảng; bảng duy nhất được thêm là `device_tokens`, và nó độc lập hoàn toàn, không sửa bảng nào đang có.

**Hệ quả phải nhớ khi test:** sự kiện nào không có rule email đang bật thì không thành thông báo. Màn hình rỗng chưa chắc là hỏng — kiểm tra `email_automation_rules` trước.

Trạng thái đã đọc là một mốc thời gian trong SecureStore, không phải cột trong DB. Vì vậy hai máy của cùng một người đếm chưa đọc độc lập nhau, và gỡ app cài lại thì mọi thứ thành chưa đọc.

## Thông báo đẩy trong Expo Go: iOS được, Android không

**Đính chính ngày 2026-08-10.** Bản ghi trước ở đây nói push "không chạy trong Expo Go" — đúng với Android, **sai với iOS**, và chính câu đó khiến nhóm đi tìm lỗi ở điện thoại khi iPhone không nhận được thông báo.

Giới hạn của SDK 53 chỉ gỡ remote push khỏi Expo Go **trên Android**. Kiểm chứng ngay trong `node_modules/expo-notifications/src/warnOfExpoGoPushUsage.ts`: thông báo ghi rõ chữ "Android", và chỉ `console.error` khi `Platform.OS === "android"`, còn iOS chỉ `console.warn`. `getDevicePushTokenAsync.ts` không có nhánh nào chặn theo platform, `getExpoPushTokenAsync` cũng không kiểm tra Expo Go — nó chỉ ném lỗi khi thiếu `projectId`.

Nên trên **iPhone thật + Expo Go, push chạy được**, không cần development build EAS, không cần Apple Developer account.

Điều kiện bắt buộc duy nhất là **`extra.eas.projectId` trong `app.json`** — thiếu nó thì `resolveProjectId()` trả null và hook thoát trước khi kịp xin token, nên bảng `device_tokens` trống và backend không có gì để gửi.

**Đã cấu hình ngày 2026-08-10:** project `@thanhdinh203s-team/SU26_SEP490_G2_MOBILE`, id `a5fb7778-74dc-42a5-ba3d-aa807a534b00`. Tạo dưới **team account** chứ không phải account cá nhân, để cả nhóm mời nhau vào build được; `app.json` vì thế có thêm `"owner": "thanhdinh203s-team"`. **Đừng chạy lại `eas init`** — projectId là immutable, chạy lại chỉ sinh project trùng và token sẽ cấp theo id khác.

Bằng chứng chuỗi này đúng, lấy từ log thật hôm 2026-08-10 trước khi có projectId: console mobile in `[push] ... thiếu extra.eas.projectId`, còn backend in `ExpoPushServiceImpl: Không có thiết bị nào đăng ký cho 1 người nhận — bỏ qua push` ngay cạnh `MailDispatcher: Email sent ... logId=28`. Email đi được nhưng push thì không, đúng vì `device_tokens` trống — chứ không phải rule email thiếu.

Muốn thử trên Android thì mới cần development build, kèm FCM V1 credentials (Firebase project + service account key upload qua `eas credentials`).

`usePushNotifications.js` trước đây thất bại hoàn toàn im lặng ở mọi nhánh. Giờ mỗi nhánh đều log lý do qua `bail()` khi `__DEV__` — thiếu projectId, máy ảo, chưa cấp quyền, lỗi mạng. Đừng bỏ lớp log này: nó là thứ duy nhất phân biệt "máy không hỗ trợ" với "cấu hình còn thiếu".

Huy hiệu chưa đọc vì thế **không** dựa vào push: `_layout.jsx` đếm lại mỗi lần đổi màn.

## JWT hết hạn và thông báo đẩy

Backend cấp JWT sống 24 giờ, không có refresh token. Thông báo đẩy vẫn tới máy khi hết hạn (push đi bằng device token, không liên quan JWT), nhưng bấm vào thì app gọi API và gặp 401.

`axiosClient.js` giờ thử đăng nhập lại ngầm bằng thông tin lưu trong SecureStore rồi chạy lại request, hỏng mới logout. Đổi mật khẩu ở `ChangePasswordCard` phải cập nhật lại thông tin đã lưu, nếu không lần hết hạn sau sẽ đăng nhập ngầm thất bại.

Chỉ lưu trên native — trên bản web lớp lưu trữ rơi về localStorage, để mật khẩu ở đó là rủi ro thật.

## Bố cục header

`AppHeader` đổi từ `justify-between` sang ba vùng cố định `w-20`. Mép phải giờ có hai nút còn mép trái một, để chúng tự co giãn thì logo bị đẩy lệch khỏi tâm.

## Endpoint dùng chung với web

Ban đầu API đặt ở `/player/notifications`, sau đổi thành **`/notifications`** khi làm phần thông báo cho FE web. Lý do: web chủ yếu do Admin/Owner/Manager/Staff dùng, mà `SecurityConfig` khoá cứng nhánh `/player/**` vào role PLAYER — để nguyên thì web không gọi được.

Hai nền tảng giờ dùng chung `NotificationController` ở backend. Sửa response ở đó là ảnh hưởng cả hai, kiểm tra cả hai trước khi đổi.

---

# 2026-08-06 (d) — Nút mạng xã hội ở footer

Thêm lại nút mạng xã hội, lần này bấm được. Facebook dùng URL thật lấy từ footer của FE web; Instagram và YouTube để `url: ""` chờ nhóm điền.

`SOCIAL_LINKS` trong `AppFooter.jsx` lọc bỏ mục chưa có URL, nên hiện chỉ mỗi Facebook hiển thị. Cố ý **không** hiện icon xám bấm không ăn — đó đúng là thứ vừa bị gỡ khỏi footer và khỏi drawer, dựng lại thì mâu thuẫn.

Điền URL vào là nút tự hiện, không phải sửa phần dựng giao diện.

Mạng khác (TikTok, Threads) cần vẽ icon vào `src/components/icons/BrandIcons.jsx` trước — `lucide-react-native` từ v1 đã bỏ hẳn nhóm icon thương hiệu, import vào chỉ nhận `undefined`. File đó thành mồ côi sau lần dọn footer trước, giờ được dùng lại.

---

# 2026-08-06 (c) — Dọn thanh điều hướng

Bỏ "Tỷ Số Trực Tiếp" và "Cơ Thủ" khỏi `navItems.js`. Hai mục đó để `path: null` và hiện mờ trong drawer từ đầu, nhưng web đã bỏ hẳn chúng khỏi `Header.jsx` — mobile giữ lại là lệch chuẩn, và người dùng thì thấy hai mục bấm không ăn mà chẳng bao giờ dùng được.

Drawer còn 4 mục, khớp đúng web cả nội dung lẫn thứ tự: Tin Mới Nhất, Giải Đấu, Cơ Sở, Bảng Xếp Hạng. Cả 4 đều đã có màn, nên hiện không còn mục nào bị làm mờ.

Cơ chế `path: null` trong `AppDrawer` vẫn giữ, phòng khi thêm mục chưa dựng màn.

---

# 2026-08-06 (b) — Nút quay lại và chiều sâu chế độ tối

## Nút quay lại đứng im khi vào thẳng màn con

`app/(app)/_layout.jsx` gọi `router.back()` trần. Lệnh đó chỉ chạy khi ngăn xếp điều hướng có màn phía trước — vào thẳng một màn con bằng deep link, F5 trên bản web, hoặc mở app từ thông báo thì expo-router dựng lại ngăn xếp chỉ với đúng màn đó, `canGoBack()` trả false và `back()` thành lệnh rỗng. Nút vẫn hiện, bấm không phản ứng.

Ảnh hưởng **mọi** màn con trong nhóm `(app)` vì tất cả dùng chung header, không riêng màn hồ sơ.

Sửa: `canGoBack()` thì `back()`, không thì `replace("/(app)/home")`. Dùng `replace` chứ không `push` — push chồng thêm entry và lần bấm sau lại kẹt đúng chỗ cũ.

Kiểm chứng trên Expo web: mở thẳng `/profile` rồi bấm quay lại — trước khi sửa URL đứng yên, sau khi sửa về `/home`.

## Chế độ tối trông phẳng

Thang tối cũ đặt `canvas` `#0A1220` ngay cạnh `surface` `#0D1B2E`. Chênh lệch quá nhỏ nên thẻ chìm vào nền, mà bóng đổ thì cũng vô dụng trên nền tối (đen chồng đen) — mất cả hai tín hiệu phân tầng cùng lúc.

Sửa ở đúng hai file định nghĩa màu, không đụng màn nào: kéo `canvas` tối hẳn xuống `#070D18`, nâng `surface` lên `#0F1E33`, nâng `line` lên `#273B57` để thấy được cạnh thẻ.

Thêm token `surface-raised` (`#18293F` ở chế độ tối) cho lớp phủ — drawer, menu hồ sơ, `ConfirmSheet`. Trước đây chúng dùng `bg-surface`, trùng đúng màu thẻ nằm dưới nên trông như dán phẳng vào trang.

Chế độ sáng giữ nguyên: nó vốn tách tầng tốt và đang bám đúng web. `surface-raised` ở nhánh sáng bằng `#FFFFFF`, tức không đổi gì — bóng đã lo phần việc đó.

Quy tắc cho màn mới: lớp phủ dùng `bg-surface-raised`, thẻ dùng `bg-surface`.

---

# 2026-08-06 — Bảng xếp hạng, hồ sơ cơ thủ, footer thật

Hai chỗ cuối trên trang chủ còn dùng nội dung chép từ nguyên mẫu đã được thay bằng dữ liệu thật.

## Khối Top tay cơ — từ mảng cứng sang API

`RankedSection` trước đây đọc `src/constants/topPlayers.js`: 9 cơ thủ nước ngoài, ảnh trỏ sang `matchroompool.com`. Comment trong file nói backend chưa có endpoint xếp hạng toàn hệ thống — **điều đó đã hết đúng từ lâu**. `PublicLeaderboardController` (`GET /leaderboard`) tồn tại và FE web đã dùng nó ở cả trang chủ lẫn trang `/rankings`.

Nay khối này gọi đúng endpoint đó với đúng tham số web dùng: `period=YEAR`, `size=9`. File `topPlayers.js` đã xoá.

Bài học ghi lại: comment "backend chưa có" phải kèm ngày, nếu không nó sống lâu hơn sự thật.

## Màn mới

| Màn | Route | Web tương ứng |
|---|---|---|
| Bảng xếp hạng | `app/(app)/rankings.jsx` | `pages/Rankings/index.jsx` |
| Hồ sơ cơ thủ công khai | `app/(app)/players/[userId].jsx` | `pages/Event/PlayerProfilePage.jsx` |

Mục "Bảng Xếp Hạng" trong drawer đã mở path (`key` đổi từ `ranking` sang `rankings` để khớp segment cuối của route, đúng quy ước `activeKey`).

## Ba chỗ cố ý lệch web

- **Ảnh cơ thủ.** Web đặt `onError` đổi `src` sang `/player-default.webp`; `Image` của React Native không đổi nguồn kiểu đó. Thêm `PlayerPortrait` — thiếu ảnh thì hiện chữ cái đầu, theo đúng quy ước sẵn có của `PlayerAvatar`. Không dùng `RemoteImage` vì ảnh dự phòng của nó là `auth-hero.jpg`, một tấm ảnh bàn bi-a đặt vào ô chân dung trông như lỗi dữ liệu.
- **Bộ lọc kỳ.** Web dùng ba thẻ `<select>` và ghi bộ lọc vào query string. Mobile dùng chip cuộn ngang (không có select gốc; `OptionPicker` chỉ hợp 3–5 mục nên không dùng được cho 12 tháng) và giữ bộ lọc trong state — không có thao tác F5 để mà khôi phục.
- **Lỗi tải hồ sơ.** Web tự `navigate("/event")`. Mobile hiện nút thử lại: mạng di động chập chờn mà màn tự nhảy đi thì người dùng mất phương hướng, và nút quay lại trên header đã đủ lối thoát.

## Footer

Bỏ toàn bộ thông tin của Matchroom Multi Sport Ltd (địa chỉ Essex, dòng bản quyền, cụm "CAPS.tv"), mười link chữ chết và ba icon mạng xã hội không trỏ đâu. Tất cả đều là chỗ giữ chỗ chép từ nguyên mẫu, không phải thông tin của dự án.

Thay bằng link tới các màn đã dựng — đọc từ `NAV_ITEMS` đã lọc `path !== null`, cùng nguồn với drawer nên mở path cho một mục là footer có luôn — và một dòng bản quyền của chính dự án, năm tính động.

Không dựng địa chỉ / điện thoại / mạng xã hội: nhóm chưa chốt thông tin thật, và bịa ra thì tệ hơn để trống.

## Còn nợ

- `src/components/icons/BrandIcons.jsx` giờ không nơi nào dùng — footer là chỗ duy nhất gọi nó. Chưa xoá vì có thể cần lại khi nhóm chốt mạng xã hội thật.
- Tab Cơ thủ trong chi tiết giải vẫn không bấm sang hồ sơ được: nó cầm `participantId`, còn màn hồ sơ dựng trên nhánh `userId`.
- Mục "Cơ Thủ" trong drawer vẫn xám — chưa có màn danh sách cơ thủ.
- Bên web, `FE/src/components/layouts/Footer.jsx` và ba màn Auth vẫn mang nguyên thông tin Matchroom.

Thiết kế chi tiết: `docs/superpowers/specs/2026-08-06-leaderboard-and-footer-design.md`.

---

# 2026-07-29 — Dark mode

Bật dark mode cho toàn bộ nhóm `(app)`. Nhóm `(auth)` khoá ở chế độ Sáng theo yêu cầu.

## Cơ chế

Ba lựa chọn: **Tự động** (theo hệ điều hành, mặc định) · Sáng · Tối. Lưu vào SecureStore.

Giao diện điều khiển là **một dòng trong menu hồ sơ, chạm để xoay vòng** trạng thái. Bản đầu tách thành khối ba nút riêng, nhưng khối đó chen giữa danh sách toàn dòng-chạm-để-điều-hướng làm gãy nhịp đọc và chiếm chỗ gấp ba — đã gộp lại theo góp ý.

Khác web: `themeStore.js` bên đó cố ý luôn mặc định Sáng và bỏ qua cài đặt hệ thống. Trên điện thoại thì ngược lại — người dùng bật dark mode toàn máy sẽ mong app theo.

## Quyết định lớn — token vai trò, không phải `dark:`

Cách phổ biến của Tailwind là `bg-white dark:bg-navy-900`. **Không chọn cách đó.** Thay vào đó định nghĩa biến CSS trong `global.css` và ánh xạ sang tên vai trò trong `tailwind.config.js`:

```
bg-white      → bg-surface
bg-slate-50   → bg-canvas
text-slate-900 → text-content
border-slate-200 → border-line
```

Lý do quyết định: dự án còn nhiều màn chưa làm. Với cách `dark:`, mỗi màn mới là một cơ hội quên — và app nửa sáng nửa tối còn tệ hơn không có dark mode. Với token, màn mới tự động đúng.

Bảng token đầy đủ: [01-design-system.md](01-design-system.md), Phần 9.

## Phạm vi thật so với ước lượng của tài liệu

`01-design-system.md` Phần 9 từng viết "khi làm dark mode chỉ cần bổ sung bảng giá trị thứ hai trong `tokens.js`, không phải sửa từng màn". **Sai một nửa** — điều đó chỉ đúng với màu truyền qua prop JS. Phía `className`, mọi màn gõ thẳng `bg-white` / `text-slate-900`, không có gì để đổi.

Thực tế: **442 chỗ ở 51 file**. Đã sửa lại đoạn tài liệu đó.

## Đã xác minh trước khi chuyển hàng loạt

Không chuyển 442 chỗ rồi mới thử. Dựng spike nhỏ trước, bundle, soi CSS output:

- `--c-surface:#fff` ở nhánh sáng
- `.dark:root{--c-canvas:#0a1220;--c-surface:#0d1b2e}` ở nhánh tối
- `.bg-surface{background-color:var(--c-surface)}` trỏ đúng biến

Spike xong mới chuyển. Nếu NativeWind 4.2.6 không hỗ trợ biến CSS thì đã phải đổi hướng ngay từ đầu.

## Bẫy đã gặp và cách xử lý

**1. `Input`/`Button` dùng chung giữa auth và app.** Auth khoá sáng nhưng dùng chung component với app — nếu component đổi theo chế độ thì màn đăng nhập thành nửa sáng nửa tối.

Giải: `src/theme/LightThemeScope.jsx` khoá cả cây con. Phải khoá **hai đường**:
- `vars()` của NativeWind cho `className`;
- `ThemeLockContext` cho màu truyền qua prop JS — `vars()` không với tới được chúng.

Thiếu vế thứ hai thì icon lấy màu tối trong khi nền quanh nó đã sáng.

**2. StatusBar ở gốc là sai.** Nhóm auth luôn sáng nên chữ trạng thái phải luôn tối; nhóm app thì đổi theo chế độ. Để chung một cái ở gốc sẽ ra chữ trắng trên nền trắng ở màn đăng nhập khi app đang tối. Đã tách xuống từng nhóm layout.

**3. `brand` phải sáng lên ở chế độ tối.** Navy-700 đặt trên nền `#0A1220` gần như chìm hẳn — icon và spinner sẽ không nhìn ra. Chế độ tối dùng `#8FB0DC`.

**4. Nút `light`/`ghost` không được dùng token.** Chúng nằm trên nền đã tối sẵn ở cả hai chế độ; đổi theo chế độ thì nút trắng sẽ tan vào nền. Đã hoàn nguyên `active:bg-slate-200` cho variant `light` sau khi script đổi nhầm.

## Kiểm chứng đã chạy

- Bundle web sạch; CSS output có đủ cả hai nhánh biến và 16 class token.
- Quét: không còn `slate-*` ngoài nhóm auth; không còn `import { colors }` tĩnh.
- Quét: mọi `colors.` đều nằm sau một lời gọi `useThemeColors()`, kể cả trong component con định nghĩa ở cấp module (`InfoTab` có ba component như vậy).
- Auth vẫn giữ class gốc — xác nhận script không đụng nhầm.

## Chưa chạy trên máy thật

Ba thứ chỉ kiểm được trên thiết bị:

- **Chế độ "Tự động" có thật sự bám hệ điều hành không** — `colorScheme.set("system")` là API đúng theo type của NativeWind, nhưng chưa thấy nó phản ứng khi đổi cài đặt máy.
- **Đổi chế độ có mượt không**, hay có nháy một nhịp khi hàng loạt màn re-render.
- **Độ tương phản thật của bảng màu tối** trên màn hình OLED ngoài nắng.

## Lỗi đã gặp khi chạy thử: "dark mode is type 'media'"

Lần chạy đầu trên bản web ném lỗi:

```
Cannot manually set color scheme, as dark mode is type 'media'.
Please use StyleSheet.setFlag('darkMode', 'class')
```

**Nguyên nhân:** NativeWind nhét kiểu dark mode vào CSS đã biên dịch dưới dạng biến `--css-interop-darkMode`, và `runtime/web/color-scheme.js` đọc biến đó **đúng một lần lúc nạp module**. Metro còn cache bản CSS dựng trước khi `tailwind.config.js` có `darkMode: "class"`, nên runtime vẫn thấy `media`.

**Chữa gốc:** `npx expo start --clear`. Bản build kiểm lại cho ra `--css-interop-darkMode:class dark` — cấu hình đúng, chỉ là chưa tới được runtime.

**Chữa thêm ở code:** bọc `colorScheme.set` trong try/catch. Đổi màu là việc trang trí, không được phép làm sập app. `themeReady` cũng phải bật kể cả khi đặt chế độ thất bại, nếu không người dùng kẹt vĩnh viễn ở màn loading.

Bản native không dính lỗi này — `native/appearance-observables.js` gọi thẳng `Appearance.setColorScheme()`, không đọc flag.

**Bài học:** sửa `tailwind.config.js` thì phải xoá cache Metro. Đã ghi vào [06-agent.md](06-agent.md).

## Lỗi thứ hai, nghiêm trọng hơn: `userInterfaceStyle` khoá cứng ở "light"

`app.json` có `"userInterfaceStyle": "light"` từ trước. Nó bảo hệ điều hành rằng app **chỉ hỗ trợ chế độ sáng**, nên `Appearance.getColorScheme()` trên máy thật luôn trả `"light"` bất kể cài đặt của người dùng.

Hệ quả nếu không sửa: **dark mode không bao giờ chạy trên native**, kể cả khi mọi thứ khác đã đúng. Chế độ "Tự động" luôn ra sáng, và `colorScheme.set("dark")` cũng bị hệ điều hành ghi đè.

Đã đổi thành `"automatic"`.

Đây là lỗi tôi bỏ sót ở lượt làm dark mode — chỉ lộ ra khi chạy thử. Bài học: **làm dark mode thì phải kiểm `app.json`**, không chỉ `tailwind.config.js`.

## Đã thử và loại: `app/+html.jsx`

Có cân nhắc khai biến `--css-interop-darkMode` thẳng trong HTML tĩnh để nó có mặt trước khi bundle chạy. **Không dùng được**: dự án để `web.output` mặc định (`single`), và bản export chứng minh expo-router bỏ qua `+html.jsx` ở chế độ đó — HTML sinh ra vẫn là template mặc định. Cách này chỉ có tác dụng khi `web.output` là `static`.

## Gộp khuôn hai lớp phủ của header

`AppDrawer` (trái) trước đây là panel cao hết màn hình trượt từ mép trái, còn `ProfileMenu` (phải) là thẻ nổi bo góc. Hai lớp phủ mở ra từ **cùng một thanh header** mà trông như hai thành phần của hai app khác nhau.

Đã cho drawer dùng chung khuôn với ProfileMenu: cùng thẻ `w-56` bo góc, cùng cỡ chữ `text-[13px]`, cùng khoảng đệm `px-3 py-2.5`, cùng kiểu bung ra (scale + trượt dọc), cùng độ mờ nền `bg-black/20`.

Hai thay đổi kèm theo:

- **Bỏ chữ IN HOA giãn ký tự** ở nhãn mục — `navItems.js` vốn đã viết hoa đầu từ ("Tin Mới Nhất"), ép uppercase nữa là thừa và làm nhãn dài ra.
- **Mục đang mở** đổi từ vạch dọc bên trái sang chữ + icon accent kèm một chấm tròn cuối dòng. Vạch dọc phải luôn chiếm chỗ (kể cả khi trong suốt) để chữ không nhích ngang; chấm cuối dòng không có vấn đề đó.

Sửa một trong hai file thì phải sửa cả file kia — đã ghi vào [07-web-mapping.md](07-web-mapping.md).

## Nợ để lại

| Chỗ | Vấn đề |
|---|---|
| `shadow` trong `tokens.js` | Bóng đen trên nền tối gần như không thấy; lớp nổi hiện chỉ nhận biết bằng nền sáng hơn |
| `src/constants/tournament.js` | Badge vẫn hardcode hex. Nền đặc chữ trắng nên đọc được ở cả hai chế độ, chưa gấp |
| Ảnh hero | Lớp phủ tối cố định, ở chế độ tối có thể muốn đậm hơn |

---

# 2026-07-29 — Sáu màn công khai

Dựng xong toàn bộ nhóm màn công khai mà web đang có: giải đấu, tin tức, cơ sở. Cộng thêm làm lại màn hồ sơ cho đủ chức năng như web.

| Màn | Route mobile | Thành phần chính |
|---|---|---|
| Danh sách giải | `app/(app)/event.jsx` | `src/components/tournament/TournamentList.jsx` |
| Chi tiết giải | `app/(app)/event/[id].jsx` | `src/components/tournament/TournamentDetail.jsx` + `tabs/` |
| Danh sách tin | `app/(app)/news.jsx` | `src/components/news/NewsList.jsx` |
| Chi tiết tin | `app/(app)/news/[slug].jsx` | `src/components/news/NewsDetail.jsx` + `RichText.jsx` |
| Danh sách cơ sở | `app/(app)/branches.jsx` | `src/components/branch/BranchList.jsx` |
| Chi tiết cơ sở | `app/(app)/branches/[id].jsx` | `src/components/branch/BranchDetail.jsx` |
| Hồ sơ (làm lại) | `app/(app)/profile.jsx` | `src/components/profile/ProfileContent.jsx` |

Drawer giờ chỉ còn ba mục trống: `Tỷ Số Trực Tiếp`, `Bảng Xếp Hạng`, `Cơ Thủ` — **web cũng chưa có ba màn này**, nên mobile không được tự dựng.

## Quy ước đặt route đã chốt

Route mobile **giữ đúng tên route của web** (`/event`, `/news`, `/branches`), không đổi thành `tournaments` như bảng ánh xạ từng dự kiến.

Lý do không chỉ là cho giống: `app/(app)/_layout.jsx` truyền segment cuối của route làm `activeKey` cho drawer, nên tên file phải trùng `key` trong `navItems.js` thì mục đang mở mới sáng lên. Đặt tên khác là phải viết thêm bảng ánh xạ.

## Thư viện mới

**`expo-image-picker`** (`~17.0.11`) — màn hồ sơ cần chọn ảnh đại diện. Pull về nhớ `npm install`.

Đây là dependency **duy nhất** thêm vào trong đợt này. Hai chỗ khác từng cân nhắc thêm thư viện nhưng đã giải quyết bằng cách khác, xem hai mục dưới.

## Quyết định lớn 1 — HTML của bài viết

`NewsPostResponse.content` là HTML. Không dùng `react-native-webview` (chữ không theo design system, phải đo chiều cao thủ công khi nhúng vào trang cuộn) cũng không dùng `react-native-render-html` (ngừng bảo trì từ 2022).

Thay vào đó tự viết `src/utils/html.js` — parser có stack, chuyển HTML thành khối để render bằng component gốc.

- **Phủ:** đoạn văn, `h1`–`h6`, đậm, nghiêng, link, `ul`/`ol`, ảnh, trích dẫn, `hr`, `br`, entity.
- **Không phủ:** bảng, `iframe`, video nhúng — mất định dạng nhưng **chữ bên trong vẫn giữ**, bài viết không bao giờ trống.
- **Có 34 test.** Sửa parser thì thêm test; cách chạy ghi ở mục "Chạy test" bên dưới.

## Quyết định lớn 2 — tỷ số trực tiếp không realtime

Tab "Trực tiếp" ở chi tiết giải: web nhận cập nhật qua WebSocket (`useTournamentSocket`, STOMP trên SockJS). Mobile **chưa có thư viện WebSocket**, nên tab này gọi lại `/tournaments/{id}/matches` mỗi 15 giây, chỉ khi tab đang hiển thị.

Hệ quả: tỷ số trễ tối đa 15 giây. Muốn realtime thật thì cả nhóm phải thống nhất thêm `@stomp/stompjs`.

## Ba chỗ chờ màn khác

| Chờ | Hiện đang |
|---|---|
| `/player/tournaments/:id/register` | Chi tiết giải hiện đủ phí và số slot, nhưng thay nút đăng ký bằng ghi chú |
| `/event/players/:participantId` | Tên cơ thủ chỉ để đọc, chưa bấm được |
| Màn Top tay cơ | Khối `RankedSection` ở trang chủ chưa nối điều hướng |

## Ba chỗ cố ý không sao chép từ web

Không phải cắt bớt cho nhanh — ba chỗ này bê sang sẽ sai hoặc vô ích:

1. **Ô "Trạng thái: Đang mở cửa"** ở chi tiết cơ sở — web hardcode chuỗi này, backend không trả giờ mở cửa nào cả. Bỏ hẳn thay vì hiển thị thông tin bịa.
2. **Khối "N cơ sở · N khu vực"** ở danh sách cơ sở — web tải thêm 100 chi nhánh rồi tách đoạn cuối địa chỉ theo dấu phẩy để đếm. Một request phụ chỉ để hiện hai con số là không đáng trên mạng di động, và cách đếm đó vốn không đáng tin.
3. **Sơ đồ bracket SVG** ở tab Trận đấu — cần màn rộng, đúng như [07](07-web-mapping.md) đã chốt. Mobile chỉ dùng danh sách theo vòng.

## Lỗi tài liệu đã sửa trong đợt này

Đọc thẳng DTO backend thay vì suy từ code web nên bắt được bốn chỗ tài liệu ghi sai:

| Chỗ sai | Sự thật |
|---|---|
| `/tournaments/{id}/rankings` trả mảng | Trả **object** `{ tournamentId, tournamentStatus, isOfficial, entries }` |
| `ParticipantResponse.avatarUrl` | Tên thật là **`avtarUrl`** — lỗi chính tả nằm ở backend |
| `BranchResponse` "có ảnh và bàn" | **Không có danh sách bàn.** Chỉ có `images` |
| "Có hai chỗ đụng tới hồ sơ, đọc cả hai controller" | Đã dứt điểm: **tạo** qua `/player/profile`, **đọc và sửa** qua `/profile`, kể cả với PLAYER |

Ngoài ra `TournamentRankingEntryResponse` **không có trường ảnh** — nhánh hiển thị avatar trong `RankingTab.jsx` bên web không bao giờ chạy. Mobile không nhân bản code chết đó.

## Component dùng chung mới

| Component | Dùng ở |
|---|---|
| `src/components/SearchField.jsx` | Giải đấu, tin tức, cơ sở, tìm cơ thủ |
| `src/components/OptionPicker.jsx` | Hồ sơ (giới tính, hạng cơ thủ) — thay `<select>` của web |
| `src/components/tournament/SectionCard.jsx` | Chi tiết giải, hồ sơ, chi tiết cơ sở |

`Input` được bổ sung prop `multiline` (ô mô tả trong hồ sơ). `authStore` thêm action `patchUser` để đồng bộ tên sau khi lưu hồ sơ.

## Chưa chạy trên máy thật

**Toàn bộ đợt này mới bundle sạch, chưa chạy trên thiết bị.** Những chỗ chỉ kiểm được trên máy thật:

- Upload ảnh đại diện (multipart từ RN, quyền truy cập thư viện ảnh).
- `Linking.openURL` cho nút gọi điện và chỉ đường ở chi tiết cơ sở.
- Render HTML với nội dung thật từ database — test dùng HTML tự dựng theo những gì trình soạn thảo thường sinh ra.
- Thanh tab 5 mục ở chi tiết giải trên máy màn hẹp.

---

# Chạy test

Không có test runner trong project.

**Test đã có sẵn, chạy được ngay:**

```
node scripts/test-standings.js
```

25 test cho `src/utils/standings.js`. Bắt buộc chạy lại nếu sửa thứ tự phân định hạng — nó phải khớp backend, xem mục 2026-08-08.

**Viết test mới cho hàm thuần khác** (`src/utils/html.js`, `src/components/profile/profileFormUtils.js`, `src/utils/date.js`): chép khuôn nạp babel dưới đây, hoặc đơn giản hơn là chép `scripts/test-standings.js` rồi thay phần khẳng định.

```js
// .tmp-test.js ở thư mục gốc repo — nhớ xoá sau khi chạy
process.env.NODE_ENV = "test";
const babel = require("@babel/core");
const Module = require("module");
const origJs = Module._extensions[".js"];

Module._extensions[".js"] = (module, filename) => {
  // Bỏ qua node_modules, nếu không babel tự biên dịch chính nó và báo lỗi vòng lặp preset
  if (filename.includes("node_modules")) return origJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    presets: ["babel-preset-expo"],
    babelrc: false,
    configFile: false,
  });
  module._compile(code, filename);
};

const { parseHtmlBlocks } = require("./src/utils/html.js");
// ... so sánh kết quả
```

Kiểm tra cả app bundle được không:

```
npx expo export --platform web --output-dir <thư mục tạm>
```

Lệnh này bắt được lỗi import, JSX hỏng và class NativeWind sai — nhanh hơn mở Expo Go.
