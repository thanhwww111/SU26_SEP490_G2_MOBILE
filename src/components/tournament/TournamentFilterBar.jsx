import { Pressable, ScrollView, Text, View } from "react-native";

import SearchField from "../SearchField";
import { TOURNAMENT_STATUS_FILTERS } from "../../constants/tournament";

/**
 * Bộ lọc đầu màn danh sách giải: chip trạng thái + ô tìm kiếm.
 *
 * Web xếp 5 chip trên một hàng ngang rồi đẩy ô tìm kiếm sang phải. Màn điện
 * thoại không đủ bề ngang cho cả hai, nên chip cuộn ngang ở hàng trên và ô tìm
 * kiếm xuống hàng dưới — thứ tự đọc vẫn là lọc trước, tìm sau như web.
 *
 * Chip cao 36 nhưng vùng chạm được kéo lên 44 bằng `hitSlop`, đủ chuẩn tiếp cận
 * mà hàng chip không bị dày ra.
 */
export default function TournamentFilterBar({
  status,
  onChangeStatus,
  searchInput,
  onChangeSearchInput,
  onSubmitSearch,
}) {
  return (
    <View className="gap-3 border-b border-line bg-surface pb-4 pt-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {TOURNAMENT_STATUS_FILTERS.map((filter) => {
          const active = filter.value === status;

          return (
            <Pressable
              key={filter.value || "all"}
              onPress={() => onChangeStatus(filter.value)}
              hitSlop={{ top: 4, bottom: 4 }}
              className={`h-9 items-center justify-center rounded-full px-4 ${
                active
                  ? "bg-navy-900"
                  : "border border-line-strong bg-surface active:bg-sunken"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-content-2"
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="px-4">
        <SearchField
          value={searchInput}
          onChangeText={onChangeSearchInput}
          onSubmit={onSubmitSearch}
          placeholder="Tìm giải đấu..."
        />
      </View>
    </View>
  );
}
