import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * MBTI 점수 → 유형 매핑에 쓰이는 데이터(lib/mbti-data.ts, lib/mbti-content.ts,
 * lib/mbti-picks.ts)의 경계·정합성 검사.
 *
 * 실제 채점(축별 +1/-1 합산 후 0 이상이면 앞 글자)은
 * components/MbtiQuiz.tsx 안에 있고 export 되지 않아 여기서 직접 부를 수
 * 없습니다. 다만 그 로직이 성립하려면 축마다 문항 수가 짝수여야 "정확히
 * 반반" 동점이 존재할 수 있고, 16개 결과 테이블이 전부 채워져 있어야
 * 어떤 유형이 나와도 화면이 비지 않습니다. 그 전제를 여기서 검사합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { questions, typeData, typeDetails } from "./lib/mbti-data";
      export { profiles, mbtiCodes } from "./lib/mbti-content";
      export { mbtiPicks } from "./lib/mbti-picks";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { questions, typeData, typeDetails, profiles, mbtiCodes, mbtiPicks } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const ALL_16 = mbtiCodes.map((c) => c.toUpperCase());

test("16가지 MBTI 유형이 전부 있고 그 외 유형은 없다 (typeData)", () => {
  assert.deepEqual(Object.keys(typeData).sort(), [...ALL_16].sort());
});

test("typeDetails 가 typeData 와 정확히 같은 16개 키를 가진다", () => {
  assert.deepEqual(Object.keys(typeDetails).sort(), Object.keys(typeData).sort());
});

test("mbtiPicks 가 typeData 와 정확히 같은 16개 키를 가진다", () => {
  assert.deepEqual(Object.keys(mbtiPicks).sort(), Object.keys(typeData).sort());
});

test("네 축(EI·SN·TF·JP) 문항 수가 서로 같고 짝수다 — 정확히 반반인 동점이 존재할 수 있다", () => {
  // MbtiQuiz.tsx 는 축 점수 합이 0 이상이면 앞 글자(E/S/T/J)를 고른다. 문항
  // 수가 홀수면 그 축은 net 0 이 될 수 없어 "동점 규칙"이 있으나마나 하다.
  const counts = {};
  for (const q of questions) counts[q.axis] = (counts[q.axis] || 0) + 1;
  const axes = ["EI", "SN", "TF", "JP"];
  for (const axis of axes) {
    assert.ok(counts[axis] > 0, `${axis} 문항이 없습니다`);
    assert.equal(counts[axis] % 2, 0, `${axis} 문항 수(${counts[axis]})가 홀수라 정확한 동점이 나올 수 없습니다`);
  }
  const distinctCounts = new Set(axes.map((a) => counts[a]));
  assert.equal(distinctCounts.size, 1, `축마다 문항 수가 다릅니다: ${JSON.stringify(counts)}`);
});

test("모든 문항이 EI/SN/TF/JP 넷 중 하나에만 속한다", () => {
  const axes = new Set(["EI", "SN", "TF", "JP"]);
  const bad = questions.filter((q) => !axes.has(q.axis));
  assert.deepEqual(bad, []);
});

test("profiles(lib/mbti-content.ts) 도 16개이고 code 필드가 자기 키와 일치한다", () => {
  assert.deepEqual(Object.keys(profiles).sort(), [...mbtiCodes].sort());
  for (const [key, p] of Object.entries(profiles)) {
    assert.equal(p.code, key.toUpperCase(), `${key} 의 code 필드(${p.code})가 자기 키와 다릅니다`);
  }
});

test("matches/challenges 는 실제 존재하는 유형만 가리키고, 자기 자신을 가리키지 않는다", () => {
  const validCodes = new Set(mbtiCodes);
  const problems = [];
  for (const [key, p] of Object.entries(profiles)) {
    for (const field of ["matches", "challenges"]) {
      for (const code of p[field]) {
        if (!validCodes.has(code)) problems.push(`${key}.${field} 에 존재하지 않는 유형 ${code}`);
        if (code === key) problems.push(`${key}.${field} 가 자기 자신(${key})을 가리킵니다`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("같은 유형이 matches 와 challenges 에 동시에 들어있지 않다", () => {
  const problems = [];
  for (const [key, p] of Object.entries(profiles)) {
    const overlap = p.matches.filter((c) => p.challenges.includes(c));
    if (overlap.length) problems.push(`${key}: ${overlap.join(", ")}`);
  }
  assert.deepEqual(problems, [], `matches 와 challenges 에 동시에 있는 유형:\n${problems.join("\n")}`);
});
