import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, CreditCard, UserCheck, XCircle } from "lucide-react-native";

import Button from "../Button";
import Input from "../Input";
import AppFooter from "../layout/AppFooter";
import SectionState from "../home/SectionState";
import RegistrationDynamicForm, { dateFieldToIso } from "./RegistrationDynamicForm";
import RegistrationStatusBadge from "./RegistrationStatusBadge";
import * as registrationApi from "../../api/playerRegistrationApi";
import { getProfile } from "../../api/profileApi";
import { usePayOsCheckout } from "../../hooks/usePayOsCheckout";
import { useAuthStore } from "../../store/authStore";
import { fmtCurrency } from "../../utils/format";
import { iconSize } from "../../theme/tokens";
import { useThemeColors } from "../../theme/useThemeColors";

/**
 * Những trường lấy được từ hồ sơ người đang đăng nhập.
 *
 * Khớp bằng `fieldKey` CHÍNH XÁC, không suy từ `uiComponent`. Template giải đôi
 * có `player2_phone` cũng là `PHONE_INPUT`; đoán theo kiểu ô thì số của người
 * đăng ký chui thẳng vào ô của đồng đội.
 *
 * Hai key này do `DataInitializer` bên backend đặt cho hai template có sẵn.
 * Owner tự dựng template với key khác thì không tự điền — thà để trống còn hơn
 * điền nhầm chỗ.
 *
 * Họ tên chỉ có ở hồ sơ (`GET /profile`); `GET /auth/me` không trả trường đó,
 * nên tài khoản chưa tạo hồ sơ thì chỉ điền được số điện thoại.
 */
const PREFILL_FROM_PROFILE = {
  /* `displayName` là đường lùi: hồ sơ tạo qua màn chơi có thể chỉ có tên hiển
     thị mà bỏ trống họ tên đầy đủ. Điền tên hiển thị vẫn hơn để trống, vì dù
     sao người dùng cũng sửa được. */
  player_full_name: (profile) => profile?.fullName || profile?.displayName || "",
  player_phone: (profile, user) => profile?.phone || user?.phone || "",
};

/** Giá trị điền sẵn cho các trường của giải, bỏ qua trường không có dữ liệu */
const buildPrefill = (fields, profile, user) => {
  const prefill = {};

  (fields || []).forEach((field) => {
    const source = PREFILL_FROM_PROFILE[field.fieldKey];
    if (!source) return;

    const value = source(profile, user);
    if (value) prefill[field.fieldKey] = String(value);
  });

  return prefill;
};

/**
 * Đăng ký một giải đấu, bám trang `/player/tournaments/:id/register` của web.
 *
 * Luồng giống web ở phần nghiệp vụ: tải form động → điền → nộp → nếu có phí thì thanh toán.
 * Khác web ở khâu quay về sau thanh toán, và đây là chỗ đáng đọc kỹ:
 *
 * Web chuyển hẳn tab sang PayOS rồi PayOS đưa người dùng về một URL cấu hình sẵn trên server.
 * Mobile không dùng được đường đó — `PayOSServiceImpl` đọc `returnUrl` từ cấu hình chứ không
 * nhận từ client, nên PayOS luôn trả về web chứ không về `btms://`.
 *
 * Thay vào đó: mở PayOS bằng trình duyệt trong app, chờ người dùng đóng, rồi nhờ backend hỏi
 * thẳng PayOS xem đơn đã trả tiền chưa. Không tin lời client, không phải sửa backend, và vẫn
 * đúng kể cả khi người dùng bỏ ngang giữa chừng.
 *
 * Toàn bộ khâu đó nằm trong `usePayOsCheckout` — dùng chung với màn chi tiết đăng ký, và có
 * thêm phần đối chiếu lại khi app quay về tiền cảnh. Đọc hook đó để hiểu vì sao cần vậy.
 */
export default function TournamentRegisterView({ tournamentId, onDone, onBack }) {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState("");
  /** Có điền hộ được ô nào không — quyết định việc hiện dòng nhắc phía trên form */
  const [prefilled, setPrefilled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  /** idle | submitting | paying | done */
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);

  const alive = useRef(true);
  /* Điền hộ đúng MỘT lần cho cả vòng đời màn. `useFocusEffect` gọi lại `load`
     mỗi lần quay lại màn; điền lại ở đó sẽ xoá sạch những gì người dùng vừa gõ,
     kể cả khi họ cố ý sửa tên để đăng ký cho người khác. */
  const prefilledOnce = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      // Hỏi song song: đã đăng ký rồi thì khỏi cần dựng form
      const [existing, preview, profile] = await Promise.all([
        registrationApi.getMyRegistrationForTournament(tournamentId),
        registrationApi.getTournamentRegistrationForm(tournamentId),
        // Hồ sơ chỉ dùng để điền hộ. Tài khoản chưa tạo hồ sơ thì backend trả
        // 404 — nuốt lỗi tại đây, vì không có nó form vẫn phải mở được bình thường
        getProfile().catch(() => null),
      ]);
      if (!alive.current) return;

      if (existing) {
        setResult(existing);
        setPhase("done");
      }
      setForm(preview);

      if (!prefilledOnce.current) {
        prefilledOnce.current = true;

        const prefill = buildPrefill(preview?.fields, profile, user);
        if (Object.keys(prefill).length > 0) {
          setValues(prefill);
          setPrefilled(true);
        }
      }
    } catch (e) {
      if (alive.current) setLoadError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [tournamentId, user]);

  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      load();
      return () => {
        alive.current = false;
      };
    }, [load])
  );

  const entryFee = form?.entryFee != null ? Number(form.entryFee) : 0;
  const hasFee = entryFee > 0;

  /** Chỉ kiểm tra trường bắt buộc — mọi luật còn lại để backend quyết, tránh hai bên lệch nhau */
  const validate = () => {
    const nextErrors = {};
    (form?.fields || []).forEach((field) => {
      if (!field.isRequired) return;
      const raw = values[field.fieldKey] ?? field.defaultValue ?? "";
      if (String(raw).trim() === "") {
        nextErrors[field.fieldKey] = `${field.label} là bắt buộc`;
      }
    });
    setErrors(nextErrors);
    setTouched(
      Object.fromEntries((form?.fields || []).map((f) => [f.fieldKey, true]))
    );
    return Object.keys(nextErrors).length === 0;
  };

  const buildFieldValues = () =>
    (form?.fields || [])
      .map((field) => {
        const raw = values[field.fieldKey] ?? field.defaultValue ?? "";
        if (String(raw).trim() === "") return null;
        const value =
          field.uiComponent === "DATE_PICKER" ? dateFieldToIso(raw) : String(raw);
        return { fieldKey: field.fieldKey, value };
      })
      .filter(Boolean);

  /**
   * Đọc lại đăng ký của tôi sau khi đối chiếu xong với PayOS.
   *
   * Người dùng bỏ ngang cũng không sao: backend chỉ ghi nhận khi PayOS xác nhận đã thu tiền,
   * còn không thì đăng ký nằm nguyên ở chờ thanh toán và họ trả sau được từ màn "Đăng ký của
   * tôi".
   */
  const refreshResult = useCallback(async () => {
    try {
      const latest = await registrationApi.getMyRegistrationForTournament(tournamentId);
      if (alive.current && latest) setResult(latest);
    } catch {
      // Giữ nguyên kết quả đang hiện — đối chiếu đã xong, chỉ là chưa tải lại được
    }
  }, [tournamentId]);

  const { pay } = usePayOsCheckout({ onSettled: refreshResult });

  const handleSubmit = async () => {
    if (phase === "submitting" || phase === "paying") return;
    setSubmitError("");
    if (!validate()) return;

    const body = {
      registrationType: form?.participantType || "SINGLE",
      note: note.trim() || null,
      fieldValues: buildFieldValues(),
    };

    try {
      setPhase("submitting");
      const registration = await registrationApi.submitTournamentRegistration(
        tournamentId,
        body
      );

      if (!hasFee) {
        // Giải miễn phí: backend đã xét duyệt ngay trong lời gọi trên
        if (alive.current) {
          setResult(registration);
          setPhase("done");
        }
        return;
      }

      setPhase("paying");

      // Đặt kết quả trước khi mở PayOS: `pay` gọi `refreshResult` để ghi đè bằng bản mới
      // nhất, nhưng nếu request đó hỏng thì màn vẫn còn đăng ký vừa tạo để hiện
      if (alive.current) setResult(registration);

      await pay(registration.id);

      if (alive.current) setPhase("done");
    } catch (e) {
      if (!alive.current) return;
      setSubmitError(e.message);
      // Về idle để người dùng sửa rồi thử lại; đăng ký đã tạo (nếu có) vẫn nằm ở
      // "Đăng ký của tôi" và trả tiền sau được
      setPhase("idle");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (loadError) {
    return (
      <ScrollView className="flex-1 bg-canvas">
        <View className="px-4 pt-6">
          <SectionState error={loadError} />
          <Button title="Thử lại" onPress={load} />
        </View>
        <AppFooter />
      </ScrollView>
    );
  }

  /* ── Đã có kết quả: hiện trạng thái thay cho form ── */
  if (phase === "done" && result) {
    const status = result.status;
    const approved = status === "APPROVED";
    const rejected = status === "REJECTED";

    return (
      <ScrollView className="flex-1 bg-canvas">
        <View className="items-center px-4 pb-6 pt-10">
          {approved ? (
            <CheckCircle2 size={48} color={colors.success} />
          ) : rejected ? (
            <XCircle size={48} color={colors.danger} />
          ) : (
            <CreditCard size={48} color={colors.warning} />
          )}

          <Text className="mt-4 text-center text-xl font-bold text-content">
            {approved
              ? "Đăng ký thành công"
              : rejected
                ? "Đăng ký không được duyệt"
                : "Chờ thanh toán"}
          </Text>

          <View className="mt-3">
            <RegistrationStatusBadge status={status} />
          </View>

          <Text className="mt-3 text-center text-sm text-muted">
            {approved
              ? "Bạn đã có suất thi đấu chính thức ở giải này."
              : rejected
                ? result.rejectedReason ||
                  "Giải đã hết suất hoặc đã đóng đăng ký."
                : "Đăng ký của bạn đã được ghi nhận nhưng chưa nhận được thanh toán. Bạn có thể trả tiền sau ở mục Đăng ký của tôi."}
          </Text>

          <View className="mt-6 w-full gap-2">
            <Button title="Xem đăng ký của tôi" onPress={onDone} />
            <Button title="Quay lại giải đấu" variant="outline" onPress={onBack} />
          </View>
        </View>
        <AppFooter />
      </ScrollView>
    );
  }

  /* ── Form ── */
  const busy = phase === "submitting" || phase === "paying";

  return (
    <ScrollView className="flex-1 bg-canvas" keyboardShouldPersistTaps="handled">
      <View className="px-4 pb-6 pt-6">
        <Text className="text-2xl font-display uppercase text-content">
          Đăng ký tham dự
        </Text>
        <Text numberOfLines={2} className="mt-1 text-sm text-muted">
          {form?.tournamentName}
        </Text>

        <View className="mt-4 flex-row items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <Text className="text-sm text-muted">Phí tham dự</Text>
          {/* fmtCurrency tự trả "Miễn phí" khi bằng 0 — không cần rẽ nhánh ở đây */}
          <Text className="text-base font-bold text-content">
            {fmtCurrency(entryFee)}
          </Text>
        </View>

        {form?.isReady === false ? (
          <Text className="mt-4 text-sm text-danger">
            Ban tổ chức chưa hoàn tất cấu hình form đăng ký cho giải này.
          </Text>
        ) : null}

        {/* Nói rõ vì sao ô đã có sẵn chữ, và rằng sửa được. Không có dòng này
            thì người đăng ký hộ bạn mình sẽ tưởng form khoá cứng theo tài khoản */}
        {prefilled ? (
          <View className="mt-5 flex-row items-start gap-2.5 rounded-xl border border-line bg-sunken px-3.5 py-3">
            <UserCheck size={iconSize.sm} color={colors.muted} />
            <Text className="flex-1 text-xs leading-5 text-muted">
              Đã điền sẵn từ hồ sơ của bạn — sửa lại nếu bạn đăng ký cho người
              khác.
            </Text>
          </View>
        ) : null}

        <View className="mt-5">
          <RegistrationDynamicForm
            fields={form?.fields}
            values={values}
            errors={errors}
            touched={touched}
            disabled={busy}
            onChange={setValues}
          />
        </View>

        <View className="mt-4">
          <Input
            label="Ghi chú cho ban tổ chức"
            value={note}
            onChangeText={setNote}
            placeholder="Không bắt buộc"
            multiline
            editable={!busy}
          />
        </View>

        {submitError ? (
          <Text className="mt-3 text-sm text-danger">{submitError}</Text>
        ) : null}

        <View className="mt-5">
          <Button
            title={
              phase === "paying"
                ? "Đang chờ thanh toán..."
                : phase === "submitting"
                  ? "Đang gửi..."
                  : hasFee
                    ? `Thanh toán ${fmtCurrency(entryFee)}`
                    : "Gửi đăng ký"
            }
            onPress={handleSubmit}
            loading={busy}
            disabled={busy || form?.isReady === false}
          />
        </View>

        {hasFee ? (
          <Text className="mt-2 text-center text-xs text-faint">
            Bạn sẽ được chuyển sang cổng thanh toán PayOS. Đóng cổng thanh toán để quay lại app.
          </Text>
        ) : null}
      </View>

      <AppFooter />
    </ScrollView>
  );
}
