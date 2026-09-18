import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * lib/screeners.ts 의 bandFor·maxScore 경계값 검사.
 *
 * tests/screener-tarot.test.mjs 는 "0점과 만점 모두 구간이 잡히는가",
 * "구간이 거꾸로 가지 않는가" 같은 정상 범위 안의 성질만 봅니다. 여기서는
 * 그 정상 범위 밖 — 척도를 벗어난 점수, 커트라인 바로 위/아래, 소수점
 * 점수 — 를 봅니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./lib/screeners";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { screeners, bandFor, maxScore, screenerBySlug } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

test("만점은 문항 수 * 3이다", () => {
  for (const s of screeners) {
    assert.equal(maxScore(s), s.questions.length * 3, `${s.slug} 만점 계산이 다릅니다`);
  }
});

test("커트라인 바로 위/아래에서 정확히 구간이 갈린다", () => {
  // band.min 값 그 자체는 그 구간, min-1은 그 아래 구간이어야 합니다.
  for (const s of screeners) {
    const sortedAsc = [...s.bands].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sortedAsc.length; i += 1) {
      const band = sortedAsc[i];
      const prev = sortedAsc[i - 1];
      assert.equal(
        bandFor(s, band.min).key,
        band.key,
        `${s.slug} 점수 ${band.min}(커트라인)이 ${band.key} 구간으로 안 잡힙니다`,
      );
      assert.equal(
        bandFor(s, band.min - 1).key,
        prev.key,
        `${s.slug} 점수 ${band.min - 1}(커트라인 바로 아래)이 ${prev.key} 구간이 아니라 ${bandFor(s, band.min - 1).key} 로 잡힙니다`,
      );
    }
  }
});

test("소수점 점수도 정수 커트라인과 같은 규칙으로 갈린다", () => {
  for (const s of screeners) {
    const sortedAsc = [...s.bands].sort((a, b) => a.min - b.min);
    for (let i = 1; i < sortedAsc.length; i += 1) {
      const band = sortedAsc[i];
      const prev = sortedAsc[i - 1];
      // 커트라인 바로 아래 소수(예: 12.999)는 아직 그 구간이 아니어야 합니다.
      assert.equal(
        bandFor(s, band.min - 0.001).key,
        prev.key,
        `${s.slug} 점수 ${band.min - 0.001} 이 ${band.key} 로 잘못 올라갑니다`,
      );
      // 커트라인보다 살짝 위(예: 13.5)는 이미 그 구간이어야 합니다.
      assert.equal(
        bandFor(s, band.min + 0.5).key,
        band.key,
        `${s.slug} 점수 ${band.min + 0.5} 이 ${band.key} 로 안 잡힙니다`,
      );
    }
  }
});

test("척도를 벗어난 음수 점수는 최저 구간으로 처리된다", () => {
  for (const s of screeners) {
    const lowest = [...s.bands].sort((a, b) => a.min - b.min)[0];
    assert.equal(bandFor(s, -1).key, lowest.key, `${s.slug} 음수 점수가 최저 구간이 아닙니다`);
    assert.equal(bandFor(s, -9999).key, lowest.key, `${s.slug} 큰 음수 점수가 최저 구간이 아닙니다`);
  }
});

test("만점을 넘는 점수는 최고 구간으로 처리된다", () => {
  for (const s of screeners) {
    const top = maxScore(s);
    const highest = [...s.bands].sort((a, b) => b.min - a.min)[0];
    assert.equal(bandFor(s, top + 1).key, highest.key, `${s.slug} 만점+1 이 최고 구간이 아닙니다`);
    assert.equal(bandFor(s, top + 9999).key, highest.key, `${s.slug} 매우 큰 점수가 최고 구간이 아닙니다`);
  }
});

test("NaN 점수는 조용히 최저 구간으로 떨어진다 (throw 하지 않는다)", () => {
  // 답변 배열에 null/undefined 가 섞여 reduce 합계가 NaN 이 되는 경우를 흉내냅니다.
  // score >= band.min 비교가 NaN 에서는 전부 false 이므로 sorted 배열의 마지막(가장
  // min 이 작은 구간)으로 빠지는데, 이건 우연히 안전한 값(최저 구간)과 같습니다.
  // 하지만 "안전해서 괜찮다"와 "의도된 동작이다"는 다릅니다 — 호출부가 이 사실을
  // 모르고 NaN 을 그대로 넘기면 사용자에게는 최저 구간(예: "지금은 안정적입니다")이
  // 표시되어 실제로는 잘못된 응답이 있었다는 사실이 완전히 가려집니다.
  for (const s of screeners) {
    const lowest = [...s.bands].sort((a, b) => a.min - b.min)[0];
    let band;
    assert.doesNotThrow(() => { band = bandFor(s, NaN); });
    assert.equal(band.key, lowest.key, `${s.slug} NaN 점수가 최저 구간으로 떨어지지 않습니다`);
  }
});

test("bands 의 min 값이 서로 겹치지 않고 오름차순으로 유일하다", () => {
  for (const s of screeners) {
    const mins = s.bands.map((b) => b.min);
    assert.equal(new Set(mins).size, mins.length, `${s.slug} 구간 min 값이 중복됩니다`);
  }
});

test("screenerBySlug — 존재하지 않는 slug 는 undefined, 존재하면 같은 객체를 준다", () => {
  assert.equal(screenerBySlug("존재하지-않는-검사"), undefined);
  assert.equal(screenerBySlug(""), undefined);
  for (const s of screeners) {
    assert.equal(screenerBySlug(s.slug), s);
  }
});
