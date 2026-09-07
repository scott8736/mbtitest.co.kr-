import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";
import { build } from "esbuild";

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
  stdin: { contents: `export * from "./worker/coupang";`, resolveDir: new URL("..", import.meta.url).pathname, loader: "ts" },
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
