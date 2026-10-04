import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 모리 캐릭터 카드(2026-10-04 제작).
 *
 * 그림·색·궁합이 여러 파일에 나뉘어 있습니다(lib/mori.ts, scripts/make_mori_assets.py,
 * lib/mbti-content.ts, public/). 하나만 바뀌면 카드와 미리보기 그림이 서로 다른 말을 합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { MORI, MORI_BEST, SHARE_CHANNEL_KEYS, TEST_MORI, moriImage, moriOgImage, testMoriImage } from "./lib/mori";
      export { genericTests } from "./lib/generic-tests";
      export { profiles, mbtiCodes } from "./lib/mbti-content";
      export { isKnownEvent } from "./worker/test-events";
      export { buildRollup, mergeRollups, isSharePage } from "./worker/rollup";
      export { siteUrls } from "./lib/site-urls";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["cloudflare:*"],
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
const codes = mod.mbtiCodes.map((c) => c.toUpperCase());

test("16유형 모두 색이 있고, 미리보기 그림 생성기의 색과 같다", () => {
  assert.deepEqual(Object.keys(mod.MORI).sort(), [...codes].sort());
  const py = fs.readFileSync(path.join(repoRoot, "scripts", "make_mori_assets.py"), "utf8");
  for (const code of codes) {
    const m = py.match(new RegExp(`"${code}": \\("(#[0-9a-f]{6})"`));
    assert.ok(m, `${code} 가 make_mori_assets.py 에 없다`);
    assert.equal(mod.MORI[code].color, m[1], `${code} 색이 서로 다르다`);
  }
  assert.equal(new Set(Object.values(mod.MORI).map((m) => m.color)).size, 16, "색이 겹치면 16마리가 닮아 보인다");
});

test("카드의 찰떡궁합은 유형 콘텐츠의 첫 번째 궁합과 같다", () => {
  for (const code of codes) assert.equal(mod.MORI_BEST[code], mod.profiles[code.toLowerCase()].matches[0].toUpperCase(), code);
});

test("16유형 캐릭터·미리보기 그림 파일이 모두 있다", () => {
  for (const code of codes) {
    for (const url of [mod.moriImage(code), mod.moriOgImage(code)]) {
      assert.ok(fs.existsSync(path.join(repoRoot, "public", url)), `${url} 없음`);
    }
  }
});

test("공유 이벤트는 공유 수단 이름으로만 받는다", () => {
  for (const key of mod.SHARE_CHANNEL_KEYS) assert.ok(mod.isKnownEvent(key, "share_click"), key);
  assert.equal(mod.isKnownEvent("mbti", "share_click"), false);
  assert.equal(mod.isKnownEvent("mori-image", "completed"), false);
});

test("공유 페이지 → 검사 시작은 공유 페이지를 본 뒤 검사 화면을 연 사람만 센다", () => {
  const row = (visitor_hash, p, time) => ({ path: p, referrer: "", source: "direct", device: "mobile", country: "KR", visitor_hash, created_at: `2026-10-12 ${time}` });
  const r = mod.buildRollup("2026-10-12", [
    row("X", "/s/infp/", "10:00:00"), row("X", "/tests/mbti/", "10:00:20"), // 받은 링크 → 검사
    row("Y", "/tests/mbti/", "11:00:00"), row("Y", "/s/estj/", "11:30:00"), // 검사가 먼저
    row("Z", "/s/entp/", "12:00:00"), // 보기만 함
    row("W", "/s/", "13:00:00"), // 공유 페이지 아님
  ], []);
  assert.deepEqual(r.share, { views: 3, visitors: 3, toTest: 1 });
  assert.ok(mod.isSharePage("/s/infp/"));
  assert.ok(!mod.isSharePage("/s/infp/x/"));
  const old = { ...r, share: undefined };
  assert.deepEqual(mod.mergeRollups([old, r]).share, { views: 3, visitors: 3, toTest: 1 }, "공유 칸이 없는 옛 집계와 더해도 된다");
});

test("공유 페이지는 사이트맵에 없고, 빌드 결과에 noindex 와 캐릭터 미리보기가 붙는다", () => {
  assert.ok(!mod.siteUrls().some((u) => /\/s\//.test(u.loc ?? u.url ?? String(u))), "공유 페이지가 사이트맵에 들어갔다");
  const html = path.join(repoRoot, "dist", "client", "s", "infp", "index.html");
  if (!fs.existsSync(html)) return; // 빌드 없이 단독 실행한 경우
  const page = fs.readFileSync(html, "utf8");
  assert.match(page, /<meta name="robots" content="noindex/);
  assert.match(page, /\/images\/og\/mori\/infp\.jpg/);
  assert.match(page, /href="\/tests\/mbti\/"/);
});

test("다른 테스트 결과 전용 모리: 적힌 결과는 실제 결과이고 그림 파일이 있으며, 안 적힌 결과는 그림 없이 간다", () => {
  for (const [slug, keys] of Object.entries(mod.TEST_MORI)) {
    for (const key of keys) {
      assert.ok(mod.genericTests[slug]?.results?.[key], `${slug}/${key} 는 없는 결과`);
      const url = mod.testMoriImage(slug, key);
      assert.ok(url && fs.existsSync(path.join(repoRoot, "public", url)), `${url} 없음`);
    }
  }
  assert.equal(mod.testMoriImage("hsp", "depth"), null, "그림을 아직 안 만든 테스트는 기본 카드");
  for (const key of ["test-image", "test-link", "test-threads", "test-copy"]) assert.ok(mod.isKnownEvent(key, "share_click"), key);
  // 운세·타로 공유는 따로 셉니다 (2026-10-04)
  for (const key of ["fortune-image", "fortune-link", "fortune-threads", "fortune-copy", "tarot-image", "tarot-link", "tarot-threads", "tarot-copy"])
    assert.ok(mod.isKnownEvent(key, "share_click"), key);
});

test("다른 테스트 공유 페이지 → 검사 시작: 받은 결과 링크를 연 뒤 아무 검사 첫 화면을 연 사람만", () => {
  const row = (visitor_hash, p, time) => ({ path: p, referrer: "", source: "direct", device: "mobile", country: "KR", visitor_hash, created_at: `2026-10-12 ${time}` });
  const r = mod.buildRollup("2026-10-12", [
    row("A", "/tests/egen-teto/r/teto/", "10:00:00"), row("A", "/tests/egen-teto/", "10:00:30"),
    row("B", "/tests/hsp/r/depth/", "11:00:00"), row("B", "/", "11:00:10"),
    row("C", "/tests/mental-age/", "12:00:00"), row("C", "/tests/mental-age/r/teen/", "12:05:00"),
  ], []);
  assert.deepEqual(r.shareTest, { views: 3, visitors: 3, toTest: 1 });
});
