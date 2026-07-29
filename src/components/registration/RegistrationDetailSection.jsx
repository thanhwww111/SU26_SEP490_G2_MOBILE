import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import RegistrationStatusBadge from "./RegistrationStatusBadge";
import SectionState from "../home/SectionState";
import AppFooter from "../layout/AppFooter";
import Button from "../Button";
import ConfirmSheet from "../ConfirmSheet";
import FormError from "../auth/FormError";
import * as registrationApi from "../../api/playerRegistrationApi";
import { canCancelRegistration } from "../../constants/registration";
import { fmtDateTime } from "../../utils/date";

/** Một dòng "nhãn — giá trị"; giá trị dài thì xuống dòng chứ không bị cắt */
function InfoRow({ label, value }) {
  return (
    <View className="flex-row items-start justify-between gap-4 border-b border-slate-100 py-2.5">
      <Text className="text-sm text-slate-500">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-slate-900">
        {value || "—"}
      </Text>
    </View>
  );
}

function SectionTitle({ children }) {
  return (
    <Text className="mb-1 text-overline font-semibold uppercase text-slate-400">
      {children}
    </Text>
  );
}

/**
 * Chi tiết một đăng ký giải.
 *
 * Web hiện phần này trong modal giữa màn; trên mobile nó là màn riêng vì
 * `fieldValues` do admin cấu hình nên số dòng không đoán trước được — một modal
 * cao bằng màn hình thì chẳng khác gì màn riêng, mà lại mất nút quay lại.
 *
 * Không có nút "Xem giải đấu" như web: route chi tiết giải trên mobile chưa
 * dựng, thêm nút bấm vào không đi đâu còn tệ hơn là chưa có nút.
 */
export default function RegistrationDetailSection({ registrationId, onCancelled }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const data = await registrationApi.getMyRegistrationDetail(registrationId);
        if (alive) setDetail(data);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // Người dùng có thể bấm quay lại trước khi request xong
    return () => {
      alive = false;
    };
  }, [registrationId]);

  const handleConfirmCancel = useCallback(async () => {
    setCancelling(true);
    setCancelError("");

    try {
      await registrationApi.cancelMyRegistration(registrationId);
      setConfirmOpen(false);
      onCancelled?.();
    } catch (e) {
      // Lỗi hiện ngay trong màn, không đóng sheet — project chưa có toast
      setCancelError(e.message);
      setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  }, [registrationId, onCancelled]);

  if (loading || error || !detail) {
    return (
      <View className="flex-1 bg-slate-50 px-4">
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Không tìm thấy đăng ký này."
        />
      </View>
    );
  }

  const createdAt = fmtDateTime(detail.createdAt);
  const fieldValues = detail.fieldValues || [];

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="gap-5 px-4 pb-8 pt-6">
          {/* Khối đầu: giải nào, đang ở trạng thái gì */}
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text numberOfLines={3} className="mb-2.5 text-base font-bold leading-snug text-slate-900">
              {detail.tournamentName}
            </Text>
            <RegistrationStatusBadge status={detail.status} />

            {detail.status === "APPROVED" ? (
              <Text className="mt-2.5 text-xs font-semibold text-emerald-600">
                ✓ Đã xác nhận tham dự — Chờ giải đấu bắt đầu
              </Text>
            ) : null}
            {detail.status === "REJECTED" ? (
              <Text className="mt-2.5 text-xs font-semibold text-red-600">
                ✗ Không được tham dự
              </Text>
            ) : null}
          </View>

          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <SectionTitle>Thông tin đăng ký</SectionTitle>
            <InfoRow label="Người đăng ký" value={detail.playerFullName} />
            <InfoRow label="Số điện thoại" value={detail.playerPhone} />
            <InfoRow label="Ngày đăng ký" value={createdAt} />
            {detail.note ? <InfoRow label="Ghi chú" value={detail.note} /> : null}
          </View>

          {fieldValues.length > 0 ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionTitle>Thông tin đã điền</SectionTitle>
              {fieldValues.map((fv) => (
                <InfoRow key={fv.fieldKey} label={fv.label || fv.fieldKey} value={fv.value} />
              ))}
            </View>
          ) : null}

          {/* className rỗng: khoảng cách đã do `gap-5` của khối cha lo */}
          <FormError message={cancelError} className="" />

          {canCancelRegistration(detail.status) ? (
            <Button
              title="Hủy đăng ký"
              variant="danger"
              onPress={() => {
                setCancelError("");
                setConfirmOpen(true);
              }}
            />
          ) : null}
        </View>

        <AppFooter />
      </ScrollView>

      <ConfirmSheet
        visible={confirmOpen}
        title="Xác nhận hủy đăng ký"
        message="Hủy đăng ký này? Bạn sẽ phải đăng ký lại từ đầu nếu đổi ý."
        confirmText="Hủy đăng ký"
        cancelText="Giữ đăng ký"
        confirmVariant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}
