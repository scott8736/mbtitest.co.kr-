/**
 * 토스 미니앱 「MBTI 검사」 인앱결제(IAP)로 산 리포트 (2026-10-07).
 *
 *   POST /api/report/toss-grant   { orderId, type, scores, name, birth, bt, agree, consentVersion }
 *        → 토스에 주문이 진짜 결제됐는지 확인한 뒤 주문을 「결제 완료」로 만들고 열람 열쇠를 돌려준다.
 *          같은 orderId 로 다시 부르면 새로 만들지 않고 같은 열쇠를 돌려준다(앱이 꺼졌다 켜져도 복구).
 *   GET  /api/report/book          (report.ts) — 토스 앱 주소에서도 읽을 수 있게 CORS 만 붙인다.
 *
 * 보안 원칙은 report.ts 와 같다 (사용자 지시 "해킹·백도어 조심"):
 *   - 앱이 "결제됐다"고 말해도 믿지 않는다. orderId 를 토스 서버(mTLS)에 직접 물어 PURCHASED/PAYMENT_COMPLETED
 *     이고 상품(sku)이 우리 리포트일 때만 지급한다. mTLS 인증서는 이 사이트 호스팅에 붙일 수 없어서
 *     사용자 Cloudflare 계정의 작은 워커(toss-iap-verify)가 대신 묻고, 우리는 그 워커를 비밀 키로 부른다.
 *   - 금액은 서버가 정한다(TOSS_REPORT_PRICE). 같은 orderId 는 부분 UNIQUE 색인으로 한 번만 들어간다.
 *   - 확인 워커 주소·키·상품 ID 는 관리자 화면에서 넣어 D1 에 둔다. 코드·저장소에는 없다(저장소가 공개).
 */
import { REPORT_CONSENT_VERSION, REPORT_PRODUCT, TOSS_REPORT_PRICE, validateOrder } from "../lib/report-config";
import { hasBook } from "./report-books";
import { readSetting } from "./naver";
import { allowAttempt, constantEquals, ensureReportSchema, logEvent, newOrderNo, newToken, seoulToday, whoHash } from "./report";

/** 토스 미니앱이 도는 주소. SDK 3.x: 실서비스 <appName>.web.tossmini.com, 콘솔 QR 테스트 <appName>.private-web.tossmini.com */
export const TOSS_ORIGINS = ["https://mbtitest.web.tossmini.com", "https://mbtitest.private-web.tossmini.com"];
const TEST_ORIGIN = "https://mbtitest.private-web.tossmini.com";

/** 토스 쪽 경로만 CORS 를 연다. 웹 사이트 자신의 경로는 지금처럼 같은 출처만. */
export const TOSS_CORS_PATHS = ["/api/report/toss-grant", "/api/report/book"];

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !TOSS_ORIGINS.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

export function withCors(res: Response, origin: string | null): Response {
  const extra = corsHeaders(origin);
  if (!Object.keys(extra).length) return res;
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

export const TOSS_SCHEMA = [
  // 같은 토스 주문이 두 번 들어가지 않게. 페이앱 주문(mul_no 가 숫자)은 건드리지 않는 부분 색인.
  "CREATE UNIQUE INDEX IF NOT EXISTS report_orders_toss_idx ON report_orders (mul_no) WHERE mul_no LIKE 'toss:%'",
];

const ORDER_ID_RE = /^[A-Za-z0-9_-]{6,100}$/;
const PAID_STATUSES = ["PURCHASED", "PAYMENT_COMPLETED"];

export type TossVerify = { ok: true; status: string; sku: string } | { ok: false; reason: string };

/** 확인 워커가 돌려준 값에서 상태·상품을 꺼낸다. 토스 응답은 { resultType, success: {...} } 로 감싸여 올 수도 있다. */
export function parseVerify(body: unknown): { status: string; sku: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const inner = (b.success && typeof b.success === "object" ? b.success : b) as Record<string, unknown>;
  return { status: String(inner.status ?? ""), sku: String(inner.sku ?? "") };
}

export async function verifyTossOrder(db: D1Database, orderId: string, fetcher: typeof fetch = fetch): Promise<TossVerify> {
  const url = await readSetting(db, "toss_verify_url");
  const secret = await readSetting(db, "toss_verify_secret");
  if (!url || !secret) return { ok: false, reason: "not_configured" };
  let res: Response;
  try {
    res = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({ orderId }),
    });
  } catch (error) {
    return { ok: false, reason: `fetch:${String(error).slice(0, 80)}` };
  }
  if (!res.ok) return { ok: false, reason: `http:${res.status}` };
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, reason: "bad_json" };
  }
  const v = parseVerify(body);
  return { ok: true, status: v.status, sku: v.sku };
}

type GrantRow = { token: string; order_no: string; status: string };

async function findGrant(db: D1Database, orderId: string): Promise<GrantRow | null> {
  return db.prepare("SELECT token, order_no, status FROM report_orders WHERE mul_no = ?").bind(`toss:${orderId}`).first<GrantRow>();
}

const schemaReady = new WeakMap<object, Promise<void>>();
function ensureTossSchema(db: D1Database): Promise<void> {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = ensureReportSchema(db)
      .then(() => db.batch(TOSS_SCHEMA.map((sql) => db.prepare(sql))))
      .then(() => undefined)
      .catch((error) => {
        schemaReady.delete(db);
        throw error;
      });
    schemaReady.set(db, ready);
  }
  return ready;
}

export async function handleTossGrant(
  request: Request,
  db: D1Database,
  notify: (text: string) => void,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  await ensureTossSchema(db);
  if (!(await allowAttempt(db, await whoHash(request), "toss", 20))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "주문 내용을 읽지 못했어요." }, 400);
  }
  const orderId = String(raw.orderId ?? "");
  if (!ORDER_ID_RE.test(orderId)) return json({ error: "주문을 찾지 못했어요." }, 400);

  // 이미 지급한 주문이면 그대로 돌려준다(복구). 결제 확인을 다시 하지 않아도 되는 이유: 지급할 때 이미 확인했다.
  const existing = await findGrant(db, orderId);
  if (existing) {
    if (existing.status !== "paid" && existing.status !== "partial") return json({ error: "환불되었거나 확인되지 않은 주문이에요." }, 402);
    return json({ token: existing.token, orderNo: existing.order_no });
  }

  const checked = validateOrder(raw as never, seoulToday(), { phone: false });
  if (!checked.ok) return json({ error: checked.error }, 400);
  const order = checked.value;
  if (!hasBook(order.type)) return json({ error: "이 유형의 리포트는 준비 중이에요." }, 503);

  const sku = await readSetting(db, "toss_report_sku");
  if (!sku) return json({ error: "아직 판매 준비 중이에요." }, 503);

  const v = await verifyTossOrder(db, orderId, fetcher);
  if (!v.ok) {
    await logEvent(db, "", "toss_verify_error", `orderId=${orderId} ${v.reason}`);
    return json({ error: "결제를 확인하지 못했어요. 잠시 뒤 다시 열어 주세요." }, 502);
  }
  if (!PAID_STATUSES.includes(v.status) || !constantEquals(v.sku, sku)) {
    await logEvent(db, "", "toss_verify_rejected", `orderId=${orderId} status=${v.status} sku=${v.sku}`);
    return json({ error: "결제가 확인되지 않았어요." }, 402);
  }

  const origin = request.headers.get("origin");
  const test = origin === TEST_ORIGIN ? 1 : 0;
  const now = new Date();
  const today = seoulToday(now);
  const token = newToken();
  let orderNo = "";
  for (let i = 0; i < 4 && !orderNo; i++) {
    const candidate = newOrderNo(now);
    try {
      const res = (await db
        .prepare(
          `INSERT INTO report_orders
             (token, order_no, type, scores, name, birth, bt, start_month, phone_last4, phone_hash, price, test,
              status, mul_no, pay_type, paid_at, consent_version, consent_at, src, entry)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, 'paid', ?, 'toss-iap', ?, ?, ?, 'toss', 'toss-app')
           ON CONFLICT DO NOTHING`,
        )
        .bind(token, candidate, order.type, order.scores.join(","), order.name, order.birth, order.bt, today.slice(0, 7),
          TOSS_REPORT_PRICE, test, `toss:${orderId}`, now.toISOString(), REPORT_CONSENT_VERSION, now.toISOString())
        .run()) as { meta?: { changes?: number }; changes?: number };
      if ((res?.meta?.changes ?? res?.changes ?? 0) > 0) orderNo = candidate;
      // 안 들어갔다: 같은 orderId 가 동시에 먼저 들어갔거나(→ 아래에서 그 주문을 돌려준다) 주문번호가 겹쳤다(→ 다시 뽑는다)
      else if (await findGrant(db, orderId)) break;
    } catch {
      // 주문번호가 겹치면 다시 뽑는다.
    }
  }
  if (!orderNo) {
    const raced = await findGrant(db, orderId);
    if (raced) return json({ token: raced.token, orderNo: raced.order_no });
    return json({ error: "주문을 만들지 못했어요. 잠시 뒤 다시 열어 주세요." }, 500);
  }
  await logEvent(db, orderNo, "toss_paid", `orderId=${orderId} status=${v.status}${test ? " test" : ""}`);
  notify(
    [
      `💰 리포트 결제 완료 (토스)${test ? " (시험)" : ""}`,
      `${order.type} · ${TOSS_REPORT_PRICE.toLocaleString()}원`,
      `주문 ${orderNo}`,
      `${new Date(Date.now() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ")} (한국 시각)`,
    ].join("\n"),
  );
  return json({ token, orderNo, product: REPORT_PRODUCT });
}
