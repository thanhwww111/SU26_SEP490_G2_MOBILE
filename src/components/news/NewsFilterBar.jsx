import { Pressable, ScrollView, Text, View } from "react-native";

import SearchField from "../SearchField";

/**
 * Bộ lọc đầu màn tin tức: chip chuyên mục + ô tìm kiếm.
 *
 * Cùng bố cục với `TournamentFilterBar` — chip cuộn ngang hàng trên, ô tìm kiếm
 * hàng dưới. Không gộp chung một component vì nguồn chip khác nhau: bên giải đấu
 * là danh sách trạng thái cố định, còn ở đây là chuyên mục tải từ API và có thể
 * rỗng (khi đó chỉ hiện mỗi ô tìm kiếm, không để lại hàng trống).
 */
export default function NewsFilterBar({
  categories,
  categoryId,
  onChangeCategory,
  searchInput,
  onChangeSearchInput,
  onSubmitSearch,
}) {
  const chips = [{ id: "", name: "Tất cả" }, ...categories];
  const showChips = categories.length > 0;

  return (
    <View className="gap-3 border-b border-line bg-surface pb-4 pt-4">
      {showChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4"
        >
          {chips.map((chip) => {
            const value = String(chip.id ?? "");
            const active = value === String(categoryId ?? "");

            return (
              <Pressable
                key={value || "all"}
                onPress={() => onChangeCategory(value)}
                hitSlop={{ top: 4, bottom: 4 }}
                className={`h-9 items-center justify-center rounded-full px-4 ${
                  active
                    ? "bg-navy-900"
                    : "border border-line-strong bg-surface active:bg-sunken"
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-sm font-semibold ${
                    active ? "text-white" : "text-content-2"
                  }`}
                >
                  {chip.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View className="px-4">
        <SearchField
          value={searchInput}
          onChangeText={onChangeSearchInput}
          onSubmit={onSubmitSearch}
          placeholder="Tìm bài viết..."
        />
      </View>
    </View>
  );
}
