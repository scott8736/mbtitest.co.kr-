import assert from "node:assert/strict";
import test from "node:test";

const {
  calcYearPillar,
  heavenlyStemsKo,
  earthlyBranchesKo,
  zodiacIndexFromYear,
  zodiacNames,
  starSignIndexFromDate,
  starSignSlugs,
  buildChart,
  hashSeed,
  seoulDateKey,
} = await import("../lib/fortune-engine.ts");

test("연주 간지가 알려진 육십갑자와 맞는다", () => {
  const cases = [
    [2024, "갑진"],
    [2025, "을사"],
    [2026, "병오"],
    [2027, "정미"],
    [1988, "무진"],
  ];
  for (const [year, expected] of cases) {
    const pillar = calcYearPillar(year);
    assert.equal(heavenlyStemsKo[pillar.stemIdx] + earthlyBranchesKo[pillar.branchIdx], expected);
  }
});

test("띠는 태어난 해로 정해지고, 입춘 이전은 전 해로 본다", () => {
  assert.equal(zodiacNames[zodiacIndexFromYear(2020, 6, 15)], "쥐띠");
  assert.equal(zodiacNames[zodiacIndexFromYear(2026, 6, 15)], "말띠");
  assert.equal(zodiacNames[zodiacIndexFromYear(2027, 6, 15)], "양띠");
  // 2027년 1월생은 아직 병오년(말띠)으로 봅니다.
  assert.equal(zodiacNames[zodiacIndexFromYear(2027, 1, 10)], "말띠");
  assert.equal(zodiacNames[zodiacIndexFromYear(2027, 2, 3)], "말띠");
  assert.equal(zodiacNames[zodiacIndexFromYear(2027, 2, 4)], "양띠");
});

test("별자리 시작일과 그 하루 전이 각각 맞는 별자리로 잡힌다", () => {
  const starts = [
    [3, 21, "aries"],
    [4, 20, "taurus"],
    [5, 21, "gemini"],
    [6, 22, "cancer"],
    [7, 23, "leo"],
    [8, 23, "virgo"],
    [9, 23, "libra"],
    [10, 23, "scorpio"],
    [11, 22, "sagittarius"],
    [12, 22, "capricorn"],
    [1, 20, "aquarius"],
    [2, 19, "pisces"],
  ];

  for (let index = 0; index < starts.length; index += 1) {
    const [month, day, expected] = starts[index];
    assert.equal(starSignSlugs[starSignIndexFromDate(month, day)], expected, `${month}/${day}`);

    // 시작일 하루 전은 앞 별자리여야 합니다.
    const previous = starts[(index + starts.length - 1) % starts.length][2];
    const beforeDay = day - 1;
    if (beforeDay >= 1) {
      assert.equal(starSignSlugs[starSignIndexFromDate(month, beforeDay)], previous, `${month}/${beforeDay}`);
    }
  }

  // 1월 1~19일은 전해 12월에 시작한 염소자리입니다.
  assert.equal(starSignSlugs[starSignIndexFromDate(1, 1)], "capricorn");
  assert.equal(starSignSlugs[starSignIndexFromDate(1, 19)], "capricorn");
});

test("모든 날짜가 12별자리 안에 들어간다", () => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= daysInMonth[month - 1]; day += 1) {
      const index = starSignIndexFromDate(month, day);
      assert.ok(index >= 0 && index <= 11, `${month}/${day} → ${index}`);
    }
  }
});

test("사주는 여덟 글자, 시간을 모르면 여섯 글자로 계산된다", () => {
  const withTime = buildChart({ year: 1993, month: 7, day: 14, timeSlot: 5 });
  const withoutTime = buildChart({ year: 1993, month: 7, day: 14 });

  assert.equal(withTime.elementCounts.reduce((sum, value) => sum + value, 0), 8);
  assert.equal(withoutTime.elementCounts.reduce((sum, value) => sum + value, 0), 6);
  assert.equal(withoutTime.time, null);
});

test("같은 입력이면 항상 같은 결과가 나온다", () => {
  const first = buildChart({ year: 1993, month: 7, day: 14, timeSlot: 5 });
  const second = buildChart({ year: 1993, month: 7, day: 14, timeSlot: 5 });
  assert.deepEqual(first, second);
  assert.equal(hashSeed("mbtitest"), hashSeed("mbtitest"));
  assert.notEqual(hashSeed("mbtitest"), hashSeed("mbtitest2"));
});

test("날짜 키는 한국 시간 기준 YYYY-MM-DD 형식이다", () => {
  // 협정시 2026-01-01 20:00 은 한국에서 이미 1월 2일입니다.
  assert.equal(seoulDateKey(new Date("2026-01-01T20:00:00Z")), "2026-01-02");
  assert.match(seoulDateKey(), /^\d{4}-\d{2}-\d{2}$/);
});
