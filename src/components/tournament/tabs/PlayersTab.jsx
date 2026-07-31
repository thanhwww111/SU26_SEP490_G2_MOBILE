import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import PlayerAvatar from "../PlayerAvatar";
import PlayerName from "../PlayerName";
import SearchField from "../../SearchField";
import SectionState from "../../home/SectionState";
import * as publicTournamentApi from "../../../api/publicTournamentApi";

/**
 * Tab Cơ thủ — danh sách người tham gia giải.
 *
 * Web ẩn người đã rút lui (`WITHDRAWN`) nhưng vẫn hiện người bị loại
 * (`INACTIVE`, làm mờ) vì ở thể thức loại dần họ vẫn là một phần của giải.
 * Mobile giữ nguyên quy tắc đó.
 *
 * Tìm kiếm lọc tại chỗ trên mảng đã tải, không gọi lại API — endpoint
 * `/participants` trả toàn bộ danh sách một lần, không có tham số tìm kiếm.
 *
 * Chưa nối được sang hồ sơ cơ thủ: màn `/event/players/:id` chưa dựng trên
 * mobile, nên mỗi dòng chỉ để đọc chứ không bấm được.
 */
export default function PlayersTab({ tournamentId }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await publicTournamentApi.listPublicParticipants(tournamentId);
        if (alive) setParticipants(data.filter((p) => p.status !== "WITHDRAWN"));
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tournamentId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return participants;
    return participants.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(query) || p.phone?.includes(query)
    );
  }, [participants, search]);

  if (loading || error || participants.length === 0) {
    return (
      <SectionState
        loading={loading}
        error={error}
        emptyMessage="Danh sách cơ thủ chưa được công bố."
      />
    );
  }

  return (
    <View className="gap-3">
      <SearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm cơ thủ..."
      />

      <View className="overflow-hidden rounded-xl border border-line bg-surface">
        {filtered.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-sm text-faint">
              Không tìm thấy cơ thủ.
            </Text>
          </View>
        ) : (
          filtered.map((participant) => {
            const eliminated = participant.status === "INACTIVE";

            return (
              <View
                key={participant.id}
                className="flex-row items-center gap-3 border-b border-line-soft px-4 py-3"
              >
                {/* Backend đặt tên trường là `avtarUrl`, không phải `avatarUrl` */}
                <PlayerAvatar
                  uri={participant.avtarUrl}
                  name={participant.displayName}
                />

                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <PlayerName
                      name={participant.displayName}
                      dimmed={eliminated}
                      className="flex-shrink"
                    />
                    {eliminated ? (
                      <Text className="rounded-full bg-sunken px-2 py-0.5 text-overline font-bold uppercase text-muted">
                        Bị loại
                      </Text>
                    ) : null}
                  </View>

                  {participant.seedNo ? (
                    <Text className="mt-1 text-xs text-faint">
                      Hạt giống #{participant.seedNo}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <View className="px-4 py-2.5">
          <Text className="text-right text-xs text-faint">
            {filtered.length} / {participants.length} cơ thủ
          </Text>
        </View>
      </View>
    </View>
  );
}
