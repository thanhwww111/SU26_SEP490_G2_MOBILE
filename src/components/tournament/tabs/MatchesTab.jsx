import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BarChart2, List } from "lucide-react-native";

import TabScreen from "./TabScreen";
import MatchRow from "../MatchRow";
import StandingTable from "../StandingTable";
import ChipRow from "../../ChipRow";
import SearchField from "../../SearchField";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { getBracketPrefix, getRoundLabel } from "../../../constants/tournament";
import { buildMergedStanding, hasLeagueStage } from "../../../utils/standings";
import { iconSize } from "../../../theme/tokens";
import { useThemeColors } from "../../../theme/useThemeColors";

/** Giai đoạn được bày thành chip cho người xem chuyển qua lại */
const NAV_STAGE_TYPES = [
  "PROGRESSIVE_ROUND",
  "GROUP",
  "PROGRESSIVE_PLAYOFF",
  "PLAYOFF",
];

const DONE_STATUSES = ["COMPLETED", "WALKOVER", "BYE"];

/**
 * Gom trận của một giai đoạn thành từng vòng đấu.
 *
 * Thứ tự: theo roundNo tăng dần, trong vòng thì theo positionNo. Nhãn vòng tính
 * ngược từ vòng cuối (chung kết / bán kết / tứ kết) — trừ giai đoạn vòng tròn,
 * ở đó vòng cuối không phải trận chung kết nên chỉ đánh số.
 */
const buildRounds = (stage) => {
  const matches = stage.matches ?? [];
  if (matches.length === 0) return [];

  const roundNos = [...new Set(matches.map((m) => m.roundNo))].sort(
    (a, b) => a - b
  );

  return roundNos.map((roundNo, index) => {
    const items = matches
      .filter((m) => m.roundNo === roundNo)
      .sort((a, b) => (a.positionNo ?? 0) - (b.positionNo ?? 0));

    return {
      key: `s${stage.id}-r${roundNo}`,
      label:
        getBracketPrefix(stage.stageType) +
        getRoundLabel(roundNo, roundNos.length - 1 - index, stage.stageType),
      raceTo: items.find((m) => m.raceTo != null)?.raceTo ?? null,
      matches: items,
    };
  });
};

/** Nhãn chip giai đoạn — backend không phải lúc nào cũng đặt tên */
const stageLabel = (stage) => {
  if (stage.name) return stage.name;
  if (stage.stageType === "PROGRESSIVE_PLAYOFF" || stage.stageType === "PLAYOFF")
    return "Playoff";
  return `Giai đoạn ${stage.orderNo ?? "—"}`;
};

/** Nút chuyển giữa Lịch đấu và Bảng điểm */
const ViewToggle = ({ view, onChange, colors }) => {
  const options = [
    { id: "list", label: "Lịch đấu", Icon: List },
    { id: "standing", label: "Bảng điểm", Icon: BarChart2 },
  ];

  return (
    <View className="flex-row gap-2">
      {options.map(({ id, label, Icon }) => {
        const active = id === view;

        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`h-9 flex-1 flex-row items-center justify-center gap-2 rounded-full ${
              active
                ? "bg-navy-900"
                : "border border-line-strong bg-surface active:bg-sunken"
            }`}
          >
            <Icon
              size={iconSize.sm}
              color={active ? colors.textInverse : colors.content2}
            />
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-content-2"
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

/**
 * Tab Trận đấu — lịch, kết quả và bảng điểm.
 *
 * Đọc `/tournaments/{id}/stages` chứ không phải `/matches`: bảng điểm gộp cần
 * biết thứ tự các giai đoạn (`orderNo`) và chip giai đoạn cần tên thật
 * (`name`), hai trường đó chỉ có ở endpoint stages. Tab Trực tiếp vẫn dùng
 * `/matches` — nó chỉ cần các trận đang đá, không quan tâm giai đoạn.
 *
 * KHÁC WEB: web có thêm chế độ xem sơ đồ bracket (SVG, zoom, kéo thả). Mobile
 * bỏ hẳn — sơ đồ cần màn rộng, đúng như docs/mobile/07-web-mapping.md đã chốt.
 * Hai chế độ còn lại (Lịch đấu, Bảng điểm) và cả ba bộ lọc thì có đủ.
 *
 * Bảng điểm chỉ hiện khi giải có giai đoạn vòng tròn. Giải loại trực tiếp thuần
 * không có bảng điểm nào để tính, bày nút rỗng chỉ làm người dùng bấm hụt.
 *
 * Tỷ số cập nhật tức thời qua cùng đường socket với tab Trực tiếp. Nếu chỉ một
 * trong hai tab nghe socket thì cùng một trận sẽ hiện hai tỷ số khác nhau tuỳ
 * người dùng đang mở tab nào — nên cả hai cùng nghe, và bảng điểm cũng tự tính
 * lại theo vì nó dựng từ chính mảng `stages` này.
 */
export default function MatchesTab({ tournamentId, locked, active }) {
  const colors = useThemeColors();

  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(!locked);
  const [error, setError] = useState("");

  const [view, setView] = useState("list");
  const [stageId, setStageId] = useState(null);
  const [roundKey, setRoundKey] = useState("");
  const [search, setSearch] = useState("");

  const alive = useRef(true);

  const load = useCallback(async () => {
    const data = await publicTournamentApi.getPublicStages(tournamentId);
    if (alive.current) setStages(data);
  }, [tournamentId]);

  useEffect(() => {
    alive.current = true;

    // Giải chưa bốc thăm thì backend chưa có trận nào — khỏi gọi cho tốn request
    if (locked) {
      return () => {
        alive.current = false;
      };
    }

    (async () => {
      try {
        await load();
      } catch (e) {
        if (alive.current) setError(e.message);
      } finally {
        if (alive.current) setLoading(false);
      }
    })();

    return () => {
      alive.current = false;
    };
  }, [load, locked]);

  /**
   * Thay một trận trong mảng stage khi socket báo tỷ số mới.
   *
   * Giữ nguyên hình dạng `stages` thay vì tải lại cả endpoint: mọi thứ trong tab
   * (danh sách vòng, bộ lọc, bảng điểm) đều dựng từ mảng này, nên chỉ cần thay
   * đúng phần tử là cả ba tự tính lại.
   */
  const applyMatch = useCallback((match) => {
    if (!alive.current) return;

    setStages((prev) =>
      prev.map((stage) => {
        const list = stage.matches ?? [];
        if (!list.some((m) => m.id === match.id)) return stage;

        return {
          ...stage,
          matches: list.map((m) => (m.id === match.id ? { ...m, ...match } : m)),
        };
      })
    );
  }, []);

  useTournamentSocket(tournamentId, {
    enabled: Boolean(active) && !locked,
    onMatchUpdate: applyMatch,
    // Bốc thăm lại hoặc chuyển giai đoạn thì cấu trúc vòng đổi hẳn, không đắp
    // từng trận được nữa — đọc lại từ REST cho chắc
    onBracketSync: () => {
      load().catch(() => {
        /* giữ nguyên dữ liệu đang hiện */
      });
    },
    onReconnect: () => {
      load().catch(() => {
        /* giữ nguyên dữ liệu đang hiện */
      });
    },
  });

  /* Chip giai đoạn, xếp theo orderNo như web */
  const navStages = useMemo(
    () =>
      stages
        .filter((s) => NAV_STAGE_TYPES.includes(s.stageType))
        .slice()
        .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)),
    [stages]
  );

  const showStageChips = navStages.length > 1;

  /* Giai đoạn đang xem. Không chọn gì thì lấy tất cả, trừ khi chip đang hiện —
     lúc đó phải chốt một giai đoạn, "tất cả" trộn hai thể thức vào một danh
     sách thì nhãn vòng của hai bên đè lên nhau */
  const activeStages = useMemo(() => {
    if (stageId == null) return showStageChips ? navStages.slice(0, 1) : stages;
    return stages.filter((s) => s.id === stageId);
  }, [stages, navStages, stageId, showStageChips]);

  const stageOptions = useMemo(
    () =>
      navStages.map((stage) => {
        const total = stage.matches?.length ?? 0;
        const done = (stage.matches ?? []).filter((m) =>
          DONE_STATUSES.includes(m.status)
        ).length;

        return {
          value: stage.id,
          label: stageLabel(stage),
          badge: total > 0 ? `${done}/${total}` : null,
        };
      }),
    [navStages]
  );

  const rounds = useMemo(
    () => activeStages.flatMap((stage) => buildRounds(stage)),
    [activeStages]
  );

  const roundOptions = useMemo(
    () => [
      { value: "", label: "Tất cả vòng" },
      ...rounds.map((round) => ({ value: round.key, label: round.label })),
    ],
    [rounds]
  );

  /* Đổi giai đoạn thì vòng của giai đoạn cũ không còn tồn tại — bỏ lọc, nếu
     không danh sách rỗng mà người dùng không hiểu vì sao */
  useEffect(() => {
    if (roundKey && !rounds.some((r) => r.key === roundKey)) setRoundKey("");
  }, [rounds, roundKey]);

  const filteredRounds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rounds
      .filter((round) => !roundKey || round.key === roundKey)
      .map((round) => ({
        ...round,
        matches: query
          ? round.matches.filter(
              (m) =>
                m.player1?.displayName?.toLowerCase().includes(query) ||
                m.player2?.displayName?.toLowerCase().includes(query)
            )
          : round.matches,
      }))
      .filter((round) => round.matches.length > 0);
  }, [rounds, roundKey, search]);

  const matchCount = useMemo(
    () => filteredRounds.reduce((sum, round) => sum + round.matches.length, 0),
    [filteredRounds]
  );

  /* Bảng điểm gộp toàn giải, không tách theo giai đoạn — giống web */
  const standing = useMemo(() => buildMergedStanding(stages), [stages]);
  const showStanding = hasLeagueStage(stages);
  const activeView = showStanding ? view : "list";

  if (locked) {
    return (
      <TabScreen>
        <SectionState emptyMessage="Lịch thi đấu chưa được xếp — giải vẫn đang mở đăng ký." />
      </TabScreen>
    );
  }

  if (loading || error || stages.length === 0) {
    return (
      <TabScreen>
        <SectionState
          loading={loading}
          error={error}
          emptyMessage="Chưa có trận đấu nào."
        />
      </TabScreen>
    );
  }

  /*
   * Chỉ ô tìm kiếm và chip vòng được giữ cố định.
   *
   * Nút Lịch đấu/Bảng điểm và chip giai đoạn thì bấm một lần rồi thôi, còn tìm
   * tên cơ thủ và nhảy vòng là thao tác lặp đi lặp lại giữa chừng danh sách.
   * Nhét cả bốn cụm lên trên sẽ ăn gần 180 điểm ảnh, tức là hơn một phần năm
   * màn hình chỉ để bày nút.
   */
  const filters =
    activeView === "list" ? (
      <>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tên cơ thủ..."
        />

        {roundOptions.length > 2 ? (
          <ChipRow
            label="Chọn vòng"
            inset={false}
            options={roundOptions}
            value={roundKey}
            onChange={setRoundKey}
          />
        ) : null}
      </>
    ) : null;

  return (
    <TabScreen filters={filters}>
      {showStanding ? (
        <ViewToggle view={activeView} onChange={setView} colors={colors} />
      ) : null}

      {showStageChips ? (
        <ChipRow
          label="Chọn giai đoạn"
          inset={false}
          options={stageOptions}
          value={stageId ?? navStages[0]?.id}
          onChange={setStageId}
        />
      ) : null}

      {activeView === "standing" ? (
        <StandingTable rows={standing} />
      ) : (
        <>
          <Text className="text-right text-xs text-faint">
            {matchCount} trận
          </Text>

          {filteredRounds.length === 0 ? (
            <View className="gap-3 rounded-xl border border-line bg-surface py-8">
              <Text className="text-center text-sm text-faint">
                Không tìm thấy trận đấu phù hợp.
              </Text>

              {search || roundKey ? (
                <Pressable
                  onPress={() => {
                    setSearch("");
                    setRoundKey("");
                  }}
                  className="self-center rounded-full border border-line-strong px-5 py-2 active:bg-sunken"
                >
                  <Text className="text-sm font-semibold text-content-2">
                    Xóa bộ lọc
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            filteredRounds.map((round) => (
              <View
                key={round.key}
                className="overflow-hidden rounded-xl border border-line bg-surface"
              >
                {/* Web tô gradient đỏ cho thanh tiêu đề vòng; RN chưa có thư viện
                    gradient trong project nên dùng nền navy đặc như các khối tối khác */}
                <View className="flex-row items-center justify-between bg-band px-4 py-2.5">
                  <Text className="text-sm font-semibold text-white">
                    {round.label}
                  </Text>
                  {round.raceTo != null ? (
                    <Text className="text-xs text-navy-500">
                      Race to {round.raceTo}
                    </Text>
                  ) : null}
                </View>

                {round.matches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </View>
            ))
          )}
        </>
      )}
    </TabScreen>
  );
}
