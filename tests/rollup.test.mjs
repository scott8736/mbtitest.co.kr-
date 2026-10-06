import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 관리자 하루 집계(worker/rollup.ts).
 *
 * 2026-10-04 에 관리자 화면이 쿼리마다 page_views 를 통째로 훑어 D1 무료 한도를 넘겼습니다.
 * 집계를 SQL 에서 이 파일로 옮겼으므로, 예전 SQL 이 내던 숫자와 같은지 여기서 고정합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export { buildRollup, mergeRollups, daysBetween, stageOf, isTestIntro, dayEndMs } from "./worker/rollup";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

const page = (visitor_hash, path, time, extra = {}) => ({
  path,
  referrer: "",
  source: "direct",
  device: "mobile",
  country: "KR",
  visitor_hash,
  created_at: `2026-10-04 ${time}`,
  ...extra,
});

test("체류·회유: 예전 SQL 검증과 같은 5명 표본에서 같은 숫자", () => {
  const rows = [
    // A: MBTI 끝내고 애착 검사로 감
    page("A", "/tests/mbti/", "10:00:00"), page("A", "/tests/mbti/step2/", "10:02:00"),
    page("A", "/mbti-result/", "10:04:00"), page("A", "/tests/adult-attachment/", "10:05:00", { source: "internal", referrer: "https://mbtitest.co.kr/mbti-result/" }),
    // B: MBTI 끝내고 나감 (4분)
    page("B", "/tests/mbti/", "11:00:00"), page("B", "/tests/mbti/step2/", "11:02:00"), page("B", "/mbti-result/", "11:04:00"),
    // C: 공유받은 결과만 열고 나감 -> 완료자 아님
    page("C", "/mbti-result/", "12:00:00", { source: "naver", referrer: "https://m.search.naver.com/" }),
    // D: 애착 먼저, MBTI 나중 -> 전환 아님
    page("D", "/tests/adult-attachment/", "13:00:00"), page("D", "/tests/adult-attachment/step2/", "13:01:00"),
    page("D", "/tests/mbti/", "13:03:00"), page("D", "/tests/mbti/step2/", "13:05:00"), page("D", "/mbti-result/", "13:07:00"),
    // E: 홈 -> 검사 목록 30초
    page("E", "/", "14:00:00", { country: "" }), page("E", "/tests/", "14:00:30"),
  ];
  const r = mod.buildRollup("2026-10-04", rows, [{ slug: "mbti", name: "completed", count: 3 }]);
  assert.deepEqual(r.journey, { visitors: 5, views: 15, multi: 2, mbti_done: 3, mbti_next: 1, b0: 1, b1: 1, b2: 0, b3: 3, b4: 0 });
  assert.equal(r.visitors, 5);
  assert.equal(r.views, 15);
  assert.deepEqual(r.steps.mbti, { intro: 3, step2: 3, result: 4 }, "A·B·D 가 MBTI 첫 화면·2단계를 봄, 결과는 C 포함 4");
  assert.deepEqual(r.steps["adult-attachment"], { intro: 2, step2: 1, result: 0 });
  assert.deepEqual(r.afterMbti, { "/tests/adult-attachment/": 1 });
  assert.deepEqual(r.referrers, { "https://m.search.naver.com/": 1 }, "사이트 안 이동은 리퍼러 표에 넣지 않는다");
  assert.equal(r.countries["알 수 없음"], 1);
  assert.equal(r.events["completed|mbti"], 3);
});

test("검사 단계 주소 판별: 공유 결과(r/…)·목록(/tests/)은 단계가 아니다", () => {
  assert.deepEqual(mod.stageOf("/tests/hsp/"), { slug: "hsp", stage: "intro" });
  assert.deepEqual(mod.stageOf("/tests/hsp/step2/"), { slug: "hsp", stage: "step2" });
  assert.deepEqual(mod.stageOf("/tests/hsp/result/"), { slug: "hsp", stage: "result" });
  assert.deepEqual(mod.stageOf("/mbti-result/"), { slug: "mbti", stage: "result" });
  assert.equal(mod.stageOf("/tests/hsp/r/abc/"), null);
  assert.equal(mod.stageOf("/tests/"), null);
  assert.ok(mod.isTestIntro("/check/depression/"));
  assert.ok(!mod.isTestIntro("/check/depression/result/"));
});

test("여러 날을 더하면 각 칸이 합쳐진다", () => {
  const d1 = mod.buildRollup("2026-10-01", [page("A", "/", "01:00:00"), page("A", "/tests/mbti/", "01:00:10")], [{ slug: "mbti", name: "answered", count: 2 }]);
  const d2 = mod.buildRollup("2026-10-02", [page("A", "/", "01:00:00")], [{ slug: "mbti", name: "answered", count: 5 }]);
  const m = mod.mergeRollups([d1, d2]);
  assert.equal(m.views, 3);
  assert.equal(m.visitors, 2, "방문자 해시는 날마다 바뀌므로 날짜별 합");
  assert.equal(m.paths["/"], 2);
  assert.equal(m.events["answered|mbti"], 7);
  assert.equal(m.journey.b0, 1);
  assert.equal(m.steps.mbti.intro, 1);
});

test("날짜 범위는 양 끝을 포함하고 월을 넘긴다", () => {
  assert.deepEqual(mod.daysBetween("2026-09-29", "2026-10-02"), ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"]);
  assert.deepEqual(mod.daysBetween("2026-10-04", "2026-10-04"), ["2026-10-04"]);
});

test("들어온 페이지별 이탈: 가장 이른 조회가 들어온 페이지, 기록 순서가 뒤섞여도 같다", () => {
  const rows = [
    // A: 블로그로 들어와 MBTI 검사로 감 (기록이 늦은 것부터 들어옴)
    page("A", "/tests/mbti/", "10:01:00", { source: "internal" }), page("A", "/blog/x/", "10:00:00", { source: "naver" }),
    // B·C: 블로그 하나만 보고 나감
    page("B", "/blog/x/", "11:00:00", { source: "naver" }),
    page("C", "/blog/x/", "12:00:00", { source: "google" }),
    // D: MBTI 첫 화면만 보고 나감
    page("D", "/tests/mbti/", "13:00:00", { source: "direct" }),
  ];
  const r = mod.buildRollup("2026-10-05", rows, []);
  assert.deepEqual(r.landing["/blog/x/"], { n: 3, b: 2 });
  assert.deepEqual(r.landing["/tests/mbti/"], { n: 1, b: 1 }, "A 는 블로그로 들어왔으므로 MBTI 첫 페이지 집계에 없다");
  assert.deepEqual(r.landingSource.naver, { n: 2, b: 1 });
  assert.equal(Object.values(r.landing).reduce((s, x) => s + x.b, 0), r.journey.b0, "이탈자 합 = 1페이지 이탈");
  const m = mod.mergeRollups([r, mod.buildRollup("2026-10-06", [page("E", "/blog/x/", "09:00:00")], [])]);
  assert.deepEqual(m.landing["/blog/x/"], { n: 4, b: 3 });
});

test("국내만 이탈: 첫 조회 국가가 KR 인 사람만 세고, 해외(봇 의심)는 빠진다", () => {
  const rows = [
    page("A", "/", "10:00:00"), page("A", "/tests/mbti/", "10:01:00", { source: "internal" }), // 국내, 2페이지
    page("B", "/", "11:00:00", { source: "naver" }),                                          // 국내, 이탈
    page("C", "/", "12:00:00", { country: "US" }),                                            // 해외 직접 유입, 이탈
    page("D", "/", "12:30:00", { country: "US" }),                                            // 해외 직접 유입, 이탈
    page("E", "/", "13:00:00", { country: "" }),                                              // 국가 모름 → 국내 아님
  ];
  const r = mod.buildRollup("2026-10-05", rows, []);
  assert.equal(r.journey.b0, 4);
  assert.deepEqual(r.kr, { n: 2, b: 1 });
  assert.deepEqual(r.landingSourceKr, { direct: { n: 1, b: 0 }, naver: { n: 1, b: 1 } });
  const m = mod.mergeRollups([r, r, { ...r, kr: undefined, landingSourceKr: undefined }]);
  assert.deepEqual(m.kr, { n: 4, b: 2 }, "버전 2 집계(kr 없음)는 더하지 않는다");
  assert.deepEqual(m.landingSourceKr.naver, { n: 2, b: 2 });
});

test("지난 날짜 확정 기준: 서울 기준 그날 자정 + 1분 전에 만든 집계는 중간본이다", () => {
  // 10-05 를 그날 저녁(KST 21:00 = 12:00Z)에 만든 집계는 다시 만들어야 하고, 다음 날 아침 것은 확정본이다.
  assert.ok(Date.parse("2026-10-05T12:00:00Z") < mod.dayEndMs("2026-10-05"));
  assert.ok(Date.parse("2026-10-05T23:00:00Z") > mod.dayEndMs("2026-10-05"));
  assert.equal(new Date(mod.dayEndMs("2026-10-05")).toISOString(), "2026-10-05T15:01:00.000Z");
});
