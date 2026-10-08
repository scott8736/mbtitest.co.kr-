import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 「친구가 본 내 모리」 + 초대 할인권 (2026-10-08). 진짜 SQLite 위에 D1 흉내를 씌워 worker/forest.ts·coupon.ts·report.ts 를 그대로 돌린다.
 * 지키는 것: 셀프 초대·같은 연결 반복은 세지 않음 · 친구 3명이 되면 주인 할인권 하나 · 친구 할인권은 기기·연결당 제한 ·
 * 맞히기는 처음 고른 답으로 채점 · 할인 금액은 서버가 정함 · 결제 완료 통보가 와야 「사용」 · 쓴 할인권은 다시 못 씀.
 */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { handleForest, countFriends, forestStats } from "./worker/forest";
      export { handleReport, handleFeedback, ensureReportSchema } from "./worker/report";
      export { bookTypes } from "./worker/report-books";
      export { writeSetting } from "./worker/naver";
      export { discounted, isCouponCode, newCouponCode, normalizeCode, INVITE_GOAL, OWNER_COUPON, FRIEND_COUPON, MIN_PRICE } from "./lib/invite-coupon";
      export { reportPrice, REPORT_CONSENT_VERSION } from "./lib/report-config";
      export { guessTally } from "./lib/our-forest";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const M = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

/** node:sqlite 위의 D1 흉내. run() 은 D1 처럼 meta.changes 를 돌려준다. */
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

const ctx = { waitUntil: (p) => p };
const call = async (db, path, body, ip = "10.0.0.1", method = "POST") => {
  const url = new URL(`https://mbtitest.co.kr${path}`);
  const req = new Request(url, { method, headers: { "cf-connecting-ip": ip, "content-type": "application/json" }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
  const res = await M.handleForest(req, url, { DB: db }, ctx);
  return { status: res.status, body: await res.json() };
};
const dev = (n) => `device_${String(n).padStart(8, "0")}`;

test("할인권 번호·금액 규칙", () => {
  for (let i = 0; i < 50; i++) assert.ok(M.isCouponCode(M.newCouponCode()));
  assert.equal(M.normalizeCode(" abcd-efgh 23 "), "ABCDEFGH23");
  assert.equal(M.isCouponCode("ABCDEFGH1O"), false, "헷갈리는 글자(1 O)는 쓰지 않는다");
  assert.equal(M.discounted(9900, 3000), 6900);
  assert.equal(M.discounted(1500, 3000), M.MIN_PRICE, "페이앱 최소 금액 아래로 내려가지 않는다");
  assert.equal(M.discounted(9900, -500), 9900);
});

test("친구 수 세기: 주인 기기·주인 연결 제외, 같은 기기 한 번, 한 연결 2명까지", () => {
  const owner = { device: "o", ip: "home" };
  assert.equal(M.countFriends([{ device: "o", ip: "x" }, { device: "a", ip: "home" }], owner), 0, "셀프 초대");
  assert.equal(M.countFriends([{ device: "a", ip: "1" }, { device: "a", ip: "2" }, { device: "b", ip: "3" }], owner), 2);
  assert.equal(M.countFriends([{ device: "a", ip: "cafe" }, { device: "b", ip: "cafe" }, { device: "c", ip: "cafe" }], owner), 2, "셋째부터는 같은 사람이 기기 값을 지운 것으로 본다");
  assert.equal(M.countFriends([{ device: "a", ip: "" }, { device: "b", ip: "" }, { device: "c", ip: "" }], { device: "o", ip: "" }), 3, "예전 기록(연결 값 없음)은 기기로만 센다");
});

test("맞히기 → 친구 3명 → 주인 할인권 → 결제에 쓰기 → 완료 통보에 「사용」 → 다시 못 씀", async () => {
  const db = fakeD1();
  const made = await call(db, "/api/forest/create", { type: "INFP", nickname: "달빛", device: dev(1) }, "1.1.1.1");
  assert.equal(made.status, 200);
  const id = made.body.id;

  // 주인이 자기 링크에 맞히기 → 거절
  assert.equal((await call(db, `/api/forest/${id}/guess`, { guess: "INFP", device: dev(1) }, "1.1.1.1")).body.own, true);
  // 주인과 같은 연결(같은 집 와이파이)의 다른 기기 → 참여는 되지만 할인권 목표에는 안 셈
  const sameHome = await call(db, `/api/forest/${id}/guess`, { guess: "ENFP", word: 0, device: dev(2) }, "1.1.1.1");
  assert.equal(sameHome.body.ok, true);

  const g1 = await call(db, `/api/forest/${id}/guess`, { guess: "ENFJ", word: 6, device: dev(3) }, "2.2.2.2");
  assert.equal(g1.body.answer, "INFP");
  assert.equal(g1.body.right, false);
  assert.equal(g1.body.friendCoupon.amount, M.FRIEND_COUPON, "처음 참여한 친구 할인권");
  // 답을 바꿔 다시 보내도 처음 답으로 채점
  const again = await call(db, `/api/forest/${id}/guess`, { guess: "INFP", device: dev(3) }, "2.2.2.2");
  assert.equal(again.body.right, false);
  assert.equal(again.body.already, true);
  assert.equal(again.body.friendCoupon.code, g1.body.friendCoupon.code, "같은 기기는 같은 할인권");

  let mine = await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1");
  assert.deepEqual([mine.body.friends, mine.body.goal, mine.body.coupon], [1, M.INVITE_GOAL, undefined]);
  assert.equal((await call(db, `/api/forest/${id}/mine`, { device: dev(3) }, "2.2.2.2")).status, 403, "남의 숲 진행은 못 본다");

  await call(db, `/api/forest/${id}/guess`, { guess: "INFP", word: 1, device: dev(4) }, "3.3.3.3");
  mine = await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1");
  assert.equal(mine.body.friends, 2);
  assert.equal(mine.body.coupon, undefined, "2명은 아직");
  // 셋째 친구는 맞히지 않고 바로 심기만 해도 참여
  const j = await call(db, `/api/forest/${id}/join`, { type: "ESTJ", via: "known", device: dev(5) }, "4.4.4.4");
  assert.equal(j.body.ok, true);
  assert.ok(j.body.friendCoupon);
  mine = await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1");
  assert.equal(mine.body.friends, 3);
  assert.equal(mine.body.coupon.amount, M.OWNER_COUPON);
  const ownerCode = mine.body.coupon.code;
  assert.equal((await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1")).body.coupon.code, ownerCode, "주인 할인권은 숲마다 하나");

  // 친구들이 본 나
  const view = (await call(db, `/api/forest/${id}`, null, "9.9.9.9", "GET")).body;
  const t = M.guessTally(view);
  assert.equal(t.total, 3, "주인 거절분은 빠지고 같은 집 기기 포함 3번");
  assert.equal(t.right, 1);

  // 할인권 확인(주문 화면용)
  const chk = await call(db, `/api/forest/coupon?c=${ownerCode.toLowerCase()}`, null, "1.1.1.1", "GET");
  assert.equal(chk.body.amount, M.OWNER_COUPON);
  assert.equal((await call(db, "/api/forest/coupon?c=AAAAAAAAAA", null, "1.1.1.1", "GET")).status, 404);

  // 주문: 서버가 금액을 깎는다
  const KEY = "k".repeat(44);
  const VAL = "v".repeat(44);
  await M.ensureReportSchema(db);
  await M.writeSetting(db, "payapp_linkkey", KEY);
  await M.writeSetting(db, "payapp_linkval", VAL);
  await M.writeSetting(db, "report_open", "1");
  await M.writeSetting(db, "report_content_key", "x");
  const sent = [];
  globalThis.fetch = async (_u, init) => {
    const body = Object.fromEntries(new URLSearchParams(init.body));
    sent.push(body);
    return new Response(`state=1&mul_no=777${sent.length}&payurl=https%3A%2F%2Fpay.example%2Fp`);
  };
  const type = M.bookTypes().includes("INFP") ? "INFP" : M.bookTypes()[0];
  const left = ["E", "S", "T", "J"];
  const scores = [...type].map((ch, i) => (ch === left[i] ? 70 : 30));
  const order = async (coupon) => {
    const url = new URL("https://mbtitest.co.kr/api/report/order");
    const req = new Request(url, {
      method: "POST",
      headers: { "cf-connecting-ip": "1.1.1.1" },
      body: JSON.stringify({ type, scores, name: "", birth: "", bt: 0, phone: "01012345678", agree: true, consentVersion: M.REPORT_CONSENT_VERSION, coupon }),
    });
    const res = await M.handleReport(req, url, { DB: db }, ctx);
    return { status: res.status, body: await res.json() };
  };
  const bad = await order("ZZZZZZZZZZ");
  assert.equal(bad.status, 400);
  assert.ok(bad.body.error.includes("할인권"));

  const o1 = await order(ownerCode);
  assert.equal(o1.status, 200, JSON.stringify(o1.body));
  const expect = M.discounted(M.reportPrice(), M.OWNER_COUPON);
  assert.equal(sent.at(-1).price, String(expect), "페이앱에 보낸 금액 = 서버가 깎은 금액");
  const row = db.sql.prepare("SELECT * FROM report_orders WHERE order_no = ?").get(o1.body.orderNo);
  assert.equal(row.price, expect);
  assert.equal(row.coupon, ownerCode);
  assert.equal(row.discount, M.reportPrice() - expect);

  // 결제창만 닫고 다시 주문해도 할인권은 아직 살아 있다
  const o2 = await order(ownerCode);
  assert.equal(o2.status, 200);

  // 결제 완료 통보(두 번째 주문) → 할인권 「사용」
  const r2 = db.sql.prepare("SELECT * FROM report_orders WHERE order_no = ?").get(o2.body.orderNo);
  const fb = new URLSearchParams({ userid: "charry333", linkkey: KEY, linkval: VAL, mul_no: r2.mul_no, price: String(r2.price), var1: r2.order_no, pay_state: "4", pay_type: "1" });
  assert.equal(await M.handleFeedback(db, fb), "SUCCESS");
  const c = db.sql.prepare("SELECT paid_order FROM forest_coupon WHERE code = ?").get(ownerCode);
  assert.equal(c.paid_order, o2.body.orderNo);
  const o3 = await order(ownerCode);
  assert.equal(o3.status, 400);
  assert.ok(o3.body.error.includes("이미 사용"));

  // 관리자 숫자
  const st = await M.forestStats(db);
  assert.equal(st.forests, 1);
  assert.equal(st.guesses, 3);
  assert.equal(st.guessRight, 1);
  assert.equal(st.participants, 4, "맞히기 3 + 심기 1, 기기 기준");
  assert.equal(st.coupons.owner, 1);
  assert.equal(st.coupons.paid, 1);
});

test("친구 할인권: 한 연결에서 2장까지(기기 값을 지우고 다시 받기 방지)", async () => {
  const db = fakeD1();
  const ids = [];
  for (let i = 0; i < 3; i++) ids.push((await call(db, "/api/forest/create", { type: "ENTP", device: dev(100 + i) }, `5.5.5.${i}`)).body.id);
  const got = [];
  for (let i = 0; i < 3; i++) got.push((await call(db, `/api/forest/${ids[i]}/guess`, { guess: "ENTP", device: dev(200 + i) }, "6.6.6.6")).body.friendCoupon);
  assert.ok(got[0] && got[1]);
  assert.equal(got[2], undefined);
  // 참여 자체는 막지 않는다
  const view = (await call(db, `/api/forest/${ids[2]}`, null, "6.6.6.6", "GET")).body;
  assert.equal(view.guesses.length, 1);
});
