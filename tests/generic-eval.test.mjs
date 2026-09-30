import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 성향 테스트 채점(lib/generic-eval.ts)의 불변조건.
 *
 * 2026-09-30 전수 점검에서 두 결함이 나왔습니다. 둘 다 화면은 멀쩡해서 눈으로는
 * 못 잡습니다. 여기서 계산으로 막습니다.
 *   - 동점이면 결과 목록의 첫 키가 이김 (4유형 테스트에서 첫 결과 34%)
 *   - 번아웃 '주의 단계' 에 도달 불가
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { genericTests } from "./lib/generic-tests";
      export { evaluateTest } from "./lib/generic-eval";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { genericTests, evaluateTest } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

/** 고정 시드 난수. 실패가 재현돼야 고칠 수 있습니다 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function play(t, picks) {
  const scores = {};
  t.questions.forEach((q, i) => {
    for (const [k, v] of Object.entries(picks[i] === "a" ? q.aScores : q.bScores)) scores[k] = (scores[k] || 0) + v;
  });
  return evaluateTest(t, scores, picks);
}

function samplePicks(t, rand) {
  return t.questions.map(() => (rand() < 0.5 ? "a" : "b"));
}

test("결과 목록의 순서를 뒤집어도 같은 답에는 같은 결과가 나온다", () => {
  const rand = rng(20260930);
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    if (t.evaluation !== "max-score") continue;
    const reversed = { ...t, results: Object.fromEntries(Object.entries(t.results).reverse()) };
    for (let n = 0; n < 2000; n++) {
      const picks = samplePicks(t, rand);
      const x = play(t, picks);
      const y = play(reversed, picks);
      if (x !== y) {
        problems.push(`${slug}: ${x} ≠ ${y}`);
        break;
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("모든 결과에 실제로 도달할 수 있다", () => {
  const rand = rng(7);
  const unreachable = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    const seen = new Set();
    const n = t.questions.length;
    // 극단값(전부 A·전부 B·번갈아)과 무작위, 그리고 A 개수를 0..n 으로 늘려 가는 경우
    const patterns = [
      Array(n).fill("a"),
      Array(n).fill("b"),
      Array.from({ length: n }, (_, i) => (i % 2 ? "b" : "a")),
      ...Array.from({ length: n + 1 }, (_, k) => Array.from({ length: n }, (_, i) => (i < k ? "a" : "b"))),
    ];
    for (const p of patterns) seen.add(play(t, p));
    for (let i = 0; i < 20000 && seen.size < Object.keys(t.results).length; i++) seen.add(play(t, samplePicks(t, rand)));
    for (const key of Object.keys(t.results)) if (!seen.has(key)) unreachable.push(`${slug}/${key}`);
  }
  assert.deepEqual(unreachable, [], `도달할 수 없는 결과: ${unreachable.join(", ")}`);
});

test("번아웃 단계는 소진 쪽 답의 개수로 나뉜다 (경계값)", () => {
  const t = genericTests.burnout;
  const at = (load) => evaluateTest(t, { red: load, green: t.questions.length - load }, []);
  assert.equal(t.questions.length, 15);
  assert.equal(at(0), "green");
  assert.equal(at(5), "green");
  assert.equal(at(6), "yellow");
  assert.equal(at(9), "yellow");
  assert.equal(at(10), "red");
  assert.equal(at(15), "red");
});

test("동점일 때는 맞붙은 문항에서 더 많이 고른 쪽이 이긴다", () => {
  // 에니어그램은 모든 유형 쌍을 한 번씩 직접 비교합니다. 두 유형이 동점이면
  // 둘이 맞붙은 그 문항의 답이 결과를 정해야 합니다.
  const t = genericTests.enneagram;
  const i = t.questions.findIndex((q) => q.aScores.type2 && q.bScores.type9);
  assert.ok(i >= 0, "2번·9번이 맞붙은 문항이 있어야 합니다");
  const picks = [];
  picks[i] = "b";
  assert.equal(evaluateTest(t, { type2: 5, type9: 5 }, picks), "type9");
  picks[i] = "a";
  assert.equal(evaluateTest(t, { type2: 5, type9: 5 }, picks), "type2");
});

test("답 기록이 없던 예전 세션도 결과를 낸다 (동점이면 첫 결과로 물러남)", () => {
  const t = genericTests.enneagram;
  assert.equal(evaluateTest(t, { type3: 4, type7: 4 }, []), "type3");
});
