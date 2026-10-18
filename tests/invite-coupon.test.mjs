import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * 「친구가 본 내 모리」 (2026-10-08). 진짜 SQLite 위에 D1 흉내를 씌워 worker/forest.ts·report.ts 를 그대로 돌린다.
 * 지키는 것: 셀프 초대·같은 연결 반복은 세지 않음 · 맞히기는 처음 고른 답으로 채점 ·
 * 초대 할인권은 2026-10-19 폐지 — 발급하지 않고, 주문에 할인권 번호가 와도 정가로 결제한다.
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

test("맞히기 → 친구 3명: 할인권은 발급하지 않는다(2026-10-19 폐지)", async () => {
  const db = fakeD1();
  const made = await call(db, "/api/forest/create", { type: "INFP", nickname: "달빛", device: dev(1) }, "1.1.1.1");
  assert.equal(made.status, 200);
  const id = made.body.id;

  // 주인이 자기 링크에 맞히기 → 거절
  assert.equal((await call(db, `/api/forest/${id}/guess`, { guess: "INFP", device: dev(1) }, "1.1.1.1")).body.own, true);
  // 주인과 같은 연결(같은 집 와이파이)의 다른 기기 → 참여는 되지만 친구 수에는 안 셈
  const sameHome = await call(db, `/api/forest/${id}/guess`, { guess: "ENFP", word: 0, device: dev(2) }, "1.1.1.1");
  assert.equal(sameHome.body.ok, true);

  const g1 = await call(db, `/api/forest/${id}/guess`, { guess: "ENFJ", word: 6, device: dev(3) }, "2.2.2.2");
  assert.equal(g1.body.answer, "INFP");
  assert.equal(g1.body.right, false);
  assert.equal(g1.body.friendCoupon, undefined, "친구 할인권 없음");
  // 답을 바꿔 다시 보내도 처음 답으로 채점
  const again = await call(db, `/api/forest/${id}/guess`, { guess: "INFP", device: dev(3) }, "2.2.2.2");
  assert.equal(again.body.right, false);
  assert.equal(again.body.already, true);

  let mine = await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1");
  assert.deepEqual([mine.body.friends, mine.body.goal], [1, M.INVITE_GOAL]);
  assert.equal((await call(db, `/api/forest/${id}/mine`, { device: dev(3) }, "2.2.2.2")).status, 403, "남의 숲 진행은 못 본다");

  await call(db, `/api/forest/${id}/guess`, { guess: "INFP", word: 1, device: dev(4) }, "3.3.3.3");
  const j = await call(db, `/api/forest/${id}/join`, { type: "ESTJ", via: "known", device: dev(5) }, "4.4.4.4");
  assert.equal(j.body.ok, true);
  assert.equal(j.body.friendCoupon, undefined);
  mine = await call(db, `/api/forest/${id}/mine`, { device: dev(1) }, "1.1.1.1");
  assert.equal(mine.body.friends, 3);
  assert.equal(mine.body.coupon, undefined, "친구 3명이 돼도 주인 할인권 없음");

  // 친구들이 본 나
  const view = (await call(db, `/api/forest/${id}`, null, "9.9.9.9", "GET")).body;
  const t = M.guessTally(view);
  assert.equal(t.total, 3, "주인 거절분은 빠지고 같은 집 기기 포함 3번");
  assert.equal(t.right, 1);

  // 할인권 확인 주소는 닫혔다
  assert.equal((await call(db, "/api/forest/coupon?c=AAAAAAAAAA", null, "1.1.1.1", "GET")).status, 410);

  // 관리자 숫자
  const st = await M.forestStats(db);
  assert.equal(st.forests, 1);
  assert.equal(st.guesses, 3);
  assert.equal(st.guessRight, 1);
  assert.equal(st.participants, 4, "맞히기 3 + 심기 1, 기기 기준");
  assert.equal(st.coupons.owner, 0);
  assert.equal(st.coupons.friend, 0);
});

test("주문에 할인권 번호를 넣어 보내도 정가로 결제한다", async () => {
  const db = fakeD1();
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
  for (const coupon of ["ZZZZZZZZZZ", "ABCDEFGH23", undefined]) {
    const url = new URL("https://mbtitest.co.kr/api/report/order");
    const req = new Request(url, {
      method: "POST",
      headers: { "cf-connecting-ip": "1.1.1.1" },
      body: JSON.stringify({ type, scores, name: "", birth: "", bt: 0, phone: "01012345678", agree: true, consentVersion: M.REPORT_CONSENT_VERSION, coupon }),
    });
    const res = await M.handleReport(req, url, { DB: db }, ctx);
    const out = await res.json();
    assert.equal(res.status, 200, JSON.stringify(out));
    assert.equal(sent.at(-1).price, String(M.reportPrice()), "페이앱에 보낸 금액 = 정가");
    const row = db.sql.prepare("SELECT * FROM report_orders WHERE order_no = ?").get(out.orderNo);
    assert.equal(row.price, M.reportPrice());
    assert.equal(row.coupon, "");
    assert.equal(row.discount, 0);
  }
});
