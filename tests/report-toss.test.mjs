import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 토스 미니앱 인앱결제 지급 (2026-10-07). 진짜 SQLite 위에서 worker/report.ts → report-toss.ts 를 그대로 돌리고,
 * 토스 결제 확인 워커만 가짜로 둔다.
 * 지키는 것: 토스가 결제 완료라고 해야만 지급 · 상품이 다르면 거절 · 같은 orderId 는 한 번만(다시 부르면 같은 열쇠)
 * · 금액은 서버가 정함 · CORS 는 토스 앱 주소에만 · 환불 표시 뒤에는 열람·복구 모두 막힘.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./worker/report"; export * from "./worker/report-toss"; export { REPORT_CONSENT_VERSION, TOSS_REPORT_PRICE } from "./lib/report-config"; export { writeSetting } from "./worker/naver";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  const stmt = (query, args = []) => ({
    bind: (...a) => stmt(query, a),
    first: async () => sql.prepare(query).get(...args) ?? null,
    run: async () => {
      const r = sql.prepare(query).run(...args);
      return { meta: { changes: Number(r.changes) } };
    },
    all: async () => ({ results: sql.prepare(query).all(...args) }),
  });
  return { sql, prepare: (q) => stmt(q), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const SKU = "ait.0000012345.abcdefgh.0000000001";
const SECRET = "s".repeat(48);
const VERIFY_URL = "https://toss-iap-verify.example.workers.dev/verify";
// SDK 3.1.1+ 번들이 실제로 도는 주소 (10-07 실결제 시험에서 이 주소가 막혀 지급 요청이 안 왔다)
const LIVE = "https://mbtitest.apps.tossmini.com";
const PRIVATE = "https://mbtitest.private-apps.tossmini.com";
const OLD_LIVE = "https://mbtitest.web.tossmini.com";
const OLD_PRIVATE = "https://mbtitest.private-web.tossmini.com";

let verifyCalls = [];
let verifyReply = () => ({ status: "PURCHASED", sku: SKU });
globalThis.fetch = async (url, init) => {
  verifyCalls.push({ url, init });
  if (init.headers.authorization !== `Bearer ${SECRET}`) return new Response("nope", { status: 401 });
  return new Response(JSON.stringify({ resultType: "SUCCESS", success: { orderId: JSON.parse(init.body).orderId, ...verifyReply() } }));
};

async function setup({ configured = true } = {}) {
  const db = fakeD1();
  await R.ensureReportSchema(db);
  if (configured) {
    await R.writeSetting(db, "toss_verify_url", VERIFY_URL);
    await R.writeSetting(db, "toss_verify_secret", SECRET);
    await R.writeSetting(db, "toss_report_sku", SKU);
  }
  return db;
}
const ctx = { waitUntil: (p) => p };
const body = { orderId: "ord_abc123456", type: "INFP", scores: [38, 27, 31, 36], name: "하늘", birth: "1995-01-20", bt: 7, agree: true };
let ip = 0;
function grant(db, data, origin = LIVE) {
  const u = new URL("https://mbtitest.co.kr/api/report/toss-grant");
  return R.handleReport(
    new Request(u, {
      method: "POST",
      body: JSON.stringify({ consentVersion: R.REPORT_CONSENT_VERSION, ...data }),
      headers: { origin, "cf-connecting-ip": `10.0.0.${++ip % 250}` },
    }),
    u,
    { DB: db },
    ctx,
  );
}
const rows = (db) => db.sql.prepare("SELECT * FROM report_orders").all();

test("설정(확인 워커·키·상품 ID)이 없으면 지급하지 않는다", async () => {
  const db = await setup({ configured: false });
  verifyCalls = [];
  assert.equal((await grant(db, body)).status, 503);
  assert.equal(rows(db).length, 0);
});

test("토스가 결제 완료라고 하면 결제 완료 주문 + 열쇠, 금액은 서버 값", async () => {
  const db = await setup();
  verifyCalls = [];
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  const res = await grant(db, { ...body, price: 10 });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.match(j.token, /^[0-9a-f]{64}$/);
  assert.equal(verifyCalls.length, 1);
  assert.equal(verifyCalls[0].url, VERIFY_URL);
  assert.deepEqual(JSON.parse(verifyCalls[0].init.body), { orderId: body.orderId });
  const [row] = rows(db);
  assert.equal(row.status, "paid");
  assert.equal(row.pay_type, "toss-iap");
  assert.equal(row.price, R.TOSS_REPORT_PRICE, "브라우저가 보낸 price 는 무시");
  assert.equal(row.price, 9900, "사용자 결정: 토스는 9,900원 고정");
  assert.equal(row.mul_no, `toss:${body.orderId}`);
  assert.equal(row.test, 0);
  assert.equal(row.phone_last4, "", "휴대폰을 받지 않는다");
});

test("PAYMENT_COMPLETED 도 결제 완료로 본다", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PAYMENT_COMPLETED", sku: SKU });
  assert.equal((await grant(db, { ...body, orderId: "ord_paycomplete" })).status, 200);
});

test("같은 orderId 를 다시 부르면 새로 만들지 않고 같은 열쇠 — 토스에 다시 묻지 않는다", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  const a = await (await grant(db, body)).json();
  verifyCalls = [];
  const b = await (await grant(db, { orderId: body.orderId })).json();
  assert.equal(b.token, a.token);
  assert.equal(verifyCalls.length, 0);
  assert.equal(rows(db).length, 1);
});

test("결제 미완료·실패·환불·다른 앱 주문·다른 상품은 지급하지 않는다", async () => {
  for (const [status, sku] of [["ORDER_IN_PROGRESS", SKU], ["FAILED", SKU], ["REFUNDED", SKU], ["MINIAPP_MISMATCH", ""], ["NOT_FOUND", ""], ["PURCHASED", "ait.other.sku"]]) {
    const db = await setup();
    verifyReply = () => ({ status, sku });
    const res = await grant(db, { ...body, orderId: `ord_${status}` });
    assert.equal(res.status, 402, `${status} ${sku}`);
    assert.equal(rows(db).length, 0, `${status} 는 주문을 만들지 않는다`);
  }
});

test("확인 워커가 401·오류면 지급하지 않는다(키가 틀린 경우)", async () => {
  const db = await setup();
  await R.writeSetting(db, "toss_verify_secret", "t".repeat(48));
  assert.equal((await grant(db, { ...body, orderId: "ord_badsecret" })).status, 502);
  assert.equal(rows(db).length, 0);
});

test("입력 검사: 주문번호 모양·유형과 점수 짝·동의", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  assert.equal((await grant(db, { ...body, orderId: "x" })).status, 400);
  assert.equal((await grant(db, { ...body, orderId: "ord'; DROP TABLE" })).status, 400);
  assert.equal((await grant(db, { ...body, orderId: "ord_scores", scores: [60, 27, 31, 36] })).status, 400, "I 유형인데 E 쪽 60%");
  assert.equal((await grant(db, { ...body, orderId: "ord_agree", agree: false })).status, 400);
  assert.equal(rows(db).length, 0);
});

test("콘솔 QR 테스트 주소에서 산 것은 시험 주문으로 표시", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  assert.equal((await grant(db, { ...body, orderId: "ord_private" }, PRIVATE)).status, 200);
  assert.equal(rows(db)[0].test, 1);
  assert.equal((await grant(db, { ...body, orderId: "ord_old_private" }, OLD_PRIVATE)).status, 200);
  assert.equal((await grant(db, { ...body, orderId: "ord_live" }, LIVE)).status, 200);
  const byId = Object.fromEntries(rows(db).map((r) => [r.mul_no, r.test]));
  assert.equal(byId["toss:ord_old_private"], 1);
  assert.equal(byId["toss:ord_live"], 0);
});

test("CORS: 토스 앱 주소에만 열고, 웹 사이트 다른 경로는 그대로", async () => {
  const db = await setup();
  const pre = (origin, path) => {
    const u = new URL(`https://mbtitest.co.kr${path}`);
    return R.handleReport(new Request(u, { method: "OPTIONS", headers: { origin } }), u, { DB: db }, ctx);
  };
  const ok = await pre(LIVE, "/api/report/toss-grant");
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("access-control-allow-origin"), LIVE);
  assert.equal((await pre(PRIVATE, "/api/report/book")).headers.get("access-control-allow-origin"), PRIVATE);
  for (const o of [OLD_LIVE, OLD_PRIVATE]) assert.equal((await pre(o, "/api/report/toss-grant")).headers.get("access-control-allow-origin"), o);
  assert.equal((await pre("https://evil.example", "/api/report/toss-grant")).headers.get("access-control-allow-origin"), null);
  const u = new URL("https://mbtitest.co.kr/api/report/status?o=" + "a".repeat(64));
  const status = await R.handleReport(new Request(u, { headers: { origin: LIVE } }), u, { DB: db }, ctx);
  assert.equal(status.headers.get("access-control-allow-origin"), null, "토스 앱이 쓰지 않는 경로는 열지 않는다");
});

test("열람: 토스 주문 열쇠로 /book 을 토스 주소에서 읽을 수 있고(402 아님), 환불 표시 뒤에는 열람·복구 모두 막힌다", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  const { token } = await (await grant(db, { ...body, orderId: "ord_view" })).json();
  const u = new URL(`https://mbtitest.co.kr/api/report/book?o=${token}`);
  const book = await R.handleReport(new Request(u, { headers: { origin: LIVE } }), u, { DB: db }, ctx);
  assert.notEqual(book.status, 402, "결제 완료 주문 — 원고 해독 키가 없는 시험 DB 라 503 이어도 결제 확인은 통과");
  assert.equal(book.headers.get("access-control-allow-origin"), LIVE);
  db.sql.prepare("UPDATE report_orders SET status = 'refunded' WHERE token = ?").run(token);
  assert.equal((await R.handleReport(new Request(u, { headers: { origin: LIVE } }), u, { DB: db }, ctx)).status, 402);
  assert.equal((await grant(db, { orderId: "ord_view" })).status, 402, "환불된 주문은 복구로도 다시 열리지 않는다");
});

test("동시에 같은 orderId 두 번 → 주문은 하나", async () => {
  const db = await setup();
  verifyReply = () => ({ status: "PURCHASED", sku: SKU });
  const [a, b] = await Promise.all([grant(db, { ...body, orderId: "ord_race" }), grant(db, { ...body, orderId: "ord_race" })]);
  const ja = await a.json();
  const jb = await b.json();
  assert.equal(rows(db).length, 1);
  assert.equal(ja.token, jb.token);
});
