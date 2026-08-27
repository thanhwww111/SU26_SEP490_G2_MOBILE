/* Test cho src/utils/standings.js.
 *
 * Chạy: `node scripts/test-standings.js` từ thư mục gốc repo.
 *
 * Project không có test runner; file này tự nạp babel của Expo để require được
 * module ESM, đúng cách đã ghi ở docs/mobile/11-changelog.md mục "Chạy test".
 *
 * Giữ lại thay vì xoá sau khi chạy — khác các test tạm trước đây — vì thứ tự
 * phân định hạng ở đây PHẢI khớp `BracketGenerationServiceImpl.computeStageStandings()`
 * của backend. Ai sửa thứ tự đó thì chạy lại file này trước khi commit.
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
  computeStandings,
  buildMergedStanding,
  hasLeagueStage,
} = require("../src/utils/standings.js");

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

const p = (id, name) => ({ id, displayName: name });

const match = (p1, p2, s1, s2, status = "COMPLETED") => ({
  player1: p1,
  player2: p2,
  player1Score: s1,
  player2Score: s2,
  status,
});

/* ── computeStandings ── */

const A = p(1, "An");
const B = p(2, "Bình");
const C = p(3, "Cường");

// Vòng tròn 3 người: A thắng cả 2, B thắng C
const roundRobin = [
  match(A, B, 5, 3),
  match(A, C, 5, 1),
  match(B, C, 5, 4),
];

const rr = computeStandings(roundRobin);
eq(
  "xếp hạng theo số trận thắng",
  rr.map((r) => [r.rank, r.name, r.wins, r.losses]),
  [
    [1, "An", 2, 0],
    [2, "Bình", 1, 1],
    [3, "Cường", 0, 2],
  ]
);
eq("hiệu số ván của người dẫn đầu", rr[0].frameDiff, 10 - 4);
eq("ván thắng/thua cộng đủ hai chiều", [rr[2].framesWon, rr[2].framesLost], [5, 10]);
eq("số trận đã đấu", rr.map((r) => r.played), [2, 2, 2]);

// Người chưa đá trận nào vẫn phải có mặt trong bảng
const withUnplayed = computeStandings([
  match(A, B, 5, 3),
  { ...match(A, C, null, null, "PENDING") },
]);
eq("người chưa đá vẫn vào bảng", withUnplayed.length, 3);
eq(
  "trận chưa xong không cộng điểm",
  withUnplayed.find((r) => r.name === "Cường").played,
  0
);

// BYE không được tính là trận đã đấu — không ai đánh ván nào
const withBye = computeStandings([match(A, B, 0, 0, "BYE")]);
eq("BYE không cộng trận", withBye.map((r) => r.played), [0, 0]);

// WALKOVER có tính
const withWo = computeStandings([match(A, B, 5, 0, "WALKOVER")]);
eq("WALKOVER có cộng trận", withWo[0].wins, 1);

// Thiếu `winner` thì suy từ tỷ số
eq("suy người thắng từ tỷ số khi thiếu winner", withWo[0].name, "An");

// Có `winner` thì ưu tiên nó
const winnerWins = computeStandings([
  { ...match(A, B, 3, 5), winner: { id: 1 } },
]);
eq("ưu tiên trường winner của backend", winnerWins[0].name, "An");

/* Tie-break bậc 3: cùng thắng, cùng hiệu số → đối đầu trực tiếp.
   A và B đều 1 thắng 1 thua, hiệu số đều 0; B thắng A ở trận đối đầu nên B trên.
   D (1 thắng, hiệu số +2) đứng đầu và C (0 thắng) đứng cuối, để nhóm hoà đúng
   hai người — nhóm ba người sẽ rơi xuống tie-break tên chứ không phải đối đầu. */
const D = p(4, "Dũng");
const h2h = computeStandings([
  match(B, A, 5, 3), // B thắng A
  match(A, C, 5, 3), // A thắng C
  match(D, B, 5, 3), // D thắng B
]);
eq(
  "đối đầu trực tiếp phân định khi hoà thắng và hiệu số",
  h2h.map((r) => [r.name, r.wins, r.frameDiff]),
  [
    ["Dũng", 1, 2],
    ["Bình", 1, 0],
    ["An", 1, 0],
    ["Cường", 0, -2],
  ]
);

/* Tie-break bậc 5: hoà tuyệt đối → tên A→Z */
const E = p(5, "Yến");
const F = p(6, "Anh");
const byName = computeStandings([
  match(E, p(7, "X"), 5, 0),
  match(F, p(8, "Y"), 5, 0),
]);
eq(
  "hoà tuyệt đối thì xếp theo tên",
  byName.slice(0, 2).map((r) => r.name),
  ["Anh", "Yến"]
);

eq("danh sách rỗng trả bảng rỗng", computeStandings([]), []);
eq("null cũng trả bảng rỗng", computeStandings(null), []);

/* ── buildMergedStanding ── */

const stage = (id, orderNo, stageType, matches) => ({
  id,
  orderNo,
  stageType,
  matches,
});

// Hai giai đoạn vòng tròn: GĐ2 chỉ còn A và B, C bị loại sau GĐ1
const merged = buildMergedStanding([
  stage(1, 1, "PROGRESSIVE_ROUND", [
    match(A, B, 5, 3),
    match(A, C, 5, 1),
    match(B, C, 5, 4),
  ]),
  stage(2, 2, "PROGRESSIVE_ROUND", [match(B, A, 5, 2)]),
]);

eq(
  "người trụ tới giai đoạn sau xếp trên",
  merged.map((r) => [r.rank, r.name, r.eliminated]),
  [
    [1, "Bình", false],
    [2, "An", false],
    [3, "Cường", true],
  ]
);

// GĐ2 đã được tạo sẵn nhưng chưa gán cơ thủ (đang chờ GĐ1 đá xong) → chưa cắt ai
const nextStagePending = buildMergedStanding([
  stage(1, 1, "PROGRESSIVE_ROUND", [
    match(A, B, 5, 3),
    match(A, C, 5, 1),
    match(B, C, 5, 4),
  ]),
  stage(2, 2, "PROGRESSIVE_ROUND", [
    { player1: null, player2: null, status: "PENDING" },
  ]),
]);
eq(
  "giai đoạn kế chưa gán cơ thủ thì chưa cắt ai",
  nextStagePending.map((r) => r.eliminated),
  [false, false, false]
);

// Giai đoạn cuối chưa có mốc cắt nào thì không ai bị đánh dấu loại
const single = buildMergedStanding([
  stage(1, 1, "PROGRESSIVE_ROUND", [match(A, B, 5, 3)]),
]);
eq("một giai đoạn, chưa cắt ai", single.map((r) => r.eliminated), [false, false]);

// Playoff đã điền người → dùng làm mốc cắt cho giai đoạn vòng tròn cuối
const withPlayoff = buildMergedStanding([
  stage(1, 1, "PROGRESSIVE_ROUND", [
    match(A, B, 5, 3),
    match(A, C, 5, 1),
    match(B, C, 5, 4),
  ]),
  stage(2, 2, "PROGRESSIVE_PLAYOFF", [match(A, B, null, null, "PENDING")]),
]);
eq(
  "playoff đã điền người thì cắt theo playoff",
  withPlayoff.map((r) => [r.name, r.eliminated]),
  [
    ["An", false],
    ["Bình", false],
    ["Cường", true],
  ]
);

// Playoff chưa điền người (toàn TBD) thì chưa cắt ai
const emptyPlayoff = buildMergedStanding([
  stage(1, 1, "PROGRESSIVE_ROUND", [match(A, B, 5, 3)]),
  stage(2, 2, "PROGRESSIVE_PLAYOFF", [
    { player1: null, player2: null, status: "PENDING" },
  ]),
]);
eq(
  "playoff chưa điền người thì chưa cắt ai",
  emptyPlayoff.map((r) => r.eliminated),
  [false, false]
);

// Giải loại trực tiếp thuần: không có giai đoạn vòng tròn → không có bảng điểm
eq(
  "giải knockout thuần không có bảng điểm",
  buildMergedStanding([stage(1, 1, "KNOCKOUT", [match(A, B, 5, 3)])]),
  []
);

eq("stages rỗng", buildMergedStanding([]), []);
eq("stages null", buildMergedStanding(null), []);

// Giai đoạn không theo thứ tự trong mảng vẫn phải sắp theo orderNo
const unordered = buildMergedStanding([
  stage(2, 2, "PROGRESSIVE_ROUND", [match(B, A, 5, 2)]),
  stage(1, 1, "PROGRESSIVE_ROUND", [
    match(A, B, 5, 3),
    match(A, C, 5, 1),
    match(B, C, 5, 4),
  ]),
]);
eq(
  "sắp giai đoạn theo orderNo chứ không theo thứ tự mảng",
  unordered.map((r) => r.name),
  ["Bình", "An", "Cường"]
);

/* ── hasLeagueStage ── */

eq("nhận ra giai đoạn vòng tròn", hasLeagueStage([stage(1, 1, "GROUP", [])]), true);
eq(
  "knockout không phải vòng tròn",
  hasLeagueStage([stage(1, 1, "KNOCKOUT", [])]),
  false
);
eq("rỗng", hasLeagueStage([]), false);

console.log(`\n${passed} đạt, ${failed} hỏng`);
process.exit(failed > 0 ? 1 : 0);
