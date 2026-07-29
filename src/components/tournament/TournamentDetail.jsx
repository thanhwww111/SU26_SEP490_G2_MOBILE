import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart2, Info, List, Radio, UserCheck } from "lucide-react-native";

import InfoTab from "./tabs/InfoTab";
import PlayersTab from "./tabs/PlayersTab";
import MatchesTab from "./tabs/MatchesTab";
import LiveTab from "./tabs/LiveTab";
import RankingTab from "./tabs/RankingTab";
import TournamentTabBar from "./TournamentTabBar";
import TournamentStatusBadge from "./TournamentStatusBadge";
import RemoteImage from "../home/RemoteImage";
import * as publicTournamentApi from "../../api/publicTournamentApi";
import { participantTypeLabel } from "../../constants/tournament";
import { fmtCurrency } from "../../utils/format";
import { fmtDateRange } from "../../utils/date";
import { colors } from "../../theme/tokens";

const TABS = [
  { id: "info", label: "Thông tin", Icon: Info },
  { id: "players", label: "Cơ thủ", Icon: UserCheck },
  { id: "matches", label: "Trận đấu", Icon: List },
  { id: "live", label: "Trực tiếp", Icon: Radio },
  { id: "ranking", label: "Xếp hạng", Icon: BarChart2 },
];

/** Ba tab kết quả bị ẩn khi ban tổ chức tắt công khai tỷ số */
const RATIO_TABS = ["matches", "live", "ranking"];

/** Một ô trong hàng thông tin nhanh dưới tên giải */
const InfoCell = ({ label, value }) => (
  <View className="flex-1 gap-1 px-3 py-3">
    <Text className="text-overline font-bold uppercase text-slate-400">{label}</Text>
    <Text numberOfLines={2} className="text-sm font-semibold text-slate-900">
      {value || "—"}
    </Text>
  </View>
);

/**
 * Khung màn chi tiết giải: tải dữ liệu giải, dựng hero + thẻ thông tin + tab.
 *
 * Hero và thẻ tên giải chỉ hiện ở tab Thông tin, giống web — ba tab danh sách
 * cần trọn chiều cao màn hình cho dữ liệu, không phải cho ảnh bìa.
 *
 * Các tab dùng chung một ScrollView thay vì mỗi tab một FlatList: hero phải
 * cuộn cùng nội dung, mà FlatList lồng trong ScrollView thì cuộn xung đột.
 * Đánh đổi: danh sách dài (giải 128 cơ thủ) render hết một lượt, không ảo hoá.
 * Chấp nhận được ở quy mô hiện tại — xem spec ngày 2026-07-29.
 *
 * Tab đã mở thì được giữ lại (ẩn bằng `display: none`) để chuyển qua chuyển lại
 * không gọi lại API.
 */
export default function TournamentDetail({ id, onOpenMyRegistrations }) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [visited, setVisited] = useState({ info: true });

  const scrollRef = useRef(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicTournamentApi.getPublicTournamentDetail(id);
      if (alive.current) setTournament(data);
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const tabs = useMemo(() => {
    if (!tournament) return [];

    return TABS.filter(
      (tab) => tournament.isPublicRatio || !RATIO_TABS.includes(tab.id)
    ).map((tab) => ({
      ...tab,
      // Giải còn đang mở đăng ký thì chưa bốc thăm, chưa có trận nào để xem
      disabled:
        tab.id === "matches" &&
        tournament.status === "OPEN_FOR_REGISTRATION",
    }));
  }, [tournament]);

  const handleChangeTab = (tabId) => {
    setActiveTab(tabId);
    setVisited((prev) => (prev[tabId] ? prev : { ...prev, [tabId]: true }));
    // Đổi tab mà giữ nguyên vị trí cuộn thì nội dung mới hiện ra giữa chừng;
    // web cũng scrollTo(0,0) mỗi lần đổi tab
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-slate-50 px-4">
        <Text className="text-center text-sm text-slate-500">
          {error || "Không tìm thấy giải đấu."}
        </Text>
        <Pressable
          onPress={load}
          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 active:bg-slate-50"
        >
          <Text className="text-sm font-semibold text-slate-700">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  const showHero = activeTab === "info";

  const renderTab = (tabId) => {
    if (tabId === "info")
      return (
        <InfoTab
          tournament={tournament}
          onOpenMyRegistrations={onOpenMyRegistrations}
        />
      );
    if (tabId === "players") return <PlayersTab tournamentId={tournament.id} />;
    if (tabId === "matches")
      return (
        <MatchesTab
          tournamentId={tournament.id}
          locked={tournament.status === "OPEN_FOR_REGISTRATION"}
        />
      );
    if (tabId === "live")
      return (
        <LiveTab tournamentId={tournament.id} active={activeTab === "live"} />
      );
    if (tabId === "ranking") return <RankingTab tournamentId={tournament.id} />;
    return null;
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        // Chừa chỗ cho thanh tab nổi ở đáy, nếu không nó che mất phần cuối nội dung
        contentContainerClassName="pb-28"
      >
        {showHero ? (
          <View>
            <View className="h-48 w-full">
              <RemoteImage uri={tournament.thumbnailUrl} className="h-full w-full" />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(12, 21, 39, 0.45)" },
                ]}
              />
              <View className="absolute right-4 top-4">
                <TournamentStatusBadge tournament={tournament} />
              </View>
            </View>

            <View className="border-b border-slate-200 bg-white px-4 pb-2 pt-4">
              <Text className="text-xl font-black uppercase italic leading-7 text-slate-900">
                {tournament.name}
              </Text>

              <View className="mt-3 flex-row flex-wrap border-t border-slate-100">
                <InfoCell
                  label="Ngày diễn ra"
                  value={fmtDateRange(tournament.startAt, tournament.endAt)}
                />
                <InfoCell label="Loại bi" value={tournament.gameType} />
              </View>
              <View className="flex-row flex-wrap">
                <InfoCell
                  label="Thể thức"
                  value={`${tournament.formatName || tournament.format || "—"} · ${participantTypeLabel(
                    tournament.participantType
                  )}`}
                />
                <InfoCell
                  label="Tổng giải thưởng"
                  value={fmtCurrency(tournament.prizePool)}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Tab danh sách bỏ hero để nhường chiều cao cho dữ liệu, nhưng vẫn
             phải nhắc người dùng đang xem giải nào */
          <View className="border-b border-slate-200 bg-white px-4 py-3">
            <Text numberOfLines={1} className="text-sm font-bold text-slate-900">
              {tournament.name}
            </Text>
          </View>
        )}

        <View className="px-4 pt-4">
          {tabs.map((tab) =>
            visited[tab.id] ? (
              <View
                key={tab.id}
                style={tab.id === activeTab ? undefined : styles.hidden}
              >
                {renderTab(tab.id)}
              </View>
            ) : null
          )}
        </View>
      </ScrollView>

      <TournamentTabBar
        tabs={tabs}
        activeId={activeTab}
        onChange={handleChangeTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { display: "none" },
});
