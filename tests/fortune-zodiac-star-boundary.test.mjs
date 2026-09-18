import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 별자리(fortune-star-signs.ts)·띠(fortune-zodiac.ts) 콘텐츠가 fortune-engine.ts
 * 의 계산 함수와 어긋나지 않는지 점검한다.
 *
 * 두 콘텐츠 파일 다 "날짜로 인덱스를 직접 계산"하지는 않는다 — slug 로 찾거나
 * (getStarSign/getZodiac), 화면에 보여줄 시작일·기간 문자열을 정적으로 들고
 * 있을 뿐이다. 그래서 위험은 두 군데다.
 *   1) 정적으로 박아둔 시작/종료 월일이 fortune-engine.ts 의 표(starSignStarts)
 *      와 실제로 같은가 (다르면 페이지 문구와 실제 판정이 어긋난다)
 *   2) fortune-zodiac.ts 의 birthYears() 가 fortune-engine.ts 의
 *      zodiacIndexFromYear() 와 같은 해를 같은 띠로 보는가
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

const { starSignIndexFromDate, starSignSlugs, zodiacIndexFromYear, zodiacSlugs, zodiacNames } = await bundle(
  `export { starSignIndexFromDate, starSignSlugs, zodiacIndexFromYear, zodiacSlugs, zodiacNames } from "./lib/fortune-engine";`,
);
const { starSigns, getStarSign, starSignName, starSignIndex } = await bundle(
  `export { starSigns, getStarSign, starSignName, starSignIndex } from "./lib/fortune-star-signs";`,
);
const { zodiacFortunes, getZodiac, birthYears, zodiacIndex, zodiacName, samjaeSlugs } = await bundle(
  `export { zodiacFortunes, getZodiac, birthYears, zodiacIndex, zodiacName, samjaeSlugs } from "./lib/fortune-zodiac";`,
);

// ── 별자리: 콘텐츠 표의 시작/종료일이 fortune-engine.ts 계산 결과와 366일 전수로 맞는지 ──

test("starSigns 콘텐츠의 시작일이 fortune-engine 의 표와 슬러그 순서까지 정확히 같다", () => {
  for (const sign of starSigns) {
    assert.equal(
      starSignSlugs[starSignIndexFromDate(sign.startMonth, sign.startDay)],
      sign.slug,
      `${sign.slug} 의 시작일(${sign.startMonth}/${sign.startDay})이 engine 계산과 다르다`,
    );
  }
});

test("윤년을 포함해 366일 전수 순회 — 콘텐츠 배열의 각 별자리가 담당하는 날짜 범위가 engine 판정과 완전히 같다", () => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2024년(윤년) 기준
  const mismatches = [];

  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= daysInMonth[month - 1]; day += 1) {
      const engineIndex = starSignIndexFromDate(month, day);
      const engineSlug = starSignSlugs[engineIndex];

      // 콘텐츠 파일에서 "이 날짜가 속한 별자리"를 기간 문자열이 아니라
      // startMonth/startDay ~ endMonth/endDay 필드로 직접 찾아본다.
      // (연말/연초를 넘나드는 염소자리만 예외 처리)
      const contentMatch = starSigns.find((sign) => {
        if (sign.startMonth <= sign.endMonth) {
          return (
            (month === sign.startMonth && day >= sign.startDay) ||
            (month === sign.endMonth && day <= sign.endDay) ||
            (month > sign.startMonth && month < sign.endMonth)
          );
        }
        // 염소자리: 12/22 ~ 1/19 처럼 해를 넘어간다.
        return (month === sign.startMonth && day >= sign.startDay) || (month === sign.endMonth && day <= sign.endDay);
      });

      if (!contentMatch || contentMatch.slug !== engineSlug) {
        mismatches.push(`${month}/${day} → engine=${engineSlug}, content=${contentMatch?.slug ?? "없음"}`);
      }
    }
  }

  assert.equal(mismatches.length, 0, `날짜-별자리 불일치 ${mismatches.length}건:\n${mismatches.join("\n")}`);
});

test("getStarSign/starSignName/starSignIndex 가 fortune-engine 의 starSignSlugs 순서와 어긋나지 않는다", () => {
  starSignSlugs.forEach((slug, index) => {
    assert.equal(starSignIndex(slug), index);
    const found = getStarSign(slug);
    assert.ok(found, `${slug} 콘텐츠가 없다`);
    assert.equal(found.slug, slug);
    assert.equal(starSignName(slug), found.name);
  });
});

test("존재하지 않는 slug 를 넣으면 undefined 를 돌려주고 예외를 던지지 않는다", () => {
  assert.equal(getStarSign("not-a-sign"), undefined);
  assert.equal(getZodiac("not-a-zodiac"), undefined);
  assert.doesNotThrow(() => getStarSign(""));
  assert.doesNotThrow(() => getZodiac(""));
});

// ── 띠: birthYears() 와 zodiacIndexFromYear() 가 같은 해를 같은 띠로 보는지 ──

test("zodiacFortunes 12개 모두 birthYears() 로 뽑은 연도가 zodiacIndexFromYear() 판정과 정확히 일치한다(달력 연도 기준)", () => {
  for (const item of zodiacFortunes) {
    const index = zodiacIndex(item.slug);
    const years = birthYears(index, 1948, 2032);
    assert.ok(years.length > 0, `${item.slug} 에 해당하는 연도가 하나도 없다`);
    for (const year of years) {
      // birthYears 는 달력 연도만 보고 고르므로, 같은 방식(월/일 없이)으로 물어본
      // zodiacIndexFromYear 도 같은 인덱스를 내야 한다.
      assert.equal(
        zodiacIndexFromYear(year),
        index,
        `${year}년은 birthYears 에서는 ${item.name}이지만 zodiacIndexFromYear 는 다른 띠를 가리킨다`,
      );
    }
  }
});

test("입춘 이전(1/1~2/3) 출생은 birthYears 목록의 '해당 연도'와 실제 판정(zodiacIndexFromYear)이 다르다 — 자료 성격이 다름을 확인", () => {
  // birthYears(index) 는 "달력 연도가 몇 년이면 이 띠인가"만 답한다.
  // 반면 실제 사람의 생년월일로 띠를 정할 때는 zodiacIndexFromYear(year, month, day)
  // 를 써야 하고, 입춘 이전 출생은 전 해로 넘어간다. 두 값을 그대로 같다고
  // 가정하면 안 된다는 것을 명시적으로 확인해 둔다.
  const ratIndex = zodiacIndex("rat");
  assert.ok(birthYears(ratIndex, 2020, 2020).includes(2020));
  // 2020년 1월생은 birthYears 표에는 "2020 = 쥐띠"로 나오지만, 실제 생일이
  // 입춘 이전이면 zodiacIndexFromYear 는 전 해(2019, 돼지띠)로 넘긴다.
  assert.notEqual(zodiacIndexFromYear(2020, 1, 20), ratIndex);
  assert.equal(zodiacNames[zodiacIndexFromYear(2020, 1, 20)], "돼지띠");
});

test("zodiacBranch/zodiacName 이 fortune-engine 의 zodiacSlugs 순서와 어긋나지 않는다", () => {
  zodiacSlugs.forEach((slug, index) => {
    assert.equal(zodiacIndex(slug), index);
    assert.equal(zodiacName(slug), zodiacNames[index]);
  });
});

test("samjaeSlugs 에 등록된 슬러그가 실제 zodiacSlugs 안에 존재하는 값이다", () => {
  for (const slug of samjaeSlugs) {
    assert.ok(zodiacSlugs.includes(slug), `${slug} 는 zodiacSlugs 에 없는 슬러그다`);
  }
});

test("birthYears 는 from > to 처럼 뒤집힌 범위를 줘도 예외 없이 빈 배열을 돌려준다", () => {
  assert.deepEqual(birthYears(0, 2032, 1948), []);
});

test("birthYears 의 index 로 12를 벗어난 값을 줘도 예외를 던지지 않는다(검증 없음 확인)", () => {
  // (((year - 4) % 12) + 12) % 12 는 항상 0~11 이므로, index 에 12 이상을 넣으면
  // 절대 매치되지 않아 조용히 빈 배열이 나온다. 잘못 호출해도 티가 안 난다.
  assert.deepEqual(birthYears(12, 2000, 2010), []);
  assert.deepEqual(birthYears(-1, 2000, 2010), []);
});
