import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const KEY_FILE = "D:/00 cloud/report_content.key";

/**
 * 유료 리포트 결제 흐름 (2026-10-04). 진짜 SQLite 위에 D1 흉내를 씌워 worker/report.ts 를 그대로 돌린다.
 * 지키는 것: 위조·금액 다른 통보는 반영 안 됨 · 같은 통보 여러 번 = 한 번 · 결제 안 된 주문은 원고를 안 줌 ·
 * 판매자 표시 정보가 비면 손님 주문이 안 열림 · 휴대폰은 뒤 4자리만 저장.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./worker/report"; export { validateOrder, REPORT_CONSENT_VERSION, isSellerInfoComplete, reportEventOn, reportPrice, REPORT_EVENT, REPORT_EVENT_PRICE, REPORT_REGULAR_PRICE } from "./lib/report-config"; export { writeSetting } from "./worker/naver";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

/** node:sqlite 위의 아주 작은 D1 흉내 */
function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  const stmt = (query, args = []) => ({
    bind: (...a) => stmt(query, a),
    first: async () => sql.prepare(query).get(...args) ?? null,
    run: async () => sql.prepare(query).run(...args),
    all: async () => ({ results: sql.prepare(query).all(...args) }),
  });
  return { sql, prepare: (q) => stmt(q), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const KEY = "k".repeat(44);
const VAL = "v".repeat(44);
let fetchCalls = [];
globalThis.fetch = async (url, init) => {
  const body = Object.fromEntries(new URLSearchParams(init.body));
  fetchCalls.push(body);
  if (body.cmd === "payrequest") return new Response(`state=1&mul_no=555${fetchCalls.length}&payurl=https%3A%2F%2Fpay.example%2Fp`);
  return new Response("state=1");
};

async function setup() {
  const db = fakeD1();
  await R.ensureReportSchema(db);
  await R.writeSetting(db, "payapp_linkkey", KEY);
  await R.writeSetting(db, "payapp_linkval", VAL);
  return db;
}
const order = { type: "INFP", scores: [38, 27, 31, 36], name: "하늘", birth: "1995-01-20", bt: 7, phone: "01012345678" };
const fb = (row, extra = {}) =>
  new URLSearchParams({ userid: "charry333", linkkey: KEY, linkval: VAL, mul_no: row.mul_no, price: String(row.price), var1: row.order_no, pay_state: "4", pay_type: "1", ...extra });
const ctx = { waitUntil: (p) => p };

test("이벤트 표시는 한국 시각 기준 기간 안에서만 켜진다(지난 기한을 띄우지 않음)", () => {
  const { from, to } = R.REPORT_EVENT;
  const kstMidnight = (d) => new Date(`${d}T00:00:00+09:00`);
  assert.equal(R.reportEventOn(kstMidnight(from)), true);
  assert.equal(R.reportEventOn(new Date(kstMidnight(from).getTime() - 1)), false);
  assert.equal(R.reportEventOn(new Date(kstMidnight(to).getTime() + 86400_000 - 1)), true);
  assert.equal(R.reportEventOn(new Date(kstMidnight(to).getTime() + 86400_000)), false);
  assert.equal(R.reportPrice(kstMidnight(to)), R.REPORT_EVENT_PRICE);
  assert.equal(R.reportPrice(new Date(kstMidnight(to).getTime() + 86400_000)), R.REPORT_REGULAR_PRICE);
  assert.ok(R.REPORT_REGULAR_PRICE > R.REPORT_EVENT_PRICE, "이벤트가가 실제로 더 싸야 「이벤트」 표시가 사실이다");
});

test("주문 입력 검사: 유형·점수 짝, 휴대폰, 동의, 이름 정리", () => {
  const ok = { ...order, agree: true, consentVersion: R.REPORT_CONSENT_VERSION };
  assert.equal(R.validateOrder(ok, "2026-10-04").ok, true);
  assert.equal(R.validateOrder({ ...ok, type: "ABCD" }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, scores: [60, 27, 31, 36] }, "2026-10-04").ok, false, "I 유형인데 E 쪽 60%");
  assert.equal(R.validateOrder({ ...ok, scores: [38, 27, 31] }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, phone: "0212345678" }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, agree: false }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, consentVersion: "old" }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, birth: "2026-02-30" }, "2026-10-04").ok, false);
  assert.equal(R.validateOrder({ ...ok, birth: "2030-01-01" }, "2026-10-04").ok, false, "미래 생일");
  const named = R.validateOrder({ ...ok, name: '<script>하늘"</script>12345' }, "2026-10-04");
  assert.equal(named.ok && named.value.name, "script하늘sc");
  const noBirth = R.validateOrder({ ...ok, birth: "", bt: 7 }, "2026-10-04");
  assert.equal(noBirth.ok && noBirth.value.bt, 0, "생일이 없으면 시간도 버린다");
});

test("손님 주문은 판매자 정보 + 스위치 + 연동 키 + 해독 키가 모두 있어야 열린다", async () => {
  const db = await setup(); // 연동 키는 들어 있음
  assert.equal(R.isSellerInfoComplete(), true, "통신판매업 신고번호·주소·연락처 입력됨(2026-10-04)");
  assert.equal(await R.salesOpen(db), false, "스위치 꺼짐");
  const order = () => R.handleReport(new Request("https://x/api/report/order", { method: "POST", body: "{}" }), new URL("https://x/api/report/order"), { DB: db }, ctx);
  assert.equal((await order()).status, 503);
  await R.writeSetting(db, "report_open", "1");
  assert.equal(await R.salesOpen(db), false, "해독 키가 없으면 결제해도 못 보므로 닫혀 있어야 한다");
  await R.writeSetting(db, "report_content_key", "x");
  assert.equal(await R.salesOpen(db), true);
  assert.equal((await order()).status, 400, "열린 뒤에는 입력 검사로 넘어간다(빈 주문)");
  await R.writeSetting(db, "report_open", "0");
  assert.equal(await R.salesOpen(db), false, "다시 닫기");
});

test("결제 흐름: 위조·금액 불일치 거절 → 결제완료 → 중복 통보 무시 → 환불", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, order, { price: 9900, test: false });
  assert.equal(made.ok, true);
  const req = fetchCalls.find((c) => c.cmd === "payrequest");
  assert.equal(req.price, "9900");
  assert.equal(req.smsuse, "n");
  assert.ok(!req.openpaytype.includes("vbank"), "가상계좌 제외");
  assert.equal(req.feedbackurl, "https://mbtitest.co.kr/api/report/payapp");
  assert.ok(!("linkkey" in req), "결제요청에는 키를 보내지 않는다");

  const row = () => db.sql.prepare("SELECT * FROM report_orders WHERE token = ?").get(made.token);
  assert.equal(row().phone_last4, "5678");
  assert.ok(!JSON.stringify(row()).includes("01012345678"), "휴대폰 전체 번호는 저장하지 않는다");

  assert.equal(await R.handleFeedback(db, fb(row(), { linkval: "x".repeat(44) })), "FAIL");
  assert.equal(await R.handleFeedback(db, fb(row(), { userid: "someone" })), "FAIL");
  assert.equal(await R.handleFeedback(db, fb(row(), { price: "100" })), "FAIL");
  assert.equal(await R.handleFeedback(db, fb(row(), { mul_no: "999" })), "FAIL");
  assert.equal(row().status, "pending");

  // 결제 전에는 원고를 주지 않는다
  const bookUrl = new URL(`https://x/api/report/book?o=${made.token}`);
  assert.equal((await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx)).status, 402);

  assert.equal(await R.handleFeedback(db, fb(row())), "SUCCESS");
  assert.equal(row().status, "paid");
  assert.equal(await R.handleFeedback(db, fb(row())), "SUCCESS", "같은 통보 재전송");
  assert.equal(await R.handleFeedback(db, fb(row(), { pay_state: "8" })), "SUCCESS");
  assert.equal(row().status, "paid", "결제된 주문이 요청취소로 되돌아가지 않는다");

  // 원고는 암호문이라 해독 키가 없거나 틀리면 결제된 주문이라도 내주지 않는다(첫 열람도 남기지 않음)
  assert.equal((await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx)).status, 503);
  await R.writeSetting(db, "report_content_key", Buffer.alloc(32, 7).toString("base64"));
  assert.equal((await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx)).status, 503, "틀린 키");
  assert.equal(row().first_viewed_at, "");

  // 진짜 키는 이 PC 파일에만 있다(저장소엔 없음). 있으면 끝까지 풀어 본다.
  if (existsSync(KEY_FILE)) {
    await R.writeSetting(db, "report_content_key", readFileSync(KEY_FILE, "utf8").trim());
    const book = await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx);
    assert.equal(book.status, 200);
    const data = await book.json();
    assert.equal(data.params.type, "INFP");
    assert.equal(data.params.ei, 38);
    assert.ok(data.book.content.who.length >= 5, "원고가 들어 있다");
    assert.ok(data.book.saju.daystem.length === 10, "사주 원고도 함께");
    assert.ok(row().first_viewed_at, "첫 열람 시각 기록");
  }

  assert.equal(await R.handleFeedback(db, fb(row(), { pay_state: "64" })), "SUCCESS");
  assert.equal(row().status, "refunded");
  assert.equal((await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx)).status, 402, "환불 뒤에는 닫힌다");
});

test("다시 찾기: 주문번호 + 뒤 4자리가 맞고 결제된 주문만", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, order, { price: 9900, test: false });
  const row = db.sql.prepare("SELECT * FROM report_orders WHERE token = ?").get(made.token);
  const find = (body) => {
    const u = new URL("https://x/api/report/find");
    return R.handleReport(new Request(u, { method: "POST", body: JSON.stringify(body), headers: { "cf-connecting-ip": "1.2.3.4" } }), u, { DB: db }, ctx);
  };
  assert.equal((await find({ orderNo: made.orderNo, last4: "5678" })).status, 404, "결제 전");
  await R.handleFeedback(db, fb(row));
  assert.equal((await find({ orderNo: made.orderNo, last4: "0000" })).status, 404);
  const ok = await find({ orderNo: made.orderNo.toLowerCase(), last4: "5678" });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).token, made.token);
});

test("휴대폰 번호만으로 결제된 리포트를 찾는다 (번호 원문은 저장 안 함)", async () => {
  fetchCalls = [];
  const db = await setup();
  const a = await R.createOrder(db, order, { price: 9900, test: false });
  const b = await R.createOrder(db, { ...order, type: "ISTJ", scores: [38, 73, 69, 64] }, { price: 9900, test: false });
  await R.createOrder(db, { ...order, phone: "01099998888" }, { price: 9900, test: false });
  const rowOf = (t) => db.sql.prepare("SELECT * FROM report_orders WHERE token = ?").get(t);
  assert.ok(rowOf(a.token).phone_hash.length === 64 && !rowOf(a.token).phone_hash.includes("12345678"));
  assert.ok(!JSON.stringify(rowOf(a.token)).includes("01012345678"));
  const find = async (body) => {
    const u = new URL("https://x/api/report/find");
    const res = await R.handleReport(new Request(u, { method: "POST", body: JSON.stringify(body), headers: { "cf-connecting-ip": "9.9.9.9" } }), u, { DB: db }, ctx);
    return { status: res.status, body: await res.json() };
  };
  assert.equal((await find({ phone: "010-1234-5678" })).status, 404, "결제 전에는 안 나온다");
  await R.handleFeedback(db, fb(rowOf(a.token)));
  await R.handleFeedback(db, fb(rowOf(b.token)));
  const hit = await find({ phone: "010-1234-5678" });
  assert.equal(hit.status, 200);
  assert.deepEqual(hit.body.orders.map((o) => o.type).sort(), ["INFP", "ISTJ"], "같은 번호의 결제된 주문만, 다른 번호 주문은 안 섞임");
  assert.equal((await find({ phone: "01000000000" })).status, 404);
  assert.equal((await find({ phone: "abc" })).status, 400);
});

test("공개 저장소에 평문 원고가 없다 (report/content 는 전부 암호문)", () => {
  const dir = fileURLToPath(new URL("../report/content/", import.meta.url));
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const sealed = JSON.parse(readFileSync(dir + f, "utf8"));
    assert.deepEqual(Object.keys(sealed).sort(), ["ct", "iv"], f);
    assert.ok(!/[가-힣]/.test(readFileSync(dir + f, "utf8")), `${f} 에 한글 평문`);
  }
});

test("열쇠 모양이 다르면 DB 를 보지 않고 404", async () => {
  const db = await setup();
  for (const o of ["", "abc", "g".repeat(64), "' OR 1=1 --"]) {
    const u = new URL(`https://x/api/report/book?o=${encodeURIComponent(o)}`);
    assert.equal((await R.handleReport(new Request(u), u, { DB: db }, ctx)).status, 404);
  }
});
