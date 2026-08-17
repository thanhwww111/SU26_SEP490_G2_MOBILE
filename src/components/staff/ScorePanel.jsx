import { Pressable, Text, View } from "react-native";
import { Crown, Hand, Undo2 } from "lucide-react-native";

import { iconSize } from "../../theme/tokens";

/**
 * Một nửa bảng điểm. Bám `ScorePanel` của `FE/src/pages/Staff/Matches/ScorePanel.jsx`.
 *
 * Hai chỗ cố ý bỏ so với web:
 *
 * 1. **Ảnh cơ thủ tràn nền.** Web làm mềm biên ảnh bằng giao của hai gradient trong một CSS mask
 *    (`maskComposite: intersect`). React Native không có `mask-image`; dựng lại bằng ảnh mờ
 *    không mask sẽ ra đúng cái rìa chữ nhật mà web đã cố tránh. Trên màn 6 inch ảnh nền cũng chỉ
 *    làm số điểm khó đọc, nên bỏ hẳn thay vì làm nửa vời.
 * 2. **Quầng sáng radial sau lưng cơ thủ.** Cùng lý do: cần gradient.
 *
 * Trạng thái (đang tới lượt / đã thắng) vẫn phân biệt được, bằng vạch nhấn ở mép trên và badge —
 * hai thứ web cũng có, và không dựa vào gradient.
 *
 * Toàn khối nằm trên nền tối cố ý nên dùng màu tuyệt đối, không dùng token vai trò.
 */

const PANEL_BG = "#0A0E14";

const ProgressPips = ({ score, raceTo, accent }) => {
  const total = Math.max(raceTo ?? 5, 1);

  return (
    <View className="flex-row items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className="h-1.5 w-5 rounded-full"
          style={{ backgroundColor: i < score ? accent : "rgba(255,255,255,0.08)" }}
        />
      ))}
    </View>
  );
};

export default function ScorePanel({
  name,
  score,
  slot,
  accent,
  raceTo,
  centerGap = 16,
  stacked = false,
  canAdd,
  canUndo,
  finished,
  isWinner,
  dimmed,
  hasTurn,
  onTapPlus,
  onMinus,
}) {
  /**
   * Đối xứng gương chỉ có nghĩa khi hai panel nằm cạnh nhau: nút của mỗi người ở phía người đó.
   * Xếp chồng thì cả hai panel cùng chiếm trọn bề ngang, đảo thứ tự nút chỉ khiến nút "+1" của
   * hai cơ thủ nằm hai đầu khác nhau — trọng tài phải nhìn mới bấm đúng.
   */
  const mirrored = slot === 2 && !stacked;

  /**
   * Tên và điểm nằm GIỮA nửa màn của mỗi cơ thủ, không dồn về phía trong.
   *
   * Web dồn vào giữa vì mép ngoài đã có ảnh cơ thủ chiếm chỗ; mobile bỏ ảnh đó (xem ghi chú đầu
   * file) nên lý do dồn cũng mất theo — giữ lại chỉ khiến hai con số ríu vào mặt đồng hồ, đúng
   * như bản đầu bị.
   *
   * `centerGap` vẫn còn việc: nó là khoảng chừa cho đồng hồ, trừ vào cạnh phía trong TRƯỚC khi
   * căn giữa. Nhờ vậy tâm của nội dung tự dịch ra ngoài đúng bằng nửa bề rộng đồng hồ, và tên
   * cơ thủ dài cũng không chui xuống dưới mặt đồng hồ.
   */
  const innerPad = mirrored
    ? { paddingLeft: centerGap, paddingRight: 16 }
    : { paddingRight: centerGap, paddingLeft: 16 };

  return (
    <View className="flex-1" style={{ backgroundColor: PANEL_BG, opacity: dimmed ? 0.55 : 1 }}>
      {/* Nền pha màu của cơ thủ — một lớp đặc mỏng thay cho gradient của web */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: accent,
          opacity: 0.1,
        }}
      />

      {/* Vạch nhấn ở mép trên: dấu hiệu duy nhất còn lại cho "đang tới lượt" sau khi bỏ quầng sáng */}
      {hasTurn || isWinner ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: accent,
          }}
        />
      ) : null}

      <View className="flex-1 items-center pt-4" style={innerPad}>
        <View className="flex-row items-center gap-2">
          <Text className="text-overline font-bold uppercase" style={{ color: accent }}>
            Cơ thủ {slot}
          </Text>

          {hasTurn ? (
            <View
              className="flex-row items-center gap-1.5 rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${accent}33` }}
            >
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              <Text className="text-overline font-bold uppercase" style={{ color: accent }}>
                Đang đánh
              </Text>
            </View>
          ) : null}

          {isWinner ? (
            <View className="flex-row items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5">
              <Crown size={12} color="#C9A227" />
              <Text className="text-overline font-bold uppercase text-gold">Thắng</Text>
            </View>
          ) : null}
        </View>

        <Text numberOfLines={1} className="mt-1 w-full text-center text-xl font-semibold text-white">
          {name}
        </Text>

        {/* Cả vùng số là nút +1: trọng tài chạm bằng ngón cái mà không cần nhìn màn hình */}
        <Pressable
          onPress={onTapPlus}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel={`Cộng 1 điểm cho ${name}`}
          className="w-full flex-1 items-center justify-center gap-4"
        >
          <Text className="font-black text-white" style={{ fontSize: 88, lineHeight: 96 }}>
            {score}
          </Text>

          <ProgressPips score={score} raceTo={raceTo} accent={accent} />
        </Pressable>
      </View>

      <View
        className={`flex-row items-stretch gap-2 px-3 py-3 ${
          mirrored ? "flex-row-reverse" : "flex-row"
        }`}
        style={{ backgroundColor: PANEL_BG, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}
      >
        <Pressable
          onPress={onTapPlus}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityLabel={`Cộng 1 điểm cho ${name}`}
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl"
          style={
            canAdd
              ? { backgroundColor: accent }
              : { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }
          }
        >
          {canAdd ? <Hand size={iconSize.md} color="#FFFFFF" /> : null}
          <Text className={`text-base font-bold ${canAdd ? "text-white" : "text-slate-500"}`}>
            {canAdd ? "+1 điểm" : finished ? "Đã kết thúc" : "Đã đủ điểm"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onMinus}
          disabled={!canUndo}
          accessibilityRole="button"
          accessibilityLabel={`Hoàn tác, trừ 1 điểm của ${name}`}
          className={`h-14 flex-row items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.05] px-4 ${
            canUndo ? "" : "opacity-25"
          }`}
        >
          <Undo2 size={iconSize.md} color="#94A3B8" />
          <Text className="text-base font-semibold text-slate-400">−1</Text>
        </Pressable>
      </View>
    </View>
  );
}
