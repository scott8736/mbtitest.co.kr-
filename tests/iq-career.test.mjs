import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * IQ 테스트와 직업적성 테스트의 문항을 계산으로 확인합니다.
 *
 * IQ: 정답이 틀린 퍼즐은 조용히 망가집니다. 화면도 빌드도 멀쩡한데, 맞게 푼
 * 사람이 오답 처리되고 해설이 틀린 답을 설명합니다. 그래서 풀 수 있는 문제는
 * 여기서 직접 다시 풀어 보고, 그 값이 보기 중 정확히 한 곳에만 있는지 봅니다.
 *
 * 직업적성: 여섯 유형이 똑같이 10번씩, 왼쪽·오른쪽에 5번씩 나와야 어느 유형도
 * 문항 배치 때문에 유리해지지 않습니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { iqQuestions, iqBandFor, IQ_AREAS } from "./lib/iq-test";
      export { careerTest } from "./lib/career-test";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { iqQuestions, iqBandFor, IQ_AREAS, careerTest } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const culprit = () => {
  // 범인 한 명, 진실을 말한 사람도 한 명. 가능한 경우를 전부 대입합니다.
  const fits = ["가", "나", "다"].filter((c) => {
    const truths = [c !== "가", c === "가", c !== "다"];
    return truths.filter(Boolean).length === 1;
  });
  assert.equal(fits.length, 1, "범인 문제의 답이 하나로 정해지지 않습니다");
  return fits[0];
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 문항 순서대로의 기대 정답. 계산할 수 있는 것은 계산합니다.
const EXPECTED = [
  String(16 * 2),
  "모자",
  "모든 고래는 폐로 숨 쉰다",
  `${((1200 / 3) * 7).toLocaleString("en-US")}원`,
  "하늘",
  "곡",
  String(3 / 3),
  `${3 * 30}°`,
  `${2 ** 2}개`,
  String(6 * 7),
  `${DAYS[(3 + 100) % 7]}요일`,
  "땅이 젖지 않았으면 비가 오지 않았다",
  String(17 + 16),
  String(3 * 7),
  String.fromCharCode(64 + 1 + 2 + 3 + 4 + 5),
  `${18 + 15 - 7}명`,
  "수렴",
  `${1 / (1 / 6 + 1 / 3)}시간`,
  culprit(),
  `시속 ${240 / (120 / 60 + 120 / 40)}km`,
];

test("IQ 문항 수와 기대 정답 목록 길이가 같다", () => {
  assert.equal(iqQuestions.length, EXPECTED.length);
});

test("IQ 정답 표시가 계산한 답과 같다", () => {
  const wrong = iqQuestions
    .map((q, i) => ({ i: i + 1, marked: q.choices[q.answer], expected: EXPECTED[i] }))
    .filter((row) => row.marked !== row.expected);
  assert.deepEqual(wrong, []);
});

test("IQ 보기는 4개이고 서로 다르며, 정답은 보기 중 한 곳에만 있다", () => {
  for (const [i, q] of iqQuestions.entries()) {
    assert.equal(q.choices.length, 4, `${i + 1}번 보기 수`);
    assert.equal(new Set(q.choices).size, 4, `${i + 1}번 보기 중복`);
    assert.ok(q.answer >= 0 && q.answer < 4, `${i + 1}번 정답 위치`);
    assert.equal(q.choices.filter((c) => c === EXPECTED[i]).length, 1, `${i + 1}번 정답이 보기에 한 번만`);
  }
});

test("표 문제의 앞 두 줄도 같은 규칙(곱)을 따른다", () => {
  const table = iqQuestions.find((q) => q.figure?.length === 3 && /^\d/.test(q.figure[0]));
  for (const row of table.figure.slice(0, 2)) {
    const [a, b, c] = row.trim().split(/\s+/).map(Number);
    assert.equal(a * b, c, row);
  }
});

test("IQ 정답 위치가 한쪽으로 몰리지 않는다 (위치마다 3~7개)", () => {
  const counts = [0, 0, 0, 0];
  for (const q of iqQuestions) counts[q.answer]++;
  for (const n of counts) assert.ok(n >= 3 && n <= 7, `정답 위치 분포 ${counts}`);
});

test("IQ 문항의 영역은 모두 선언된 영역이고, 영역마다 3문제 이상이다", () => {
  for (const area of IQ_AREAS) {
    assert.ok(iqQuestions.filter((q) => q.area === area).length >= 3, area);
  }
  assert.ok(iqQuestions.every((q) => IQ_AREAS.includes(q.area)));
});

test("IQ 구간은 0~20개 모든 점수에 이름을 준다", () => {
  for (let n = 0; n <= iqQuestions.length; n++) assert.ok(iqBandFor(n).name, `${n}개`);
  assert.notEqual(iqBandFor(0).name, iqBandFor(iqQuestions.length).name);
});

test("직업적성: 여섯 유형이 10번씩, 왼쪽·오른쪽 5번씩 나온다", () => {
  const keys = careerTest.dimensions.map((d) => d.key);
  assert.equal(keys.length, 6);
  for (const key of keys) {
    const left = careerTest.questions.filter((q) => q.aScores[key]).length;
    const right = careerTest.questions.filter((q) => q.bScores[key]).length;
    assert.equal(left, 5, `${key} 왼쪽`);
    assert.equal(right, 5, `${key} 오른쪽`);
  }
});

test("직업적성: 15가지 조합이 정확히 두 번씩 나온다", () => {
  const seen = new Map();
  for (const q of careerTest.questions) {
    const pair = [Object.keys(q.aScores)[0], Object.keys(q.bScores)[0]].sort().join("-");
    seen.set(pair, (seen.get(pair) || 0) + 1);
  }
  assert.equal(seen.size, 15);
  assert.ok([...seen.values()].every((n) => n === 2));
});

test("직업적성: 3문항마다 여섯 유형이 한 번씩 나온다", () => {
  for (let i = 0; i < careerTest.questions.length; i += 3) {
    const keys = careerTest.questions
      .slice(i, i + 3)
      .flatMap((q) => [Object.keys(q.aScores)[0], Object.keys(q.bScores)[0]]);
    assert.equal(new Set(keys).size, 6, `${i + 1}~${i + 3}번`);
  }
});

test("직업적성: 같은 문장이 두 번 나오지 않는다", () => {
  const all = careerTest.questions.flatMap((q) => [q.a, q.b]);
  assert.equal(new Set(all).size, all.length);
});
