import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 검사 결과 화면의 "다음 행동" 계약.
 *
 * 결과를 본 사람이 할 수 있는 일이 뒤로가기뿐이면 사이트를 떠납니다. 결과 화면마다
 *   1) 그 결과에 맞춘 쿠팡 추천 카드 (링크가 없으면 카드가 조용히 숨겨짐)
 *   2) 다음 테스트 추천 3개 이상 (자기 자신 제외, 실제로 열리는 테스트)
 * 이 있어야 합니다. 둘 다 데이터가 비면 화면은 멀쩡한 채로 빠지므로 여기서 셉니다.
 *
 * 자가진단(/check/)에는 쿠팡 카드를 달지 않습니다. 우울·불안 결과 옆에 상품을
 * 파는 것은 맞지 않다고 봤습니다 — 대신 관련 자가진단 추천만 요구합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { genericTests } from "./lib/generic-tests";
      export { testPicks } from "./lib/test-picks";
      export { mbtiPicks } from "./lib/mbti-picks";
      export { typeData } from "./lib/mbti-data";
      export { testCatalog } from "./lib/test-catalog";
      export { screeners } from "./lib/screeners";
      export { iqBands, IQ_SLUG } from "./lib/iq-test";
      export { resolveTestPick, CATEGORY_FALLBACK } from "./lib/pick-fallback";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { genericTests, testPicks, mbtiPicks, typeData, testCatalog, screeners, iqBands, IQ_SLUG, resolveTestPick, CATEGORY_FALLBACK } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const COUPANG = /^https:\/\/link\.coupang\.com\/a\/[A-Za-z0-9]+$/;
const published = new Map(testCatalog.filter((t) => t.status === "published").map((t) => [t.slug, t]));
const MIN_NEXT = 3;

test("성향 테스트·IQ 의 모든 결과 화면에 쿠팡 추천 카드가 나온다 (결과별 또는 분야별 기본)", () => {
  const missing = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    for (const key of Object.keys(t.results)) {
      const pick = resolveTestPick(slug, key);
      if (!pick || !COUPANG.test(pick.coupangUrl)) missing.push(`${slug}/${key}`);
    }
  }
  for (const band of iqBands) {
    if (!resolveTestPick(IQ_SLUG, String(band.min))) missing.push(`iq/${band.min}`);
  }
  assert.deepEqual(missing, [], `쿠팡 추천이 안 나오는 결과 ${missing.length}개: ${missing.join(", ")}`);
});

test("분야별 기본 추천이 카탈로그의 모든 분야를 덮고, 링크가 올바르다", () => {
  const categories = new Set(testCatalog.map((t) => t.category));
  for (const c of categories) {
    assert.ok(COUPANG.test(CATEGORY_FALLBACK[c]?.coupangUrl ?? ""), `${c} 분야 기본 추천 없음`);
  }
});

test("참고: 결과별 전용 추천 비율 (실패하지 않음)", () => {
  let total = 0;
  let own = 0;
  for (const [slug, t] of Object.entries(genericTests)) {
    for (const key of Object.keys(t.results)) {
      total++;
      if (COUPANG.test(testPicks[slug]?.[key]?.coupangUrl ?? "")) own++;
    }
  }
  console.log(`  결과별 전용 쿠팡 추천 ${own}/${total} — 나머지는 분야별 기본 추천`);
});

test("MBTI 16유형 결과에 모두 쿠팡 추천 링크가 있다", () => {
  const missing = Object.keys(typeData).filter((code) => !COUPANG.test(mbtiPicks[code]?.coupangUrl ?? ""));
  assert.deepEqual(missing, []);
});

test(`성향 테스트 결과마다 다음 테스트 추천이 ${MIN_NEXT}개 이상이고 모두 열린다`, () => {
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    const next = t.related.filter((s) => s !== slug && published.has(s));
    const dead = t.related.filter((s) => !published.has(s));
    if (t.related.includes(slug)) problems.push(`${slug}: 자기 자신을 추천`);
    if (dead.length) problems.push(`${slug}: 없는 테스트 추천 ${dead.join(",")}`);
    if (next.length < MIN_NEXT) problems.push(`${slug}: 추천 ${next.length}개`);
  }
  assert.deepEqual(problems, [], problems.join("\n"));
});

test("자가진단 결과마다 관련 자가진단 추천이 2개 이상이고 모두 있다", () => {
  const slugs = new Set(screeners.map((s) => s.slug));
  const problems = screeners
    .map((s) => ({ slug: s.slug, ok: s.related.filter((r) => r !== s.slug && slugs.has(r)) }))
    .filter((row) => row.ok.length < 2)
    .map((row) => `${row.slug}: ${row.ok.length}개`);
  assert.deepEqual(problems, []);
});

test("쿠팡 파트너스 고지문구는 푸터(SiteFooter) 한 곳에만 있다 — 사용자 규칙", async () => {
  // 2026-10-01 사용자 지시: "쿠팡 파트너스 활동 문구 빼라. 맨 밑에 있다."
  // 추천 카드마다 고지문구를 붙였다가 두 번 지적받았다. 푸터 말고는 넣지 않는다.
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join, relative } = await import("node:path");
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  const offenders = ["components", "app"]
    .flatMap((dir) => walk(join(repoRoot, dir)))
    .filter((file) => /\.(tsx|ts)$/.test(file) && !file.endsWith("SiteFooter.tsx"))
    .filter((file) => /AFFILIATE_DISCLOSURE|파트너스 활동/.test(readFileSync(file, "utf8")))
    .map((file) => relative(repoRoot, file));
  assert.deepEqual(offenders, [], `푸터 밖에 파트너스 고지문구가 있습니다: ${offenders.join(", ")}`);
});

test("사주랩 배너가 결과 화면 9자리 모두에 붙어 있고, 자가진단에는 없다", async () => {
  const { readFile } = await import("node:fs/promises");
  const read = (f) => readFile(new URL(`../components/${f}`, import.meta.url), "utf8");
  const expected = {
    "MbtiResult.tsx": ['placement="mbti"'],
    "GenericTestRunner.tsx": ['placement="test"'],
    "SharedResult.tsx": ['placement="shared"'],
    "IqTestRunner.tsx": ['placement="iq"'],
    "TarotDaily.tsx": ['placement="tarot"'],
    "FortuneTool.tsx": ['"fortune-today"', '"fortune-saju"', '"fortune-saju-mbti"'],
    "CoupleFortuneTool.tsx": ['placement="gunghap"'],
  };
  const missing = [];
  for (const [file, needles] of Object.entries(expected)) {
    const src = await read(file);
    if (!src.includes("<SajuLabBanner")) missing.push(file);
    for (const n of needles) if (!src.includes(n)) missing.push(`${file} ${n}`);
  }
  assert.deepEqual(missing, []);
  assert.equal((await read("ScreenerRunner.tsx")).includes("SajuLabBanner"), false, "자가진단 결과에는 사주 배너를 달지 않는다");
  const banner = await read("SajuLabBanner.tsx");
  assert.ok(!/명이 보고/.test(banner), "셀 수 없는 실시간 시청자 수를 지어내지 않는다");
  const visible = banner.slice(banner.indexOf("return ("));
  // 「무료 운세로는 볼 수 없는」은 유료와 대비하는 말이라 둔다. 무료로 볼 수 있다고 읽히는 말만 막는다.
  assert.ok(!/무료로|무료 보기|무료 제공|기간 한정/.test(visible), "사주랩은 유료다. 무료로 볼 수 있다고 쓰지 않는다");
  assert.ok(/유료/.test(visible), "유료임을 배너에 밝힌다");
});
