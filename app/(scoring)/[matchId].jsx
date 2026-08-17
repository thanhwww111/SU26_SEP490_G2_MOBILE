import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { ArrowLeft, Flag, UserX, Wifi, WifiOff } from "lucide-react-native";

import CompleteMatchSheet from "../../src/components/staff/CompleteMatchSheet";
import ScorePanel from "../../src/components/staff/ScorePanel";
import ShotClockControls, {
  ShotClockRuleHint,
} from "../../src/components/staff/ShotClockControls";
import ShotClockDial from "../../src/components/staff/ShotClockDial";
import { useRequireStaff } from "../../src/hooks/useRequireStaff";
import { useShotClock } from "../../src/hooks/useShotClock";
import { useTournamentSocket } from "../../src/hooks/useTournamentSocket";
import * as matchApi from "../../src/api/matchApi";
import * as staffMatchApi from "../../src/api/staffMatchApi";
import { SOCKET_STATE_LABELS } from "../../src/constants/websocket";
import {
  getPlayerName,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
  pickDefaultWinnerId,
} from "../../src/utils/refereeMatch";
import { iconSize } from "../../src/theme/tokens";

/**
 * Bảng điểm của trọng tài, bám `/staff/matches/:matchId` của web
 * (`FE/src/pages/Staff/Matches/StaffScoringPage.jsx`).
 *
 * Màn chạy ngang, nền tối cố ý ở cả hai chế độ sáng/tối — nên toàn bộ màu ở đây là màu tuyệt
 * đối, không đi qua token vai trò (ngoại lệ đã ghi ở `docs/mobile/01-design-system.md`, Phần 9).
 * Khoá hướng màn hình nằm ở `_layout.jsx` của nhóm.
 *
 * ## Cách tỷ số được giữ đúng
 *
 * Ba nguồn cùng ghi vào một trận: nút bấm tại đây, bản tin WebSocket, và snapshot REST. Thứ tự
 * ưu tiên giống hệt web:
 *
 * - Bấm +1 thì hiện ngay tỷ số dự đoán (`optimisticScores`) để ngón tay không phải chờ mạng.
 * - Bản tin từ server ghi đè, TRỪ khi còn lời gọi đang bay — `incrementInFlight` đếm số request
 *   chưa xong; xoá dự đoán giữa chừng sẽ làm số nhảy lùi rồi nhảy tới.
 * - Mất kết nối rồi nối lại thì tải hẳn snapshot mới, vì lúc rớt có thể đã lỡ vài bản tin.
 *
 * Backend chốt bằng delta (`+1`/`-1`) chứ không nhận tỷ số tuyệt đối, nên hai máy cùng chấm một
 * trận cũng không ghi đè lên nhau.
 */

const P1_COLOR = "#378ADD";
const P2_COLOR = "#EF4444";
const SCREEN_BG = "#0A0E14";
const BAR_BG = "#0F141C";

/**
 * Màu chỉ báo kết nối WebSocket, bám `SocketConnectionBadge` của web nhưng lấy bậc sáng hơn:
 * emerald-500 / amber-500 / red-500 của web nằm trên nền trắng, còn thanh này nền `#0F141C`.
 */
const SOCKET_COLORS = {
  connected: "#34D399",
  connecting: "#FBBF24",
  reconnecting: "#FBBF24",
  disconnected: "#F87171",
};

/** Thông báo tự tắt — thay cho toast, thư viện toast chưa được cài (xem docs/mobile/06-agent.md) */
const NOTICE_MS = 5000;

function formatHeaderMeta(match) {
  const table = match?.tableNo != null ? `Bàn ${match.tableNo}` : `Trận #${match?.id}`;
  const detail = [
    match?.raceTo != null ? `Đánh tới ${match.raceTo} ván` : null,
    match?.stageName || match?.bracketType,
    match?.matchCode,
  ]
    .filter(Boolean)
    .join(" · ");
  return { table, detail };
}

/** Ai đã chạm mốc thắng — dùng để hiện banner và làm mờ panel bên kia. */
function getRaceLeader(scores, raceTo, p1Name, p2Name) {
  if (raceTo == null) return null;
  const p1Win = scores.p1 >= raceTo;
  const p2Win = scores.p2 >= raceTo;

  if (p1Win && !p2Win) return { name: p1Name, score: scores.p1, slot: 1 };
  if (p2Win && !p1Win) return { name: p2Name, score: scores.p2, slot: 2 };
  if (p1Win && p2Win) {
    if (scores.p1 > scores.p2) return { name: p1Name, score: scores.p1, slot: 1 };
    if (scores.p2 > scores.p1) return { name: p2Name, score: scores.p2, slot: 2 };
    return { name: p1Name, score: scores.p1, slot: 1 };
  }
  return null;
}

export default function StaffScoringScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const { checking, allowed } = useRequireStaff();

  /**
   * Màn tự xoay được bố cục thay vì trông chờ vào khoá hướng.
   *
   * `(scoring)/_layout.jsx` có gọi `lockAsync(LANDSCAPE)`, nhưng lệnh đó không phải lúc nào cũng
   * ăn: iPad bật multitasking bỏ qua nó, một số máy khoá xoay ở mức hệ thống cũng vậy, và trong
   * Expo Go thì còn tuỳ bản. Bám cứng vào một hướng nghĩa là khi khoá trượt, cả màn vỡ — chữ bị
   * cắt, badge tràn khỏi panel.
   *
   * Nên hướng màn hình ở đây là thứ để ĐỌC chứ không phải để ép: dọc thì hai panel xếp chồng và
   * đồng hồ nằm thành một dải riêng giữa chúng; ngang thì hai panel cạnh nhau và đồng hồ nổi ở
   * tâm. Cả hai đều là bố cục đủ chỗ, không có cái nào là bản dự phòng méo mó.
   */
  const { width, height } = useWindowDimensions();
  const stacked = height > width;

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [optimisticScores, setOptimisticScores] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [sheetMode, setSheetMode] = useState(null);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);
  const [sheetError, setSheetError] = useState("");

  const incrementInFlight = useRef(0);
  const alive = useRef(true);
  const noticeTimer = useRef(null);

  const showNotice = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), NOTICE_MS);
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(noticeTimer.current);
    };
  }, []);

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await matchApi.getMatchDetail(matchId);
      if (!alive.current) return;
      setMatch(data);
      setOptimisticScores(null);
      setError("");
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!allowed) return;
    setLoading(true);
    loadSnapshot();
  }, [allowed, loadSnapshot]);

  const applyServerMatch = useCallback(
    (serverMatch) => {
      if (Number(serverMatch?.id) !== Number(matchId)) return;
      setMatch(serverMatch);
      if (incrementInFlight.current === 0) setOptimisticScores(null);
    },
    [matchId]
  );

  const handleBracketSync = useCallback(
    (matches) => {
      const found = matches?.find((m) => Number(m.id) === Number(matchId));
      if (found) applyServerMatch(found);
    },
    [matchId, applyServerMatch]
  );

  const { connectionState } = useTournamentSocket(match?.tournamentId, {
    enabled: Boolean(match?.tournamentId) && !loading,
    onMatchUpdate: applyServerMatch,
    onBracketSync: handleBracketSync,
    onReconnect: loadSnapshot,
  });

  const pending = isMatchPending(match?.status);
  const live = isMatchLive(match?.status);
  const finished = isMatchFinished(match?.status);

  /* Giữ màn hình sáng suốt trận: trọng tài đặt máy xuống thành bàn giữa hai ván, màn tắt là mất
     luôn đồng hồ đang đếm. Chỉ giữ khi trận đang chạy, không giữ ở trận đã xong. */
  useEffect(() => {
    if (!live) return undefined;
    activateKeepAwakeAsync("btms-scoring").catch(() => {});
    return () => {
      deactivateKeepAwake("btms-scoring").catch(() => {});
    };
  }, [live]);

  const scores = useMemo(() => {
    if (optimisticScores) return optimisticScores;
    return { p1: match?.player1Score ?? 0, p2: match?.player2Score ?? 0 };
  }, [optimisticScores, match?.player1Score, match?.player2Score]);

  const raceTo = match?.raceTo ?? 5;
  const p1Name = getPlayerName(match?.player1, "Cơ thủ 1");
  const p2Name = getPlayerName(match?.player2, "Cơ thủ 2");

  /* Ai vừa thắng ván — suy từ điểm vừa tăng, tính ngay trong render để đồng hồ chọn đúng người
     phá ván kế tiếp. Giữ y hệt cách web làm. */
  const scoreTrackRef = useRef(null);
  if (scoreTrackRef.current === null) {
    scoreTrackRef.current = { p1: scores.p1, p2: scores.p2, winner: null };
  } else {
    const prev = scoreTrackRef.current;
    if (prev.p1 !== scores.p1 || prev.p2 !== scores.p2) {
      scoreTrackRef.current = {
        p1: scores.p1,
        p2: scores.p2,
        winner: scores.p1 > prev.p1 ? 1 : scores.p2 > prev.p2 ? 2 : prev.winner,
      };
    }
  }

  const handleShotClockExpire = useCallback(
    (offenderSlot) => {
      const offender = offenderSlot === 1 ? p1Name : p2Name;
      const opponent = offenderSlot === 1 ? p2Name : p1Name;
      showNotice(`Hết giờ — ${offender} phạm lỗi, mất lượt. ${opponent} được bi tự do.`);
    },
    [p1Name, p2Name, showNotice]
  );

  const clock = useShotClock({
    matchId,
    active: live && !finished,
    rackIndex: match ? scores.p1 + scores.p2 : null,
    lastRackWinnerSlot: scoreTrackRef.current.winner,
    onExpire: handleShotClockExpire,
  });

  const raceLeader = useMemo(
    () => getRaceLeader(scores, raceTo, p1Name, p2Name),
    [scores, raceTo, p1Name, p2Name]
  );

  const raceReached = scores.p1 >= raceTo || scores.p2 >= raceTo;
  const scoreInteractive = live && !finished && actionLoading !== "complete";
  const canAdd = scoreInteractive && !raceReached;
  const showClock = clock.enabled && live && !finished;

  const handleStart = async () => {
    if (!pending || actionLoading) return;
    setActionLoading("start");
    try {
      const updated = await staffMatchApi.startStaffMatch(matchId);
      if (!alive.current) return;
      setMatch(updated);
      setOptimisticScores(null);
    } catch (e) {
      if (alive.current) showNotice(e.message);
      loadSnapshot();
    } finally {
      if (alive.current) setActionLoading(null);
    }
  };

  const handleIncrement = async (playerSlot, delta) => {
    if (!scoreInteractive) return;

    const base = optimisticScores ?? {
      p1: match?.player1Score ?? 0,
      p2: match?.player2Score ?? 0,
    };

    if (delta > 0 && (base.p1 >= raceTo || base.p2 >= raceTo)) {
      showNotice("Đã đủ điểm thắng — hãy kết thúc trận.");
      return;
    }

    const next = { ...base };
    if (playerSlot === 1) next.p1 += delta;
    else next.p2 += delta;

    // Backend cũng chặn hai mốc này (MATCH_SCORE_OUT_OF_RANGE); chặn sớm ở đây để không tốn một
    // vòng mạng chỉ để nhận về lỗi.
    if (next.p1 < 0 || next.p2 < 0) return;
    if (next.p1 > raceTo || next.p2 > raceTo) return;

    setOptimisticScores(next);
    incrementInFlight.current += 1;

    try {
      const res = await staffMatchApi.incrementStaffScore(matchId, { playerSlot, delta });
      if (alive.current && res?.match) setMatch(res.match);
    } catch (e) {
      if (alive.current) {
        showNotice(e.message);
        setOptimisticScores(null);
      }
      loadSnapshot();
    } finally {
      incrementInFlight.current -= 1;
      if (incrementInFlight.current === 0 && alive.current) setOptimisticScores(null);
    }
  };

  const openSheet = (mode) => {
    const fallback =
      pickDefaultWinnerId(match, scores.p1, scores.p2) ??
      (mode === "walkover" ? null : match?.player1?.id ?? null);
    setSelectedWinnerId(fallback);
    setSheetError("");
    setSheetMode(mode);
  };

  const handleConfirmSheet = async () => {
    if (!selectedWinnerId) return;
    const isWalkover = sheetMode === "walkover";
    setActionLoading(isWalkover ? "walkover" : "complete");
    setSheetError("");

    try {
      const updated = isWalkover
        ? await staffMatchApi.walkoverStaffMatch(matchId, {
            winnerParticipantId: selectedWinnerId,
          })
        : await staffMatchApi.completeStaffMatch(matchId, {
            winnerParticipantId: selectedWinnerId,
            // Bắt buộc khi chưa ai đạt raceTo, nếu không backend trả MATCH_EARLY_END_NOT_CONFIRMED
            confirmEarlyEnd: !raceReached,
          });

      if (!alive.current) return;
      setMatch(updated);
      setOptimisticScores(null);
      setSheetMode(null);
      // Trận đã chốt thì bản lưu của đồng hồ không còn ý nghĩa, dọn luôn cho khỏi đọng lại
      clock.clearPersisted();
    } catch (e) {
      if (alive.current) setSheetError(e.message);
    } finally {
      if (alive.current) setActionLoading(null);
    }
  };

  const goBackToList = () => router.replace("/(app)/staff/matches");

  if (checking || !allowed) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: SCREEN_BG }}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: SCREEN_BG }}>
        <ActivityIndicator size="large" color={P1_COLOR} />
        <Text className="mt-3 text-sm text-slate-400">Đang tải trận đấu…</Text>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 px-6"
        style={{ backgroundColor: SCREEN_BG }}
      >
        <Text className="text-center text-base text-slate-300">
          {error || "Không tìm thấy trận đấu."}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              setLoading(true);
              loadSnapshot();
            }}
            className="h-12 items-center justify-center rounded-full bg-white/10 px-6"
          >
            <Text className="text-sm font-semibold text-white">Thử lại</Text>
          </Pressable>
          <Pressable
            onPress={goBackToList}
            className="h-12 items-center justify-center rounded-full border border-white/20 px-6"
          >
            <Text className="text-sm font-semibold text-slate-300">Về danh sách</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const header = formatHeaderMeta(match);
  const statusLabel = finished ? "Đã xong" : live ? "Đang đấu" : "Sắp tới";
  const statusColor = finished ? "#94A3B8" : live ? "#16A34A" : "#D97706";
  const turnAccent = clock.turnSlot === 1 ? P1_COLOR : P2_COLOR;
  const connected = connectionState === "connected";
  const socketColor = SOCKET_COLORS[connectionState] ?? SOCKET_COLORS.disconnected;
  /* Nhãn khi đã kết nối lấy theo web ("Đã kết nối") thay vì "Trực tiếp" của `SOCKET_STATE_LABELS`:
     ở màn này ngay cạnh đã có badge "Đang đấu" của trận, hai nhãn cùng nói về "đang trực tiếp"
     nhưng chỉ một cái nói về đường truyền thì người đọc phải đoán cái nào là cái nào. */
  const socketLabel = connected
    ? "Đã kết nối"
    : (SOCKET_STATE_LABELS[connectionState] ?? SOCKET_STATE_LABELS.disconnected);
  /* Khoảng né mặt đồng hồ: nửa bề ngang (112) cộng chút thở. Khổ dọc không cần vì đồng hồ đã có
     dải riêng, không nằm đè lên panel nào. */
  const centerGap = showClock && !stacked ? 68 : 16;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SCREEN_BG }} edges={["left", "right", "bottom"]}>
      {/**
       * Thanh trên.
       *
       * Khổ dọc không đủ bề ngang cho cả tên bàn, dòng thể thức và hai badge trên một hàng — bản
       * trước nhồi hết vào một hàng nên "Đánh tới…" và "Đang kết nối…" đều bị cắt cụt. Nên ở khổ
       * dọc, dòng thể thức xuống hàng riêng thay vì bị ép co lại: nó là chữ phụ, cho nó cả một
       * hàng vẫn rẻ hơn là để người đọc thấy một câu đứt quãng.
       */}
      <View
        className="gap-1 px-3 py-2"
        style={{ backgroundColor: BAR_BG, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={goBackToList}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quay lại danh sách trận"
            className="h-10 w-10 items-center justify-center rounded-lg active:bg-white/10"
          >
            <ArrowLeft size={iconSize.lg} color="#94A3B8" />
          </Pressable>

          <Text className="text-xl font-bold text-white">{header.table}</Text>

          {!stacked && header.detail ? (
            <Text numberOfLines={1} className="flex-1 text-xs text-slate-400">
              {header.detail}
            </Text>
          ) : (
            <View className="flex-1" />
          )}

          <View className="flex-row items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1">
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
            <Text className="text-overline font-bold uppercase" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>

          {/* Chỉ báo kết nối, hiện ở MỌI trạng thái — bám `SocketConnectionBadge` của web.
              Xanh lục là lời trấn an: tỷ số vừa bấm đã sang tới màn hình khán giả. Ẩn nó lúc kết
              nối tốt thì trọng tài không phân biệt được "đang chạy ngon" với "đã rớt từ lâu", vì
              cả hai trông y hệt nhau.

              Khổ dọc chỉ còn icon: nhãn "Đang kết nối lại…" dài gấp ba badge trạng thái, giữ lại
              là đẩy chính nó ra khỏi mép màn. Icon sóng gạch chéo đã nói đủ, và `accessibilityLabel`
              vẫn giữ nguyên câu đầy đủ cho trình đọc màn hình. */}
          <View
            className="flex-row items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1"
            accessibilityRole="status"
            accessibilityLabel={`Kết nối trực tiếp: ${socketLabel}`}
          >
            {/* Icon sóng chứ không phải chấm tròn: badge trạng thái trận ngay bên trái cũng là
                chấm xanh lục, hai chấm giống hệt nhau cạnh nhau thì phải đọc chữ mới phân biệt
                được — mà đọc chữ thì mất luôn cái lợi của tín hiệu màu. */}
            {connected ? (
              <Wifi size={12} color={socketColor} />
            ) : (
              <WifiOff size={12} color={socketColor} />
            )}
            {!stacked ? (
              <Text className="text-overline font-bold uppercase" style={{ color: socketColor }}>
                {socketLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {stacked && header.detail ? (
          <Text numberOfLines={1} className="pl-12 text-xs text-slate-400">
            {header.detail}
          </Text>
        ) : null}
      </View>

      {notice ? (
        <View className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2">
          <Text className="text-sm text-amber-300">{notice}</Text>
        </View>
      ) : null}

      {live && raceLeader ? (
        <View className="flex-row items-center gap-3 border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2">
          <Flag size={iconSize.sm} color="#34D399" />
          <Text className="flex-1 text-sm text-emerald-300">
            {raceLeader.name} đã đạt {raceLeader.score}/{raceTo} — có thể kết thúc trận
          </Text>
          <Pressable
            onPress={() => openSheet("complete")}
            className="h-11 items-center justify-center rounded-lg bg-emerald-500 px-4"
          >
            <Text className="text-sm font-bold text-[#0A0E14]">Kết thúc trận</Text>
          </Pressable>
        </View>
      ) : null}

      <View className={stacked ? "flex-1" : "flex-1 flex-row"}>
        <ScorePanel
          name={p1Name}
          score={scores.p1}
          slot={1}
          accent={P1_COLOR}
          raceTo={raceTo}
          centerGap={centerGap}
          stacked={stacked}
          canAdd={canAdd}
          canUndo={scoreInteractive}
          finished={finished}
          isWinner={raceLeader?.slot === 1}
          dimmed={Boolean(raceLeader) && raceLeader.slot !== 1}
          hasTurn={showClock && clock.turnSlot === 1}
          onTapPlus={() => handleIncrement(1, 1)}
          onMinus={() => handleIncrement(1, -1)}
        />

        {/**
         * Ranh giới hai panel.
         *
         * Khổ dọc: đồng hồ nằm hẳn thành một dải ở đây thay vì nổi đè lên hai panel. Bề ngang khi
         * dọc chỉ đủ cho một cụm số, mà mặt đồng hồ ở tâm sẽ đúng chỗ con số muốn đứng — cho nó
         * chỗ riêng thì cả ba thứ đều đủ rộng, không cái nào phải né cái nào.
         *
         * Khổ ngang: chỉ là vạch mảnh, đồng hồ nổi ở tâm (khai bên dưới).
         */}
        {stacked ? (
          <View
            className="items-center justify-center py-1"
            style={{
              backgroundColor: BAR_BG,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            {showClock ? (
              <Pressable
                onPress={clock.toggleRun}
                accessibilityRole="button"
                accessibilityLabel={clock.running ? "Tạm dừng đồng hồ" : "Chạy đồng hồ"}
                className="rounded-full"
              >
                <ShotClockDial
                  remainingSeconds={clock.remainingSeconds}
                  totalSeconds={clock.totalSeconds}
                  accent={turnAccent}
                  running={clock.running}
                  isWarning={clock.isWarning}
                  isBreakShot={clock.isBreakShot}
                  size={96}
                />
              </Pressable>
            ) : (
              <View className="h-px w-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
            )}
          </View>
        ) : (
          <View className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        )}

        <ScorePanel
          name={p2Name}
          score={scores.p2}
          slot={2}
          accent={P2_COLOR}
          raceTo={raceTo}
          centerGap={centerGap}
          stacked={stacked}
          canAdd={canAdd}
          canUndo={scoreInteractive}
          finished={finished}
          isWinner={raceLeader?.slot === 2}
          dimmed={Boolean(raceLeader) && raceLeader.slot !== 2}
          hasTurn={showClock && clock.turnSlot === 2}
          onTapPlus={() => handleIncrement(2, 1)}
          onMinus={() => handleIncrement(2, -1)}
        />

        {/* Đồng hồ nổi ở tâm màn — chỉ dùng cho khổ ngang; khổ dọc đã có dải riêng bên trên.
            Phải khai SAU cả hai panel: React Native không có z-index mặc định, thứ tự khai báo
            quyết định thứ tự vẽ — đặt ở giữa thì nửa bên phải của mặt đồng hồ bị panel 2 phủ lên.
            `zIndex` thêm vào để phòng trường hợp có thứ khác chen vào sau này (web cũng đặt z-20).
            `box-none` để phần nền trong suốt quanh đồng hồ không nuốt mất lượt chạm +1 của panel. */}
        {showClock && !stacked ? (
          <View
            pointerEvents="box-none"
            className="absolute inset-y-0 left-0 right-0 items-center justify-center"
            style={{ zIndex: 20 }}
          >
            <Pressable
              onPress={clock.toggleRun}
              accessibilityRole="button"
              accessibilityLabel={clock.running ? "Tạm dừng đồng hồ" : "Chạy đồng hồ"}
              className="rounded-full"
            >
              <ShotClockDial
                remainingSeconds={clock.remainingSeconds}
                totalSeconds={clock.totalSeconds}
                accent={turnAccent}
                running={clock.running}
                isWarning={clock.isWarning}
                isBreakShot={clock.isBreakShot}
                size={112}
              />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View
        className="gap-2 px-4 py-2"
        style={{ backgroundColor: BAR_BG, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}
      >
        {pending && !finished ? (
          <View className="flex-row items-center justify-center gap-2">
            <Pressable
              onPress={handleStart}
              disabled={Boolean(actionLoading)}
              className={`h-12 flex-1 max-w-sm flex-row items-center justify-center gap-2 rounded-full ${
                actionLoading ? "opacity-60" : ""
              }`}
              style={{ backgroundColor: P1_COLOR }}
            >
              {actionLoading === "start" ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
              <Text className="text-sm font-semibold text-white">
                {actionLoading === "start" ? "Đang bắt đầu…" : "Bắt đầu trận"}
              </Text>
            </Pressable>

            {/* Đối thủ không tới thì xử luôn, không phải bấm Bắt đầu trước — backend cho phép
                walkover ngay ở trạng thái PENDING (MatchServiceImpl.walkover) */}
            <Pressable
              onPress={() => openSheet("walkover")}
              disabled={Boolean(actionLoading)}
              className="h-12 flex-row items-center justify-center gap-2 rounded-full border border-white/20 px-4"
            >
              <UserX size={iconSize.sm} color="#94A3B8" />
              <Text className="text-sm font-semibold text-slate-300">Vắng mặt</Text>
            </Pressable>
          </View>
        ) : null}

        {live && !finished ? (
          <>
            <ShotClockControls clock={clock} disabled={!live || finished} />
            {clock.enabled ? <ShotClockRuleHint clock={clock} /> : null}

            {!raceLeader ? (
              <View className="flex-row items-center justify-center gap-2">
                <Pressable
                  onPress={() => openSheet("complete")}
                  disabled={actionLoading === "complete"}
                  className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5"
                >
                  <Flag size={iconSize.sm} color="#CBD5E1" />
                  <Text className="text-sm font-semibold text-slate-300">Kết thúc trận</Text>
                </Pressable>

                <Pressable
                  onPress={() => openSheet("walkover")}
                  disabled={Boolean(actionLoading)}
                  className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-white/15 px-5"
                >
                  <UserX size={iconSize.sm} color="#94A3B8" />
                  <Text className="text-sm font-semibold text-slate-400">Vắng mặt</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

        {finished ? (
          <View className="items-center gap-1 py-1">
            <Text className="text-overline font-bold uppercase text-slate-500">Kết quả</Text>
            <Text className="text-[32px] font-black text-white">
              <Text style={{ color: P1_COLOR }}>{scores.p1}</Text>
              {"  —  "}
              <Text style={{ color: P2_COLOR }}>{scores.p2}</Text>
            </Text>
            {match.winner ? (
              <Text className="text-sm font-semibold text-emerald-400">
                Thắng: {getPlayerName(match.winner)}
              </Text>
            ) : null}
            <Pressable
              onPress={goBackToList}
              className="mt-1 h-11 items-center justify-center rounded-full border border-white/20 px-6"
            >
              <Text className="text-sm font-semibold text-slate-300">Về danh sách trận</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <CompleteMatchSheet
        visible={sheetMode != null}
        mode={sheetMode ?? "complete"}
        match={match}
        scores={scores}
        raceTo={raceTo}
        selectedWinnerId={selectedWinnerId}
        onSelectWinner={setSelectedWinnerId}
        loading={actionLoading === "complete" || actionLoading === "walkover"}
        error={sheetError}
        onConfirm={handleConfirmSheet}
        onCancel={() => setSheetMode(null)}
      />
    </SafeAreaView>
  );
}
