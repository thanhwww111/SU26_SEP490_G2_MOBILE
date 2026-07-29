import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import RemoteImage from "../home/RemoteImage";
import TournamentStatusBadge from "./TournamentStatusBadge";
import { fmtDateRange } from "../../utils/date";
import { colors, iconSize } from "../../theme/tokens";

/** Giải đã xong thì nút dẫn tới kết quả chứ không còn là "xem giải sắp tới" */
const isFinished = (status) => status === "COMPLETED" || status === "DRAW_DONE";

/**
 * Một giải đấu trong danh sách /event.
 *
 * Web dùng thẻ dọc tỷ lệ 4:5 với tên giải chồng lên ảnh. Trên điện thoại ảnh
 * dọc chiếm gần trọn chiều cao màn hình — mỗi lần cuộn chỉ thấy được một giải,
 * nên mobile đổi sang ảnh ngang 16:9 và đưa tên xuống dưới. Thứ tự thông tin
 * và nội dung footer (ngày + hành động) giữ nguyên như web.
 *
 * Cả thẻ là một vùng bấm; nhãn ở footer chỉ để nhìn, không phải nút riêng —
 * hai đích bấm nhỏ cạnh nhau rất dễ bấm nhầm bằng ngón tay.
 */
export default function TournamentCard({ item, onPress }) {
  const dateRange = fmtDateRange(item.startAt, item.endAt);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white active:bg-slate-50"
    >
      <View>
        <RemoteImage uri={item.thumbnailUrl} className="h-44 w-full" />

        {/* Badge nằm trên ảnh như web, chỉ đổi từ góc dưới sang góc trên vì
            phần dưới ảnh đã sát khối chữ */}
        <View className="absolute right-3 top-3">
          <TournamentStatusBadge tournament={item} />
        </View>
      </View>

      <View className="gap-2 p-4">
        <Text
          numberOfLines={2}
          className="text-base font-bold leading-snug text-slate-900"
        >
          {item.name}
        </Text>

        {item.gameType || item.formatName ? (
          <View className="flex-row flex-wrap items-center gap-x-2">
            {item.gameType ? (
              <Text className="text-sm font-semibold text-slate-600">
                {item.gameType}
              </Text>
            ) : null}
            {item.gameType && item.formatName ? (
              <Text className="text-sm text-slate-300">·</Text>
            ) : null}
            {item.formatName ? (
              <Text numberOfLines={1} className="flex-shrink text-sm text-slate-500">
                {item.formatName}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <Text numberOfLines={1} className="flex-1 text-xs text-slate-500">
          {dateRange}
        </Text>

        <View className="flex-row items-center">
          <Text className="text-overline font-bold uppercase text-slate-700">
            {isFinished(item.status) ? "Kết quả" : "Xem"}
          </Text>
          <ChevronRight size={iconSize.sm} color={colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}
