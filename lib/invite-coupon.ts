/**
 * 「친구가 본 내 모리」 + 초대 할인권 (2026-10-08 사용자 결정: "우리의 핵심은 많이 공유, 바이럴" → 초대 할인 + 친구 맞히기).
 *
 * 숲 주인: 친구 INVITE_GOAL 명이 내 링크로 참여(맞히기 또는 심기)하면 리포트 OWNER_COUPON 원 할인권.
 * 참여한 친구: 처음 참여하면 FRIEND_COUPON 원 할인권 — 받은 사람도 누를 이유가 있어야 퍼집니다.
 * 할인권은 서버(worker/coupon.ts)가 발급·대조하고, 결제 금액도 서버가 정합니다. 화면 값은 보여 주기만 합니다.
 * 광고와는 엮지 않습니다 — 광고 시청·클릭을 조건으로 보상하면 애드센스 정책 위반입니다.
 */

export const INVITE_GOAL = 3;
export const OWNER_COUPON = 3000;
export const FRIEND_COUPON = 1000;
export const COUPON_DAYS = 30;
/** 페이앱 최소 결제 금액 */
export const MIN_PRICE = 1000;

export const COUPON_TERMS = [
  "리포트 「모리 마음숲 안내서」 웹 결제에만 쓸 수 있어요",
  `발급일부터 ${COUPON_DAYS}일 동안 쓸 수 있어요`,
  "결제 한 번에 한 장만 쓸 수 있어요",
  "현금으로 바꾸거나 다른 사람에게 줄 수 없어요",
  "결제를 환불하면 쓴 할인권은 돌아오지 않아요",
];

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 헷갈리는 글자(0 O 1 I L) 뺌
export const isCouponCode = (v: unknown): v is string => typeof v === "string" && /^[A-HJKMNP-Z2-9]{10}$/.test(v);
export const normalizeCode = (v: unknown) => (typeof v === "string" ? v.replace(/[\s-]/g, "").toUpperCase() : "");

export function newCouponCode(rand: () => number = Math.random): string {
  return Array.from({ length: 10 }, () => CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)]).join("");
}

/** 할인 뒤 결제 금액. 페이앱 최소 금액 아래로는 내려가지 않습니다. */
export const discounted = (price: number, amount: number) => Math.max(MIN_PRICE, price - Math.max(0, amount));

/** 친구가 고르는 한 마디. 자유 입력은 받지 않습니다 — 익명 악플로 번지지 않게(2026-10-08 기획). */
export const FRIEND_WORDS = ["다정해", "웃겨", "믿음직해", "엉뚱해", "똑똑해", "솔직해", "따뜻해", "열정적이야"] as const;

export type Coupon = { code: string; amount: number; kind: "owner" | "friend"; expiresAt: number; used?: boolean };

/* ---------- 이 기기에 받은 할인권 (서버가 진짜 장부, 여기는 다시 꺼내 보기용) ---------- */

const KEY = "mori-coupons";

export function myCoupons(now = Date.now()): Coupon[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Coupon[];
    return Array.isArray(list) ? list.filter((c) => isCouponCode(c?.code) && !c.used && c.expiresAt > now) : [];
  } catch {
    return [];
  }
}

export function saveCoupon(c: Coupon): void {
  try {
    const all = (JSON.parse(localStorage.getItem(KEY) ?? "[]") as Coupon[]).filter((x) => x?.code !== c.code);
    localStorage.setItem(KEY, JSON.stringify([...all, c].slice(-10)));
  } catch {
    // 저장이 막힌 브라우저 — 화면에 코드를 보여 주므로 손으로 넣을 수 있습니다.
  }
}

/** 가장 큰 할인권 하나 */
export const bestCoupon = (list: Coupon[]) => [...list].sort((a, b) => b.amount - a.amount || a.expiresAt - b.expiresAt)[0];

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const untilText = (ms: number) => {
  const d = new Date(ms + 9 * 3600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일까지`;
};
