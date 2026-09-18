import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * lib/tarot.ts 경계값 테스트.
 *
 * screener-tarot.test.mjs 가 이미 기본 데이터 무결성(22장, 슬러그 중복,
 * 결정적 선택, KST 날짜 경계)을 검증하고 있습니다. 여기서는 그 파일이
 * 다루지 않는 "카드 뽑기 함수 자체의 경계 입력"에 집중합니다:
 * count 파라미터가 카드 총수를 넘거나 0/음수일 때, tarotCardByNo 가
 * 범위를 벗어난 번호를 받았을 때, tarotFortuneBySlug 가 빈 문자열/미지
 * 슬러그를 받았을 때, 그리고 대량의 방문자 ID에 대해 항상 중복 없는
 * 후보가 나오는지.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./lib/tarot";`,
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
const { tarotCards, dailyCandidates, tarotCardByNo, tarotFortuneBySlug, todayKst } = mod;

/* ---------------- dailyCandidates: count 경계 ---------------- */

test("count 가 카드 총수(22)보다 크면 있는 카드만(22장) 중복 없이 반환한다", () => {
  const picked = dailyCandidates("2026-09-13", "visitor-over", "total", 100);
  assert.equal(picked.length, tarotCards.length);
  assert.equal(new Set(picked.map((c) => c.no)).size, tarotCards.length);
});

test("count 가 0 이면 빈 배열을 반환한다", () => {
  const picked = dailyCandidates("2026-09-13", "visitor-zero", "total", 0);
  assert.deepEqual(picked, []);
});

test("count 가 음수면 Array.prototype.slice 의 '끝에서부터' 규칙이 그대로 적용된다", () => {
  // dailyCandidates(..., -1) === pool.slice(0, -1) 이므로 "마지막 한 장 제외한
  // 전부"가 나옵니다. 호출부(TarotDaily.tsx)는 항상 양수 리터럴만 넘기므로
  // 실사용 크래시는 아니지만, 함수 자체는 음수를 막지 않는다는 점을 남겨둡니다.
  const picked = dailyCandidates("2026-09-13", "visitor-neg", "total", -1);
  assert.equal(picked.length, tarotCards.length - 1);
  assert.equal(new Set(picked.map((c) => c.no)).size, picked.length);
});

test("count 가 기본값(5)일 때 다섯 장이 중복 없이 나온다 — 대량 방문자 샘플", () => {
  for (let i = 0; i < 200; i += 1) {
    const picked = dailyCandidates("2026-09-13", `visitor-${i}`, "money");
    assert.equal(picked.length, 5, `visitor-${i} 후보 수가 5가 아닙니다`);
    assert.equal(new Set(picked.map((c) => c.no)).size, 5, `visitor-${i} 후보가 겹칩니다`);
    for (const card of picked) {
      assert.ok(card.no >= 0 && card.no <= 21, `visitor-${i} 카드 번호(${card.no})가 범위를 벗어났습니다`);
    }
  }
});

test("dateKey/visitorId/type 이 빈 문자열이어도 죽지 않고 다섯 장을 만든다", () => {
  const picked = dailyCandidates("", "", "");
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((c) => c.no)).size, 5);
});

test("아주 긴 visitorId 문자열도 그대로 처리한다", () => {
  const longId = "v".repeat(20000);
  const picked = dailyCandidates("2026-09-13", longId, "total");
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((c) => c.no)).size, 5);
});

test("TarotType 에 없는 임의의 문자열(타입 체크는 컴파일 타임뿐)을 넣어도 크래시하지 않는다", () => {
  // 런타임에는 문자열일 뿐이므로 hashSeed 에 그대로 들어갑니다. TS 타입은
  // 지켜지지만, 검증되지 않은 값이 넘어올 경로(예: URL 파라미터를 캐스팅)가
  // 생기면 여기서 조용히 통과한다는 점을 남겨둡니다.
  const picked = dailyCandidates("2026-09-13", "visitor-1", "not-a-real-type");
  assert.equal(picked.length, 5);
});

/* ---------------- tarotCardByNo: 인덱스 경계 ---------------- */

test("범위를 벗어난 번호는 undefined 를 반환한다 (크래시하지 않는다)", () => {
  assert.equal(tarotCardByNo(-1), undefined);
  assert.equal(tarotCardByNo(22), undefined);
  assert.equal(tarotCardByNo(999), undefined);
  assert.equal(tarotCardByNo(Number.NaN), undefined);
  assert.equal(tarotCardByNo(1.5), undefined);
  assert.equal(tarotCardByNo(Infinity), undefined);
});

test("0번(바보) 카드는 falsy 값이 아니라 정상 객체로 반환된다", () => {
  // no:0 은 숫자로는 falsy 지만 find() 가 반환하는 것은 카드 "객체"이므로
  // `if (card)` 같은 호출부 검사에서 0번 카드가 빠지는 사고는 나지 않습니다.
  const card = tarotCardByNo(0);
  assert.ok(card);
  assert.equal(card.ko, "바보");
});

test("각 카드 번호로 조회하면 정확히 그 카드가 나온다 (왕복 검증)", () => {
  for (const card of tarotCards) {
    assert.equal(tarotCardByNo(card.no), card);
  }
});

/* ---------------- tarotFortuneBySlug: 문자열 경계 ---------------- */

test("빈 문자열/미지 슬러그/대소문자 다른 슬러그는 모두 undefined", () => {
  assert.equal(tarotFortuneBySlug(""), undefined);
  assert.equal(tarotFortuneBySlug("   "), undefined);
  assert.equal(tarotFortuneBySlug("존재하지-않는-슬러그"), undefined);
  assert.equal(tarotFortuneBySlug("TODAY-TOTAL"), undefined); // 대소문자 정규화 없음
  assert.equal(tarotFortuneBySlug(" today-total "), undefined); // 공백 정규화 없음
});

test("정확한 슬러그는 찾는다", () => {
  const found = tarotFortuneBySlug("today-total");
  assert.ok(found);
  assert.equal(found.type, "total");
});

/* ---------------- todayKst: 자정 경계 재확인 ---------------- */

test("연말/연초 경계에서도 KST 날짜가 올바르게 넘어간다", () => {
  // UTC 2026-12-31 14:59 -> KST 2026-12-31 23:59
  assert.equal(todayKst(new Date("2026-12-31T14:59:00Z")), "2026-12-31");
  // UTC 2026-12-31 15:00 -> KST 2027-01-01 00:00
  assert.equal(todayKst(new Date("2026-12-31T15:00:00Z")), "2027-01-01");
});
