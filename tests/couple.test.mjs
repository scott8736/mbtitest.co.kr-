import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 사주 궁합 계산 점검.
 *
 * 오행 상생·상극과 지지 삼합·육합·충은 정해진 표라 틀리면 조용히 틀립니다.
 * 화면에는 그럴듯한 문장이 그대로 나오기 때문에 눈으로는 안 잡힙니다.
 *
 * 점수 분포도 같이 봅니다. 바닥이 높으면 네 단계 중 아래 두 개가 나오지 않아
 * 숫자가 장식이 됩니다. 처음 만들 때 실제로 58~100 에 몰려 있었습니다.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export { buildCouple, elementRelation, branchRelation } from "./lib/fortune-couple";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { buildCouple, elementRelation, branchRelation } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

// 오행 인덱스: 0목 1화 2토 3금 4수
test("오행 상생 순서가 목화토금수로 돈다", () => {
  assert.equal(elementRelation(0, 1), "생해줌"); // 목생화
  assert.equal(elementRelation(1, 2), "생해줌"); // 화생토
  assert.equal(elementRelation(2, 3), "생해줌"); // 토생금
  assert.equal(elementRelation(3, 4), "생해줌"); // 금생수
  assert.equal(elementRelation(4, 0), "생해줌"); // 수생목
  assert.equal(elementRelation(1, 0), "생받음");
});

test("오행 상극이 목토화금토수금목수화로 맞는다", () => {
  assert.equal(elementRelation(0, 2), "극함"); // 목극토
  assert.equal(elementRelation(1, 3), "극함"); // 화극금
  assert.equal(elementRelation(2, 4), "극함"); // 토극수
  assert.equal(elementRelation(3, 0), "극함"); // 금극목
  assert.equal(elementRelation(4, 1), "극함"); // 수극화
  assert.equal(elementRelation(2, 0), "극받음");
  assert.equal(elementRelation(0, 0), "같음");
});

// 지지 인덱스: 0자 1축 2인 3묘 4진 5사 6오 7미 8신 9유 10술 11해
test("삼합 · 육합 · 충이 맞는다", () => {
  assert.equal(branchRelation(8, 0), "삼합"); // 신자진
  assert.equal(branchRelation(2, 6), "삼합"); // 인오술
  assert.equal(branchRelation(11, 3), "삼합"); // 해묘미
  assert.equal(branchRelation(5, 9), "삼합"); // 사유축
  assert.equal(branchRelation(0, 1), "육합"); // 자축
  assert.equal(branchRelation(2, 11), "육합"); // 인해
  assert.equal(branchRelation(0, 6), "충"); // 자오
  assert.equal(branchRelation(3, 9), "충"); // 묘유
});

test("육합이 충보다 먼저 잡힌다", () => {
  // 어떤 짝도 육합이면서 충일 수는 없다. 규칙이 겹치면 순서 때문에 조용히 틀린다.
  for (let a = 0; a < 12; a += 1) {
    const b = (a + 6) % 12;
    assert.equal(branchRelation(a, b), "충", `${a}·${b} 는 충이어야 합니다`);
  }
});

test("네 가지 결과 문구가 모두 실제로 나온다", () => {
  const seen = new Set();
  let min = 100;
  let max = 0;
  for (let y = 1950; y < 2005; y += 1) {
    for (let y2 = 1950; y2 < 2005; y2 += 3) {
      const r = buildCouple({ year: y, month: 5, day: 10 }, { year: y2, month: 9, day: 20 });
      seen.add(r.headline);
      min = Math.min(min, r.score);
      max = Math.max(max, r.score);
    }
  }
  assert.equal(seen.size, 4, `나온 문구가 ${seen.size}가지입니다: ${[...seen].join(" / ")}`);
  assert.ok(min < 50, `가장 낮은 점수가 ${min} 입니다. 바닥이 높으면 아래 두 단계가 장식이 됩니다`);
  assert.ok(max > 85, `가장 높은 점수가 ${max} 입니다`);
});

test("같은 두 사람이면 언제 계산해도 같은 결과가 나온다", () => {
  const a = buildCouple({ year: 1970, month: 3, day: 15 }, { year: 1975, month: 8, day: 2 });
  const b = buildCouple({ year: 1970, month: 3, day: 15 }, { year: 1975, month: 8, day: 2 });
  assert.equal(a.score, b.score);
  assert.equal(a.headline, b.headline);
  assert.deepEqual(a.advice, b.advice);
});

test("결과 문구가 비어 있지 않다", () => {
  const r = buildCouple({ year: 1988, month: 1, day: 1 }, { year: 1992, month: 12, day: 31 });
  for (const key of ["headline", "summary", "relationNote", "branchNote", "complementNote"]) {
    assert.ok(r[key] && r[key].length > 10, `${key} 가 비어 있습니다`);
  }
  assert.ok(r.advice.length >= 2);
});
