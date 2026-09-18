import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 성향 테스트(lib/generic-tests.ts, lib/new-tests.ts, lib/hsp-test.ts,
 * lib/egen-teto-male.ts) 의 채점 데이터 정합성 경계 검사.
 *
 * 실제 점수 합산·유형 판정(evaluateTest)은 components/GenericTestRunner.tsx
 * 안에 있고 export 되어 있지 않아 여기서 직접 부를 수 없습니다. 대신 그
 * 함수가 실제로 읽는 lib 쪽 데이터 — 문항의 aScores/bScores 키가 test.dimensions
 * 와 어긋나지 않는지, "max-score" 판정에서 절대 뽑힐 수 없는 죽은 결과가
 * 있는지 — 를 검사합니다. 문항 수 vs 카탈로그 문항 수 일치는 이미
 * tests/test-catalog.test.mjs 가 보고 있어 여기서 반복하지 않습니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export { genericTests } from "./lib/generic-tests";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { genericTests } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

function scoredKeys(test) {
  const keys = new Set();
  for (const q of test.questions) {
    for (const k of Object.keys(q.aScores)) keys.add(k);
    for (const k of Object.keys(q.bScores)) keys.add(k);
  }
  return keys;
}

test("문항이 점수를 매기는 키는 모두 test.dimensions 에 선언돼 있다", () => {
  // dimensions 는 인트로 화면(generic-explain 섹션)이 "이 테스트로 알 수 있는
  // 축"을 사람에게 보여줄 때 도는 배열입니다. 실제로 점수를 받는 축이 여기
  // 빠지면, 그 축은 유형 판정에는 쓰이면서 사용자에게는 설명되지 않는
  // 축이 됩니다.
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    const dimensionKeys = new Set(t.dimensions.map((d) => d.key));
    const missing = [...scoredKeys(t)].filter((k) => !dimensionKeys.has(k));
    if (missing.length) problems.push(`${slug}: ${missing.join(", ")}`);
  }
  assert.deepEqual(problems, [], `dimensions 에 없는 채점 키:\n${problems.join("\n")}`);
});

test("한 문항에서 A/B 가 같은 축에 동시에 점수를 주지 않는다", () => {
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    t.questions.forEach((q, i) => {
      const aKeys = Object.keys(q.aScores);
      const bKeys = Object.keys(q.bScores);
      const overlap = aKeys.filter((k) => bKeys.includes(k));
      if (overlap.length) problems.push(`${slug} 문항 ${i}: ${overlap.join(", ")}`);
    });
  }
  assert.deepEqual(problems, [], `A/B 가 같은 축을 겹쳐 채점하는 문항:\n${problems.join("\n")}`);
});

test("dimensions 배열 안에서 키가 중복되지 않는다", () => {
  for (const [slug, t] of Object.entries(genericTests)) {
    const keys = t.dimensions.map((d) => d.key);
    assert.equal(new Set(keys).size, keys.length, `${slug} dimensions 에 중복 키가 있습니다`);
  }
});

test("evaluation이 max-score 인 테스트는 모든 결과 키가 실제로 채점된다 (죽은 결과 없음)", () => {
  // GenericTestRunner.evaluateTest 의 max-score 분기는
  //   Object.keys(test.results).reduce((best,key)=> (scores[key]||0) > (scores[best]||0) ? key : best, ...)
  // 로 동작합니다. 어떤 결과 키가 문항에서 단 한 번도 점수를 받지 못하면
  // scores[key] 는 항상 0이라, 그 키가 초기값(Object.keys 의 첫 번째)이
  // 아닌 이상 아무리 답해도 절대 뽑히지 않는 죽은 결과가 됩니다.
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    if (t.evaluation !== "max-score") continue;
    const scored = scoredKeys(t);
    const resultKeys = Object.keys(t.results);
    const unreachable = resultKeys.filter((k, i) => i !== 0 && !scored.has(k));
    if (unreachable.length) problems.push(`${slug}: ${unreachable.join(", ")}`);
  }
  assert.deepEqual(problems, [], `절대 뽑힐 수 없는 결과 키:\n${problems.join("\n")}`);
});

test("egen-teto·attachment·mental-age 전용 평가는 그 평가가 실제로 참조하는 키를 문항이 채점한다", () => {
  // components/GenericTestRunner.evaluateTest 에서 하드코딩된 참조 키:
  //   egen-teto  -> scores.egen, scores.teto
  //   attachment -> scores.anxiety, scores.avoidance, scores.fear
  //   mental-age -> scores.young
  const REQUIRED = {
    "egen-teto": ["egen", "teto"],
    attachment: ["anxiety", "avoidance", "fear"],
    "mental-age": ["young"],
  };
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    const required = REQUIRED[t.evaluation];
    if (!required) continue;
    const scored = scoredKeys(t);
    const missing = required.filter((k) => !scored.has(k));
    if (missing.length) problems.push(`${slug} (${t.evaluation}): ${missing.join(", ")}`);
  }
  assert.deepEqual(problems, [], `평가 로직이 참조하지만 문항이 채점하지 않는 키:\n${problems.join("\n")}`);
});

test("모든 문항은 A/B 각각 정확히 1점만 준다 (2점 이상 몰아주는 문항 없음)", () => {
  const problems = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    t.questions.forEach((q, i) => {
      for (const [side, scores] of [["a", q.aScores], ["b", q.bScores]]) {
        const values = Object.values(scores);
        if (values.length !== 1 || values[0] !== 1) {
          problems.push(`${slug} 문항 ${i} ${side}Scores: ${JSON.stringify(scores)}`);
        }
      }
    });
  }
  assert.deepEqual(problems, [], `1점이 아닌 채점 문항:\n${problems.join("\n")}`);
});
