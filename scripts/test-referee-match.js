/* Test cho src/utils/refereeMatch.js và src/utils/shotClock.js.
 *
 * Chạy: `node scripts/test-referee-match.js` từ thư mục gốc repo.
 *
 * Giữ lại vì hai lý do:
 *  - Thứ tự và cách nhóm trận phải khớp `FE/src/utils/refereeMatch.js`. Trọng tài nhìn cùng một
 *    danh sách trên web và trên điện thoại; hai bên xếp khác nhau là gọi nhầm bàn.
 *  - Luật đồng hồ (30s, +30s cú mở ván, luân phiên phá) khớp `FE/src/utils/shotClock.js`.
 *
 * Khuôn nạp babel lấy từ scripts/test-standings.js — xem docs/mobile/11-changelog.md, mục
 * "Chạy test".
 */
process.env.NODE_ENV = "test";
const babel = require("@babel/core");
const Module = require("module");
const origJs = Module._extensions[".js"];

Module._extensions[".js"] = (module, filename) => {
  if (filename.includes("node_modules")) return origJs(module, filename);
  const { code } = babel.transformFileSync(filename, {
    presets: ["babel-preset-expo"],
    babelrc: false,
    configFile: false,
  });
  module._compile(code, filename);
};

const {
  filterMatchesByDay,
  formatMatchScheduleLabel,
  groupRefereeMatches,
  isMatchDue,
  pickDefaultWinnerId,
  sortRefereeMatches,
  countDistinctTournaments,
} = require("../src/utils/refereeMatch.js");

const {
  nextBreakSlot,
  otherSlot,
  shotDurationSeconds,
  toRemainingSeconds,
} = require("../src/utils/shotClock.js");

let passed = 0;
let failed = 0;

const eq = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    passed++;
  } else {
    failed++;
    console.log(`FAIL  ${name}\n  mong đợi: ${b}\n  nhận được: ${a}`);
  }
};

/** Giờ cố định để test không đổi kết quả theo lúc chạy */
const NOW = new Date(2026, 7, 17, 14, 0, 0); // 17/08/2026 14:00 giờ địa phương

const at = (day, hour, minute = 0) =>
  new Date(2026, 7, day, hour, minute, 0).toISOString();

const m = (id, status, extra = {}) => ({
  id,
  status,
  tableNo: extra.tableNo ?? null,
  scheduledAt: extra.scheduledAt ?? null,
  tournamentId: extra.tournamentId ?? 1,
  tournamentName: extra.tournamentName ?? "Giải A",
  ...extra,
});

/* ── sortRefereeMatches ── */

eq(
  "đang đấu lên trước, rồi tới sắp đấu, cuối cùng là đã xong",
  sortRefereeMatches([
    m(1, "COMPLETED"),
    m(2, "PENDING", { scheduledAt: at(17, 16) }),
    m(3, "IN_PROGRESS"),
  ]).map((x) => x.id),
  [3, 2, 1]
);

eq(
  "hai trận cùng chờ thì trận tới giờ sớm hơn lên trước",
  sortRefereeMatches([
    m(1, "PENDING", { scheduledAt: at(17, 18) }),
    m(2, "PENDING", { scheduledAt: at(17, 15) }),
  ]).map((x) => x.id),
  [2, 1]
);

eq(
  "chưa xếp giờ thì xuống cuối nhóm chờ",
  sortRefereeMatches([
    m(1, "PENDING", { scheduledAt: null }),
    m(2, "PENDING", { scheduledAt: at(17, 15) }),
  ]).map((x) => x.id),
  [2, 1]
);

eq(
  "cùng trạng thái cùng giờ thì xếp theo số bàn",
  sortRefereeMatches([
    m(1, "IN_PROGRESS", { tableNo: 7 }),
    m(2, "IN_PROGRESS", { tableNo: 2 }),
  ]).map((x) => x.id),
  [2, 1]
);

/* ── groupRefereeMatches ── */

const grouped = groupRefereeMatches([
  m(1, "IN_PROGRESS"),
  m(2, "PENDING"),
  m(3, "COMPLETED"),
  m(4, "WALKOVER"),
  m(5, "BYE"),
]);

eq("nhóm đang diễn ra", grouped.live.map((x) => x.id), [1]);
eq("nhóm sắp tới", grouped.upcoming.map((x) => x.id), [2]);
eq(
  "walkover và bye tính là đã xong, giống web",
  grouped.finished.map((x) => x.id),
  [3, 4, 5]
);

/* ── filterMatchesByDay ── */

const dayFixture = [
  m(1, "PENDING", { scheduledAt: at(17, 16) }), // hôm nay
  m(2, "PENDING", { scheduledAt: at(18, 10) }), // ngày mai
  m(3, "PENDING", { scheduledAt: at(20, 10) }), // ngày kia
  m(4, "PENDING", { scheduledAt: null }), // chưa xếp giờ
  m(5, "IN_PROGRESS", { scheduledAt: at(15, 10) }), // đang đấu, lịch ghi hôm kia
];

/* `filterMatchesByDay` đọc giờ hệ thống nên phải giả lập Date.now cho ổn định */
const RealDate = Date;
global.Date = class extends RealDate {
  constructor(...args) {
    if (args.length === 0) return new RealDate(NOW);
    return new RealDate(...args);
  }
  static now() {
    return NOW.getTime();
  }
};

eq(
  "hôm nay: gồm trận hôm nay, trận chưa xếp giờ và trận đang đấu",
  filterMatchesByDay(dayFixture, "today").map((x) => x.id),
  [1, 4, 5]
);

eq(
  "ngày mai: chỉ trận có lịch ngày mai",
  filterMatchesByDay(dayFixture, "tomorrow").map((x) => x.id),
  [2]
);

eq("mọi ngày: giữ nguyên", filterMatchesByDay(dayFixture, "all").length, 5);

/* ── isMatchDue ── */

eq("trận quá giờ là đã tới lượt", isMatchDue(m(1, "PENDING", { scheduledAt: at(17, 13) })), true);
eq("trận chưa tới giờ thì chưa", isMatchDue(m(1, "PENDING", { scheduledAt: at(17, 16) })), false);
eq("trận chưa xếp giờ coi như tới lượt", isMatchDue(m(1, "PENDING")), true);
eq("trận đang đấu không tính là chờ tới lượt", isMatchDue(m(1, "IN_PROGRESS")), false);

/* ── formatMatchScheduleLabel ── */

eq("nhãn hôm nay", formatMatchScheduleLabel(at(17, 16, 30)), "Hôm nay 16:30");
eq("nhãn ngày mai", formatMatchScheduleLabel(at(18, 9, 5)), "Ngày mai 09:05");
eq("chưa xếp giờ", formatMatchScheduleLabel(null), "Chưa xếp giờ");

global.Date = RealDate;

/* ── countDistinctTournaments ── */

eq(
  "đếm số giải khác nhau",
  countDistinctTournaments([
    m(1, "PENDING", { tournamentId: 1 }),
    m(2, "PENDING", { tournamentId: 1 }),
    m(3, "PENDING", { tournamentId: 2, tournamentName: "Giải B" }),
  ]),
  2
);

/* ── pickDefaultWinnerId ── */

const withPlayers = { player1: { id: 11 }, player2: { id: 22 } };
eq("người dẫn điểm là mặc định", pickDefaultWinnerId(withPlayers, 5, 3), 11);
eq("bên kia dẫn thì đổi", pickDefaultWinnerId(withPlayers, 2, 5), 22);
eq("hoà thì không đoán, để trọng tài chọn", pickDefaultWinnerId(withPlayers, 4, 4), null);

/* ── shotClock ── */

eq("cú thường 30 giây", shotDurationSeconds(false), 30);
eq("cú mở ván được cộng thêm 30", shotDurationSeconds(true), 60);
eq("đối thủ của slot 1", otherSlot(1), 2);
eq("đối thủ của slot 2", otherSlot(2), 1);
eq("luân phiên phá: đổi người", nextBreakSlot("alternate", 1, 2), 2);
eq("người thắng phá: lấy người vừa thắng ván", nextBreakSlot("winner", 1, 1), 1);
eq(
  "người thắng phá nhưng chưa biết ai thắng thì rơi về luân phiên",
  nextBreakSlot("winner", 1, null),
  2
);
eq("giây còn lại làm tròn lên", toRemainingSeconds(2400), 3);
eq("hết giờ không âm", toRemainingSeconds(-500), 0);

console.log(`\n${passed} đạt, ${failed} hỏng`);
process.exit(failed > 0 ? 1 : 0);
