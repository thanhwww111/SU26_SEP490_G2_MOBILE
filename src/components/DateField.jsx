import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";

import Button from "./Button";
import { dateInputToIso, isoToDateInput } from "../utils/date";
import { iconSize } from "../theme/tokens";
import { useThemeColors } from "../theme/useThemeColors";

/**
 * Ô chọn ngày, thay cho ô gõ tay dd/mm/yyyy.
 *
 * Web dùng `<input type="date">` — trình duyệt tự dựng lịch. React Native không
 * có thứ tương đương nên đây là `@react-native-community/datetimepicker`, gọi
 * đúng bộ chọn ngày của hệ điều hành.
 *
 * **Giá trị vào và ra vẫn là chuỗi `dd/mm/yyyy`**, không phải `Date`. Cố ý giữ
 * nguyên định dạng cũ để `profileFormUtils` và `dateFieldToIso` không phải sửa
 * gì — chúng đã có sẵn phần đổi qua lại với ISO của backend và đã được test.
 *
 * Hai nền tảng hành xử khác hẳn nhau, nên phải tách nhánh:
 * - Android: bộ chọn là hộp thoại của hệ thống, tự đóng khi chọn xong hoặc khi
 *   người dùng huỷ.
 * - iOS: bộ chọn là một view nằm ngay trong màn, không tự đóng — phải tự dựng
 *   khung và nút "Xong" cho nó.
 */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = "Chọn ngày",
  error,
  touched = false,
  disabled = false,
  className = "",
  /** Chặn ngày tương lai — ngày sinh thì luôn cần, nên bật sẵn */
  maxToday = true,
}) {
  const colors = useThemeColors();

  const [open, setOpen] = useState(false);
  // Bản nháp của iOS: người dùng xoay bánh xe nhiều lần rồi mới bấm Xong
  const [draft, setDraft] = useState(null);

  const showError = Boolean(touched && error);

  /** "15/05/1998" → Date. Không đọc được thì mở lịch ở ngày hôm nay. */
  const toDate = (text) => {
    const iso = dateInputToIso(text);
    if (!iso) return new Date();
    // Tách tay thay vì new Date(iso): chuỗi ISO thuần ngày bị hiểu là UTC rồi
    // quy về giờ địa phương, lệch mất một ngày ở các múi giờ âm
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const toText = (date) =>
    isoToDateInput(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`
    );

  const handleOpen = () => {
    if (disabled) return;
    setDraft(toDate(value));
    setOpen(true);
  };

  const handleAndroidChange = (event, selected) => {
    setOpen(false);
    if (event.type === "set" && selected) onChange(toText(selected));
  };

  return (
    <View className={className}>
      {label ? <Text className="mb-1 text-xs text-muted">{label}</Text> : null}

      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || placeholder }}
        className={`h-10 flex-row items-center justify-between rounded border px-3 ${
          showError
            ? "border-red-400 bg-tint-danger"
            : "border-line-strong bg-canvas"
        } ${disabled ? "opacity-60" : "active:bg-sunken"}`}
      >
        <Text className={`text-sm ${value ? "text-content" : "text-faint"}`}>
          {value || placeholder}
        </Text>
        <Calendar size={iconSize.sm} color={colors.muted} />
      </Pressable>

      {showError ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draft ?? new Date()}
          mode="date"
          display="default"
          maximumDate={maxToday ? new Date() : undefined}
          onChange={handleAndroidChange}
        />
      ) : null}

      {open && Platform.OS !== "android" ? (
        <View className="mt-2 rounded-xl border border-line bg-surface p-2">
          <DateTimePicker
            value={draft ?? new Date()}
            mode="date"
            display="spinner"
            maximumDate={maxToday ? new Date() : undefined}
            onChange={(_, selected) => selected && setDraft(selected)}
            textColor={colors.content}
          />

          <View className="flex-row gap-2 px-2 pb-1">
            <View className="flex-1">
              <Button
                title="Bỏ qua"
                variant="outline"
                onPress={() => setOpen(false)}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Xong"
                onPress={() => {
                  if (draft) onChange(toText(draft));
                  setOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
