/**
 * 초대 할인권 장부 (2026-10-08). 규칙·금액은 lib/invite-coupon.ts.
 *
 * 발급: worker/forest.ts — 숲 주인(친구 INVITE_GOAL 명 참여) · 참여한 친구(처음 한 번).
 * 사용: worker/report.ts — 주문 때 checkCoupon 으로 금액을 깎고 주문에 코드를 적어 두며(attachCoupon),
 *       페이앱 결제 완료 통보 때 markCouponPaid 로 「쓴 할인권」이 됩니다.
 * 결제창만 열고 닫은 주문은 할인권을 쓰지 않은 것으로 봅니다(다시 주문하면 또 쓸 수 있음).
 */
import { COUPON_DAYS, isCouponCode, newCouponCode, normalizeCode } from "../lib/invite-coupon";

export const COUPON_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS forest_coupon (
     code text PRIMARY KEY NOT NULL,
     kind text NOT NULL,
     amount integer NOT NULL,
     device text NOT NULL,
     ip text DEFAULT '' NOT NULL,
     forest_id text NOT NULL,
     created_at integer NOT NULL,
     expires_at integer NOT NULL,
     order_no text DEFAULT '' NOT NULL,
     paid_order text DEFAULT '' NOT NULL,
     paid_at integer DEFAULT 0 NOT NULL
   )`,
  // 숲마다 주인 할인권 하나, 기기마다 친구 할인권 하나
  `CREATE UNIQUE INDEX IF NOT EXISTS forest_coupon_owner_idx ON forest_coupon (forest_id) WHERE kind = 'owner'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS forest_coupon_friend_idx ON forest_coupon (device) WHERE kind = 'friend'`,
  `CREATE INDEX IF NOT EXISTS forest_coupon_ip_idx ON forest_coupon (ip, kind)`,
];

/** 한 연결(IP)에서 받을 수 있는 친구 할인권 수. 기기 값을 지우고 다시 받는 것을 막습니다. */
export const FRIEND_COUPONS_PER_IP = 2;

const schemaReady = new WeakMap<object, Promise<void>>();
export function ensureCouponSchema(db: D1Database): Promise<void> {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = db
      .batch(COUPON_SCHEMA.map((s) => db.prepare(s)))
      .then(() => undefined)
      .catch((e) => {
        schemaReady.delete(db);
        throw e;
      });
    schemaReady.set(db, ready);
  }
  return ready;
}

export type CouponRow = { code: string; kind: string; amount: number; expires_at: number; paid_order: string };
export type CouponOut = { code: string; amount: number; kind: "owner" | "friend"; expiresAt: number; used: boolean };

export const couponOut = (r: CouponRow): CouponOut => ({
  code: r.code, amount: Number(r.amount), kind: r.kind === "owner" ? "owner" : "friend", expiresAt: Number(r.expires_at), used: Boolean(r.paid_order),
});

/** 할인권을 만듭니다. 이미 있으면(같은 숲 주인 · 같은 기기 친구) 있던 것을 돌려줍니다. */
export async function issueCoupon(
  db: D1Database,
  c: { kind: "owner" | "friend"; amount: number; device: string; ip: string; forestId: string },
  now = Date.now(),
): Promise<CouponRow | null> {
  await ensureCouponSchema(db);
  const existing = () =>
    c.kind === "owner"
      ? db.prepare("SELECT code, kind, amount, expires_at, paid_order FROM forest_coupon WHERE forest_id = ? AND kind = 'owner'").bind(c.forestId).first<CouponRow>()
      : db.prepare("SELECT code, kind, amount, expires_at, paid_order FROM forest_coupon WHERE device = ? AND kind = 'friend'").bind(c.device).first<CouponRow>();
  const had = await existing();
  if (had) return had;
  if (c.kind === "friend" && c.ip) {
    const n = await db.prepare("SELECT COUNT(*) AS n FROM forest_coupon WHERE ip = ? AND kind = 'friend'").bind(c.ip).first<{ n: number }>();
    if (Number(n?.n ?? 0) >= FRIEND_COUPONS_PER_IP) return null;
  }
  for (let i = 0; i < 4; i++) {
    const code = newCouponCode(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
    try {
      const r = await db
        .prepare(
          `INSERT OR IGNORE INTO forest_coupon (code, kind, amount, device, ip, forest_id, created_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(code, c.kind, c.amount, c.device, c.ip, c.forestId, now, now + COUPON_DAYS * 86400_000)
        .run();
      if ((r as { meta?: { changes?: number }; changes?: number })?.meta?.changes ?? (r as { changes?: number })?.changes) break;
    } catch {
      // 코드가 겹치거나(PRIMARY KEY) 같은 순간 두 번 만들었으면(고유 색인) 아래에서 다시 읽습니다.
    }
  }
  return existing();
}

/** 주문 전에 할인권을 확인합니다. 결제가 끝난(쓴) 것·기한 지난 것·없는 코드는 거절. */
export async function checkCoupon(db: D1Database, raw: unknown, now = Date.now()): Promise<{ ok: true; row: CouponRow } | { ok: false; error: string }> {
  const code = normalizeCode(raw);
  if (!isCouponCode(code)) return { ok: false, error: "할인권 번호를 다시 확인해 주세요." };
  await ensureCouponSchema(db);
  const row = await db.prepare("SELECT code, kind, amount, expires_at, paid_order FROM forest_coupon WHERE code = ?").bind(code).first<CouponRow>();
  if (!row) return { ok: false, error: "없는 할인권이에요. 번호를 다시 확인해 주세요." };
  if (row.paid_order) return { ok: false, error: "이미 사용한 할인권이에요." };
  if (Number(row.expires_at) < now) return { ok: false, error: "기한이 지난 할인권이에요." };
  return { ok: true, row };
}

/** 주문에 할인권을 적어 둡니다(아직 「사용」 아님). */
export async function attachCoupon(db: D1Database, code: string, orderNo: string): Promise<void> {
  await db.prepare("UPDATE forest_coupon SET order_no = ? WHERE code = ? AND paid_order = ''").bind(orderNo, code).run();
}

/** 결제 완료 통보 때: 그 주문에 적힌 할인권을 「사용」으로. 이미 다른 주문에서 쓴 것이면 그대로 둡니다. */
export async function markCouponPaid(db: D1Database, orderNo: string, code: string, now = Date.now()): Promise<void> {
  if (!isCouponCode(code)) return;
  await ensureCouponSchema(db);
  await db.prepare("UPDATE forest_coupon SET paid_order = ?, paid_at = ? WHERE code = ? AND paid_order = ''").bind(orderNo, now, code).run();
}

/** 관리자 표 */
export async function couponStats(db: D1Database): Promise<{ owner: number; friend: number; paid: number; discount: number }> {
  await ensureCouponSchema(db);
  const r = await db
    .prepare(
      `SELECT SUM(CASE WHEN kind = 'owner' THEN 1 ELSE 0 END) AS owner,
              SUM(CASE WHEN kind = 'friend' THEN 1 ELSE 0 END) AS friend,
              SUM(CASE WHEN paid_order <> '' THEN 1 ELSE 0 END) AS paid,
              SUM(CASE WHEN paid_order <> '' THEN amount ELSE 0 END) AS discount
       FROM forest_coupon`,
    )
    .first<{ owner: number; friend: number; paid: number; discount: number }>();
  return { owner: Number(r?.owner ?? 0), friend: Number(r?.friend ?? 0), paid: Number(r?.paid ?? 0), discount: Number(r?.discount ?? 0) };
}
