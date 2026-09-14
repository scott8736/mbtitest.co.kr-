import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 오늘의 운세 생성 점검.
 *
 * 운세는 틀려도 티가 안 납니다. 문장이 늘 그럴듯하게 나오기 때문에, 시드가
 * 깨져서 매번 같은 내용이 나오거나 반대로 새로고침마다 바뀌어도 화면만 봐서는
 * 모릅니다. 그래서 세 가지를 고정합니다 — 같은 날은 같게, 다른 날은 다르게,
 * 띠가 다르면 다르게.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export { buildDailyReading, formatKoreanDate } from "./lib/daily-fortune";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { buildDailyReading, formatKoreanDate } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

test("같은 날 같은 대상이면 몇 번을 불러도 같다", () => {
  const a = buildDailyReading("2026-09-14", "rat");
  const b = buildDailyReading("2026-09-14", "rat");
  assert.deepEqual(a, b);
});

test("날짜가 바뀌면 내용도 바뀐다", () => {
  const days = ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"];
  const headlines = new Set(days.map((d) => buildDailyReading(d, "").headline));
  assert.ok(headlines.size >= 3, `닷새 중 ${headlines.size}가지만 나왔습니다`);
});

test("띠가 다르면 같은 날에도 다르게 나온다", () => {
  const animals = ["rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "goat"];
  const headlines = new Set(animals.map((a) => buildDailyReading("2026-09-14", a).headline));
  assert.ok(headlines.size >= 3, `여덟 띠에서 ${headlines.size}가지만 나왔습니다`);
});

test("모든 칸이 채워진다", () => {
  for (const day of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
    const r = buildDailyReading(day, "");
    for (const key of ["headline", "detail", "advice", "caution", "luckyColor", "luckyDirection", "luckyItem"]) {
      assert.ok(r[key] && String(r[key]).length > 1, `${day} 의 ${key} 가 비어 있습니다`);
    }
  }
});

test("총운 점수가 55~95 안에 머문다", () => {
  // 0 점이나 100 점을 내보내면 운세가 아니라 하루에 대한 낙인이 됩니다.
  let min = 100;
  let max = 0;
  for (let d = 1; d <= 28; d += 1) {
    const day = `2026-03-${String(d).padStart(2, "0")}`;
    for (const scope of ["", "rat", "ox", "tiger"]) {
      const s = buildDailyReading(day, scope).score;
      min = Math.min(min, s);
      max = Math.max(max, s);
    }
  }
  assert.ok(min >= 55, `최저 점수가 ${min} 입니다`);
  assert.ok(max <= 95, `최고 점수가 ${max} 입니다`);
});

test("날짜 표기가 한국식 요일까지 맞다", () => {
  // 2026-09-14 는 월요일입니다.
  assert.equal(formatKoreanDate("2026-09-14"), "2026년 9월 14일 (월)");
  assert.equal(formatKoreanDate("2026-01-01"), "2026년 1월 1일 (목)");
});
