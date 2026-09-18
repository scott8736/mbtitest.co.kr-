import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 사주 궁합(fortune-couple.ts) 경계값·에러 케이스 점검.
 *
 * fortune-engine.ts 의 buildChart() 는 chart.zodiacIndex(입춘 보정이 들어간
 * "진짜 띠")와 chart.year.branchIdx(달력 연도만 보는 "년주 지지")를 따로
 * 계산해 둔다. fortune-couple.ts 는 이 중 어느 쪽을 쓰느냐에 따라 궁합의
 * 띠 관계(삼합/육합/충) 결과가 완전히 달라질 수 있어 경계일(입춘) 처리를
 * 별도로 확인한다.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

async function bundle(contents) {
  const { outputFiles } = await build({
    stdin: { contents, resolveDir: repoRoot, loader: "ts" },
    bundle: true,
    format: "esm",
    platform: "neutral",
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
}

const { buildCouple, elementRelation, branchRelation } = await bundle(
  `export { buildCouple, elementRelation, branchRelation } from "./lib/fortune-couple";`,
);
const { buildChart, zodiacIndexFromYear, zodiacNames } = await bundle(
  `export { buildChart, zodiacIndexFromYear, zodiacNames } from "./lib/fortune-engine";`,
);

// ── 회귀 테스트: 입춘 이전 출생자의 궁합이 실제 띠와 어긋나던 버그 ──────────
//
// buildCouple() 이 branchRelation(a.year.branchIdx, b.year.branchIdx) 를 써서
// (fortune-couple.ts) 입춘 보정이 없는 년주 지지로 띠 관계를 계산하던 버그가
// 있었다. a.year.branchIdx 는 calcYearPillar(year) 가 만든 값이라 입춘 보정이
// 없고, 사이트가 실제로 "띠"를 정할 때 쓰는 zodiacIndexFromYear(입춘 보정 있음,
// chart.zodiacIndex 와 동일)와 어긋났다. branchRelation(a.zodiacIndex, b.zodiacIndex)
// 로 고쳐서 더 이상 어긋나지 않는다.

test("2027년 1월 10일생은 사이트 기준 말띠이고, 년주 지지와는 별개로 zodiacIndex 가 그 값을 담는다", () => {
  const chart = buildChart({ year: 2027, month: 1, day: 10 });

  // 사이트의 띠별 운세 페이지가 쓰는 "진짜 띠" — 입춘 이전이라 전 해(2026, 말띠)로 본다.
  assert.equal(zodiacIndexFromYear(2027, 1, 10), 6);
  assert.equal(zodiacNames[zodiacIndexFromYear(2027, 1, 10)], "말띠");
  assert.equal(chart.zodiacIndex, 6);

  // 년주 지지(chart.year.branchIdx)는 입춘 보정이 없어 2027년 그대로 7(양띠)이다 —
  // 이 자체는 사주 년주 계산 방식이라 정상이다. 궁합 쪽이 이 값 대신 zodiacIndex 를 쓰는지가 핵심.
  assert.equal(chart.year.branchIdx, 7);
});

test("실제로는 같은 말띠인 두 사람의 궁합에서 띠 관계가 '보통'으로 정확히 나온다", () => {
  const personA = { year: 2027, month: 1, day: 10 }; // 입춘 이전 출생 → 진짜 띠는 말띠
  const personB = { year: 2026, month: 6, day: 15 }; // 계산에 보정이 필요 없는 말띠

  assert.equal(
    zodiacIndexFromYear(personA.year, personA.month, personA.day),
    zodiacIndexFromYear(personB.year, personB.month, personB.day),
    "두 사람은 사이트 기준으로 같은 띠(말띠)여야 한다",
  );

  const result = buildCouple(personA, personB);

  // buildChart 는 두 사람이 같은 띠임을 정확히 알고 있다.
  assert.equal(result.a.zodiacIndex, result.b.zodiacIndex);
  assert.equal(branchRelation(result.a.zodiacIndex, result.b.zodiacIndex), "보통");

  // buildCouple 도 이제 zodiacIndex 를 써서 같은 결과를 낸다 (수정 전에는 "육합"이 나왔다).
  assert.equal(result.branch, "보통");
});

// ── 정상 동작 확인 ────────────────────────────────────────────────────────

test("두 사람이 생년월일시까지 완전히 같으면 오행 관계 '같음', 띠 관계 '보통', 보완 없음", () => {
  const same = { year: 1993, month: 7, day: 14, timeSlot: 5 };
  const result = buildCouple(same, same);

  assert.equal(result.relation, "같음");
  assert.equal(result.branch, "보통");
  assert.deepEqual(result.complements, []);
  assert.deepEqual(result.a, result.b);
});

test("timeSlot 을 넘기지 않아도(궁합 입력 폼과 동일한 상황) 오류 없이 계산된다", () => {
  // CoupleFortuneTool.tsx 는 timeSlot 을 입력받지 않고 buildCouple 을 호출한다.
  const result = buildCouple({ year: 1990, month: 3, day: 3 }, { year: 1995, month: 11, day: 20 });
  assert.equal(result.a.time, null);
  assert.equal(result.b.time, null);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("존재하지 않는 날짜(4월 31일, 평년 2월 30일)를 넣어도 예외 없이 다음 날짜로 미끄러진다", () => {
  // calcDayPillar 는 율리우스 적일 계산이라 달력에 없는 날짜도 예외를 던지지
  // 않고 다음 날로 자연스럽게 넘어간다(4/31 == 5/1, 평년 2/30 == 3/2).
  // buildCouple 은 이 값을 그대로 받아 계산할 뿐 별도 검증을 하지 않는다.
  const april31 = buildChart({ year: 2027, month: 4, day: 31 });
  const may1 = buildChart({ year: 2027, month: 5, day: 1 });
  assert.deepEqual(april31.day, may1.day);

  const feb30NonLeap = buildChart({ year: 2027, month: 2, day: 30 });
  const mar2 = buildChart({ year: 2027, month: 3, day: 2 });
  assert.deepEqual(feb30NonLeap.day, mar2.day);

  assert.doesNotThrow(() => buildCouple({ year: 2027, month: 4, day: 31 }, { year: 1990, month: 2, day: 30 }));
});

test("연도 극단값(1900년 이전 · 2100년 이후 · 0 · 음수)을 넣어도 buildCouple 은 예외를 던지지 않는다", () => {
  // fortune-couple.ts/fortune-engine.ts 어디에도 연도 범위를 검증하는 코드가
  // 없다. 화면(CoupleFortuneTool.tsx)의 ok() 함수가 1900~2035년만 통과시키지만,
  // 그건 UI 단의 방어일 뿐 라이브러리 자체의 안전장치는 아니다.
  assert.doesNotThrow(() => buildCouple({ year: 1899, month: 1, day: 1 }, { year: 2101, month: 12, day: 31 }));
  assert.doesNotThrow(() => buildCouple({ year: 0, month: 1, day: 1 }, { year: -5, month: 1, day: 1 }));
});

test("한쪽 입력에 숫자로 변환되지 않는 값이 섞이면 예외 대신 NaN 이 결과에 조용히 섞여 나온다", () => {
  // BirthInput 은 타입으로만 숫자를 강제할 뿐 런타임 검증이 없다. 폼에서 온
  // 문자열이 Number() 변환 없이 그대로 들어오는 경우를 흉내낸다.
  const broken = buildChart({ year: 1993, month: Number("칠월"), day: 14 });
  assert.ok(Number.isNaN(broken.month.stemIdx), "month 가 NaN 이면 월주 천간도 NaN 이 되어야 한다(검증 없음 확인)");

  const result = buildCouple({ year: 1993, month: Number("칠월"), day: 14 }, { year: 1995, month: 11, day: 20 });
  assert.ok(Number.isNaN(result.a.month.stemIdx));
  // NaN 이 섞여도 예외 없이 문자열 결과가 만들어진다 — 화면에는 "NaN" 이 아니라
  // 그럴듯한 한글 문장이 나가므로 이런 오염은 겉으로 드러나지 않는다.
  assert.equal(typeof result.headline, "string");
});
