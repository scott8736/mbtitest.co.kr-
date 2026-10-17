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
 * 다음 테스트 추천 3개 이상 (자기 자신 제외, 실제로 열리는 테스트)이 있어야 합니다.
 * 자가진단(/check/)은 관련 자가진단 추천을 요구합니다.
 *
 * 2026-10-15 사용자 결정: 사이트 광고는 애드센스만 — 쿠팡 추천 카드·푸터 쿠팡·파트너스 고지를 모두 뺐습니다.
 * lib/test-picks.ts·mbti-picks.ts·pick-fallback.ts 의 상품 데이터는 되살릴 때를 위해 남겨 두지만 화면에서는 쓰지 않습니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { genericTests } from "./lib/generic-tests";
      export { typeData } from "./lib/mbti-data";
      export { testCatalog } from "./lib/test-catalog";
      export { screeners } from "./lib/screeners";
      export { iqBands, IQ_SLUG } from "./lib/iq-test";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { genericTests, typeData, testCatalog, screeners, iqBands, IQ_SLUG } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const published = new Map(testCatalog.filter((t) => t.status === "published").map((t) => [t.slug, t]));
const MIN_NEXT = 3;

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

test("사이트 화면 코드에 쿠팡 광고·파트너스 고지가 없다 — 광고는 애드센스만(2026-10-15 사용자 결정)", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join, relative } = await import("node:path");
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });
  const offenders = ["components", "app"]
    .flatMap((dir) => walk(join(repoRoot, dir)))
    .filter((file) => /\.(tsx|ts)$/.test(file) && !/[\\/]admin[\\/]/.test(file))
    .filter((file) => /link\.coupang\.com|coupangcdn|CoupangPartners|ResultPick|파트너스 활동|AFFILIATE_DISCLOSURE/.test(readFileSync(file, "utf8")))
    .map((file) => relative(repoRoot, file));
  assert.deepEqual(offenders, [], `화면 코드에 쿠팡 흔적: ${offenders.join(", ")}`);
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

test("사주 배너는 사주를 보러 온 화면에만 보인다(10-13, MBTI 결과는 리포트 자리)", async () => {
  const { readFile } = await import("node:fs/promises");
  const lib = await readFile(new URL("../lib/sajulab.ts", import.meta.url), "utf8");
  const hidden = lib.slice(lib.indexOf("SAJULAB_HIDDEN"));
  for (const p of ['"mbti"', '"test"', '"shared"']) assert.ok(hidden.includes(p), `${p} 자리는 배너를 내린다`);
  for (const p of ['"fortune-saju"', '"gunghap"']) assert.ok(!hidden.includes(p), `${p} 자리는 배너를 남긴다`);
  const banner = await readFile(new URL("../components/SajuLabBanner.tsx", import.meta.url), "utf8");
  assert.ok(banner.includes("SAJULAB_HIDDEN.has(placement)) return null"));
});

test("MBTI 결과는 정보 먼저, 결제·홍보는 그 뒤(2026-10-15 순서 개편)", async () => {
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(new URL("../components/MbtiResult.tsx", import.meta.url), "utf8");
  const body = src.slice(src.search(/return \(\s*<section className="result-shell"/));
  const at = (needle) => {
    const i = body.indexOf(needle);
    assert.ok(i >= 0, `${needle} 이 결과 화면에 있어야 한다`);
    return i;
  };
  const order = ["<MoriPortrait", "<h1>", 'className="result-grid"', 'className="mbti-deep-result"', "<ReportTeaser", "<MoriShare", "<GuessMePanel", "<MoriChatEntry", "<ForestEntry", "<MoriForestCard"];
  const pos = order.map(at);
  for (let i = 1; i < pos.length; i++) assert.ok(pos[i - 1] < pos[i], `${order[i - 1]} 가 ${order[i]} 보다 위여야 한다`);
  assert.ok(/<MoriShare[^>]*\bcompact\b/.test(body), "첫 화면 아래 공유판은 작은 판(compact)이다");
  assert.ok(!body.includes("<MoriChatBubble"), "대화 말풍선은 첫 화면에 다시 넣지 않는다");
  // 상세 칸 아래 리포트 장 이름은 판매 페이지 목차에 실제로 있는 것만
  const page = await readFile(new URL("../app/report/page.tsx", import.meta.url), "utf8");
  for (const [, chapter] of src.matchAll(/\["[A-Z]+", "[^"]+", "\w+", "([^"]+)", "result-\w+"\]/g)) {
    assert.ok(page.includes(`"${chapter}"`), `리포트 목차에 「${chapter}」 장이 있어야 한다`);
  }
  const admin = await readFile(new URL("../worker/report-admin.ts", import.meta.url), "utf8");
  for (const from of ["result-love", "result-work", "result-rest"]) assert.ok(admin.includes(`"${from}"`), `주문 표에 ${from} 이름이 있어야 한다`);
});
