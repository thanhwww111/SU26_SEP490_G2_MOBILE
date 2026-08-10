import { Text, View } from "react-native";

/**
 * Tỷ số một trận đấu.
 *
 * Tách riêng vì ba chỗ đang hiện tỷ số theo ba kiểu khác nhau: tab Trận đấu và
 * tab Trực tiếp dùng `3 - 1` cỡ 16, còn Lịch thi đấu của tôi dùng `3 — 1` cỡ 14
 * và chữ "vs" khi trận chưa đá. Cùng một dữ liệu mà mỗi màn một hình thức thì
 * người dùng phải đọc lại từ đầu mỗi lần chuyển màn.
 *
 * Tỷ số để cỡ 24 và tách thành khối nền riêng: đây là thứ người xem tìm đầu
 * tiên khi lướt danh sách trận, để cùng cỡ với tên cơ thủ thì phải dừng lại đọc
 * mới thấy.
 *
 * @param {number|null} score1 — điểm bên trái, `null` khi chưa có
 * @param {number|null} score2 — điểm bên phải
 * @param {1|2|null} winner — bên thắng, dùng để tô đậm
 * @param {"live"|"done"|"upcoming"} state — trạng thái trận, từ `getMatchState`
 */
export default function MatchScore({ score1, score2, winner, state }) {
  const done = state === "done";
  const isLive = state === "live";

  // Chưa có điểm nào thì "vs" đọc nhanh hơn hai gạch ngang đặt cạnh nhau
  const pending = score1 == null && score2 == null;

  /* Điểm khuyết mà bên kia đã có thì hiện gạch ngang chứ không hiện 0 — 0 là
     một kết quả thật, quy ước này có từ MatchRow cũ */
  const cell = (value) => (value == null ? "–" : String(value));

  const tone = (side) => {
    if (winner === side) return "text-info";
    if (done) return "text-faint";
    return "text-content";
  };

  if (pending) {
    return (
      <View className="min-w-[76px] items-center rounded-lg bg-sunken px-3 py-2">
        <Text className="text-base font-bold uppercase text-muted">vs</Text>
      </View>
    );
  }

  return (
    <View
      className={`min-w-[76px] flex-row items-center justify-center gap-2 rounded-lg px-3 py-1.5 ${
        isLive ? "bg-tint-accent" : "bg-sunken"
      }`}
    >
      <Text className={`text-2xl font-black tabular-nums ${tone(1)}`}>
        {cell(score1)}
      </Text>
      <Text className="text-base text-disabled">-</Text>
      <Text className={`text-2xl font-black tabular-nums ${tone(2)}`}>
        {cell(score2)}
      </Text>
    </View>
  );
}
