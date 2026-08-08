import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import MatchRow from "../MatchRow";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { getMatchState } from "../../../constants/tournament";
import { SOCKET_STATE_LABELS } from "../../../constants/websocket";
import { iconSize } from "../../../theme/tokens";
import { useThemeColors } from "../../../theme/useThemeColors";

/** Trận đang đá xếp theo bàn để khán giả dò theo bàn ngoài đời — web cũng vậy */
const byTable = (a, b) =>
  (a.tableNo ?? 9999) - (b.tableNo ?? 9999) || (a.id ?? 0) - (b.id ?? 0);

const liveOnly = (list) =>
  list.filter((m) => getMatchState(m.status) === "live").sort(byTable);

/**
 * Tab Trực tiếp — các trận đang diễn ra, cập nhật tức thời.
 *
 * Dùng chung đường realtime với web: STOMP trên WebSocket, cùng topic
 * `/topic/tournament/{id}/matches`. Trước 2026-08-08 tab này gọi lại REST mỗi
 * 15 giây; giờ REST chỉ còn dùng cho lần tải đầu và cho những lúc mất kết nối.
 *
 * Bản tin socket chỉ mang **một trận**, nên danh sách được giữ dạng map theo id:
 * trận mới đang đá thì thêm vào, trận vừa kết thúc thì tự rơi khỏi bộ lọc.
 *
 * Nối lại sau khi rớt mạng thì tải lại toàn bộ từ REST — quãng mất kết nối có
 * thể đã lỡ vài bản tin, mà đắp từng bản tin lên trạng thái cũ thì sai âm thầm.
 */
export default function LiveTab({ tournamentId, active }) {
  const colors = useThemeColors();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const data = await publicTournamentApi.getPublicMatches(tournamentId);
    if (!alive.current) return;
    setMatches(liveOnly(data));
  }, [tournamentId]);

  useEffect(() => {
    alive.current = true;

    (async () => {
      try {
        await load();
        loadedOnce.current = true;
        if (alive.current) setError("");
      } catch (e) {
        // Lần đầu lỗi thì báo; các lần tải lại sau lỗi thì giữ nguyên dữ liệu
        // đang hiện — chớp một thông báo lỗi rồi tự biến mất còn khó hiểu hơn
        if (alive.current && !loadedOnce.current) setError(e.message);
      } finally {
        if (alive.current) setLoading(false);
      }
    })();

    return () => {
      alive.current = false;
    };
  }, [load]);

  /**
   * Ghép một trận từ socket vào danh sách.
   *
   * Trận vừa chuyển sang đang đá thì thêm; vừa kết thúc thì bỏ ra. Sắp lại theo
   * bàn sau mỗi lần ghép để thứ tự không nhảy lung tung khi có trận mới vào.
   */
  const applyMatch = useCallback((match) => {
    if (!alive.current) return;

    setMatches((prev) => {
      const rest = prev.filter((m) => m.id !== match.id);
      if (getMatchState(match.status) !== "live") return rest;
      return [...rest, match].sort(byTable);
    });
  }, []);

  const applyBracketSync = useCallback((list) => {
    if (alive.current) setMatches(liveOnly(list));
  }, []);

  const { connectionState, isConnected } = useTournamentSocket(tournamentId, {
    // Tab ẩn thì không giữ socket: người dùng ở tab khác không cần trả tiền 3G
    // cho dữ liệu họ không xem
    enabled: Boolean(active),
    onMatchUpdate: applyMatch,
    onBracketSync: applyBracketSync,
    onReconnect: () => {
      load().catch(() => {
        /* giữ nguyên danh sách đang hiện; nút làm mới vẫn dùng được */
      });
    },
  });

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
      if (alive.current) setError("");
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setRefreshing(false);
    }
  };

  /** Chấm trạng thái: xanh nhấp nháy khi đang nghe, xám khi đứt */
  const StatusDot = () => (
    <View
      className={`h-1.5 w-1.5 rounded-full ${
        isConnected ? "bg-accent" : "bg-navy-500"
      }`}
    />
  );

  if (loading || error || matches.length === 0) {
    return (
      <View className="gap-3">
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Hiện không có trận nào đang diễn ra."
        />

        {!loading ? (
          <View className="items-center gap-2">
            <Text className="text-xs text-faint">
              {SOCKET_STATE_LABELS[connectionState]}
            </Text>

            <Pressable
              onPress={handleManualRefresh}
              disabled={refreshing}
              className="flex-row items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
            >
              <RefreshCw size={iconSize.sm} color={colors.content2} />
              <Text className="text-sm font-semibold text-content-2">
                {refreshing ? "Đang tải..." : "Làm mới"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-line bg-surface">
      <View className="flex-row items-center justify-between bg-navy-900 px-4 py-2.5">
        <View className="flex-row items-center gap-2">
          <StatusDot />
          <Text className="text-sm font-semibold text-white">
            {isConnected ? "Đang diễn ra" : SOCKET_STATE_LABELS[connectionState]}
          </Text>
        </View>
        <Text className="text-xs text-navy-500">{matches.length} trận</Text>
      </View>

      {matches.map((match) => (
        <MatchRow key={match.id} match={match} />
      ))}

      {/* Kết nối tốt thì tỷ số tự về, không cần mời người dùng bấm gì. Chỉ khi
          đứt mới hiện nút — lúc đó REST là đường duy nhất còn lại */}
      {!isConnected ? (
        <Pressable
          onPress={handleManualRefresh}
          disabled={refreshing}
          className="flex-row items-center justify-center gap-2 border-t border-line-soft bg-canvas py-3 active:bg-sunken-strong"
        >
          <RefreshCw size={iconSize.sm} color={colors.content2} />
          <Text className="text-xs font-semibold text-content-2">
            {refreshing
              ? "Đang tải..."
              : `${SOCKET_STATE_LABELS[connectionState]} · Chạm để làm mới`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
