import { Text, View } from "react-native";

/**
 * Bảng điểm vòng tròn.
 *
 * Web dựng `<table>` 9 cột (#, Cơ thủ, Điểm, Trận, Thắng, Thua, RT, RB, Hiệu
 * số). Quy ước mobile cấm bảng cuộn ngang, nên mỗi cơ thủ thành một hàng hai
 * tầng: tầng trên là hạng, tên và hai số quyết định thứ hạng (số trận thắng,
 * hiệu số ván); tầng dưới là phần chi tiết ít ai đọc kỹ (số trận đã đấu, ván
 * thắng–thua). Không cột nào bị bỏ, chỉ đổi chỗ theo mức quan trọng.
 *
 * Người bị loại làm mờ và gắn nhãn, giống web. Đường nét đứt nằm TRÊN người bị
 * loại đầu tiên — đó là ranh giới đi tiếp / dừng lại, thông tin đáng giá nhất
 * của bảng này khi giải còn đang chạy.
 */

/** Ô số ở tầng trên: nhãn nhỏ phía trên, số to phía dưới */
const StatCell = ({ label, value, tone }) => (
  <View className="w-14 items-center">
    <Text className="text-overline font-bold uppercase text-faint">{label}</Text>
    <Text className={`text-base font-black tabular-nums ${tone}`}>{value}</Text>
  </View>
);

const StandingRow = ({ row, cutAbove }) => {
  const eliminated = Boolean(row.eliminated);
  const isFirst = row.rank === 1 && !eliminated;

  const rankBox = isFirst
    ? "border-gold bg-tint-warning"
    : eliminated
      ? "border-line bg-sunken"
      : "border-line-strong bg-canvas";

  const rankText = isFirst ? "text-gold" : eliminated ? "text-disabled" : "text-muted";

  const nameText = isFirst
    ? "text-gold"
    : eliminated
      ? "text-faint"
      : "text-content";

  const diffTone = eliminated
    ? "text-disabled"
    : row.frameDiff > 0
      ? "text-info"
      : row.frameDiff < 0
        ? "text-danger"
        : "text-faint";

  return (
    <View
      className={`px-4 py-3 ${
        cutAbove
          ? "border-t-2 border-dashed border-line-strong"
          : "border-t border-line-soft"
      } ${eliminated ? "bg-sunken" : isFirst ? "bg-tint-warning" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`h-9 w-9 items-center justify-center rounded-lg border ${rankBox}`}
        >
          <Text className={`text-sm font-bold tabular-nums ${rankText}`}>
            {row.rank}
          </Text>
        </View>

        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Text
            numberOfLines={1}
            className={`flex-shrink text-sm font-semibold ${nameText}`}
          >
            {row.name}
          </Text>

          {eliminated ? (
            <Text className="rounded-full bg-sunken px-2 py-0.5 text-overline font-bold uppercase text-muted">
              Bị loại
            </Text>
          ) : null}
        </View>

        <StatCell
          label="Thắng"
          value={row.wins}
          tone={eliminated ? "text-disabled" : "text-emerald-600"}
        />
        <StatCell
          label="Hiệu số"
          value={`${row.frameDiff > 0 ? "+" : ""}${row.frameDiff}`}
          tone={diffTone}
        />
      </View>

      <Text className="mt-1 pl-12 text-xs text-faint">
        {row.played} trận · {row.wins}T {row.losses}B · {row.framesWon}–
        {row.framesLost} ván
      </Text>
    </View>
  );
};

export default function StandingTable({ rows }) {
  if (!rows?.length) {
    return (
      <View className="rounded-xl border border-line bg-surface py-10">
        <Text className="px-6 text-center text-sm text-faint">
          Chưa có bảng điểm — các trận vòng tròn chưa hoàn thành.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-line bg-surface">
      <View className="flex-row items-center justify-between bg-navy-900 px-4 py-2.5">
        <Text className="text-sm font-semibold text-white">Bảng xếp hạng</Text>
        <Text className="text-xs text-navy-500">{rows.length} cơ thủ</Text>
      </View>

      {rows.map((row, index) => (
        <StandingRow
          key={row.id}
          row={row}
          // Ranh giới nằm ngay trên người bị loại đầu tiên
          cutAbove={
            Boolean(row.eliminated) && index > 0 && !rows[index - 1].eliminated
          }
        />
      ))}
    </View>
  );
}
