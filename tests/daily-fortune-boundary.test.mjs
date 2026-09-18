import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * daily-fortune.ts 경계값 점검. 결정성(같은 입력 → 같은 결과)은
 * tests/daily-fortune.test.mjs 가 이미 다룬다. 여기서는 그 파일이 다루지
 * 않은 "이상한 입력을 줘도 조용히 죽지 않는가"만 본다.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export { buildDailyReading, formatKoreanDate } from "./lib/daily-fortune";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { buildDailyReading, formatKoreanDate } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

test("존재하지 않는 날짜 문자열(평년 2월 30일, 13월)을 넣어도 예외 없이 결과가 만들어진다", () => {
  // buildDailyReading 은 dateKey 를 실제 달력으로 파싱하지 않고 해시 시드로만
  // 쓰기 때문에 형식만 맞으면 존재하지 않는 날짜라도 그대로 계산된다.
  assert.doesNotThrow(() => buildDailyReading("2026-02-30", "rat"));
  assert.doesNotThrow(() => buildDailyReading("2026-13-45", ""));
  const r = buildDailyReading("2026-02-30", "rat");
  assert.ok(r.headline.length > 0);
  assert.ok(r.score >= 55 && r.score <= 95);
});

test("dateKey 를 아예 안 주면 seoulDateKey() 로 오늘 날짜를 대신 쓴다", () => {
  const r = buildDailyReading();
  assert.match(r.dateKey, /^\d{4}-\d{2}-\d{2}$/);
});

test("extra 를 생략한 것과 빈 문자열을 준 것은 같은 결과를 낸다", () => {
  const withDefault = buildDailyReading("2026-09-14");
  const withEmpty = buildDailyReading("2026-09-14", "");
  assert.deepEqual(withDefault, withEmpty);
});

test("formatKoreanDate 는 형식이 깨진 문자열을 받아도 예외를 던지지 않는다(검증 없음 확인)", () => {
  // y/m/d 가 하나라도 falsy(0, NaN, undefined)면 원본을 그대로 돌려주지만,
  // month=13·day=45 처럼 "숫자이지만 달력에는 없는 값"은 걸러내지 않고
  // 그대로 문자열에 박아 내보낸다. formatKoreanDate 는 dateKey 가 항상
  // seoulDateKey() 출력이라고 믿고 있어서 방어 코드가 없다.
  assert.doesNotThrow(() => formatKoreanDate(""));
  assert.doesNotThrow(() => formatKoreanDate("not-a-date"));
  assert.equal(formatKoreanDate(""), "");
  assert.equal(formatKoreanDate("2026-13-45"), "2026년 13월 45일 (일)");
});

test("윤년 2월 29일과 평년에 2월 29일을 넣어도 둘 다 예외 없이 계산된다", () => {
  const leap = buildDailyReading("2024-02-29", "dragon");
  const nonLeap = buildDailyReading("2026-02-29", "dragon"); // 2026년은 평년, 실존하지 않는 날짜
  assert.ok(leap.headline.length > 0);
  assert.ok(nonLeap.headline.length > 0);
  // 실존하지 않는 날짜라도 해시 시드는 문자열 그대로 계산하므로 서로 다른 값이 나올 뿐 죽지 않는다.
  assert.notEqual(leap.dateKey, nonLeap.dateKey);
});
