import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 모리 게임 「마음숲 산책」(2026-10-07). 부탁이 세계관(말버릇·마을)과 어긋나지 않는지,
 * 연결한 검사가 실제로 있고 결과 화면에서 숲으로 돌아올 수 있는지, 도감에 넣을 결과 그림이 다 있는지 봅니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { FOREST_QUESTS, completeForestQuest, readForest, writeForest, stampsOf } from "./lib/mori-forest";
      export { MORI_WORLD, VILLAGES, villageOf } from "./lib/mori-world";
      export { genericTests } from "./lib/generic-tests";
      export { testCatalog } from "./lib/test-catalog";
      export { RESULT_CLICK_PLACEMENT_KEYS } from "./lib/result-clicks";
      export { isKnownEvent } from "./worker/test-events";
      export { screenerSlugs } from "./lib/screeners";
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
const Q = mod.FOREST_QUESTS;

test("주민 16모리가 한 번씩, 마을마다 넷이 부탁을 하나씩 갖는다", () => {
  assert.deepEqual(Q.map((q) => q.mori).sort(), Object.keys(mod.MORI_WORLD).sort());
  for (const v of Object.keys(mod.VILLAGES)) {
    assert.equal(Q.filter((q) => mod.villageOf(q.mori) === v).length, 4, v);
  }
  assert.equal(new Set(Q.map((q) => q.slug)).size, 16, "같은 검사를 두 주민이 권하지 않는다");
});

test("부탁은 주민의 말버릇으로 시작한다", () => {
  for (const q of Q) assert.ok(q.ask.startsWith(mod.MORI_WORLD[q.mori].says), `${q.mori}: ${q.ask}`);
});

test("부탁 검사는 공개된 GenericTestRunner 검사라 결과 화면에서 숲으로 돌아올 수 있다", () => {
  const runner = readFileSync(new URL("../components/GenericTestRunner.tsx", import.meta.url), "utf8");
  assert.ok(runner.includes("<ForestReturn slug={test.slug}"), "결과 화면에 ForestReturn 이 없다");
  for (const q of Q) {
    assert.ok(mod.genericTests[q.slug], `${q.slug} 는 genericTests 에 없다`);
    const item = mod.testCatalog.find((t) => t.slug === q.slug);
    assert.equal(item?.status, "published", `${q.slug} 는 공개 검사가 아니다`);
  }
});

test("자가진단(진지한 톤) 검사로는 보내지 않는다", () => {
  assert.ok(mod.screenerSlugs.length > 0);
  for (const q of Q) assert.ok(!mod.screenerSlugs.includes(q.slug), q.slug);
});

test("도감 특별 모리 칸에 넣을 결과 그림이 결과마다 있다", () => {
  for (const q of Q) {
    for (const key of Object.keys(mod.genericTests[q.slug].results)) {
      const card = new URL(`../public/images/og/r/${q.slug}-${key}.png`, import.meta.url);
      assert.ok(existsSync(card), `${q.slug}-${key}.png 없음`);
    }
  }
});

test("게임 그림·곡이 public 에 있다", () => {
  for (const k of ["forest", "nt", "nf", "sj", "sp"]) {
    assert.ok(existsSync(new URL(`../public/audio/forest/${k}.m4a`, import.meta.url)), `${k}.m4a`);
  }
  for (const v of ["nt", "nf", "sj", "sp"]) {
    assert.ok(existsSync(new URL(`../public/images/forest/stamp-${v}.webp`, import.meta.url)), `stamp-${v}`);
  }
});

test("부탁 클릭·진입 버튼 클릭이 워커에서 버려지지 않는다", () => {
  for (const key of ["mbti-forest", "home-mori-forest", "forest-quest"]) {
    assert.ok(mod.RESULT_CLICK_PLACEMENT_KEYS.includes(key), key);
    assert.ok(mod.isKnownEvent(key, "result_click"), key);
  }
});

test("부탁 없이 검사한 사람은 진행이 바뀌지 않고, 부탁받고 간 검사만 완료된다", () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };

  assert.equal(mod.completeForestQuest("aura", "a"), false);
  assert.deepEqual(mod.readForest().done, {});

  mod.writeForest({ ...mod.readForest(), pending: "aura" });
  assert.equal(mod.completeForestQuest("mental-age", "teen"), false, "다른 검사는 완료되지 않는다");
  assert.equal(mod.completeForestQuest("aura", "a"), true);
  const s = mod.readForest();
  assert.deepEqual(s.done, { aura: "a" });
  assert.equal(s.pending, undefined);

  // 다시 해도 결과만 바뀐다(돌아가기 버튼은 다시 뜸)
  assert.equal(mod.completeForestQuest("aura", "b"), true);
  assert.deepEqual(mod.readForest().done, { aura: "b" });
});

test("마을 도장은 그 마을 넷을 다 풀어야 나온다", () => {
  const sp = Object.fromEntries(Q.filter((q) => mod.villageOf(q.mori) === "sp").map((q) => [q.slug, "x"]));
  assert.deepEqual(mod.stampsOf(sp), ["sp"]);
  const three = Object.fromEntries(Object.entries(sp).slice(0, 3));
  assert.deepEqual(mod.stampsOf(three), []);
  assert.deepEqual(mod.stampsOf(Object.fromEntries(Q.map((q) => [q.slug, "x"]))), ["nt", "nf", "sj", "sp"]);
});
