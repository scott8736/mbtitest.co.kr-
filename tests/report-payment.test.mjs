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
    contents: `export * from "./worker/report"; export { validateOrder, REPORT_CONSENT_VERSION, isSellerInfoComplete, reportPrice, REPORT_PRICE } from "./lib/report-config"; export { writeSetting } from "./worker/naver"; export { sendTelegram, findTelegramChatId } from "./worker/telegram"; export { payAlert, payAlertText } from "./worker/pay-alert";`,
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

test("가격은 9,900원 고정이다 — 날짜가 지나도 오르지 않는다(2026-10-14 사용자 결정)", () => {
  assert.equal(R.REPORT_PRICE, 9900);
  assert.equal(R.reportPrice(), 9900);
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
  assert.equal(R.isSellerInfoComplete(), true, "통신판매업 신고번호·연락처 입력됨(주소는 10-12부터 표시 안 함)");
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

  const alerts = [];
  const notify = (m) => alerts.push(m);
  assert.equal(await R.handleFeedback(db, fb(row(), { price: "100" }), notify), "FAIL");
  // 거절된 통보는 결제 알림이 아니라 결제오류로 알린다(2026-10-18)
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].split("\n")[0], /^🧩 MBTI테스트 · 🚨결제오류 · 리포트 결제완료·지급 실패 · 100원$/);
  assert.match(alerts[0], /금액 불일치/);
  alerts.length = 0;
  assert.equal(await R.handleFeedback(db, fb(row()), notify), "SUCCESS");
  assert.equal(row().status, "paid");
  assert.equal(alerts.length, 1, "결제 완료를 알린다");
  // 첫 줄은 「사이트 · 구분 · 상품 · 금액」(10-12 텔레그램 형식 통일)
  assert.match(alerts[0].split("\n")[0], /^🧩 MBTI테스트 · 결제 · INFP 리포트 · 9,900원$/);
  assert.match(alerts[0], /\*\*\*-5678/);
  assert.ok(!alerts[0].includes("01012345678"), "알림에 휴대폰 전체 번호를 넣지 않는다");
  assert.equal(await R.handleFeedback(db, fb(row()), notify), "SUCCESS", "같은 통보 재전송");
  assert.equal(alerts.length, 1, "재전송은 다시 알리지 않는다");
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

  const sent = [];
  assert.equal(await R.handleFeedback(db, fb(row(), { pay_state: "64" }), (m) => sent.push(m)), "SUCCESS");
  assert.equal(row().status, "refunded");
  assert.equal(sent.length, 1, "환불도 알린다");
  assert.equal(await R.handleFeedback(db, fb(row(), { pay_state: "64" }), (m) => sent.push(m)), "SUCCESS");
  assert.equal(sent.length, 1, "같은 환불 통보 재전송은 다시 알리지 않는다");
  assert.equal((await R.handleReport(new Request(bookUrl), bookUrl, { DB: db }, ctx)).status, 402, "환불 뒤에는 닫힌다");
});

test("텔레그램 알림: 설정이 없으면 보내지 않고, 실패해도 예외 없이 false", async () => {
  const db = await setup();
  const real = globalThis.fetch;
  const calls = [];
  try {
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
      if (String(url).endsWith("/getUpdates")) return Response.json({ ok: true, result: [{ message: { chat: { id: 11 } } }, { message: { chat: { id: 4242 } } }] });
      return Response.json({ ok: true });
    };
    assert.equal(await R.sendTelegram(db, "x"), false, "토큰 없음");
    assert.equal(calls.length, 0);
    await R.writeSetting(db, "telegram_bot_token", "not-a-token");
    await R.writeSetting(db, "telegram_chat_id", "4242");
    assert.equal(await R.sendTelegram(db, "x"), false, "토큰 모양이 틀리면 보내지 않는다");
    assert.equal(calls.length, 0);
    const token = "123456789:" + "A".repeat(35);
    await R.writeSetting(db, "telegram_bot_token", token);
    assert.equal(await R.sendTelegram(db, "결제 완료"), true);
    assert.equal(calls[0].url, `https://api.telegram.org/bot${token}/sendMessage`);
    assert.deepEqual([calls[0].body.chat_id, calls[0].body.text], ["4242", "결제 완료"]);
    assert.equal(await R.findTelegramChatId(token), "4242", "봇에게 마지막으로 말을 건 대화");
    globalThis.fetch = async () => {
      throw new Error("network");
    };
    assert.equal(await R.sendTelegram(db, "x"), false, "네트워크 오류도 예외 없이 false");
  } finally {
    globalThis.fetch = real;
  }
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

test("관리자 검수용 무료 리포트: 결제창 없이 결제 완료, 0원 시험 주문", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, { ...order, phone: "01000000000" }, { price: 0, test: true, free: true });
  assert.equal(made.ok, true);
  assert.equal(fetchCalls.length, 0, "페이앱을 부르지 않는다");
  const row = db.sql.prepare("SELECT status, price, test, pay_type FROM report_orders WHERE token = ?").get(made.token);
  assert.deepEqual({ ...row }, { status: "paid", price: 0, test: 1, pay_type: "admin-free" });
  const url = new URL(`https://x/api/report/status?o=${made.token}`);
  const res = await R.handleReport(new Request(url), url, { DB: db }, ctx);
  assert.equal((await res.json()).status, "paid", "열람 화면이 결제 완료로 본다");
});

test("검수용 무료 리포트(01000000000·test=1)는 「다시 찾기」로 꺼낼 수 없다 (10-08 점검 1번)", async () => {
  const db = await setup();
  const made = await R.createOrder(db, { ...order, phone: "01000000000" }, { price: 0, test: true, free: true });
  assert.equal(made.ok, true);
  const find = (body) => R.handleReport(
    new Request("https://x/api/report/find", { method: "POST", body: JSON.stringify(body), headers: { "cf-connecting-ip": "8.8.4.4" } }),
    new URL("https://x/api/report/find"), { DB: db }, ctx,
  );
  assert.equal((await find({ phone: "01000000000" })).status, 404, "번호로 찾기");
  assert.equal((await find({ orderNo: made.orderNo, last4: "0000" })).status, 404, "주문번호로 찾기");
});

// ── 결제 오류 텔레그램 알림 (2026-10-18) ──
const firstLine = (m) => m.split("\n")[0];
const alertRows = (db) => db.sql.prepare("SELECT order_no, detail FROM report_events WHERE kind = 'pay_alert' ORDER BY id").all();

test("결제오류 알림: 위조 통보(인증 실패)는 알리고, 30분 안 같은 위조는 기록만 한다", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, order, { price: 9900, test: false });
  const row = db.sql.prepare("SELECT * FROM report_orders WHERE token = ?").get(made.token);
  const sent = [];
  const notify = (m) => sent.push(m);
  assert.equal(await R.handleFeedback(db, fb(row, { linkval: "x".repeat(44) }), notify), "FAIL");
  assert.equal(sent.length, 1);
  assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 리포트 결제통보 인증 실패");
  assert.match(sent[0], /원인: 연동 KEY·VALUE 불일치/);
  assert.match(sent[0], /할 일: /);
  assert.ok(!sent[0].includes(KEY) && !sent[0].includes(VAL) && !sent[0].includes("x".repeat(44)), "키 값을 싣지 않는다");
  // 주문번호를 바꿔 보내도(위조자가 마음대로 넣는 값) 같은 원인이면 30분에 한 번
  assert.equal(await R.handleFeedback(db, fb(row, { linkval: "x".repeat(44), var1: "MR000000-000001" }), notify), "FAIL");
  assert.equal(sent.length, 1, "억제");
  assert.equal(alertRows(db).length, 2, "기록은 매번 남긴다");
  assert.match(alertRows(db)[1].detail, /생략/);
  assert.equal(db.sql.prepare("SELECT status FROM report_orders WHERE token = ?").get(made.token).status, "pending");
});

test("결제오류 알림: 30분 창 — 같은 단계+주문은 한 번, 30분 지나면 다시, 다른 주문은 따로", async () => {
  const db = await setup();
  const sent = [];
  const a = { stage: "리포트 결제요청 실패", orderNo: "MR261018-000001", price: 9900, cause: "state=0", todo: "확인" };
  const t0 = 1_800_000_000_000;
  assert.equal(await R.payAlert(db, a, (m) => sent.push(m), t0), true);
  assert.equal(await R.payAlert(db, a, (m) => sent.push(m), t0 + 29 * 60_000), false);
  assert.equal(await R.payAlert(db, { ...a, orderNo: "MR261018-000002" }, (m) => sent.push(m), t0 + 60_000), true, "다른 주문");
  assert.equal(await R.payAlert(db, a, (m) => sent.push(m), t0 + 30 * 60_000), true, "30분 지나면 다시");
  assert.equal(sent.length, 3);
  assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 리포트 결제요청 실패 · 9,900원");
  assert.equal(alertRows(db).length, 4);
  // 보내는 쪽이 터져도 예외 없이 넘어간다
  assert.equal(await R.payAlert(db, { ...a, orderNo: "MR261018-000003" }, () => { throw new Error("tg down"); }, t0), false);
});

test("결제오류 알림: 결제완료인데 지급 실패(주문이 닫혀 있음·처리 중 예외)는 「수동 처리 필요」로 알린다", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, order, { price: 9900, test: false });
  const row = () => db.sql.prepare("SELECT * FROM report_orders WHERE token = ?").get(made.token);
  db.sql.prepare("UPDATE report_orders SET status = 'failed' WHERE token = ?").run(made.token);
  const sent = [];
  assert.equal(await R.handleFeedback(db, fb(row()), (m) => sent.push(m)), "SUCCESS");
  assert.equal(sent.length, 1);
  assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 리포트 결제완료·지급 실패 · 9,900원");
  assert.match(sent[0], /돈은 받았는데 지급 실패, 수동 처리 필요/);
  assert.match(sent[0], new RegExp(`주문 ${made.orderNo} · mul_no ${row().mul_no} · state 4`));
  assert.ok(!sent[0].includes("01012345678"));

  // 처리 중 예외: 알리고 FAIL(페이앱이 다시 보냄)
  db.sql.prepare("UPDATE report_orders SET status = 'pending' WHERE token = ?").run(made.token);
  const broken = { ...db, prepare: (q) => (q.startsWith("UPDATE report_orders SET status") ? { bind: () => ({ run: async () => { throw new Error("D1 down"); } }) } : db.prepare(q)) };
  const sent2 = [];
  assert.equal(await R.handleFeedback(broken, fb(row()), (m) => sent2.push(m)), "FAIL");
  assert.equal(sent2.length, 0, "같은 단계+주문은 30분 안에 다시 안 보낸다");
  db.sql.exec("DELETE FROM pay_alerts");
  assert.equal(await R.handleFeedback(broken, fb(row()), (m) => sent2.push(m)), "FAIL");
  assert.equal(sent2.length, 1);
  assert.match(sent2[0], /리포트 결제완료·지급 실패/);
  assert.match(sent2[0], /D1 down/);
  assert.equal(row().status, "pending");
  // 페이앱 재전송이 오면 정상 처리되고 결제 알림이 간다
  assert.equal(await R.handleFeedback(db, fb(row()), (m) => sent2.push(m)), "SUCCESS");
  assert.equal(row().status, "paid");
  assert.equal(firstLine(sent2[1]), "🧩 MBTI테스트 · 결제 · INFP 리포트 · 9,900원");
});

test("결제오류 알림: 주문 없는 결제완료 통보는 알리고, 지운 주문의 취소·만료 통보(고아)는 조용히 SUCCESS", async () => {
  const db = await setup();
  const sent = [];
  const ghost = (state) => new URLSearchParams({ userid: "charry333", linkkey: KEY, linkval: VAL, mul_no: "777", price: "1000", var1: "MR261001-123456", pay_state: state });
  for (const s of ["8", "32", "9", "64", "70", "71"]) assert.equal(await R.handleFeedback(db, ghost(s), (m) => sent.push(m)), "SUCCESS", s);
  assert.equal(sent.length, 0, "고아 통보는 알리지 않는다");
  assert.equal(db.sql.prepare("SELECT COUNT(*) AS n FROM report_events WHERE kind = 'feedback_orphan'").get().n, 6);
  assert.equal(await R.handleFeedback(db, ghost("4"), (m) => sent.push(m)), "FAIL");
  assert.equal(sent.length, 1);
  assert.match(sent[0], /리포트 결제완료·지급 실패 · 1,000원/);
  assert.match(sent[0], /원인: 주문 없음/);
});

test("결제오류 알림: 결제요청 실패(state≠1·API 예외)", async () => {
  const db = await setup();
  const real = globalThis.fetch;
  const sent = [];
  try {
    globalThis.fetch = async () => new Response("state=0&errno=70010&errorMessage=bad");
    const a = await R.createOrder(db, order, { price: 9900, test: false, alert: (m) => sent.push(m) });
    assert.equal(a.ok, false);
    assert.equal(sent.length, 1);
    assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 리포트 결제요청 실패 · 9,900원");
    assert.match(sent[0], /state=0 70010 bad/);
    globalThis.fetch = async () => { throw new Error("network"); };
    const b = await R.createOrder(db, order, { price: 9900, test: false, alert: (m) => sent.push(m) });
    assert.equal(b.ok, false);
    assert.equal(sent.length, 2, "다른 주문이라 따로 알린다");
    assert.match(sent[1], /페이앱 API 호출 예외/);
    assert.ok(!sent.join("").includes("01012345678"));
  } finally {
    globalThis.fetch = real;
  }
});
