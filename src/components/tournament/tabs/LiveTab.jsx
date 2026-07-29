import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import MatchRow from "../MatchRow";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";
import { getMatchState } from "../../../constants/tournament";
import { colors, iconSize } from "../../../theme/tokens";

/**
 * Nhịp tự làm mới. 15 giây là mức thoả hiệp: đủ nhanh để tỷ số không quá cũ,
 * đủ thưa để không ngốn pin và dữ liệu di động khi người dùng để màn mở lâu.
 */
const REFRESH_MS = 15000;

/**
 * Tab Trực tiếp — các trận đang diễn ra.
 *
 * KHÁC WEB: web nhận cập nhật tức thời qua WebSocket (`useTournamentSocket`,
 * STOMP trên SockJS). Mobile chưa có thư viện WebSocket trong package.json nên
 * tab này tự gọi lại `/matches` mỗi 15 giây. Tỷ số vì vậy trễ tối đa 15 giây.
 * Muốn realtime thật thì cả nhóm phải thống nhất cài @stomp/stompjs cho mobile
 * — xem docs/superpowers/specs/2026-07-29-event-screens-design.md.
 *
 * Bộ đếm chỉ chạy khi tab đang hiển thị (`active`): tab ẩn mà vẫn gọi API thì
 * người dùng ở tab khác cũng phải trả tiền 3G cho dữ liệu họ không xem.
 */
export default function LiveTab({ tournamentId, active }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const alive = useRef(true);
  const loadedOnce = useRef(false);

  const load = useCallback(async () => {
    const data = await publicTournamentApi.getPublicMatches(tournamentId);
    if (!alive.current) return;
    setMatches(data.filter((m) => getMatchState(m.status) === "live"));
  }, [tournamentId]);

  useEffect(() => {
    alive.current = true;

    const run = async () => {
      try {
        await load();
        loadedOnce.current = true;
        if (alive.current) setError("");
      } catch (e) {
        // Lần đầu lỗi thì báo; các lần tự làm mới sau lỗi thì giữ nguyên dữ liệu
        // đang hiện — chớp một thông báo lỗi rồi tự biến mất còn khó hiểu hơn
        if (alive.current && !loadedOnce.current) setError(e.message);
      } finally {
        if (alive.current) setLoading(false);
      }
    };

    // Rời tab không cần tải lại — chỉ tải khi đang xem, hoặc khi chưa có gì
    if (active || !loadedOnce.current) run();

    if (!active) {
      return () => {
        alive.current = false;
      };
    }

    const timer = setInterval(run, REFRESH_MS);

    return () => {
      alive.current = false;
      clearInterval(timer);
    };
  }, [load, active]);

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

  if (loading || error || matches.length === 0) {
    return (
      <View className="gap-3">
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Hiện không có trận nào đang diễn ra."
        />

        {!loading ? (
          <Pressable
            onPress={handleManualRefresh}
            disabled={refreshing}
            className="flex-row items-center justify-center gap-2 self-center rounded-full border border-slate-300 bg-white px-5 py-2.5 active:bg-slate-50"
          >
            <RefreshCw size={iconSize.sm} color={colors.textSecondary} />
            <Text className="text-sm font-semibold text-slate-700">
              {refreshing ? "Đang tải..." : "Làm mới"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <View className="flex-row items-center justify-between bg-navy-900 px-4 py-2.5">
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-accent" />
          <Text className="text-sm font-semibold text-white">Đang diễn ra</Text>
        </View>
        <Text className="text-xs text-navy-500">{matches.length} trận</Text>
      </View>

      {matches.map((match) => (
        <MatchRow key={match.id} match={match} />
      ))}

      <Pressable
        onPress={handleManualRefresh}
        disabled={refreshing}
        className="flex-row items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 py-3 active:bg-slate-100"
      >
        <RefreshCw size={iconSize.sm} color={colors.textSecondary} />
        <Text className="text-xs font-semibold text-slate-600">
          {refreshing ? "Đang tải..." : "Tự làm mới mỗi 15 giây · Chạm để làm mới ngay"}
        </Text>
      </Pressable>
    </View>
  );
}
