import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Trophy,
  XCircle,
} from "lucide-react-native";

import SectionCard from "../SectionCard";
import * as playerRegistrationApi from "../../../api/playerRegistrationApi";
import { ROLES } from "../../../constants/auth";
import { REGISTRATION_STATUS_LABELS } from "../../../constants/registration";
import { participantTypeLabel } from "../../../constants/tournament";
import { fmtCurrency } from "../../../utils/format";
import { fmtDateTime } from "../../../utils/date";
import { useAuthStore } from "../../../store/authStore";
import { iconSize } from "../../../theme/tokens";
import { useThemeColors } from "../../../theme/useThemeColors";

const SEEDING_LABELS = {
  RANDOM: "Ngẫu nhiên",
  ELO: "Theo ELO",
  MANUAL: "Thủ công",
};

const BREAK_RULE_LABELS = {
  ALTERNATE_BREAK: "Luân phiên",
  WINNER_BREAK: "Người thắng",
  LOSER_BREAK: "Người thua",
};

/** Giải đã đóng đăng ký hoặc đã chạy thì không còn ý nghĩa hiển thị thanh slot */
const isClosedOrEnded = (status) =>
  ["REGISTRATION_CLOSED", "DRAW_DONE", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(
    status
  );

/** Thanh tiến độ số người đã đăng ký */
const SlotBar = ({ approved, max }) => {
  const remaining = Math.max(0, max - approved);
  const percent = max > 0 ? Math.min(100, Math.round((approved / max) * 100)) : 0;
  const full = remaining === 0;

  // Ba mức cảnh báo giống web: hết chỗ, sắp hết (≤3), còn thoải mái
  const barColor = full ? "bg-danger" : remaining <= 3 ? "bg-warning" : "bg-success";
  const textColor = full
    ? "text-danger"
    : remaining <= 3
      ? "text-warning"
      : "text-success";

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted">Đã đăng ký</Text>
        <Text className={`text-sm font-semibold ${textColor}`}>
          {full ? "Đã đủ người" : `Còn ${remaining} slot`}
        </Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-sunken">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </View>

      <Text className="text-xs text-faint">
        {approved} / {max} người
      </Text>
    </View>
  );
};

/** Ô thông tin nhỏ trong lưới hai cột */
const StatBox = ({ Icon, label, value }) => {
  const colors = useThemeColors();

  return (
    <View className="flex-1 rounded-lg border border-line bg-canvas p-3">
      <View className="mb-1 flex-row items-center gap-1.5">
        <Icon size={12} color={colors.faint} />
        <Text className="text-overline font-bold uppercase text-faint">{label}</Text>
      </View>
      <Text numberOfLines={2} className="text-sm font-bold text-content">
        {value}
      </Text>
    </View>
  );
};

/** Một mốc thời gian trong khối "Thời gian" */
const TimeRow = ({ Icon, label, value }) => {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-start gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-sunken">
        <Icon size={14} color={colors.brand} />
      </View>
      <View className="flex-1">
        <Text className="text-overline font-bold uppercase text-faint">{label}</Text>
        <Text className="mt-0.5 text-sm font-semibold text-content">{value || "—"}</Text>
      </View>
    </View>
  );
};

/**
 * Khối kêu gọi đăng ký ở đầu tab, bám banner CTA của web.
 *
 * Bốn tình huống như web: đã đăng ký, đang mở, hết chỗ, và đóng/chưa mở.
 */
const RegistrationBanner = ({
  tournament,
  myRegistration,
  isPlayer,
  onOpenMyRegistrations,
  onRegister,
}) => {
  const colors = useThemeColors();
  const approved = tournament.approvedCount ?? 0;
  const max = tournament.maxParticipants ?? 0;
  const remaining =
    tournament.remainingSlots ?? Math.max(0, max - approved);
  const full = max > 0 && remaining <= 0;
  const registered = Boolean(myRegistration);
  const canRegister =
    tournament.status === "OPEN_FOR_REGISTRATION" &&
    tournament.isRegister &&
    !full &&
    !registered &&
    isPlayer;

  if (registered) {
    return (
      <View className="gap-3 rounded-xl bg-navy-900 p-4">
        <View className="flex-row items-center gap-3">
          <CheckCircle2 size={iconSize.lg} color={colors.success} />
          <View className="flex-1">
            <Text className="text-base font-bold uppercase text-white">
              Bạn đã đăng ký giải này
            </Text>
            <Text className="mt-0.5 text-sm text-navy-500">
              Trạng thái:{" "}
              <Text className="font-semibold text-white">
                {REGISTRATION_STATUS_LABELS[myRegistration.status] ||
                  myRegistration.status}
              </Text>
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onOpenMyRegistrations}
          className="h-11 items-center justify-center rounded-full border border-white/40 active:bg-white/10"
        >
          <Text className="text-sm font-semibold text-white">
            {myRegistration.status === "PENDING_PAYMENT"
              ? "Tới phần thanh toán"
              : "Xem đăng ký của tôi"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (canRegister) {
    return (
      <View className="gap-2 rounded-xl bg-navy-900 p-4">
        <Text className="text-overline font-bold uppercase text-navy-500">
          Phí tham dự
        </Text>
        <Text className="text-3xl font-black text-white">
          {fmtCurrency(tournament.entryFee)}
        </Text>

        {remaining > 0 && remaining <= 5 ? (
          <Text className="text-sm font-bold text-warning">
            Chỉ còn {remaining} slot
          </Text>
        ) : null}

        <Pressable
          onPress={onRegister}
          className="mt-2 h-11 items-center justify-center rounded-full bg-accent active:bg-accent-pressed"
        >
          <Text className="text-sm font-bold uppercase text-white">
            Đăng ký tham dự
          </Text>
        </Pressable>
      </View>
    );
  }

  if (full && !isClosedOrEnded(tournament.status)) {
    return (
      <View className="flex-row items-center gap-3 rounded-xl bg-navy-900 p-4">
        <XCircle size={iconSize.lg} color={colors.danger} />
        <View className="flex-1">
          <Text className="text-base font-bold text-white">
            Đã đủ {max} người tham gia
          </Text>
          <Text className="mt-0.5 text-sm text-navy-500">Không còn slot trống.</Text>
        </View>
      </View>
    );
  }

  const closedTitle =
    tournament.status === "REGISTRATION_CLOSED" || tournament.status === "DRAW_DONE"
      ? "Đã đóng đăng ký"
      : tournament.status === "IN_PROGRESS"
        ? "Giải đấu đang diễn ra"
        : tournament.status === "COMPLETED"
          ? "Giải đấu đã kết thúc"
          : tournament.status === "CANCELLED"
            ? "Giải đấu đã hủy"
            : "Chưa mở đăng ký";

  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-navy-900 p-4">
      {tournament.status === "IN_PROGRESS" ? (
        <Info size={iconSize.lg} color={colors.textInverseMuted} />
      ) : (
        <Clock size={iconSize.lg} color={colors.textInverseMuted} />
      )}
      <View className="flex-1">
        <Text className="text-base font-bold text-white">{closedTitle}</Text>
        <Text className="mt-0.5 text-sm text-navy-500">
          {tournament.isRegister
            ? "Đã đóng nhận đăng ký online"
            : "Giải đấu không nhận đăng ký online"}
        </Text>
      </View>
    </View>
  );
};

/**
 * Tab Thông tin của màn chi tiết giải.
 *
 * Dữ liệu giải đã có sẵn từ component cha nên tab này chỉ gọi thêm một request:
 * đăng ký của tôi cho giải này, và chỉ khi người đang đăng nhập là PLAYER.
 * Lỗi của request đó cố ý nuốt — không biết mình đã đăng ký hay chưa thì phần
 * còn lại của tab vẫn phải đọc được.
 */
export default function InfoTab({ tournament, onOpenMyRegistrations, onRegister }) {
  const user = useAuthStore((s) => s.user);
  const isPlayer = user?.role === ROLES.PLAYER;

  const [myRegistration, setMyRegistration] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    if (isPlayer && tournament?.id) {
      playerRegistrationApi
        .getMyRegistrationForTournament(tournament.id)
        .then((reg) => {
          if (alive.current) setMyRegistration(reg);
        })
        .catch(() => {});
    }

    return () => {
      alive.current = false;
    };
  }, [isPlayer, tournament?.id]);

  const approved = tournament.approvedCount ?? 0;
  const max = tournament.maxParticipants ?? 0;
  const config = tournament.configSummary;

  const formatRows = [
    tournament.formatName && { label: "Thể thức", value: tournament.formatName },
    tournament.participantType && {
      label: "Hình thức",
      value: participantTypeLabel(tournament.participantType),
    },
    config?.seedingMethod && {
      label: "Bốc thăm",
      value: SEEDING_LABELS[config.seedingMethod] || config.seedingMethod,
    },
    config?.bracketSize != null && {
      label: "Bracket",
      value: `${config.bracketSize} slot`,
    },
    config?.finalRaceTo != null && {
      label: "Chung kết",
      value: `Race to ${config.finalRaceTo}`,
    },
    config?.breakRule && {
      label: "Luật break",
      value: BREAK_RULE_LABELS[config.breakRule] || config.breakRule,
    },
    config?.thirdPlaceMatch != null && {
      label: "Tranh hạng 3",
      value: config.thirdPlaceMatch ? "Có" : "Không",
    },
  ].filter(Boolean);

  return (
    <View className="gap-4">
      <RegistrationBanner
        tournament={tournament}
        myRegistration={myRegistration}
        isPlayer={isPlayer}
        onOpenMyRegistrations={onOpenMyRegistrations}
        onRegister={onRegister}
      />

      <SectionCard title="Thời gian">
        <View className="gap-3.5">
          <TimeRow
            Icon={Clock}
            label="Hạn đăng ký"
            value={fmtDateTime(tournament.registrationDeadline)}
          />
          <TimeRow
            Icon={Calendar}
            label="Bắt đầu"
            value={fmtDateTime(tournament.startAt)}
          />
          <TimeRow
            Icon={Calendar}
            label="Kết thúc"
            value={fmtDateTime(tournament.endAt)}
          />
        </View>
      </SectionCard>

      <SectionCard title="Người tham dự">
        {!isClosedOrEnded(tournament.status) && max > 0 ? (
          <View className="mb-4">
            <SlotBar approved={approved} max={max} />
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <StatBox
            Icon={CreditCard}
            label="Phí tham dự"
            value={fmtCurrency(tournament.entryFee)}
          />
          <StatBox
            Icon={Trophy}
            label="Giải thưởng"
            value={fmtCurrency(tournament.prizePool)}
          />
        </View>

        {tournament.prizeDescription ? (
          <Text className="mt-3 border-t border-line-soft pt-3 text-sm leading-6 text-content-2">
            {tournament.prizeDescription}
          </Text>
        ) : null}
      </SectionCard>

      {formatRows.length > 0 ? (
        <SectionCard title="Thể thức thi đấu">
          <View className="gap-2">
            {formatRows.map((row) => (
              <View
                key={row.label}
                className="flex-row items-center justify-between border-b border-line-soft py-2"
              >
                <Text className="text-sm text-muted">{row.label}</Text>
                <Text
                  numberOfLines={1}
                  className="flex-1 text-right text-sm font-semibold text-content"
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {tournament.venueName || tournament.venue?.name ? (
        <SectionCard title="Địa điểm">
          <Text className="text-sm font-semibold text-content">
            {tournament.venueName || tournament.venue?.name}
          </Text>
          {tournament.venueAddress || tournament.venue?.address ? (
            <Text className="mt-1 text-sm leading-6 text-content-2">
              {tournament.venueAddress || tournament.venue?.address}
            </Text>
          ) : null}
        </SectionCard>
      ) : null}

      {tournament.description ? (
        <SectionCard title="Giới thiệu">
          <Text className="text-sm leading-6 text-content-2">
            {tournament.description}
          </Text>
        </SectionCard>
      ) : null}
    </View>
  );
}
