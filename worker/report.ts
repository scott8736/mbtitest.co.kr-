/**
 * 유료 리포트 결제·열람 (2026-10-04). 페이앱(PayApp) REST 연동.
 *
 *   POST /api/report/order    주문 → 페이앱 결제요청(payrequest) → 결제창 주소
 *   POST /api/report/payapp   페이앱 결과 통보(feedbackurl). 검증 후 본문 "SUCCESS"
 *   GET  /api/report/status   ?o=열쇠 → 결제 상태 (결제 직후 화면이 기다릴 때)
 *   GET  /api/report/book     ?o=열쇠 → 결제된 주문의 원고(JSON). 첫 열람 시각을 남긴다
 *   POST /api/report/find     휴대폰 번호 → 결제된 주문 목록, 또는 주문번호 + 휴대폰 뒤 4자리 → 열쇠 (다시 찾기)
 *
 * 보안 원칙 (사용자 지시 "해킹·백도어 조심"):
 *   - 금액은 서버가 정한다. 브라우저 값은 쓰지 않는다.
 *   - 통보는 userid·연동 KEY·연동 VALUE·금액·주문번호·결제요청번호(mul_no)가 모두 맞아야 반영한다.
 *     같은 통보가 여러 번 와도 상태가 한 방향으로만 바뀌게(멱등) UPDATE … WHERE status = … 로 건다.
 *   - 열쇠는 256비트 난수. 주문번호만으로는 열리지 않는다.
 *   - 우회 경로·시험용 무료 열기는 두지 않는다. 시험 결제도 진짜 결제(1,000원)를 거친다.
 *   - 휴대폰 번호 원문은 저장하지 않는다. 뒤 4자리와 되돌릴 수 없는 HMAC 값(phone_hash)만 둔다.
 */
import {
  isSellerInfoComplete,
  PAYAPP_USERID,
  REPORT_CONSENT_VERSION,
  REPORT_PAY_TYPES,
  reportPrice,
  REPORT_PRODUCT,
  validateOrder,
  type CleanOrder,
} from "../lib/report-config";
import { SITE_ORIGIN } from "../lib/site-urls";
import { classifyDevice, classifySource } from "../lib/analytics";
import { hasBook, loadBook } from "./report-books";
import { readSetting } from "./naver";

const PAYAPP_API = "https://api.payapp.kr/oapi/apiLoad.html";

export const REPORT_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS report_orders (
     token text PRIMARY KEY NOT NULL,
     order_no text NOT NULL UNIQUE,
     type text NOT NULL,
     scores text NOT NULL,
     name text DEFAULT '' NOT NULL,
     birth text DEFAULT '' NOT NULL,
     bt integer DEFAULT 0 NOT NULL,
     start_month text NOT NULL,
     phone_last4 text NOT NULL,
     price integer NOT NULL,
     test integer DEFAULT 0 NOT NULL,
     status text DEFAULT 'pending' NOT NULL,
     mul_no text DEFAULT '' NOT NULL,
     payurl text DEFAULT '' NOT NULL,
     pay_type text DEFAULT '' NOT NULL,
     paid_at text DEFAULT '' NOT NULL,
     consent_version text NOT NULL,
     consent_at text NOT NULL,
     first_viewed_at text DEFAULT '' NOT NULL,
     view_count integer DEFAULT 0 NOT NULL,
     created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
     updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS report_orders_mul_idx ON report_orders (mul_no)`,
  `CREATE INDEX IF NOT EXISTS report_orders_created_idx ON report_orders (created_at)`,
  // 페이앱 통보·취소 기록. 분쟁이 나면 이것을 봅니다(키 값은 남기지 않음).
  `CREATE TABLE IF NOT EXISTS report_events (
     id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     order_no text DEFAULT '' NOT NULL,
     kind text NOT NULL,
     detail text DEFAULT '' NOT NULL,
     created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  // 주문·다시 찾기 시도 횟수 제한(무차별 대입 방지). IP 원본 대신 해시만.
  `CREATE TABLE IF NOT EXISTS report_attempts (
     who text NOT NULL,
     kind text NOT NULL,
     at integer NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS report_attempts_idx ON report_attempts (who, kind, at)`,
];

export type OrderRow = {
  token: string;
  order_no: string;
  type: string;
  scores: string;
  name: string;
  birth: string;
  bt: number;
  start_month: string;
  phone_last4: string;
  price: number;
  test: number;
  status: string;
  mul_no: string;
  payurl: string;
  pay_type: string;
  paid_at: string;
  src?: string;
  ref_host?: string;
  landing?: string;
  utm?: string;
  entry?: string;
  device?: string;
  first_viewed_at: string;
  view_count: number;
  created_at: string;
};

type Env = { DB?: D1Database };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

// ── 작은 도구 ──
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export function constantEquals(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export function newToken(): string {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

/** 주문번호: MR + 한국 날짜(yymmdd) + 6자리 난수. 사람이 불러 줄 수 있는 길이. */
export function newOrderNo(now: Date = new Date()): string {
  const day = seoulParts(now);
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `MR${day.y.slice(2)}${day.m}${day.d}-${String(n).padStart(6, "0")}`;
}

function seoulParts(at: Date) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

export function seoulToday(at: Date = new Date()): string {
  const { y, m, d } = seoulParts(at);
  return `${y}-${m}-${d}`;
}

async function whoHash(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`report:${ip}:${seoulToday()}`));
  return hex(new Uint8Array(digest)).slice(0, 32);
}

/** 한 시간 안에 같은 사람의 시도가 limit 번을 넘으면 false. */
async function allowAttempt(db: D1Database, who: string, kind: string, limit: number): Promise<boolean> {
  const since = Date.now() - 3600_000;
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM report_attempts WHERE who = ? AND kind = ? AND at > ?")
    .bind(who, kind, since)
    .first<{ n: number }>();
  if (Number(row?.n ?? 0) >= limit) return false;
  await db.prepare("INSERT INTO report_attempts (who, kind, at) VALUES (?, ?, ?)").bind(who, kind, Date.now()).run();
  if (Math.random() < 0.02) await db.prepare("DELETE FROM report_attempts WHERE at < ?").bind(since).run();
  return true;
}

/** 아이솔레이트가 살아 있는 동안 데이터베이스마다 한 번만 확인합니다. */
const schemaReady = new WeakMap<object, Promise<void>>();
export function ensureReportSchema(db: D1Database): Promise<void> {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = db
      .batch(REPORT_SCHEMA.map((sql) => db.prepare(sql)))
      // 휴대폰 번호로 다시 찾기(2026-10-04 추가). 이미 만든 표에는 열을 붙이고, 있으면 오류를 그냥 넘깁니다.
      .then(() => db.prepare("ALTER TABLE report_orders ADD COLUMN phone_hash text DEFAULT '' NOT NULL").run().catch(() => undefined))
      // 유입 경로(2026-10-04): 어디서 왔고(src·ref_host·utm), 처음 연 페이지(landing), 어느 버튼으로 주문 화면에 왔는지(entry)
      .then(() => Promise.all(["src", "ref_host", "landing", "utm", "entry", "device"].map((c) =>
        db.prepare(`ALTER TABLE report_orders ADD COLUMN ${c} text DEFAULT '' NOT NULL`).run().catch(() => undefined))))
      .then(() => db.prepare("CREATE INDEX IF NOT EXISTS report_orders_phone_idx ON report_orders (phone_hash)").run())
      .then(() => undefined)
      .catch((error) => {
        schemaReady.delete(db);
        throw error;
      });
    schemaReady.set(db, ready);
  }
  return ready;
}

/**
 * 휴대폰 번호 → 되돌릴 수 없는 HMAC-SHA256 값. 번호 원문은 저장하지 않고 이 값으로만 대조합니다.
 * 비밀 소금은 처음 쓸 때 만들어 D1 에 두며(report_phone_salt), 화면 어디에도 내보내지 않습니다.
 */
export async function phoneHash(db: D1Database, digits: string): Promise<string> {
  let salt = await readSetting(db, "report_phone_salt");
  if (!salt) {
    salt = hex(crypto.getRandomValues(new Uint8Array(32)));
    await db
      .prepare("INSERT INTO app_settings (key, value) VALUES ('report_phone_salt', ?) ON CONFLICT(key) DO NOTHING")
      .bind(salt)
      .run();
    salt = await readSetting(db, "report_phone_salt"); // 동시에 두 요청이 만들었으면 먼저 저장된 값을 씁니다
  }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`phone:${digits}`))));
}

export async function logEvent(db: D1Database, orderNo: string, kind: string, detail: string): Promise<void> {
  await db.prepare("INSERT INTO report_events (order_no, kind, detail) VALUES (?, ?, ?)").bind(orderNo, kind, detail.slice(0, 500)).run();
}

export async function payappKeys(db: D1Database): Promise<{ linkkey: string; linkval: string }> {
  return { linkkey: await readSetting(db, "payapp_linkkey"), linkval: await readSetting(db, "payapp_linkval") };
}

/** 일반 손님 주문이 열려 있는가: 관리자 스위치 + 키 + 판매자 표시 정보. */
export async function salesOpen(db: D1Database): Promise<boolean> {
  const keys = await payappKeys(db);
  const contentKey = await readSetting(db, "report_content_key");
  return (await readSetting(db, "report_open")) === "1" && Boolean(keys.linkkey && keys.linkval && contentKey) && isSellerInfoComplete();
}

export async function payappPost(params: Record<string, string>): Promise<Record<string, string>> {
  const response = await fetch(PAYAPP_API, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
    body: new URLSearchParams(params).toString(),
  });
  return Object.fromEntries(new URLSearchParams(await response.text()));
}

/**
 * 주문을 만들고 페이앱 결제요청까지 한다. 일반 주문과 관리자 시험 주문(price=1000, test=1)이 같이 쓴다.
 * 결제창 주소를 돌려준다.
 */
export async function createOrder(
  db: D1Database,
  order: CleanOrder,
  opts: { price: number; test: boolean; meta?: OrderMeta },
): Promise<{ ok: true; payurl: string; orderNo: string; token: string } | { ok: false; error: string }> {
  const token = newToken();
  const now = new Date();
  const today = seoulToday(now);
  let orderNo = "";
  for (let i = 0; i < 4 && !orderNo; i++) {
    const candidate = newOrderNo(now);
    try {
      await db
        .prepare(
          `INSERT INTO report_orders
             (token, order_no, type, scores, name, birth, bt, start_month, phone_last4, phone_hash, price, test, consent_version, consent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(token, candidate, order.type, order.scores.join(","), order.name, order.birth, order.bt, today.slice(0, 7),
          order.phone.slice(-4), await phoneHash(db, order.phone), opts.price, opts.test ? 1 : 0, REPORT_CONSENT_VERSION, now.toISOString())
        .run();
      orderNo = candidate;
    } catch {
      // 주문번호가 겹치면(UNIQUE) 다시 뽑습니다.
    }
  }
  if (!orderNo) return { ok: false, error: "주문을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요." };

  let res: Record<string, string>;
  try {
    res = await payappPost({
      cmd: "payrequest",
      userid: PAYAPP_USERID,
      goodname: `${REPORT_PRODUCT} ${order.type}${opts.test ? " (시험)" : ""}`,
      price: String(opts.price),
      recvphone: order.phone,
      smsuse: "n",
      feedbackurl: `${SITE_ORIGIN}/api/report/payapp`,
      returnurl: `${SITE_ORIGIN}/report/done/?o=${token}`,
      var1: orderNo,
      checkretry: "y",
      openpaytype: REPORT_PAY_TYPES,
    });
  } catch (error) {
    await logEvent(db, orderNo, "payrequest_error", String(error));
    return { ok: false, error: "결제창을 열지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
  if (res.state !== "1" || !res.mul_no || !res.payurl) {
    await logEvent(db, orderNo, "payrequest_fail", `${res.errno ?? ""} ${res.errorMessage ?? ""}`);
    await db.prepare("UPDATE report_orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE token = ?").bind(token).run();
    return { ok: false, error: "결제창을 열지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
  await db.prepare("UPDATE report_orders SET mul_no = ?, payurl = ?, updated_at = CURRENT_TIMESTAMP WHERE token = ?").bind(res.mul_no, res.payurl.slice(0, 300), token).run();
  if (opts.meta) {
    const m = opts.meta;
    await db
      .prepare("UPDATE report_orders SET src = ?, ref_host = ?, landing = ?, utm = ?, entry = ?, device = ? WHERE token = ?")
      .bind(m.src, m.refHost, m.landing, m.utm, m.entry, m.device, token)
      .run();
  }
  await logEvent(db, orderNo, "payrequest", `mul_no=${res.mul_no} price=${opts.price}${opts.test ? " test" : ""}`);
  return { ok: true, payurl: res.payurl, orderNo, token };
}

export type OrderMeta = { src: string; refHost: string; landing: string; utm: string; entry: string; device: string };

/** 브라우저가 보낸 유입 정보를 정리합니다. 표시용 기록일 뿐 결제·열람 판단에는 쓰지 않습니다. */
export function orderMeta(raw: unknown, request: Request): OrderMeta {
  const t = ((raw as { touch?: Record<string, unknown> })?.touch ?? {}) as Record<string, unknown>;
  const clean = (v: unknown, n: number) => String(v ?? "").replace(/[^\w\-./:?=&%#가-힣 ]/g, "").slice(0, n);
  const ref = clean(t.ref, 300);
  let refHost = "";
  try {
    refHost = ref ? new URL(ref).hostname.slice(0, 80) : "";
  } catch {
    refHost = "";
  }
  return {
    src: classifySource(ref, "mbtitest.co.kr"),
    refHost,
    landing: clean(t.landing, 120),
    utm: clean(t.utm, 120),
    entry: clean(t.entry, 40),
    device: classifyDevice(request.headers.get("user-agent") ?? ""),
  };
}

/** 결제 상태 → 주문 상태. 바뀌는 방향만 허용합니다(이미 결제된 주문이 다시 대기로 가지 않게). */
const TRANSITIONS: Record<string, { to: string; from: string[] }> = {
  "4": { to: "paid", from: ["pending"] },
  "8": { to: "cancelled", from: ["pending"] },
  "32": { to: "cancelled", from: ["pending"] },
  "9": { to: "refunded", from: ["paid", "partial"] },
  "64": { to: "refunded", from: ["paid", "partial"] },
  "70": { to: "partial", from: ["paid"] },
  "71": { to: "partial", from: ["paid"] },
};

/**
 * 페이앱 결과 통보 처리. 돌려준 문자열을 그대로 응답 본문으로 씁니다.
 * 검증에 실패하면 "FAIL" — 페이앱은 SUCCESS 가 아니면 다시 보내므로, 진짜 통보는 키를 고친 뒤 다시 들어옵니다.
 */
export async function handleFeedback(db: D1Database, form: URLSearchParams): Promise<string> {
  const get = (k: string) => (form.get(k) ?? "").trim();
  const keys = await payappKeys(db);
  const orderNo = get("var1");
  const authed =
    get("userid") === PAYAPP_USERID && constantEquals(get("linkkey"), keys.linkkey) && constantEquals(get("linkval"), keys.linkval);
  if (!authed) {
    await logEvent(db, orderNo, "feedback_rejected", `auth mul_no=${get("mul_no")} state=${get("pay_state")}`);
    return "FAIL";
  }
  const order = await db
    .prepare("SELECT token, price, status, mul_no FROM report_orders WHERE order_no = ?")
    .bind(orderNo)
    .first<{ token: string; price: number; status: string; mul_no: string }>();
  if (!order || !order.mul_no || order.mul_no !== get("mul_no") || String(order.price) !== get("price")) {
    await logEvent(db, orderNo, "feedback_rejected", `mismatch mul_no=${get("mul_no")} price=${get("price")} state=${get("pay_state")}`);
    return "FAIL";
  }
  const state = get("pay_state");
  const move = TRANSITIONS[state];
  if (move) {
    const marks = move.from.map(() => "?").join(",");
    const extra = state === "4" ? ", paid_at = ?, pay_type = ?" : "";
    const binds: (string | number)[] = [move.to];
    if (state === "4") binds.push(get("pay_date") || new Date().toISOString(), get("pay_type"));
    await db
      .prepare(`UPDATE report_orders SET status = ?${extra}, updated_at = CURRENT_TIMESTAMP WHERE token = ? AND status IN (${marks})`)
      .bind(...binds, order.token, ...move.from)
      .run();
  }
  await logEvent(db, orderNo, "feedback", `state=${state} type=${get("pay_type")} mul_no=${get("mul_no")}`);
  return "SUCCESS";
}

/** 리포트 열람용 묶음. 결제된 주문만. */
export function bookPayload(row: OrderRow, book: Record<string, unknown>) {
  const [ei, sn, tf, jp] = row.scores.split(",").map(Number);
  return {
    orderNo: row.order_no,
    params: { type: row.type, name: row.name, ei, sn, tf, jp, birth: row.birth, bt: row.bt, from: row.start_month },
    book,
  };
}

const PAID = ["paid", "partial"];

export function handleReport(request: Request, url: URL, env: Env, ctx: Ctx): Promise<Response> | null {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/report/")) return null;
  return (async () => {
    const db = env?.DB;
    if (!db) return json({ error: "준비 중이에요." }, 503);
    await ensureReportSchema(db);

    if (path === "/api/report/payapp" && request.method === "POST") {
      const body = await request.text();
      return text(await handleFeedback(db, new URLSearchParams(body)));
    }

    if (path === "/api/report/order" && request.method === "POST") {
      if (!(await salesOpen(db))) return json({ error: "아직 판매 준비 중이에요. 조금만 기다려 주세요." }, 503);
      if (!(await allowAttempt(db, await whoHash(request), "order", 10))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return json({ error: "주문 내용을 읽지 못했어요." }, 400);
      }
      const checked = validateOrder(raw as Record<string, never>, seoulToday());
      if (!checked.ok) return json({ error: checked.error }, 400);
      if (!hasBook(checked.value.type)) return json({ error: "이 유형의 리포트는 준비 중이에요." }, 503);
      const made = await createOrder(db, checked.value, { price: reportPrice(), test: false, meta: orderMeta(raw, request) });
      return made.ok ? json({ payurl: made.payurl, orderNo: made.orderNo }) : json({ error: made.error }, 502);
    }

    if (path === "/api/report/status" && request.method === "GET") {
      const token = url.searchParams.get("o") ?? "";
      if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "주문을 찾지 못했어요." }, 404);
      const row = await db.prepare("SELECT order_no, status FROM report_orders WHERE token = ?").bind(token).first<{ order_no: string; status: string }>();
      if (!row) return json({ error: "주문을 찾지 못했어요." }, 404);
      return json({ status: PAID.includes(row.status) ? "paid" : row.status, orderNo: row.order_no });
    }

    if (path === "/api/report/book" && request.method === "GET") {
      const token = url.searchParams.get("o") ?? "";
      if (!/^[0-9a-f]{64}$/.test(token)) return json({ error: "주문을 찾지 못했어요." }, 404);
      const row = await db.prepare("SELECT * FROM report_orders WHERE token = ?").bind(token).first<OrderRow>();
      if (!row) return json({ error: "주문을 찾지 못했어요." }, 404);
      if (!PAID.includes(row.status)) return json({ error: row.status === "refunded" ? "환불된 주문이에요." : "결제가 확인되지 않았어요.", status: row.status }, 402);
      const book = await loadBook(db, row.type);
      if (!book) return json({ error: "리포트를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요." }, 503);
      // 첫 열람 시각은 환불 판단 근거라 한 번만 적습니다.
      ctx.waitUntil(
        db
          .prepare(
            `UPDATE report_orders SET view_count = view_count + 1,
               first_viewed_at = CASE WHEN first_viewed_at = '' THEN ? ELSE first_viewed_at END WHERE token = ?`,
          )
          .bind(new Date().toISOString(), token)
          .run(),
      );
      return json(bookPayload(row, book));
    }

    if (path === "/api/report/find" && request.method === "POST") {
      if (!(await allowAttempt(db, await whoHash(request), "find", 8))) return json({ error: "시도가 너무 많아요. 한 시간 뒤 다시 시도해 주세요." }, 429);
      let raw: { orderNo?: string; last4?: string; phone?: string };
      try {
        raw = await request.json();
      } catch {
        return json({ error: "입력을 읽지 못했어요." }, 400);
      }
      // 휴대폰 번호만으로 찾기(손님은 주문번호를 기억하지 못합니다). 결제된 주문만, 최근 10건.
      if (raw.phone !== undefined) {
        const digits = String(raw.phone).replace(/\D/g, "");
        if (!/^01[016789]\d{7,8}$/.test(digits)) return json({ error: "휴대폰 번호를 다시 확인해 주세요." }, 400);
        const rows = (
          await db
            .prepare(
              `SELECT token, order_no, type, paid_at FROM report_orders
               WHERE phone_hash = ? AND status IN ('paid', 'partial') ORDER BY created_at DESC LIMIT 10`,
            )
            .bind(await phoneHash(db, digits))
            .all<{ token: string; order_no: string; type: string; paid_at: string }>()
        ).results ?? [];
        if (!rows.length) return json({ error: "이 번호로 결제된 리포트가 없어요. 결제할 때 쓴 번호인지 확인해 주세요." }, 404);
        return json({ orders: rows.map((r) => ({ token: r.token, orderNo: r.order_no, type: r.type, paidAt: r.paid_at })) });
      }
      const orderNo = String(raw.orderNo ?? "").trim().toUpperCase();
      const last4 = String(raw.last4 ?? "").replace(/\D/g, "");
      if (!/^MR\d{6}-\d{6}$/.test(orderNo) || !/^\d{4}$/.test(last4)) return json({ error: "주문번호와 휴대폰 뒤 4자리를 확인해 주세요." }, 400);
      const row = await db
        .prepare("SELECT token, status, phone_last4 FROM report_orders WHERE order_no = ?")
        .bind(orderNo)
        .first<{ token: string; status: string; phone_last4: string }>();
      if (!row || !constantEquals(row.phone_last4, last4)) return json({ error: "일치하는 주문이 없어요." }, 404);
      if (!PAID.includes(row.status)) return json({ error: "결제가 완료된 주문이 아니에요." }, 404);
      return json({ token: row.token });
    }

    return json({ error: "없는 주소예요." }, 404);
  })().catch(() => json({ error: "잠시 문제가 생겼어요. 다시 시도해 주세요." }, 500));
}
