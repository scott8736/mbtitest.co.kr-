import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const KEY_FILE = "D:/00 cloud/report_content.key";

/**
 * 두 번째 상품 「내 성향 신문」 1,900원 (2026-10-25). 진짜 SQLite 위에 D1 흉내를 씌워 worker/report.ts 를 그대로 돌린다.
 * 지키는 것: 가격은 서버가 상품별로 정한다(브라우저 금액 무시) · 통보 금액은 주문에 저장된 1,900원과 대조 ·
 * 결제 오류 알림 첫 줄에 「신문」 · 신문 열쇠로 책이, 책 열쇠로 신문이 안 열린다 · 결제 전·환불 뒤에는 안 열린다 ·
 * 원고는 저장소·공개 폴더에 평문으로 없다 · 동의 문구 판은 그대로(토스 미니앱 보호).
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./worker/report"; export { REPORT_CONSENT_VERSION, productPrice, parseProduct, NEWS_PRICE, reportPrice } from "./lib/report-config"; export { writeSetting } from "./worker/naver"; export { hasNews, newsTypes } from "./worker/report-news"; export { NEWS_READY_TYPES } from "./report/news/ready";`,
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
  if (body.cmd === "payrequest") return new Response(`state=1&mul_no=777${fetchCalls.length}&payurl=https%3A%2F%2Fpay.example%2Fp`);
  return new Response("state=1");
};

const NEWS_TYPE = R.NEWS_READY_TYPES[0];
const ctx = { waitUntil: (p) => p };
const firstLine = (m) => m.split("\n")[0];
// ISTJ: I(E 쪽 50 미만)·S·T·J
const istj = { type: "ISTJ", scores: [38, 73, 69, 64], name: "하늘", birth: "1995-01-20", bt: 7, phone: "01012345678" };

async function setup({ open = true } = {}) {
  const db = fakeD1();
  await R.ensureReportSchema(db);
  await R.writeSetting(db, "payapp_linkkey", KEY);
  await R.writeSetting(db, "payapp_linkval", VAL);
  if (open) {
    await R.writeSetting(db, "report_open", "1");
    await R.writeSetting(db, "report_content_key", existsSync(KEY_FILE) ? readFileSync(KEY_FILE, "utf8").trim() : Buffer.alloc(32, 1).toString("base64"));
  }
  return db;
}
const fb = (row, extra = {}) =>
  new URLSearchParams({ userid: "charry333", linkkey: KEY, linkval: VAL, mul_no: row.mul_no, price: String(row.price), var1: row.order_no, pay_state: "4", pay_type: "1", ...extra });
const call = (db, path, init = {}) => {
  const u = new URL(`https://x${path}`);
  return R.handleReport(new Request(u, { headers: { "cf-connecting-ip": `10.0.0.${Math.floor(Math.random() * 250)}` }, ...init }), u, { DB: db }, ctx);
};
const postOrder = (db, body) => call(db, "/api/report/order", { method: "POST", body: JSON.stringify(body) });
const orderBody = (extra = {}) => ({ ...istj, agree: true, consentVersion: R.REPORT_CONSENT_VERSION, ...extra });
const rowByNo = (db, orderNo) => db.sql.prepare("SELECT * FROM report_orders WHERE order_no = ?").get(orderNo);

test("상품별 가격은 서버가 정한다: 책 9,900 · 신문 1,900 · 모르는 상품은 거절", () => {
  assert.equal(R.NEWS_PRICE, 1900);
  assert.equal(R.productPrice("news"), 1900);
  assert.equal(R.productPrice("book"), 9900);
  assert.equal(R.parseProduct(undefined), "book");
  assert.equal(R.parseProduct(""), "book");
  assert.equal(R.parseProduct("news"), "news");
  assert.equal(R.parseProduct("vip"), null);
});

test("동의 문구 판은 올리지 않았다(토스 미니앱이 같은 번호를 보낸다)", () => {
  assert.equal(R.REPORT_CONSENT_VERSION, "2026-10-13");
});

test("신문 주문 생성: 결제요청 금액 1,900 · 상품명 · 주문에 product=news, 브라우저 금액은 무시", async () => {
  assert.ok(NEWS_TYPE, "신문 원고가 하나 이상 올라가 있어야 한다(scripts/sync-news.mjs)");
  fetchCalls = [];
  const db = await setup();
  const res = await postOrder(db, orderBody({ type: NEWS_TYPE === "ISTJ" ? "ISTJ" : NEWS_TYPE, product: "news", price: 1, amount: 1 }));
  assert.equal(res.status, 200);
  const { orderNo } = await res.json();
  const req = fetchCalls.find((c) => c.cmd === "payrequest");
  assert.equal(req.price, "1900");
  assert.equal(req.goodname, "내 성향 신문 ISTJ");
  const row = rowByNo(db, orderNo);
  assert.equal(row.product, "news");
  assert.equal(row.price, 1900);
  assert.equal(row.phone_last4, "5678");
  assert.ok(!JSON.stringify(row).includes("01012345678"));

  // 상품을 안 보내면 예전처럼 책
  fetchCalls = [];
  const book = await postOrder(db, orderBody());
  assert.equal(book.status, 200);
  const bookRow = rowByNo(db, (await book.json()).orderNo);
  assert.deepEqual([bookRow.product, bookRow.price], ["book", 9900]);
  assert.match(fetchCalls.find((c) => c.cmd === "payrequest").goodname, /^MBTI 유형 마음숲 안내서 ISTJ$/);

  assert.equal((await postOrder(db, orderBody({ product: "vip" }))).status, 400, "모르는 상품");
  const notReady = ["INFP", "ENFP", "ESTP"].find((t) => !R.hasNews(t));
  if (notReady) {
    const scores = { INFP: [38, 27, 31, 36], ENFP: [62, 27, 31, 36], ESTP: [62, 73, 69, 36] }[notReady];
    assert.equal((await postOrder(db, orderBody({ type: notReady, scores, product: "news" }))).status, 503, "원고 없는 유형의 신문은 안 판다");
  }
});

test("예전 주문 표에 product 열이 없어도 붙고, 기존 행은 책이 된다", async () => {
  const db = fakeD1();
  db.sql.exec(`CREATE TABLE report_orders (token text PRIMARY KEY NOT NULL, order_no text NOT NULL UNIQUE, type text NOT NULL, scores text NOT NULL,
    name text DEFAULT '' NOT NULL, birth text DEFAULT '' NOT NULL, bt integer DEFAULT 0 NOT NULL, start_month text NOT NULL, phone_last4 text NOT NULL,
    price integer NOT NULL, test integer DEFAULT 0 NOT NULL, status text DEFAULT 'pending' NOT NULL, mul_no text DEFAULT '' NOT NULL,
    payurl text DEFAULT '' NOT NULL, pay_type text DEFAULT '' NOT NULL, paid_at text DEFAULT '' NOT NULL, consent_version text NOT NULL,
    consent_at text NOT NULL, first_viewed_at text DEFAULT '' NOT NULL, view_count integer DEFAULT 0 NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  db.sql.exec(`INSERT INTO report_orders (token, order_no, type, scores, start_month, phone_last4, price, consent_version, consent_at)
    VALUES ('${"a".repeat(64)}', 'MR261001-000001', 'INFP', '38,27,31,36', '2026-10', '1234', 9900, '2026-10-13', 'x')`);
  await R.ensureReportSchema(db);
  assert.equal(db.sql.prepare("SELECT product FROM report_orders").get().product, "book");
});

test("신문 결제 통보: 금액은 주문의 1,900원과 대조 — 9,900원 통보는 거절하고 「신문」 결제오류로 알린다", async () => {
  fetchCalls = [];
  const db = await setup();
  const made = await R.createOrder(db, istj, { price: R.productPrice("news"), product: "news", test: false });
  assert.equal(made.ok, true);
  const row = () => rowByNo(db, made.orderNo);
  const sent = [];
  const notify = (m) => sent.push(m);
  assert.equal(await R.handleFeedback(db, fb(row(), { price: "9900" }), notify), "FAIL", "책 가격으로 온 통보");
  assert.equal(await R.handleFeedback(db, fb(row(), { price: "100" })), "FAIL");
  assert.equal(row().status, "pending");
  assert.equal(sent.length, 1);
  assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 신문 결제완료·지급 실패 · 9,900원");
  assert.match(sent[0], /금액 불일치\(주문 1900원\)/);
  assert.match(sent[0], /돈은 받았는데 지급 실패, 수동 처리 필요/);

  assert.equal(await R.handleFeedback(db, fb(row()), notify), "SUCCESS");
  assert.equal(row().status, "paid");
  assert.equal(firstLine(sent[1]), "🧩 MBTI테스트 · 결제 · ISTJ 신문 · 1,900원");
  assert.equal(await R.handleFeedback(db, fb(row()), notify), "SUCCESS", "재전송");
  assert.equal(sent.length, 2, "재전송은 다시 알리지 않는다");

  // 인증 실패 통보도 신문 주문번호면 「신문」으로 표시(억제 묶음은 원인 기준 그대로)
  assert.equal(await R.handleFeedback(db, fb(row(), { linkval: "x".repeat(44) }), notify), "FAIL");
  assert.equal(firstLine(sent[2]), "🧩 MBTI테스트 · 🚨결제오류 · 신문 결제통보 인증 실패");
  assert.ok(!sent.join("").includes(KEY) && !sent.join("").includes(VAL));
});

test("신문 결제요청 실패도 「신문」으로 알린다", async () => {
  const db = await setup();
  const real = globalThis.fetch;
  const sent = [];
  try {
    globalThis.fetch = async () => new Response("state=0&errno=70010&errorMessage=bad");
    const a = await R.createOrder(db, istj, { price: 1900, product: "news", test: false, alert: (m) => sent.push(m) });
    assert.equal(a.ok, false);
    assert.equal(firstLine(sent[0]), "🧩 MBTI테스트 · 🚨결제오류 · 신문 결제요청 실패 · 1,900원");
    globalThis.fetch = async () => { throw new Error("tg down"); };
    const b = await R.createOrder(db, istj, { price: 1900, product: "news", test: false, alert: () => { throw new Error("tg down"); } });
    assert.equal(b.ok, false, "텔레그램이 터져도 예외 없이 손님에게 오류 문구");
  } finally {
    globalThis.fetch = real;
  }
});

test("열람 열쇠: 신문 열쇠는 /news 로만, 책 열쇠는 /book 으로만 · 결제 전·환불 뒤 닫힘", async () => {
  fetchCalls = [];
  const db = await setup();
  const news = await R.createOrder(db, istj, { price: 1900, product: "news", test: false });
  const book = await R.createOrder(db, istj, { price: 9900, test: false });
  const newsRow = () => rowByNo(db, news.orderNo);

  assert.equal((await call(db, `/api/report/news?o=${news.token}`)).status, 402, "결제 전");
  for (const bad of ["", "abc", "g".repeat(64)]) assert.equal((await call(db, `/api/report/news?o=${bad}`)).status, 404);

  await R.handleFeedback(db, fb(newsRow()));
  await R.handleFeedback(db, fb(rowByNo(db, book.orderNo)));

  const crossBook = await call(db, `/api/report/book?o=${news.token}`);
  assert.equal(crossBook.status, 409, "1,900원 신문 열쇠로 9,900원 책이 열리면 안 된다");
  assert.equal((await crossBook.json()).product, "news");
  const crossNews = await call(db, `/api/report/news?o=${book.token}`);
  assert.equal(crossNews.status, 409);
  assert.equal((await crossNews.json()).product, "book");

  const st = await (await call(db, `/api/report/status?o=${news.token}`)).json();
  assert.deepEqual([st.status, st.product], ["paid", "news"], "결제 완료 화면이 신문 화면으로 보낼 수 있게");

  if (existsSync(KEY_FILE)) {
    const res = await call(db, `/api/report/news?o=${news.token}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.orderNo, news.orderNo);
    assert.deepEqual(
      { ...data.params, date: undefined },
      { type: "ISTJ", name: "하늘", ei: 38, sn: 73, tf: 69, jp: 64, date: undefined },
    );
    assert.match(data.params.date, /^\d{4}-\d{2}-\d{2}$/, "발행일 = 주문일");
    assert.equal(data.news.code, "ISTJ");
    assert.ok(data.news.front?.headline, "원고가 풀려 나온다");
    assert.ok(newsRow().first_viewed_at, "첫 열람 시각 기록");
  }
  await R.writeSetting(db, "report_content_key", Buffer.alloc(32, 7).toString("base64"));
  assert.equal((await call(db, `/api/report/news?o=${news.token}`)).status, 503, "틀린 키면 안 준다");

  // 다시 찾기 결과에도 상품이 실린다
  const found = await (await call(db, "/api/report/find", { method: "POST", body: JSON.stringify({ orderNo: news.orderNo, last4: "5678" }) })).json();
  assert.deepEqual([found.token, found.product], [news.token, "news"]);

  assert.equal(await R.handleFeedback(db, fb(newsRow(), { pay_state: "64" })), "SUCCESS");
  assert.equal((await call(db, `/api/report/news?o=${news.token}`)).status, 402, "환불 뒤 닫힘");
});

test("신문 원고는 저장소·공개 폴더에 평문으로 없다", () => {
  const dir = fileURLToPath(new URL("../report/news/", import.meta.url));
  const sealed = readdirSync(dir).filter((x) => x.endsWith(".json"));
  assert.ok(sealed.length >= 1);
  for (const f of sealed) {
    const text = readFileSync(dir + f, "utf8");
    assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ["ct", "iv"], f);
    assert.ok(!/[가-힣]/.test(text), `${f} 에 한글 평문`);
  }
  const pub = fileURLToPath(new URL("../public/news-app/", import.meta.url));
  for (const f of ["index.html", "news.js"]) {
    const text = readFileSync(pub + f, "utf8");
    assert.ok(!/window\.NEWS\s*=\s*\{/.test(text), `${f} 에 원고가 박혀 있다`);
    assert.ok(!text.includes("약속 지킴이") && !text.includes("최종 확인"), `${f} 에 ISTJ 원고 문장`);
  }
  assert.ok(!readdirSync(pub).includes("content"), "public/news-app/content 폴더(평문 원고)가 없어야 한다");
  assert.match(readFileSync(pub + "index.html", "utf8"), /\/api\/report\/news\?o=/, "열람 화면은 주문 열쇠로 서버에서 원고를 받는다");
});

test("신문 주문은 모리 AI 대화권을 주지 않는다(대화권 조회가 책만 본다)", () => {
  const src = readFileSync(fileURLToPath(new URL("../worker/mori-chat.ts", import.meta.url)), "utf8");
  assert.match(src, /FROM report_orders WHERE token IN \(\$\{marks\}\) AND status IN \('paid','partial'\) AND product = 'book'/);
});

test("토스 미니앱은 신문을 열지 않는다(토스 지급은 product 를 넣지 않아 언제나 책)", () => {
  const src = readFileSync(fileURLToPath(new URL("../worker/report-toss.ts", import.meta.url)), "utf8");
  assert.ok(!/product\s*[,)]/.test(src.slice(src.indexOf("INSERT INTO report_orders"), src.indexOf("ON CONFLICT DO NOTHING"))), "토스 INSERT 에 product 열 없음 → 기본값 book");
  assert.ok(!src.includes("hasNews") && !src.includes("/api/report/news"));
});
