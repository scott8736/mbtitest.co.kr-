import assert from "node:assert/strict";
import test from "node:test";
import KoreanLunarCalendar from "korean-lunar-calendar";

/**
 * 음력 변환 점검.
 *
 * 변환이 틀리면 화면에는 그럴듯한 날짜가 그대로 나옵니다. 그래서 답을 아는
 * 날짜 — 실제 설날 — 로 고정합니다. 설날은 정의상 음력 1월 1일이므로
 * 양력 설날을 넣었을 때 음력 1월 1일이 나와야 합니다.
 */

const SEOLLAL = [
  ["2020-01-25"],
  ["2021-02-12"],
  ["2022-02-01"],
  ["2023-01-22"],
  ["2024-02-10"],
  ["2025-01-29"],
  ["2026-02-17"],
];

test("실제 설날을 넣으면 음력 1월 1일이 나온다", () => {
  const cal = new KoreanLunarCalendar();
  for (const [date] of SEOLLAL) {
    const [y, m, d] = date.split("-").map(Number);
    assert.ok(cal.setSolarDate(y, m, d), `${date} 변환 실패`);
    const lunar = cal.getLunarCalendar();
    assert.equal(lunar.month, 1, `${date} 의 음력 월이 ${lunar.month} 입니다`);
    assert.equal(lunar.day, 1, `${date} 의 음력 일이 ${lunar.day} 입니다`);
  }
});

test("양력에서 음력으로 갔다가 돌아오면 같은 날이 된다", () => {
  const cal = new KoreanLunarCalendar();
  const back = new KoreanLunarCalendar();
  for (let year = 1950; year <= 2040; year += 7) {
    for (const [m, d] of [[1, 15], [5, 3], [8, 26], [12, 31]]) {
      assert.ok(cal.setSolarDate(year, m, d), `${year}-${m}-${d} 변환 실패`);
      const lunar = cal.getLunarCalendar();
      assert.ok(
        back.setLunarDate(lunar.year, lunar.month, lunar.day, lunar.intercalation),
        `음력 ${lunar.year}-${lunar.month}-${lunar.day} 되돌리기 실패`,
      );
      const solar = back.getSolarCalendar();
      assert.deepEqual(
        [solar.year, solar.month, solar.day],
        [year, m, d],
        `${year}-${m}-${d} 가 왕복에서 어긋났습니다`,
      );
    }
  }
});

test("음력 날짜는 1~12월, 1~30일 범위 안에 있다", () => {
  const cal = new KoreanLunarCalendar();
  for (let year = 1950; year <= 2040; year += 3) {
    assert.ok(cal.setSolarDate(year, 6, 15));
    const lunar = cal.getLunarCalendar();
    assert.ok(lunar.month >= 1 && lunar.month <= 12, `${year} 음력 월이 ${lunar.month}`);
    assert.ok(lunar.day >= 1 && lunar.day <= 30, `${year} 음력 일이 ${lunar.day}`);
  }
});
