import { View } from "react-native";

import ChipRow from "../ChipRow";
import {
  MONTH_OPTIONS,
  PERIODS,
  QUARTER_OPTIONS,
  yearOptions,
} from "../../constants/leaderboard";

/**
 * Bộ lọc kỳ thống kê của bảng xếp hạng.
 *
 * Web dùng ba thẻ `<select>`; React Native không có thẻ đó, và `OptionPicker`
 * chỉ hợp danh sách 3–5 mục nên không dùng được cho 12 tháng. Vì vậy cả ba mức
 * đều là chip cuộn ngang — cùng một hình thức, không phải nhớ hai kiểu thao tác.
 *
 * Hàng năm/quý/tháng chỉ hiện khi kỳ cần tới, để bộ lọc không chiếm ba hàng
 * ngay lúc mở màn ở kỳ mặc định.
 */
export default function RankingFilterBar({
  period,
  year,
  quarter,
  month,
  onChange,
}) {
  const showYear = period !== "ALL";

  return (
    <View className="gap-3 border-b border-line bg-surface pb-4 pt-4">
      <ChipRow
        label="Kỳ thống kê"
        options={PERIODS}
        value={period}
        onChange={(value) => onChange({ period: value })}
      />

      {showYear ? (
        <ChipRow
          label="Chọn năm"
          options={yearOptions()}
          value={year}
          onChange={(value) => onChange({ year: value })}
        />
      ) : null}

      {period === "QUARTER" ? (
        <ChipRow
          label="Chọn quý"
          options={QUARTER_OPTIONS}
          value={quarter}
          onChange={(value) => onChange({ quarter: value })}
        />
      ) : null}

      {period === "MONTH" ? (
        <ChipRow
          label="Chọn tháng"
          options={MONTH_OPTIONS}
          value={month}
          onChange={(value) => onChange({ month: value })}
        />
      ) : null}
    </View>
  );
}
