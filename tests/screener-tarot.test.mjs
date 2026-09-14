import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 자가진단과 오늘의 타로 데이터가 조용히 어긋나지 않는지 봅니다.
 *
 * 둘 다 화면이 데이터를 그대로 믿고 그리기 때문에, 빠진 필드 하나가 빈 화면이
 * 되거나 결과가 안 나오는 형태로만 드러납니다. 특히 자가진단은 상담 안내가
 * 빠지면 안 되는 자리라 그 부분을 따로 확인합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export * from "./lib/screeners";
      export * from "./lib/tarot";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);
const {
  screeners,
  screenerSlugs,
  bandFor,
  maxScore,
  HELPLINES,
  tarotCards,
  tarotFortunes,
  tarotSlugs,
  dailyCandidates,
  todayKst,
} = mod;

/* ---------------- 자가진단 ---------------- */

test("자가진단 슬러그가 중복되지 않는다", () => {
  assert.equal(new Set(screenerSlugs).size, screenerSlugs.length);
});

test("모든 자가진단에 문항·선택지·구간이 채워져 있다", () => {
  for (const s of screeners) {
    assert.ok(s.questions.length >= 5, `${s.slug} 문항이 너무 적습니다`);
    assert.equal(s.options.length, 4, `${s.slug} 선택지는 4개여야 합니다`);
    assert.ok(s.bands.length >= 3, `${s.slug} 구간이 너무 적습니다`);
    assert.ok(s.intro.length > 0, `${s.slug} 설명이 비어 있습니다`);
    assert.ok(s.faq.length > 0, `${s.slug} FAQ 가 비어 있습니다`);
    assert.ok(s.source.length > 0, `${s.slug} 출처 표기가 비어 있습니다`);
  }
});

test("0점과 만점 모두 구간이 잡힌다", () => {
  // 가장 낮은 구간의 min 이 0 이 아니면 0점일 때 결과가 비어 버립니다.
  for (const s of screeners) {
    const lowest = bandFor(s, 0);
    const highest = bandFor(s, maxScore(s));
    assert.ok(lowest, `${s.slug} 0점 구간이 없습니다`);
    assert.ok(highest, `${s.slug} 만점 구간이 없습니다`);
    assert.equal(Math.min(...s.bands.map((b) => b.min)), 0, `${s.slug} 최저 구간이 0점에서 시작하지 않습니다`);
  }
});

test("구간 경계가 만점을 넘지 않는다", () => {
  for (const s of screeners) {
    const top = maxScore(s);
    for (const band of s.bands) {
      assert.ok(band.min <= top, `${s.slug} ${band.key} 구간(${band.min})이 만점(${top})보다 큽니다`);
      assert.ok(band.advice.length > 0, `${s.slug} ${band.key} 에 조언이 없습니다`);
      assert.ok(band.name && band.summary, `${s.slug} ${band.key} 문구가 비어 있습니다`);
    }
  }
});

test("점수가 오를수록 구간도 같이 오르거나 유지된다", () => {
  for (const s of screeners) {
    const top = maxScore(s);
    let lastMin = -1;
    for (let score = 0; score <= top; score += 1) {
      const band = bandFor(s, score);
      assert.ok(band.min >= lastMin, `${s.slug} ${score}점에서 구간이 거꾸로 갔습니다`);
      lastMin = band.min;
    }
  }
});

test("위험 문항 번호가 실제 문항 범위 안에 있다", () => {
  for (const s of screeners) {
    if (s.criticalIndex === undefined) continue;
    assert.ok(
      s.criticalIndex >= 0 && s.criticalIndex < s.questions.length,
      `${s.slug} 위험 문항 번호가 범위를 벗어났습니다`,
    );
    assert.ok(s.criticalNote, `${s.slug} 위험 문항이 있는데 안내 문구가 없습니다`);
  }
});

test("도움이 필요한 구간이 최소 하나씩 있다", () => {
  // 전부 seekHelp:false 면 상담 안내가 결과 위로 올라가는 일이 없습니다.
  for (const s of screeners) {
    assert.ok(
      s.bands.some((b) => b.seekHelp),
      `${s.slug} 에 상담을 권하는 구간이 없습니다`,
    );
  }
});

test("함께 볼 검사로 지정한 슬러그가 실제로 있다", () => {
  const known = new Set(screenerSlugs);
  for (const s of screeners) {
    for (const slug of s.related) {
      assert.ok(known.has(slug), `${s.slug} 의 관련 검사 ${slug} 가 없습니다`);
      assert.notEqual(slug, s.slug, `${s.slug} 가 자기 자신을 관련 검사로 가리킵니다`);
    }
  }
});

test("상담 전화번호가 비어 있지 않다", () => {
  assert.ok(HELPLINES.length >= 3);
  for (const line of HELPLINES) {
    assert.match(line.tel, /^[0-9-]+$/, `${line.name} 번호 형식이 이상합니다`);
    assert.ok(line.name.length > 0);
  }
});

test("결과 문구에 병명을 단정하는 표현이 없다", () => {
  // "우울증입니다" 처럼 진단으로 읽히는 문장이 들어가면 선별 도구가 아니게 됩니다.
  const banned = /(입니다|이에요|예요)\s*$/;
  for (const s of screeners) {
    for (const band of s.bands) {
      assert.doesNotMatch(
        band.name,
        /(우울증|불안장애|공황장애|ADHD|불면증)(입니다|이에요)/,
        `${s.slug} ${band.key} 결과 이름이 진단처럼 읽힙니다`,
      );
      void banned;
    }
  }
});

/* ---------------- 오늘의 타로 ---------------- */

test("타로 카드가 22장이고 번호가 겹치지 않는다", () => {
  assert.equal(tarotCards.length, 22);
  const numbers = tarotCards.map((c) => c.no);
  assert.equal(new Set(numbers).size, 22);
  assert.deepEqual([...numbers].sort((a, b) => a - b), Array.from({ length: 22 }, (_, i) => i));
});

test("모든 카드가 여섯 가지 운세 해석을 갖고 있다", () => {
  const types = ["total", "love", "money", "health", "work", "study"];
  for (const card of tarotCards) {
    for (const type of types) {
      const text = card.readings[type];
      assert.ok(text && text.length > 10, `${card.ko}(${card.no}) 의 ${type} 해석이 비어 있습니다`);
    }
    assert.ok(card.advice.length > 0, `${card.ko} 한 줄 조언이 없습니다`);
    assert.ok(card.luckyColor && card.luckyItem, `${card.ko} 행운 정보가 비어 있습니다`);
    assert.match(card.color, /^#[0-9a-f]{6}$/i, `${card.ko} 색상 값이 이상합니다`);
  }
});

test("건강운 해석에 불길한 예언이 없다", () => {
  // 죽음·탑 같은 카드가 건강 쪽에서 겁을 주면 안 됩니다. 행동 권유로만 씁니다.
  for (const card of tarotCards) {
    assert.doesNotMatch(
      card.readings.health,
      /(죽|사망|큰 병|중병|위독|불치)/,
      `${card.ko} 건강운이 불안을 줍니다`,
    );
  }
});

test("운세 종류가 여섯 가지이고 슬러그가 겹치지 않는다", () => {
  assert.equal(tarotFortunes.length, 6);
  assert.equal(new Set(tarotSlugs).size, 6);
  assert.equal(new Set(tarotFortunes.map((f) => f.type)).size, 6);
  for (const f of tarotFortunes) {
    assert.ok(f.intro.length > 0, `${f.slug} 설명이 비어 있습니다`);
    assert.ok(f.keywords.length > 0, `${f.slug} 키워드가 비어 있습니다`);
  }
});

test("같은 날·같은 사람·같은 운세면 후보 카드가 항상 같다", () => {
  // 새로고침할 때마다 카드가 바뀌면 운세로 읽히지 않습니다.
  const a = dailyCandidates("2026-09-13", "visitor-1", "total");
  const b = dailyCandidates("2026-09-13", "visitor-1", "total");
  assert.deepEqual(a.map((c) => c.no), b.map((c) => c.no));
});

test("날짜나 운세 종류가 달라지면 후보가 달라진다", () => {
  const base = dailyCandidates("2026-09-13", "visitor-1", "total").map((c) => c.no);
  const nextDay = dailyCandidates("2026-09-14", "visitor-1", "total").map((c) => c.no);
  const otherType = dailyCandidates("2026-09-13", "visitor-1", "love").map((c) => c.no);
  assert.notDeepEqual(base, nextDay);
  assert.notDeepEqual(base, otherType);
});

test("후보 카드는 서로 겹치지 않는다", () => {
  const picked = dailyCandidates("2026-09-13", "visitor-9", "money", 5);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((c) => c.no)).size, 5);
});

test("날짜 키가 한국 시간 기준 YYYY-MM-DD 다", () => {
  // UTC 15시는 KST 로 다음 날 0시입니다. 여기서 날짜가 넘어가야 합니다.
  assert.equal(todayKst(new Date("2026-09-13T14:59:00Z")), "2026-09-13");
  assert.equal(todayKst(new Date("2026-09-13T15:00:00Z")), "2026-09-14");
});
