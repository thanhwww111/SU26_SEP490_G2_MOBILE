import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Vibration } from "react-native";

import {
  EXTENSION_SECONDS,
  WARNING_SECONDS,
  nextBreakSlot,
  otherSlot,
  shotDurationSeconds,
  toRemainingSeconds,
} from "../utils/shotClock";
import { getItem, removeItem, setItem } from "../utils/storage";

/**
 * Đồng hồ mỗi cú đánh cho trọng tài.
 *
 * Port `FE/src/hooks/useShotClock.js` — cùng luật, cùng tên trường trong state, nên hành vi hai
 * bản khách giống nhau. Ba chỗ phải khác vì nền tảng:
 *
 * 1. **Lưu trạng thái là bất đồng bộ.** Web ghi thẳng `localStorage` trong lúc render; `src/utils/
 *    storage.js` của mobile trả Promise. Nên có `hydrated` để màn biết lúc nào giờ đã khôi phục
 *    xong, và ghi xuống được gộp nhịp bằng timer thay vì ghi mỗi lần state đổi — SecureStore đi
 *    qua Keystore/Keychain, gọi liên tục thì tốn hơn hẳn localStorage.
 * 2. **Không có WebAudio.** Tiếng bíp đổi thành rung (`Vibration` của React Native, không cần cài
 *    gì): rung ngắn khi còn 10 giây, rung dài khi hết giờ. Điện thoại trọng tài thường để trên
 *    thành bàn giữa tiếng ồn của quán nên rung lại đáng tin hơn tiếng.
 * 3. **`setInterval` bị hệ điều hành bóp khi app xuống nền.** Mốc `endsAt` là thời điểm tuyệt đối
 *    nên giờ vẫn đúng lúc quay lại, nhưng phải chủ động đọc lại `Date.now()` ngay khi app về tiền
 *    cảnh, nếu không mặt đồng hồ đứng im cho tới nhịp tick kế tiếp.
 *
 * @param {object} params
 * @param {string|number} params.matchId
 * @param {boolean} params.active trận đang diễn ra (chỉ khi đó mới đếm)
 * @param {number|null} params.rackIndex tổng số ván đã xong (p1 + p2); null khi chưa tải xong trận
 * @param {1|2|null} params.lastRackWinnerSlot ai vừa thắng ván gần nhất
 * @param {(slot: 1|2) => void} [params.onExpire] gọi khi một cơ thủ hết giờ
 */

const TICK_MS = 100;
const PERSIST_DEBOUNCE_MS = 400;
const STORAGE_PREFIX = "btms.shotclock.";

const storageKey = (matchId) => `${STORAGE_PREFIX}${matchId}`;

const WARNING_PATTERN = 60;
/** Rung–nghỉ–rung: dễ phân biệt với nhịp cảnh báo 10 giây */
const EXPIRE_PATTERN = [0, 300, 120, 300];

function initialState(breakSlot = 1) {
  return {
    enabled: true,
    running: false,
    breakMode: "alternate",
    breakSlot,
    turnSlot: breakSlot,
    isBreakShot: true,
    endsAt: null,
    remainingMs: shotDurationSeconds(true) * 1000,
    extensionUsed: { 1: false, 2: false },
    rackIndex: 0,
  };
}

export function useShotClock({
  matchId,
  active,
  rackIndex = null,
  lastRackWinnerSlot = null,
  onExpire,
}) {
  const [state, setState] = useState(() => initialState());
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);

  const hydratedFor = useRef(null);
  /** null = chưa từng đồng bộ số ván với server trong phiên này */
  const knownRack = useRef(null);
  const warnedRef = useRef(false);
  const expiredRef = useRef(false);
  const persistTimer = useRef(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  /* Khôi phục trạng thái đã lưu khi đổi trận */
  useEffect(() => {
    if (matchId == null || hydratedFor.current === matchId) return undefined;
    hydratedFor.current = matchId;

    let cancelled = false;
    setHydrated(false);

    (async () => {
      let restored = null;
      try {
        const raw = await getItem(storageKey(matchId));
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
          restored = { ...initialState(), ...parsed };
        }
      } catch {
        /* Bản lưu hỏng hoặc không đọc được — bắt đầu lại từ đầu, không chặn màn */
      }

      if (cancelled) return;
      setState(restored ?? initialState());
      knownRack.current = restored?.rackIndex ?? null;
      warnedRef.current = false;
      expiredRef.current = false;
      setNow(Date.now());
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  /* Ghi xuống máy, gộp nhịp. Chưa khôi phục xong thì chưa ghi, nếu không state khởi tạo sẽ đè
     mất bản đã lưu ngay trước khi đọc ra. */
  useEffect(() => {
    if (matchId == null || !hydrated) return undefined;

    persistTimer.current = setTimeout(() => {
      setItem(storageKey(matchId), JSON.stringify(state)).catch(() => {
        /* Hết chỗ / bị từ chối — đồng hồ vẫn chạy đúng trong phiên hiện tại */
      });
    }, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(persistTimer.current);
  }, [matchId, state, hydrated]);

  const ticking = state.enabled && state.running && active;

  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [ticking]);

  /* Về tiền cảnh: đọc lại giờ ngay thay vì đợi nhịp tick kế tiếp */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  /* Trận kết thúc hoặc rời trạng thái đang đấu → dừng đồng hồ, giữ nguyên giờ còn lại */
  useEffect(() => {
    if (active) return;
    setState((s) => {
      if (!s.running) return s;
      const left = s.endsAt != null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
      return { ...s, running: false, endsAt: null, remainingMs: left };
    });
  }, [active]);

  const remainingMs = useMemo(() => {
    if (!state.running || state.endsAt == null) return state.remainingMs;
    return Math.max(0, state.endsAt - now);
  }, [state.running, state.endsAt, state.remainingMs, now]);

  const remainingSeconds = toRemainingSeconds(remainingMs);
  const totalSeconds = shotDurationSeconds(state.isBreakShot);
  const isWarning = state.running && remainingSeconds <= WARNING_SECONDS;

  /** Đặt lại đồng hồ cho một cú đánh mới. */
  const armShot = useCallback((patch, { run }) => {
    setState((s) => {
      const merged = { ...s, ...patch };
      const ms = shotDurationSeconds(merged.isBreakShot) * 1000;
      return {
        ...merged,
        remainingMs: ms,
        endsAt: run ? Date.now() + ms : null,
        running: run,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, []);

  /* Cảnh báo 10 giây */
  useEffect(() => {
    if (!ticking) return;
    if (remainingSeconds <= WARNING_SECONDS && remainingSeconds > 0) {
      if (!warnedRef.current) {
        warnedRef.current = true;
        Vibration.vibrate(WARNING_PATTERN);
      }
    } else if (remainingSeconds > WARNING_SECONDS) {
      warnedRef.current = false;
    }
  }, [ticking, remainingSeconds]);

  /* Hết giờ → phạm lỗi: chuyển lượt cho đối thủ và chạy tiếp */
  useEffect(() => {
    if (!ticking || remainingMs > 0 || expiredRef.current) return;
    expiredRef.current = true;
    const offender = state.turnSlot;
    Vibration.vibrate(EXPIRE_PATTERN);
    armShot({ turnSlot: otherSlot(offender), isBreakShot: false }, { run: true });
    onExpireRef.current?.(offender);
  }, [ticking, remainingMs, state.turnSlot, armShot]);

  /* Ván mới: đổi người phá, trả lại quyền gia hạn cho cả hai */
  useEffect(() => {
    if (rackIndex == null || !hydrated) return;

    // Lần đầu biết số ván (vừa tải trận, hoặc mở lại màn giữa trận): chỉ ghi nhận, không coi là
    // vừa xong một ván — nếu không, mở lại màn là đồng hồ tự nhảy sang người phá kế tiếp.
    if (knownRack.current == null) {
      knownRack.current = rackIndex;
      setState((s) => (s.rackIndex === rackIndex ? s : { ...s, rackIndex }));
      return;
    }
    if (rackIndex === knownRack.current) return;

    const advanced = rackIndex > knownRack.current;
    knownRack.current = rackIndex;

    setState((s) => {
      const breakSlot = advanced
        ? nextBreakSlot(s.breakMode, s.breakSlot, lastRackWinnerSlot)
        : s.breakSlot;
      const ms = shotDurationSeconds(true) * 1000;
      return {
        ...s,
        rackIndex,
        breakSlot,
        turnSlot: breakSlot,
        isBreakShot: true,
        extensionUsed: { 1: false, 2: false },
        remainingMs: ms,
        endsAt: s.running && s.enabled ? Date.now() + ms : null,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, [rackIndex, lastRackWinnerSlot, hydrated]);

  const setEnabled = useCallback((value) => {
    setState((s) => ({
      ...s,
      enabled: value,
      running: value ? s.running : false,
      endsAt: null,
      remainingMs: value ? s.remainingMs : shotDurationSeconds(s.isBreakShot) * 1000,
    }));
  }, []);

  const toggleRun = useCallback(() => {
    setState((s) => {
      if (s.running) {
        const left = s.endsAt != null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
        return { ...s, running: false, endsAt: null, remainingMs: left };
      }
      const left = s.remainingMs > 0 ? s.remainingMs : shotDurationSeconds(s.isBreakShot) * 1000;
      return { ...s, running: true, endsAt: Date.now() + left, remainingMs: left };
    });
    setNow(Date.now());
  }, []);

  const resetShot = useCallback(() => {
    armShot({}, { run: state.running });
  }, [armShot, state.running]);

  const switchTurn = useCallback(() => {
    armShot({ turnSlot: otherSlot(state.turnSlot), isBreakShot: false }, { run: true });
  }, [armShot, state.turnSlot]);

  const setTurn = useCallback(
    (slot) => {
      if (slot !== 1 && slot !== 2) return;
      armShot({ turnSlot: slot, isBreakShot: false }, { run: true });
    },
    [armShot]
  );

  const canExtend = state.enabled && active && !state.extensionUsed[state.turnSlot];

  const grantExtension = useCallback(() => {
    setState((s) => {
      if (s.extensionUsed[s.turnSlot]) return s;
      const bonus = EXTENSION_SECONDS * 1000;
      const left =
        s.running && s.endsAt != null ? Math.max(0, s.endsAt - Date.now()) : s.remainingMs;
      return {
        ...s,
        extensionUsed: { ...s.extensionUsed, [s.turnSlot]: true },
        remainingMs: left + bonus,
        endsAt: s.running ? Date.now() + left + bonus : null,
      };
    });
    warnedRef.current = false;
    expiredRef.current = false;
    setNow(Date.now());
  }, []);

  const setBreakMode = useCallback((mode) => {
    setState((s) => ({ ...s, breakMode: mode }));
  }, []);

  /** Xoá bản lưu — gọi khi trận đã chốt kết quả, không còn gì để khôi phục. */
  const clearPersisted = useCallback(async () => {
    if (matchId == null) return;
    clearTimeout(persistTimer.current);
    await removeItem(storageKey(matchId));
  }, [matchId]);

  return {
    enabled: state.enabled,
    setEnabled,
    running: state.running,
    ticking,
    remainingMs,
    remainingSeconds,
    totalSeconds,
    isWarning,
    isBreakShot: state.isBreakShot,
    turnSlot: state.turnSlot,
    breakSlot: state.breakSlot,
    breakMode: state.breakMode,
    setBreakMode,
    extensionUsed: state.extensionUsed,
    canExtend,
    grantExtension,
    toggleRun,
    resetShot,
    switchTurn,
    setTurn,
    clearPersisted,
  };
}
