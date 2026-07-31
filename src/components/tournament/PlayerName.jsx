import { Text } from "react-native";

import { splitName } from "../../utils/format";

/**
 * Tên cơ thủ kiểu WNT: phần đầu chữ thường, họ cuối IN HOA đậm.
 *
 * Web dùng đúng cách này ở cả tab Cơ thủ lẫn tab Xếp hạng, nên tách ra dùng chung.
 * `dimmed` dành cho cơ thủ đã bị loại — web làm mờ và xám hoá ảnh, mobile chỉ
 * đổi màu chữ vì `RemoteImage` không có bộ lọc xám.
 */
export default function PlayerName({ name, dimmed = false, className = "" }) {
  const { first, last } = splitName(name);
  const color = dimmed ? "text-faint" : "text-content";

  return (
    <Text numberOfLines={1} className={`text-sm ${color} ${className}`}>
      {first ? `${first} ` : ""}
      <Text className="font-bold uppercase">{last}</Text>
    </Text>
  );
}
