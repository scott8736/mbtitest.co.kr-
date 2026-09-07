import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 쿠팡 파트너스 서명이 규격과 맞는지 봅니다.
 *
 * 서명은 한 글자만 어긋나도 401 로 거절되고, 그때 쿠팡이 주는 메시지로는
 * 어디가 틀렸는지 알 수 없습니다. 그래서 공개 SDK 구현(CoupangAuth.ts)을
 * node:crypto 로 그대로 옮겨 놓고, 워커용 crypto.subtle 구현이 같은 문자열을
 * 내는지 대조합니다.
 *
 * 특히 GET 은 서명한 쿼리와 실제로 보내는 쿼리가 같아야 하므로 함께 봅니다.
 */
const { outputFiles } = await build({
  stdin: { contents: `export * from "./worker/coupang";`, resolveDir: repoRoot, loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const coupang = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

/** SDK 의 알고리즘을 그대로 옮긴 참조 구현 */
function reference(method, url, accessKey, secretKey, now) {
  const [path, query = ""] = url.split(/\?/);
  const p = (n) => String(n).padStart(2, "0");
  const datetime =
    String(now.getUTCFullYear()).slice(-2) + p(now.getUTCMonth() + 1) + p(now.getUTCDate()) +
    "T" + p(now.getUTCHours()) + p(now.getUTCMinutes()) + p(now.getUTCSeconds()) + "Z";
  const message = datetime + method.toUpperCase() + path + query;
  const signature = crypto.createHmac("sha256", secretKey).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

const ACCESS = "abcdef0123456789abcdef";
const SECRET = "0123456789abcdef0123456789abcdef";
const FROZEN = new Date(Date.UTC(2026, 8, 7, 5, 4, 3));
const RealDate = Date;

let captured = null;

function withFrozenClock(fn) {
  globalThis.Date = class extends RealDate {
    constructor(...args) { return args.length ? new RealDate(...args) : new RealDate(FROZEN); }
    static now() { return FROZEN.getTime(); }
  };
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), auth: init.headers.Authorization, method: init.method, body: init.body };
    return { ok: true, status: 200, text: async () => JSON.stringify({ rCode: "0", data: [] }) };
  };
  return Promise.resolve(fn()).finally(() => { globalThis.Date = RealDate; });
}

test("딥링크 POST 서명이 참조 구현과 같다", async () => {
  await withFrozenClock(() =>
    coupang.createDeeplinks({ accessKey: ACCESS, secretKey: SECRET }, ["https://www.coupang.com/np/search?q=abc"], "hsp"),
  );
  assert.equal(
    captured.auth,
    reference("POST", "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink", ACCESS, SECRET, FROZEN),
  );
  assert.equal(captured.url, "https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink");
  assert.equal(captured.body, JSON.stringify({ coupangUrls: ["https://www.coupang.com/np/search?q=abc"], subId: "hsp" }));
});

test("리포트 GET 은 서명한 쿼리와 보낸 쿼리가 같다", async () => {
  await withFrozenClock(() =>
    coupang.fetchReport({ accessKey: ACCESS, secretKey: SECRET }, "clicks", "20260901", "20260907"),
  );
  const sent = new URL(captured.url).search.slice(1);
  assert.equal(sent, "startDate=20260901&endDate=20260907");
  assert.equal(
    captured.auth,
    reference("GET", `/v2/providers/affiliate_open_api/apis/openapi/reports/clicks?${sent}`, ACCESS, SECRET, FROZEN),
  );
});

test("rCode 가 0 이 아니면 오류로 올린다", async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ rCode: "ERROR", rMessage: "권한 없음" }) });
  await assert.rejects(
    () => coupang.fetchReport({ accessKey: ACCESS, secretKey: SECRET }, "clicks", "20260901", "20260907"),
    /권한 없음/,
  );
});

test("검색 주소와 날짜 형식", () => {
  assert.equal(coupang.searchUrl("소음 차단 이어플러그"), "https://www.coupang.com/np/search?q=" + encodeURIComponent("소음 차단 이어플러그"));
  // KST 기준이라 UTC 20시는 다음 날입니다.
  assert.equal(coupang.reportDay(new Date(Date.UTC(2026, 8, 6, 20, 0, 0))), "20260907");
});

/**
 * 실적을 채널별로 나누는 부분.
 *
 * 쿠팡은 숫자를 문자열로 주기도 하고, 채널 아이디 없이 만든 링크는 subId 를
 * 비워서 돌려줍니다. 그대로 더하면 "12" + "3" 이 되거나 undefined 키가 생겨서
 * 금액이 조용히 틀립니다.
 */
test("채널별 합계가 문자열 숫자와 빈 채널을 견딘다", () => {
  const rows = [
    { date: "20260901", trackingCode: "AF1", subId: "result", click: 10, order: 2, cancel: 0, commission: 500, gmv: 10000 },
    { date: "20260902", trackingCode: "AF1", subId: "result", click: "5", order: "1", cancel: "1", commission: "250", gmv: "5000" },
    { date: "20260902", trackingCode: "AF1", subId: "", click: 3, order: 0, cancel: 0, commission: 0, gmv: 0 },
  ];
  const totals = coupang.totalsBySubId(rows);
  // 수수료가 큰 채널이 앞에 옵니다.
  assert.deepEqual(totals, [
    { subId: "result", click: 15, order: 3, cancel: 1, commission: 750, gmv: 15000 },
    { subId: "", click: 3, order: 0, cancel: 0, commission: 0, gmv: 0 },
  ]);
});

test("날짜별 수수료가 같은 날을 합친다", () => {
  const byDay = coupang.commissionByDay([
    { date: "20260901", commission: 100 },
    { date: "20260901", commission: "50" },
    { date: "20260902", commission: 20 },
  ]);
  assert.equal(byDay.get("20260901"), 150);
  assert.equal(byDay.get("20260902"), 20);
});

test("최근 N일 목록은 오늘로 끝나고 하루씩 이어진다", () => {
  // 그래프의 x축이라 빠진 날 없이 이어져야 합니다. KST 기준입니다.
  const days = coupang.recentDays(7, new Date("2026-09-07T12:00:00Z"));
  assert.equal(days.length, 7);
  assert.equal(days.at(-1), "20260907");
  assert.equal(days[0], "20260901");
  assert.deepEqual([...new Set(days)], days);
});

test("검색 주소에서 검색어를 되꺼낸다", () => {
  // 관리자 표에 원본 주소 대신 이 값을 보여줍니다.
  const url = coupang.searchUrl("소음 차단 이어플러그");
  assert.equal(coupang.keywordFromSearchUrl(url), "소음 차단 이어플러그");
  // 상품 주소처럼 q 가 없으면 빈 문자열. 화면은 그때 원본 주소로 되돌립니다.
  assert.equal(coupang.keywordFromSearchUrl("https://www.coupang.com/vp/products/1846"), "");
  assert.equal(coupang.keywordFromSearchUrl("주소가 아님"), "");
});
