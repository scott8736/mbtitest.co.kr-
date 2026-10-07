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
      export { MINIGAMES, inviteOf, acornStars, starStars, lanternStars, pickConstellations, CONSTELLATIONS } from "./lib/forest-minigames";
      export { RHYTHM_CHARTS, notesOf, judgeOf, starsOf, RHYTHM_BARS, COUNT_IN_BEATS, LOOP_BEATS } from "./lib/forest-rhythm";
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

test("리듬 탭: 바람 들판 주민 넷만 악보가 있고, 초대 대사는 말버릇으로 시작한다", () => {
  const sp = Q.filter((q) => mod.villageOf(q.mori) === "sp").map((q) => q.mori).sort();
  assert.deepEqual(mod.RHYTHM_CHARTS.map((c) => c.mori).sort(), sp);
  for (const c of mod.RHYTHM_CHARTS) {
    assert.ok(c.invite.startsWith(mod.MORI_WORLD[c.mori].says), c.mori);
    assert.equal(c.react.length, 4, `${c.mori} 별 0~3 반응`);
  }
});

test("리듬 탭 악보: 8마디·마디당 8칸(마지막만 마무리 한 방 9칸), 곡 루프 안에서 끝난다", () => {
  for (const c of mod.RHYTHM_CHARTS) {
    assert.equal(c.bars.length, mod.RHYTHM_BARS, c.mori);
    c.bars.forEach((bar, i) => {
      assert.match(bar, /^[LR.]+$/, `${c.mori} ${i + 1}마디`);
      assert.equal(bar.length, i === c.bars.length - 1 ? 9 : 8, `${c.mori} ${i + 1}마디 길이`);
    });
    const notes = mod.notesOf(c);
    assert.ok(notes.length >= 12, `${c.mori} 음표가 너무 적다`);
    assert.ok(notes[0].beat >= mod.COUNT_IN_BEATS, "준비 마디에는 음표가 없다");
    assert.ok(notes.at(-1).beat + 2 < mod.LOOP_BEATS, "곡이 한 바퀴 돌기 전에 끝난다");
  }
  // 난이도: 느긋 < 기본 < 빠름 (음표 수)
  const n = (m) => mod.notesOf(mod.RHYTHM_CHARTS.find((c) => c.mori === m)).length;
  assert.ok(n("ISFP") < n("ESFP") && n("ESFP") < n("ESTP"));
});

test("리듬 탭 판정·별점", () => {
  assert.equal(mod.judgeOf(0.03), "perfect");
  assert.equal(mod.judgeOf(-0.12), "good");
  assert.equal(mod.judgeOf(0.3), "miss");
  assert.equal(mod.starsOf(20, 0, 20), 3);
  assert.equal(mod.starsOf(10, 5, 20), 2);
  assert.equal(mod.starsOf(0, 0, 20), 0);
  assert.equal(mod.starsOf(0, 0, 0), 0);
});

test("마을 놀이: 주민 16모리 모두 놀이가 하나씩 있고, 마을마다 놀이 종류가 같다", () => {
  const kindOf = (m) => mod.RHYTHM_CHARTS.some((c) => c.mori === m) ? "rhythm" : mod.MINIGAMES.find((g) => g.mori === m)?.play.kind;
  const want = { sp: "rhythm", sj: "acorn", nt: "stars", nf: "lantern" };
  for (const q of Q) {
    assert.equal(kindOf(q.mori), want[mod.villageOf(q.mori)], q.mori);
    const invite = mod.inviteOf(q.mori);
    assert.ok(invite?.startsWith(mod.MORI_WORLD[q.mori].says), `${q.mori} 초대: ${invite}`);
  }
  for (const g of mod.MINIGAMES) assert.equal(g.react.length, 4, `${g.mori} 별 0~3 반응`);
});

test("별자리: 점 개수마다 모양이 셋 이상이라 한 판에 서로 다른 별자리 셋이 나온다", () => {
  for (const g of mod.MINIGAMES.filter((x) => x.play.kind === "stars")) {
    const picked = mod.pickConstellations(g.play.points);
    assert.equal(picked.length, 3, g.mori);
    assert.equal(new Set(picked.map((c) => c.name)).size, 3);
    for (const c of picked) for (const [x, y] of c.pts) assert.ok(x >= 8 && x <= 92 && y >= 8 && y <= 92, `${c.name} 점이 가장자리에 붙었다`);
  }
});

test("마을 놀이 채점", () => {
  assert.equal(mod.acornStars({ good: 10, bonus: 0, bad: 0 }, { good: 10, bonus: 0 }), 3);
  assert.equal(mod.acornStars({ good: 10, bonus: 0, bad: 10 }, { good: 10, bonus: 0 }), 0, "벌레를 다 받으면 깎인다");
  assert.equal(mod.acornStars({ good: 4, bonus: 3, bad: 0 }, { good: 6, bonus: 3 }), 3, "컵케이크는 2점");
  assert.equal(mod.acornStars({ good: 0, bonus: 0, bad: 0 }, { good: 0, bonus: 0 }), 0);
  assert.equal(mod.starStars(2), 2);
  assert.equal(mod.lanternStars(5, [3, 5, 6]), 2);
  assert.equal(mod.lanternStars(2, [3, 5, 6]), 0);
  assert.equal(mod.lanternStars(7, [4, 5, 7]), 3);
  for (const g of mod.MINIGAMES.filter((x) => x.play.kind === "lantern")) {
    const t = g.play.targets;
    assert.ok(t[0] < t[1] && t[1] < t[2], `${g.mori} 목표는 점점 길어진다`);
  }
});
