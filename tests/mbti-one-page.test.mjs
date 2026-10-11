import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * MBTI 검사 한 페이지 계약 (2026-10-11).
 *
 * 40문항은 /tests/mbti/ 한 주소에서 풀고, 마지막 답 뒤에는 저절로 넘어가지 않습니다.
 * 결과는 예고 카드의 「내 결과 확인하기」 <a href> 로 엽니다 — 애드센스 전면광고는
 * 링크 클릭에만 붙으므로, 누가 이걸 location.assign() 으로 되돌리면 그 자리가 사라집니다.
 */
const src = readFileSync(fileURLToPath(new URL("../components/MbtiQuiz.tsx", import.meta.url)), "utf8");

test("검사 중간·끝에 자바스크립트 페이지 이동이 없다(나가기 버튼 제외)", () => {
  const moves = src.match(/location\.(assign|replace|href)\s*\(?\s*[`"'][^`"']*[`"']/g) ?? [];
  assert.deepEqual(moves, ['location.assign("/"'], "나가기(홈) 말고 다른 이동이 생겼다");
  assert.ok(!src.includes("step2/"), "2단계 주소로 넘기는 코드가 남아 있다");
});

test("결과는 진짜 링크로 연다", () => {
  assert.match(src, /<a className="mbti-teaser-cta" href=\{RESULT_PATH\}>/);
  assert.match(src, /const RESULT_PATH = "\/mbti-result\/"/);
});

test("예고 카드는 유형 네 글자 중 두 글자만 보여 준다", () => {
  assert.match(src, /const HIDDEN_LETTERS = \[1, 3\]/);
});

/** 공용 테스트 실행기·IQ 도 같은 계약입니다(2026-10-11). 자가진단(/check/)은 일부러 뺐습니다. */
const generic = readFileSync(fileURLToPath(new URL("../components/GenericTestRunner.tsx", import.meta.url)), "utf8");
const iq = readFileSync(fileURLToPath(new URL("../components/IqTestRunner.tsx", import.meta.url)), "utf8");

test("공용 테스트: 2단계·결과로 자바스크립트 이동이 없고 결과는 링크로 연다", () => {
  assert.ok(!/location\.assign\(`\/tests\/\$\{test\.slug\}\/(step2|result)\/`\)/.test(generic), "옛 자동 이동이 남아 있다");
  assert.match(generic, /<a className="mbti-teaser-cta" href=\{`\/tests\/\$\{test\.slug\}\/result\/`\}>/);
});

test("IQ: 마지막 문제 뒤 예고 화면, 결과는 링크로 연다", () => {
  assert.match(iq, /setScreen\("teaser"\)/);
  assert.match(iq, /<a className="mbti-teaser-cta" href=\{RESULT_PATH\}>/);
  assert.match(iq, /const RESULT_PATH = "\/tests\/iq\/result\/"/);
});

/** 운세·타로·자가진단·생년월일 궁합도 같은 계약(2026-10-11). 결과는 예고 화면의 <a href> 로만 연다. */
const read = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

test("오늘의 운세·사주: 입력 뒤 자동 이동 없이 예고 화면 링크", () => {
  const src = read("components/FortuneTool.tsx");
  assert.ok(!src.includes("location.assign(`/fortune/${mode}/result/`)"), "옛 자동 이동이 남아 있다");
  assert.match(src, /<a className="mbti-teaser-cta" href=\{`\/fortune\/\$\{mode\}\/result\/`\}>/);
});

test("타로·궁합: 결과는 별도 주소의 링크로 연다", () => {
  assert.match(read("components/TarotDaily.tsx"), /<a className="mbti-teaser-cta" href=\{resultPath\}>/);
  assert.match(read("components/CoupleFortuneTool.tsx"), /<a className="mbti-teaser-cta" href=\{RESULT_PATH\}>/);
  read("app/tarot/[slug]/result/page.tsx");
  read("app/fortune/gunghap/result/page.tsx");
});

test("자가진단: 결과 링크가 있되, 도움이 필요한 사람은 예고 없이 바로 결과", () => {
  const src = read("components/ScreenerRunner.tsx");
  assert.match(src, /<a className="mbti-teaser-cta" href=\{resultPath\}>/);
  assert.match(src, /if \(nextUrgent\) \{[\s\S]*?setScreen\("result"\);[\s\S]*?\} else \{[\s\S]*?setScreen\("teaser"\);/);
  read("app/check/[slug]/result/page.tsx");
});
