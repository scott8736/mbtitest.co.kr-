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
