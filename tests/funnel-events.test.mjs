import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 완주율 표를 만드는 기록이 사람당 한 번씩만 쌓이는지 봅니다.
 *
 * 2026-09-30 관리자 표에서 애착 테스트의 「2단계」(108)가 「첫 응답」(102)보다
 * 컸습니다. 2단계를 화면 조회수로 세서 새로고침·뒤로가기가 섞였기 때문입니다.
 * 지금은 완주와 같은 방식(표시 → 한 번 기록)으로 셉니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { markStep2Reached, recordStep2Once, markTestCompleted, recordCompletionOnce, onResultLinkClick, remainingMinutes, recordTestEventOnce, recordVisitOnce, recordAnswered } from "./lib/test-events";
      export { parseRange, cleanKey } from "./worker/admin";
      export { isKnownEvent } from "./worker/test-events";
      export { SAJULAB_PLACEMENT_KEYS } from "./lib/sajulab";
      export { RESULT_CLICK_PLACEMENT_KEYS } from "./lib/result-clicks";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  external: ["cloudflare:*"],
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

// 브라우저 대역. sendBeacon 으로 나간 주소를 모읍니다.
const sent = [];
const store = new Map();
globalThis.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
Object.defineProperty(globalThis, "navigator", {
  value: { sendBeacon: (url) => (sent.push(url), true) },
  configurable: true,
});

const reset = () => {
  sent.length = 0;
  store.clear();
};

test("2단계는 1단계를 끝낸 사람만, 한 번만 기록된다 (새로고침해도 한 번)", () => {
  reset();
  mod.markStep2Reached("adult-attachment");
  mod.recordStep2Once("adult-attachment");
  mod.recordStep2Once("adult-attachment"); // 새로고침
  assert.deepEqual(sent, ["/api/event?slug=adult-attachment&name=step2"]);
});

test("1단계를 거치지 않고 2단계 주소를 연 경우는 기록하지 않는다", () => {
  reset();
  mod.recordStep2Once("mbti");
  assert.deepEqual(sent, []);
});

test("테스트마다 따로 센다", () => {
  reset();
  mod.markStep2Reached("mbti");
  mod.recordStep2Once("egen-teto");
  assert.deepEqual(sent, []);
  mod.recordStep2Once("mbti");
  assert.deepEqual(sent, ["/api/event?slug=mbti&name=step2"]);
});

test("완주도 같은 방식으로 한 번만 기록된다", () => {
  reset();
  mod.markTestCompleted("career");
  mod.recordCompletionOnce("career");
  mod.recordCompletionOnce("career");
  assert.deepEqual(sent, ["/api/event?slug=career&name=completed"]);
});

test("남은 시간은 문항당 6초, 최소 1분", () => {
  assert.equal(mod.remainingMinutes(20), 2);
  assert.equal(mod.remainingMinutes(12), 1);
  assert.equal(mod.remainingMinutes(1), 1);
  assert.equal(mod.remainingMinutes(0), 1);
});

test("관리자 기간 지정: 올바른 범위만 받고, 미래 끝 날짜는 오늘로 자른다", () => {
  const r = (q) => mod.parseRange(new URL(`https://x/admin/?${q}`));
  assert.deepEqual(r("from=2026-09-10&to=2026-09-22"), { from: "2026-09-10", to: "2026-09-22" });
  assert.equal(r("from=2026-09-22&to=2026-09-10"), null, "시작이 끝보다 늦음");
  assert.equal(r("from=2026-9-1&to=2026-09-22"), null, "형식 틀림");
  assert.equal(r("from=abc&to=2026-09-22"), null);
  assert.equal(r("to=2026-09-22"), null, "시작 없음");
  assert.equal(r(""), null);
  const future = r("from=2026-09-10&to=2999-01-01");
  assert.ok(future && future.to < "2999-01-01", "미래 날짜는 오늘로");
});

test("붙여 넣은 API 키에서 이름=·따옴표·공백·줄바꿈을 걷어낸다", () => {
  // 2026-10-01 트렌드 화면이 HUB 로 넘어간 뒤 "Authentication information are missing" 이 났다.
  const k = "abcDEF1234";
  assert.equal(mod.cleanKey(k), k);
  assert.equal(mod.cleanKey(`  ${k}
`), k);
  assert.equal(mod.cleanKey(`NCP_APIGW_KEY_ID=${k}`), k);
  assert.equal(mod.cleanKey(`NCP_APIGW_KEY = "${k}"`), k);
  assert.equal(mod.cleanKey(`'${k}'`), k);
  assert.equal(mod.cleanKey("abc==def"), "abc==def", "값 안의 = 는 건드리지 않는다");
});

test("리포트 수요 측정은 탭당 한 번만 센다 (스크롤·연타로 관심률이 부풀지 않게)", () => {
  reset();
  mod.recordTestEventOnce("mbti", "report_seen");
  mod.recordTestEventOnce("mbti", "report_seen");
  mod.recordTestEventOnce("mbti", "report_click");
  mod.recordTestEventOnce("mbti", "report_click");
  mod.recordTestEventOnce("mbti", "report_follow");
  assert.deepEqual(sent, [
    "/api/event?slug=mbti&name=report_seen",
    "/api/event?slug=mbti&name=report_click",
    "/api/event?slug=mbti&name=report_follow",
  ]);
});

test("방문은 답하기 전까지 한 번만, 답한 뒤 다시 검사하면 새로 센다", () => {
  reset();
  mod.recordVisitOnce("mbti");
  mod.recordVisitOnce("mbti"); // 새로고침
  mod.recordAnswered("mbti");
  mod.recordVisitOnce("mbti"); // 같은 탭에서 다시 검사
  assert.deepEqual(sent, [
    "/api/event?slug=mbti&name=visited",
    "/api/event?slug=mbti&name=answered",
    "/api/event?slug=mbti&name=visited",
  ]);
});

test("사주랩 배너 이벤트는 배너 자리로만 받고, 탭당 한 번만 센다", () => {
  for (const key of mod.SAJULAB_PLACEMENT_KEYS) {
    assert.ok(mod.isKnownEvent(key, "saju_seen"), `${key} 노출이 워커에서 버려진다`);
    assert.ok(mod.isKnownEvent(key, "saju_click"), `${key} 클릭이 워커에서 버려진다`);
  }
  assert.equal(mod.isKnownEvent("depression", "saju_click"), false, "자가진단에는 배너가 없다");
  assert.equal(mod.isKnownEvent("아무거나", "saju_click"), false);
  assert.equal(mod.isKnownEvent("test", "completed"), false, "배너 자리 이름은 테스트 slug 가 아니다");
  assert.ok(mod.isKnownEvent("mbti", "completed"), "기존 이벤트는 그대로 받는다");

  reset();
  mod.recordTestEventOnce("tarot", "saju_seen");
  mod.recordTestEventOnce("tarot", "saju_seen");
  mod.recordTestEventOnce("tarot", "saju_click");
  mod.recordTestEventOnce("tarot", "saju_click");
  assert.deepEqual(sent, [
    "/api/event?slug=tarot&name=saju_seen",
    "/api/event?slug=tarot&name=saju_click",
  ]);
});

test("결과 화면 링크 묶음 클릭은 묶음 이름으로만 받고, 카드를 눌렀을 때만 탭당 한 번 센다", () => {
  for (const key of mod.RESULT_CLICK_PLACEMENT_KEYS) {
    assert.ok(mod.isKnownEvent(key, "result_click"), `${key} 클릭이 워커에서 버려진다`);
  }
  assert.equal(mod.isKnownEvent("mbti", "result_click"), false, "테스트 slug 는 묶음 이름이 아니다");
  assert.equal(mod.isKnownEvent("mbti-next", "completed"), false, "묶음 이름은 테스트 slug 가 아니다");

  // 클릭 대상 대역: closest("a[href]") 로 카드 안인지 판단합니다.
  const onCard = { target: { closest: (sel) => (sel === "a[href]" ? {} : null) } };
  const onGap = { target: { closest: () => null } };

  reset();
  const handler = mod.onResultLinkClick("mbti-next");
  handler(onGap);
  handler(onCard);
  handler(onCard); // 뒤로 와서 또 누름
  mod.onResultLinkClick("mbti-type")(onCard);
  assert.deepEqual(sent, [
    "/api/event?slug=mbti-next&name=result_click",
    "/api/event?slug=mbti-type&name=result_click",
  ]);
});
