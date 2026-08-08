import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import Input from "../Input";
import DateField from "../DateField";
import OptionPicker from "../OptionPicker";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Form đăng ký giải, dựng theo cấu hình Owner đặt cho từng giải.
 *
 * Bám `RegistrationDynamicForm.jsx` của web: cùng tập `uiComponent`, cùng quy tắc mọi giá trị
 * gửi lên đều là chuỗi. Khác ở hai chỗ do nền tảng:
 *
 * - `SELECT`/`RADIO` thành hàng chip bấm được (`OptionPicker`) chứ không phải thẻ select —
 *   trên điện thoại select bung ra một bánh xe che nửa màn, mà số lựa chọn ở đây thường ít.
 * - `DATE_PICKER` thành `DateField` — gọi bộ chọn ngày của hệ điều hành. Giá trị vẫn giữ dạng
 *   dd/mm/yyyy trong form rồi đổi sang ISO trước khi gửi, đúng như trước.
 */

/** Ngày kiểu Việt "15/05/1998" → "1998-05-15" cho backend. Không parse được thì trả nguyên. */
export const dateFieldToIso = (value) => {
  if (!value) return "";
  const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const CheckboxField = ({ label, checked, disabled, onToggle }) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => !disabled && onToggle(!checked)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      className="flex-row items-center gap-2.5 py-1.5 active:opacity-70"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          checked ? "border-navy-700 bg-navy-700" : "border-line-strong bg-surface"
        }`}
      >
        {checked ? <Check size={14} color="#FFFFFF" /> : null}
      </View>
      <Text className="text-sm text-content">{label || (checked ? "Có" : "Không")}</Text>
    </Pressable>
  );
};

export default function RegistrationDynamicForm({
  fields,
  values,
  errors = {},
  touched = {},
  disabled = false,
  onChange,
}) {
  const colors = useThemeColors();

  if (!fields?.length) {
    return (
      <Text className="text-sm text-muted">Form đăng ký chưa được cấu hình.</Text>
    );
  }

  const setValue = (fieldKey, value) => onChange({ ...values, [fieldKey]: value });

  const renderField = (field) => {
    const key = field.fieldKey;
    const value = values[key] ?? field.defaultValue ?? "";
    const ui = field.uiComponent;
    const error = errors[key];
    const isTouched = touched[key];

    if (ui === "CHECKBOX") {
      return (
        <View key={key}>
          <Text className="mb-1 text-xs text-muted">
            {field.label}
            {field.isRequired ? <Text className="text-accent"> *</Text> : null}
          </Text>
          <CheckboxField
            checked={String(value) === "true"}
            disabled={disabled}
            onToggle={(next) => setValue(key, next ? "true" : "false")}
          />
          {field.description ? (
            <Text className="mt-0.5 text-xs text-faint">{field.description}</Text>
          ) : null}
          {isTouched && error ? (
            <Text className="mt-1 text-xs text-danger">{error}</Text>
          ) : null}
        </View>
      );
    }

    if (ui === "DATE_PICKER") {
      return (
        <View key={key}>
          <DateField
            label={`${field.label}${field.isRequired ? " *" : ""}`}
            value={String(value)}
            onChange={(next) => setValue(key, next)}
            placeholder={field.placeholder || "Chọn ngày"}
            error={error}
            touched={isTouched}
            disabled={disabled}
            // Trường ngày ở đây không chỉ là ngày sinh: Owner có thể hỏi ngày
            // dự kiến có mặt, nên không chặn tương lai như hồ sơ
            maxToday={false}
          />
          {field.description ? (
            <Text className="mt-0.5 text-xs text-faint">{field.description}</Text>
          ) : null}
        </View>
      );
    }

    if ((ui === "SELECT" || ui === "RADIO") && field.enumOptions?.length) {
      return (
        <View key={key}>
          <OptionPicker
            label={`${field.label}${field.isRequired ? " *" : ""}`}
            options={field.enumOptions.map((opt) => ({ value: opt, label: opt }))}
            value={String(value)}
            disabled={disabled}
            onChange={(next) => setValue(key, next)}
          />
          {field.description ? (
            <Text className="mt-1 text-xs text-faint">{field.description}</Text>
          ) : null}
          {isTouched && error ? (
            <Text className="mt-1 text-xs text-danger">{error}</Text>
          ) : null}
        </View>
      );
    }

    // Bàn phím đổi theo kiểu dữ liệu — gõ số điện thoại bằng bàn phím chữ là cực hình
    const keyboardType =
      ui === "NUMBER"
        ? "numeric"
        : ui === "PHONE_INPUT"
          ? "phone-pad"
          : ui === "EMAIL_INPUT"
            ? "email-address"
            : "default";

    const placeholder =
      field.placeholder ||
      (ui === "EMAIL_INPUT"
        ? "email@example.com"
        : ui === "PHONE_INPUT"
          ? "09xxxxxxxx"
          : "");

    return (
      <View key={key}>
        <Input
          label={`${field.label}${field.isRequired ? " *" : ""}`}
          value={String(value)}
          onChangeText={(next) => setValue(key, next)}
          placeholder={placeholder}
          error={error}
          touched={isTouched}
          multiline={ui === "TEXTAREA"}
          keyboardType={keyboardType}
          autoCapitalize={ui === "EMAIL_INPUT" ? "none" : "sentences"}
          editable={!disabled}
        />
        {field.description ? (
          <Text className="mt-0.5 text-xs text-faint">{field.description}</Text>
        ) : null}
      </View>
    );
  };

  // Owner sắp thứ tự trường bằng sortOrder; không tôn trọng thì form hiện lộn xộn so với web
  const ordered = [...fields].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  return <View className="gap-4">{ordered.map(renderField)}</View>;
}
