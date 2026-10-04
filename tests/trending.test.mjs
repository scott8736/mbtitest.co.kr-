import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 홈 「요즘 뜨는 심리테스트」가 고르는 규칙.
 *
 * 상승이라고 말하는 숫자는 사람이 그대로 믿습니다. 바닥값 출렁임에 배지를 붙이거나,
 * 사이트에 없는 검사로 보내거나, 같은 검사를 두 장 내면 안 됩니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { pickTrending, TREND_KEYWORD_TESTS, TRENDING_LIMIT } from "./lib/trending";
      export { testCatalog } from "./lib/test-catalog";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

const published = new Set(mod.testCatalog.filter((t) => t.status === "published").map((t) => t.slug));
const known = (slug) => published.has(slug);
const row = (keyword, recent, previous) => ({
  keyword,
  recent,
  previous,
  change: previous > 0 ? ((recent - previous) / previous) * 100 : null,
});

// 관리자 트렌드 화면 2026-10-04 14:15 값 그대로.
const oct4 = [
  row("번아웃테스트", 11.8, 8.5),
  row("성격유형검사", 8.5, 8.4),
  row("연애테스트", 12.5, 12.7),
  row("자존감테스트", 2.8, 2.9),
  row("MBTI검사", 76.5, 81.9),
  row("심리테스트", 73.9, 82.0),
  row("HSP테스트", 1.4, 1.6),
  row("애니어그램테스트", 1.0, 1.2),
  row("나르시시스트테스트", 0.3, 0.4),
  row("에겐테토", 0.1, 0.1),
];

test("키워드가 가리키는 검사는 모두 실제로 열려 있는 검사다", () => {
  for (const [keyword, slug] of Object.entries(mod.TREND_KEYWORD_TESTS)) {
    assert.ok(known(slug), `${keyword} → ${slug} 는 사이트에 없는 검사`);
  }
});

test("10-04 실제 값: 번아웃만 상승 배지, 나머지는 배지 없이 순서대로", () => {
  const items = mod.pickTrending(oct4, known);
  assert.equal(items.length, mod.TRENDING_LIMIT);
  assert.deepEqual(items.map((i) => i.slug), ["burnout", "mbti", "love-tendency", "self-esteem"]);
  assert.deepEqual(items.map((i) => i.rising), [true, false, false, false]);
  assert.equal(Math.round(items[0].change), 39);
});

test("같은 검사로 가는 키워드(MBTI검사·성격유형검사)는 한 장만, 더 오른 쪽으로", () => {
  const items = mod.pickTrending(oct4, known);
  const mbti = items.filter((i) => i.slug === "mbti");
  assert.equal(mbti.length, 1);
  assert.equal(mbti[0].keyword, "성격유형검사");
});

test("맞는 검사가 없는 키워드(심리테스트·애니어그램·나르시시스트)는 버린다", () => {
  const items = mod.pickTrending(oct4, known);
  for (const keyword of ["심리테스트", "애니어그램테스트", "나르시시스트테스트"]) {
    assert.ok(!items.some((i) => i.keyword === keyword), keyword);
  }
});

test("검색이 거의 없는 바닥값(에겐테토 0.1 → 0.2, +100%)은 상승이라 하지 않고 카드에서도 뺀다", () => {
  const items = mod.pickTrending([row("에겐테토", 0.2, 0.1), row("번아웃테스트", 5, 4.9)], known);
  assert.deepEqual(items.map((i) => i.slug), ["burnout"]);
  assert.equal(items[0].rising, false, "+2% 는 배지 없음");
});

test("이전 값이 0이라 상승률이 없으면 배지도 없다", () => {
  const items = mod.pickTrending([row("번아웃테스트", 3, 0)], known);
  assert.equal(items[0].change, null);
  assert.equal(items[0].rising, false);
});
