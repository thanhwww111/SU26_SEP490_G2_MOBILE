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
import { useThemeColors } from "../../theme/useThemeColors";

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
    <Text className="text-overline font-bold uppercase text-faint">{label}</Text>
    <Text numberOfLines={2} className="text-sm font-semibold text-content">
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
 * Vùng cuộn chia theo tab chứ không dùng chung một `ScrollView` như trước:
 * tab Thông tin cần hero cuộn cùng nội dung nên `ScrollView` dựng ở đây, còn
 * bốn tab danh sách tự lo lấy qua `TabScreen` để giữ được bộ lọc ở trên cùng.
 * Danh sách dài (giải 128 cơ thủ) vẫn render hết một lượt, không ảo hoá —
 * chấp nhận được ở quy mô hiện tại, xem spec ngày 2026-07-29.
 *
 * Tab đã mở thì được giữ lại (ẩn bằng `display: none`) để chuyển qua chuyển lại
 * không gọi lại API — và nhờ vậy mỗi tab giữ nguyên vị trí cuộn của nó.
 */
export default function TournamentDetail({
  id,
  onOpenMyRegistrations,
  onRegister,
  onPressParticipant,
}) {
  const colors = useThemeColors();

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
    // Chỉ kéo tab Thông tin về đầu. Bốn tab danh sách có vùng cuộn riêng và cố
    // ý giữ nguyên chỗ đang đọc: quay lại tab Trận đấu mà bị ném về đầu danh
    // sách thì phải dò lại từ vòng 1.
    if (tabId === "info") scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="small" color={colors.brand} />
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-canvas px-4">
        <Text className="text-center text-sm text-muted">
          {error || "Không tìm thấy giải đấu."}
        </Text>
        <Pressable
          onPress={load}
          className="rounded-full border border-line-strong bg-surface px-5 py-2.5 active:bg-sunken"
        >
          <Text className="text-sm font-semibold text-content-2">Thử lại</Text>
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
          onRegister={onRegister}
        />
      );
    if (tabId === "players")
      return (
        <PlayersTab
          tournamentId={tournament.id}
          onPressParticipant={onPressParticipant}
        />
      );
    if (tabId === "matches")
      return (
        <MatchesTab
          tournamentId={tournament.id}
          locked={tournament.status === "OPEN_FOR_REGISTRATION"}
          active={activeTab === "matches"}
        />
      );
    if (tabId === "live")
      return (
        <LiveTab tournamentId={tournament.id} active={activeTab === "live"} />
      );
    if (tabId === "ranking")
      return (
        <RankingTab
          tournamentId={tournament.id}
          onPressParticipant={onPressParticipant}
        />
      );
    return null;
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Tab danh sách bỏ hero để nhường chiều cao cho dữ liệu, nhưng vẫn phải
          nhắc người dùng đang xem giải nào. Dải này nằm ngoài mọi vùng cuộn nên
          không trôi đi mất. */}
      {showHero ? null : (
        <View className="border-b border-line bg-surface px-4 py-3">
          <Text numberOfLines={1} className="text-sm font-bold text-content">
            {tournament.name}
          </Text>
        </View>
      )}

      {tabs.map((tab) => {
        if (!visited[tab.id]) return null;

        const active = tab.id === activeTab;

        return (
          <View
            key={tab.id}
            style={active ? styles.fill : styles.hidden}
            // Tab ẩn vẫn nằm trong cây để giữ dữ liệu đã tải; cắt nó khỏi luồng
            // đọc màn hình để trình đọc không xướng nội dung đang không hiện
            aria-hidden={!active}
          >
            {tab.id === "info" ? (
              <ScrollView
                ref={scrollRef}
                className="flex-1"
                // Chừa chỗ cho thanh tab nổi ở đáy, nếu không nó che mất phần cuối
                contentContainerClassName="pb-28"
              >
                <View className="h-48 w-full">
                  <RemoteImage
                    uri={tournament.thumbnailUrl}
                    className="h-full w-full"
                  />
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

                <View className="border-b border-line bg-surface px-4 pb-2 pt-4">
                  <Text className="text-xl font-display uppercase leading-7 text-content">
                    {tournament.name}
                  </Text>

                  <View className="mt-3 flex-row flex-wrap border-t border-line-soft">
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

                <View className="px-4 pt-4">{renderTab("info")}</View>
              </ScrollView>
            ) : (
              renderTab(tab.id)
            )}
          </View>
        );
      })}

      <TournamentTabBar
        tabs={tabs}
        activeId={activeTab}
        onChange={handleChangeTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: "none" },
});
