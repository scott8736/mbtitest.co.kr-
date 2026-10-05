import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 관리자 리포트 주문 표 (2026-10-06).
 * 지키는 것: 골라 지우기는 시험 주문만 · 돈이 걸린 시험 주문(1,000원 결제 완료)과 손님 주문은 요청을 위조해도 안 지워짐 ·
 * 검수용 무료 리포트는 발행 이력에 남아 다시 만들지 않고 「열기」로 열린다.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./worker/report"; export { handleReportAdmin } from "./worker/report-admin";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const R = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

/** node:sqlite 위의 D1 흉내. run() 은 D1 처럼 { meta: { changes } } 를 돌려준다. */
function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`CREATE TABLE app_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL)`);
  const stmt = (query, args = []) => ({
    bind: (...a) => stmt(query, a),
    first: async () => sql.prepare(query).get(...args) ?? null,
    run: async () => ({ meta: sql.prepare(query).run(...args) }),
    all: async () => ({ results: sql.prepare(query).all(...args) }),
  });
  return { sql, prepare: (q) => stmt(q), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const H = {
  esc,
  shell: (title, body) => body,
  html: (body) => new Response(body),
  redirect: (to) => new Response(null, { status: 303, headers: { location: to } }),
};
globalThis.fetch = async () => new Response("state=1&mul_no=1&payurl=https%3A%2F%2Fpay.example%2Fp");

const order = { type: "INFP", scores: [38, 27, 31, 36], name: "하늘", birth: "1995-01-20", bt: 7, phone: "01012345678" };

async function seed() {
  const db = fakeD1();
  await R.ensureReportSchema(db);
  const free = await R.createOrder(db, { ...order, type: "ISTJ", scores: [30, 85, 70, 55], name: "검수" }, { price: 0, test: true, free: true });
  const mk = async (opts, status) => {
    const made = await R.createOrder(db, order, opts);
    db.sql.prepare("UPDATE report_orders SET status = ?, mul_no = 'm' || order_no WHERE token = ?").run(status, made.token);
    return made;
  };
  const testPaid = await mk({ price: 1000, test: true }, "paid");       // 돈이 걸린 시험 주문
  const testRefunded = await mk({ price: 1000, test: true }, "refunded");
  const real = await mk({ price: 9900, test: false }, "paid");           // 손님 주문
  return { db, free, testPaid, testRefunded, real };
}

const post = (db, nos) => {
  const fd = new FormData();
  nos.forEach((n) => fd.append("order_no", n));
  const req = new Request("https://x/admin/report/delete", { method: "POST", body: fd });
  return R.handleReportAdmin(req, new URL(req.url), "/admin/report/delete", db, H);
};
const left = (db) => db.sql.prepare("SELECT order_no FROM report_orders").all().map((r) => r.order_no).sort();

test("골라 지우기는 지울 수 있는 시험 주문만 지운다(위조 요청 포함)", async () => {
  const { db, free, testPaid, testRefunded, real } = await seed();
  const res = await post(db, [free.orderNo, testPaid.orderNo, testRefunded.orderNo, real.orderNo, "없는번호"]);
  assert.equal(res.status, 303);
  assert.match(res.headers.get("location"), /deleted=2&skipped=3/);
  assert.deepEqual(left(db), [testPaid.orderNo, real.orderNo].sort());
  const ev = db.sql.prepare("SELECT order_no FROM report_events WHERE kind = 'admin_delete'").all().map((r) => r.order_no).sort();
  assert.deepEqual(ev, [free.orderNo, testRefunded.orderNo].sort());
});

test("주문 표: 손님 주문·돈 걸린 시험 주문은 체크박스가 막혀 있다", async () => {
  const { db, free, testPaid, real } = await seed();
  const req = new Request("https://x/admin/report/");
  const page = await (await R.handleReportAdmin(req, new URL(req.url), "/admin/report/", db, H)).text();
  assert.match(page, new RegExp(`form="del-form" name="order_no" value="${free.orderNo}"`));
  assert.doesNotMatch(page, new RegExp(`form="del-form" name="order_no" value="${testPaid.orderNo}"`));
  assert.doesNotMatch(page, new RegExp(`form="del-form" name="order_no" value="${real.orderNo}"`));
  assert.match(page, /손님 주문은 지울 수 없습니다/);
});

test("검수용 무료 리포트 발행 이력: 점수는 내 유형 쪽 %, 열기 링크가 있다", async () => {
  const { db, free } = await seed();
  const req = new Request("https://x/admin/report/");
  const page = await (await R.handleReportAdmin(req, new URL(req.url), "/admin/report/", db, H)).text();
  assert.match(page, /발행 이력 \(1건\)/);
  // 저장은 왼쪽 글자 비율 [30,85,70,55] → ISTJ 기준 I 70 · S 85 · T 70 · J 55
  assert.match(page, /I 70 · S 85 · T 70 · J 55/);
  assert.match(page, new RegExp(`href="/report-app/\\?o=${free.token}"[^>]*>열기`));
});
