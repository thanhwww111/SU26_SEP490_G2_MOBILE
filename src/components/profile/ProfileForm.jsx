import { Text, View } from "react-native";

import Input from "../Input";
import Button from "../Button";
import OptionPicker from "../OptionPicker";
import SectionCard from "../tournament/SectionCard";
import {
  BILLIARD_RANK_OPTIONS,
  GENDER_OPTIONS,
} from "../../constants/profile";

/**
 * Form thông tin hồ sơ, bám ProfileForm.jsx của web.
 *
 * Web xếp các trường thành lưới hai cột; mobile đổ thành một cột, thứ tự trường
 * giữ nguyên. Hai thẻ `<select>` của web đổi thành `OptionPicker` — React Native
 * không có select gốc.
 *
 * `touched` cố ý luôn là true: khác các màn auth (mở ra là ô trống), ở đây dữ
 * liệu đã có sẵn và lỗi chỉ xuất hiện sau khi người dùng bấm lưu, nên hiện ngay
 * là đúng chứ không phải "đỏ lòm khi chưa gõ gì".
 */
export default function ProfileForm({
  form,
  errors,
  email,
  mode = "edit",
  isPlayer = true,
  saving = false,
  uploading = false,
  onChange,
  onSubmit,
}) {
  const isCreate = mode === "create";
  const setField = (name) => (value) => onChange({ [name]: value });

  return (
    <View className="gap-4">
      <SectionCard title={isCreate ? "Tạo hồ sơ" : "Thông tin hồ sơ"}>
        <View className="gap-4">
          <View>
            <Text className="mb-1 text-xs text-muted">Email</Text>
            {/* Bo góc `rounded` cho khớp ô nhập thật ngay dưới, không phải rounded-lg */}
            <View className="h-10 justify-center rounded border border-line bg-sunken px-3">
              <Text numberOfLines={1} className="text-sm text-muted">
                {email || "—"}
              </Text>
            </View>
            <Text className="mt-1 text-xs text-faint">Không thể thay đổi</Text>
          </View>

          <Input
            label="Họ và tên *"
            value={form.fullName}
            onChangeText={setField("fullName")}
            placeholder="Nguyễn Văn A"
            error={errors.fullName}
            touched
            editable={!saving}
          />

          <Input
            label="Tên hiển thị"
            value={form.displayName}
            onChangeText={setField("displayName")}
            placeholder="Tên trên giải đấu"
            editable={!saving}
          />

          {/* Số điện thoại chỉ sửa được ở chế độ edit — lúc tạo hồ sơ backend
              lấy số đã khai khi đăng ký tài khoản */}
          {!isCreate ? (
            <View>
              <Input
                label="Số điện thoại"
                value={form.phone}
                onChangeText={setField("phone")}
                placeholder="0912345678"
                error={errors.phone}
                touched
                keyboardType="phone-pad"
                editable={!saving}
              />
              {!errors.phone ? (
                <Text className="mt-1 text-xs text-faint">
                  03/05/07/08/09 + 8 số
                </Text>
              ) : null}
            </View>
          ) : null}

          <View>
            <Input
              label="Ngày sinh"
              value={form.dateOfBirth}
              onChangeText={setField("dateOfBirth")}
              placeholder="dd/mm/yyyy"
              error={errors.dateOfBirth}
              touched
              keyboardType="numbers-and-punctuation"
              editable={!saving}
            />
            {!errors.dateOfBirth ? (
              <Text className="mt-1 text-xs text-faint">
                Ví dụ: 15/05/1998
              </Text>
            ) : null}
          </View>

          <OptionPicker
            label="Giới tính"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={setField("gender")}
            disabled={saving}
          />

          {isPlayer ? (
            <OptionPicker
              label="Hạng cơ thủ"
              options={BILLIARD_RANK_OPTIONS}
              value={form.billiardRank}
              onChange={setField("billiardRank")}
              disabled={saving}
            />
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Giới thiệu">
        <Text className="mb-3 text-sm text-muted">
          Mô tả ngắn về bản thân, kinh nghiệm chơi bi-a hoặc thành tích của bạn.
        </Text>

        <Input
          value={form.bio}
          onChangeText={setField("bio")}
          placeholder="Mô tả ngắn về bản thân..."
          editable={!saving}
          multiline
        />
      </SectionCard>

      <Button
        title={isCreate ? "Ghi lại hồ sơ" : "Lưu hồ sơ"}
        loadingTitle="Đang lưu..."
        loading={saving}
        disabled={uploading}
        onPress={onSubmit}
      />
    </View>
  );
}
