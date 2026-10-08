/**
 * 「우리 숲」 서버 (2026-10-07, 기획안 4절 — 같이 하는 줄기).
 *
 * 내 숲을 만들고(기기당 하나), 친구가 초대 링크(/mori/forest/f/?id=…)로 들어와 자기 모리를 심습니다.
 * 숲은 16칸(유형마다 한 칸). 같은 유형이 또 들어오면 하트만 늘어납니다. 순위·점수 비교 없음.
 *
 *   POST /api/forest/create        { type, nickname?, device }          → { id }
 *   GET  /api/forest/<id>                                               → { id, owner, members }
 *   POST /api/forest/<id>/join     { type, nickname?, via, device }     → { ok, already, members, friendCoupon? }
 *   POST /api/forest/<id>/guess    { guess, word, device }              → { ok, answer, right, ...view, friendCoupon? }
 *   POST /api/forest/<id>/mine     { device }  (주인만)                  → { friends, goal, coupon? }
 *   GET  /api/forest/coupon?c=코드                                      → { amount, expiresAt } (리포트 주문 화면 확인용)
 *
 * 「친구가 본 내 모리」(2026-10-08): 친구는 심기 전에 「이 친구는 어떤 모리 같아?」를 고르고(guess) 정해진 한 마디(word)를 남깁니다.
 * 초대 할인권(lib/invite-coupon.ts): 친구 INVITE_GOAL 명이 참여하면 주인에게, 처음 참여한 친구에게 하나씩.
 * 참여 인원은 기기 해시로 세고, 한 연결(IP 해시)에서는 2명까지만, 주인과 같은 연결은 빼고 셉니다(셀프 초대 방지).
 *
 * 저장하지 않는 것: IP 원본, 기기 값 원본(해시만), 닉네임 외 개인정보. 닉네임은 선택이고 8자까지.
 * 표는 요청 때 IF NOT EXISTS 로 만듭니다(worker/schema.ts 와 같은 이유 — 배포가 마이그레이션을 돌리지 않음).
 */

import { FRIEND_COUPON, FRIEND_WORDS, INVITE_GOAL, OWNER_COUPON } from "../lib/invite-coupon";
import { checkCoupon, couponOut, couponStats, issueCoupon, type CouponOut } from "./coupon";

export const MBTI_CODES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
const ID_CHARS = "abcdefghjkmnpqrstuvwxyz23456789"; // 헷갈리는 글자(0 o 1 l i) 뺌
export const MEMBER_CAP = 300; // 한 숲에 들어올 수 있는 최대 인원(장난 방지)

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS forest (
     id text PRIMARY KEY NOT NULL,
     owner_type text NOT NULL,
     nickname text DEFAULT '' NOT NULL,
     owner_device text NOT NULL,
     created_at integer NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS forest_owner_idx ON forest (owner_device)`,
  `CREATE TABLE IF NOT EXISTS forest_member (
     forest_id text NOT NULL,
     type text NOT NULL,
     nickname text DEFAULT '' NOT NULL,
     via text DEFAULT 'known' NOT NULL,
     device text NOT NULL,
     joined_at integer NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS forest_member_once_idx ON forest_member (forest_id, device)`,
  `CREATE TABLE IF NOT EXISTS forest_attempts (
     who text NOT NULL,
     kind text NOT NULL,
     at integer NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS forest_attempts_idx ON forest_attempts (who, kind, at)`,
  `CREATE TABLE IF NOT EXISTS forest_guess (
     forest_id text NOT NULL,
     device text NOT NULL,
     guess text NOT NULL,
     word integer DEFAULT -1 NOT NULL,
     ip text DEFAULT '' NOT NULL,
     at integer NOT NULL
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS forest_guess_once_idx ON forest_guess (forest_id, device)`,
];
/** 처음 만든 표에 나중에 붙인 열(2026-10-08). 이미 있으면 오류를 그냥 넘깁니다. */
const ADD_COLUMNS = [
  "ALTER TABLE forest ADD COLUMN owner_ip text DEFAULT '' NOT NULL",
  "ALTER TABLE forest_member ADD COLUMN ip text DEFAULT '' NOT NULL",
];

/* ---------- 순수 함수(테스트가 직접 봄) ---------- */

export const isForestId = (id: string) => /^[a-z2-9]{8}$/.test(id);

export function newForestId(rand: () => number = Math.random): string {
  return Array.from({ length: 8 }, () => ID_CHARS[Math.floor(rand() * ID_CHARS.length)]).join("");
}

/** 닉네임: 앞뒤 공백·제어문자·꺾쇠 제거, 8자까지. 비우면 "" */
export function cleanNickname(v: unknown): string {
  if (typeof v !== "string") return "";
  return [...v.replace(/[\u0000-\u001f\u007f<>&"'`]/g, "").trim()].slice(0, 8).join("");
}

export const cleanType = (v: unknown) => (typeof v === "string" && MBTI_CODES.includes(v.toUpperCase()) ? v.toUpperCase() : null);
export const cleanDevice = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{12,64}$/.test(v) ? v : null);

export type ForestView = {
  id: string;
  owner: { type: string; nickname: string };
  members: { type: string; nickname: string; via: string }[];
  /** 친구들이 고른 「이 친구는 어떤 모리 같아?」 */
  guesses: { guess: string; word: number }[];
};

/**
 * 할인권 목표에 세는 친구 수. 같은 기기는 한 번, 주인 기기·주인과 같은 연결은 빼고, 한 연결에서는 2명까지.
 * (같은 와이파이 친구 둘은 셉니다. 셋째부터는 같은 사람이 기기 값을 지우고 다시 들어온 것으로 봅니다.)
 */
export function countFriends(rows: { device: string; ip: string }[], owner: { device: string; ip: string }): number {
  const seen = new Set<string>();
  const perIp = new Map<string, number>();
  for (const r of rows) {
    if (!r.device || r.device === owner.device || seen.has(r.device)) continue;
    if (r.ip && owner.ip && r.ip === owner.ip) continue;
    if (r.ip) {
      const n = perIp.get(r.ip) ?? 0;
      if (n >= 2) continue;
      perIp.set(r.ip, n + 1);
    }
    seen.add(r.device);
  }
  return seen.size;
}

export const cleanWord = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < FRIEND_WORDS.length ? (v as number) : -1);

/** 숲에 모인 서로 다른 유형(주인 포함) */
export function typesIn(view: ForestView): string[] {
  return [...new Set([view.owner.type, ...view.members.map((m) => m.type)])];
}

/**
 * 카톡·스레드 미리보기 제목(2026-10-08 「친구가 본 내 모리」): 「달빛님은 어떤 모리 같아? 맞혀 줘 🤔」.
 * 주인 유형은 미리보기에 쓰지 않습니다 — 맞히기 전에 답이 보이면 누를 이유가 없습니다.
 */
export function forestOgTitle(view: ForestView): { title: string; description: string } {
  const who = view.owner.nickname ? `${view.owner.nickname}님은` : "내 친구는";
  const n = Math.max(view.guesses.length, view.members.length);
  return {
    title: `${who} 어떤 모리 같아? 맞혀 줘 🤔`,
    description: n
      ? `친구 ${n}명이 벌써 맞혀 봤어요. 16모리 중 하나를 골라 보고, 내 모리도 숲에 심어 줘!`
      : "16모리 중 하나를 골라 맞혀 보고, 내 모리도 숲에 심어 줘!",
  };
}

/* ---------- 요청 처리 ---------- */

type Env = { DB?: D1Database };
type Ctx = { waitUntil(p: Promise<unknown>): void };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

/** 데이터베이스마다 한 번만 표를 확인합니다(시험용 D1 을 여러 개 쓰는 테스트에서도 맞게 — report.ts 와 같은 방식). */
const schemaReady = new WeakMap<object, Promise<void>>();
function ensureForestSchema(db: D1Database): Promise<void> {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = db
      .batch(SCHEMA.map((s) => db.prepare(s)))
      .then(() => Promise.all(ADD_COLUMNS.map((sql) => db.prepare(sql).run().catch(() => undefined))))
      .then(() => undefined)
      .catch((e) => {
        schemaReady.delete(db);
        throw e;
      });
    schemaReady.set(db, ready);
  }
  return ready;
}

/** 셀프 초대·할인권 중복을 가리는 연결 값. IP 원본은 남기지 않고 되돌릴 수 없는 해시만. */
const ipHash = (request: Request) => sha(`forest-ip:${request.headers.get("cf-connecting-ip") ?? ""}`);

async function sha(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** 한 시간에 같은 IP 가 limit 번 넘게 만들기·들어가기를 하면 막습니다 */
async function allow(db: D1Database, request: Request, kind: string, limit: number): Promise<boolean> {
  const who = await sha(`forest:${request.headers.get("cf-connecting-ip") ?? ""}`);
  const since = Date.now() - 3600_000;
  const row = await db.prepare("SELECT COUNT(*) AS n FROM forest_attempts WHERE who = ? AND kind = ? AND at > ?").bind(who, kind, since).first<{ n: number }>();
  if (Number(row?.n ?? 0) >= limit) return false;
  await db.prepare("INSERT INTO forest_attempts (who, kind, at) VALUES (?, ?, ?)").bind(who, kind, Date.now()).run();
  if (Math.random() < 0.02) await db.prepare("DELETE FROM forest_attempts WHERE at < ?").bind(since).run();
  return true;
}

export async function loadForest(db: D1Database, id: string): Promise<ForestView | null> {
  const f = await db.prepare("SELECT id, owner_type, nickname FROM forest WHERE id = ?").bind(id).first<{ id: string; owner_type: string; nickname: string }>();
  if (!f) return null;
  const rows = await db
    .prepare("SELECT type, nickname, via FROM forest_member WHERE forest_id = ? ORDER BY joined_at LIMIT ?")
    .bind(id, MEMBER_CAP)
    .all<{ type: string; nickname: string; via: string }>();
  const guesses = await db
    .prepare("SELECT guess, word FROM forest_guess WHERE forest_id = ? ORDER BY at LIMIT ?")
    .bind(id, MEMBER_CAP)
    .all<{ guess: string; word: number }>();
  return {
    id: f.id,
    owner: { type: f.owner_type, nickname: f.nickname },
    members: rows.results ?? [],
    guesses: (guesses.results ?? []).map((g) => ({ guess: g.guess, word: Number(g.word) })),
  };
}

/** 주인 할인권 목표에 세는 친구 수(맞히기 또는 심기) */
async function friendsOf(db: D1Database, id: string, owner: { device: string; ip: string }): Promise<number> {
  const rows = await db
    .prepare("SELECT device, ip FROM forest_guess WHERE forest_id = ? UNION SELECT device, ip FROM forest_member WHERE forest_id = ?")
    .bind(id, id)
    .all<{ device: string; ip: string }>();
  return countFriends(rows.results ?? [], owner);
}

/** 처음 참여한 친구 할인권. 실패해도 참여는 그대로 됩니다. */
async function friendCoupon(db: D1Database, dev: string, ip: string, forestId: string): Promise<CouponOut | undefined> {
  try {
    const row = await issueCoupon(db, { kind: "friend", amount: FRIEND_COUPON, device: dev, ip, forestId });
    return row ? couponOut(row) : undefined;
  } catch {
    return undefined;
  }
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const v = await request.json();
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function handleForest(request: Request, url: URL, env: Env, _ctx: Ctx): Promise<Response> | null {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/forest")) return null;
  return (async () => {
    const db = env?.DB;
    if (!db) return json({ error: "준비 중이에요." }, 503);
    await ensureForestSchema(db);

    if (path === "/api/forest/create" && request.method === "POST") {
      const b = await body(request);
      const type = cleanType(b.type);
      const device = cleanDevice(b.device);
      if (!type || !device) return json({ error: "유형을 다시 골라 주세요." }, 400);
      const dev = await sha(`forest-dev:${device}`);
      const mine = await db.prepare("SELECT id FROM forest WHERE owner_device = ?").bind(dev).first<{ id: string }>();
      const ip = await ipHash(request);
      if (mine) {
        // 기기당 숲 하나. 닉네임·유형만 새로 고칩니다(닉네임을 비워 보내면 있던 것을 둡니다).
        const nick = cleanNickname(b.nickname);
        await db
          .prepare("UPDATE forest SET owner_type = ?, nickname = CASE WHEN ? = '' THEN nickname ELSE ? END, owner_ip = CASE WHEN owner_ip = '' THEN ? ELSE owner_ip END WHERE id = ?")
          .bind(type, nick, nick, ip, mine.id)
          .run();
        return json({ id: mine.id });
      }
      if (!(await allow(db, request, "create", 20))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      for (let i = 0; i < 4; i++) {
        const id = newForestId(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
        const r = await db
          .prepare("INSERT OR IGNORE INTO forest (id, owner_type, nickname, owner_device, owner_ip, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(id, type, cleanNickname(b.nickname), dev, ip, Date.now())
          .run();
        if (r.meta?.changes) return json({ id });
      }
      return json({ error: "잠시 뒤 다시 시도해 주세요." }, 500);
    }

    // 리포트 주문 화면이 할인권 번호를 확인합니다(금액을 정하는 건 주문 서버 — 여기는 보여 주기용).
    if (path === "/api/forest/coupon" && request.method === "GET") {
      if (!(await allow(db, request, "coupon", 40))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      const c = await checkCoupon(db, url.searchParams.get("c"));
      return c.ok ? json({ code: c.row.code, amount: Number(c.row.amount), expiresAt: Number(c.row.expires_at) }) : json({ error: c.error }, 404);
    }

    const m = path.match(/^\/api\/forest\/([a-z2-9]{8})(\/join|\/guess|\/mine)?$/);
    if (!m || !isForestId(m[1])) return json({ error: "없는 숲이에요." }, 404);
    const id = m[1];

    if (!m[2] && request.method === "GET") {
      const view = await loadForest(db, id);
      return view ? json(view) : json({ error: "없는 숲이에요." }, 404);
    }

    if (m[2] === "/mine" && request.method === "POST") {
      const b = await body(request);
      const device = cleanDevice(b.device);
      if (!device) return json({ error: "잘못된 요청이에요." }, 400);
      const dev = await sha(`forest-dev:${device}`);
      const f = await db.prepare("SELECT owner_ip FROM forest WHERE id = ? AND owner_device = ?").bind(id, dev).first<{ owner_ip: string }>();
      if (!f) return json({ error: "내 숲이 아니에요." }, 403);
      const friends = await friendsOf(db, id, { device: dev, ip: f.owner_ip });
      let coupon: CouponOut | undefined;
      if (friends >= INVITE_GOAL) {
        const row = await issueCoupon(db, { kind: "owner", amount: OWNER_COUPON, device: dev, ip: f.owner_ip, forestId: id });
        if (row) coupon = couponOut(row);
      }
      return json({ friends, goal: INVITE_GOAL, coupon });
    }

    if (m[2] === "/guess" && request.method === "POST") {
      const b = await body(request);
      const guess = cleanType(b.guess);
      const device = cleanDevice(b.device);
      if (!guess || !device) return json({ error: "모리를 다시 골라 주세요." }, 400);
      const view = await loadForest(db, id);
      if (!view) return json({ error: "없는 숲이에요." }, 404);
      const dev = await sha(`forest-dev:${device}`);
      const owner = await db.prepare("SELECT 1 AS x FROM forest WHERE id = ? AND owner_device = ?").bind(id, dev).first();
      if (owner) return json({ ok: false, own: true, ...view });
      if (view.guesses.length >= MEMBER_CAP) return json({ ok: false, full: true, guess, answer: view.owner.type, right: guess === view.owner.type, ...view });
      if (!(await allow(db, request, "join", 60))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      const ip = await ipHash(request);
      const r = await db
        .prepare("INSERT OR IGNORE INTO forest_guess (forest_id, device, guess, word, ip, at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, dev, guess, cleanWord(b.word), ip, Date.now())
        .run();
      const after = (await loadForest(db, id)) as ForestView;
      // 이미 맞혀 본 기기면 처음 고른 답으로 채점합니다(답을 바꿔 가며 맞히기 방지).
      const first = await db.prepare("SELECT guess FROM forest_guess WHERE forest_id = ? AND device = ?").bind(id, dev).first<{ guess: string }>();
      const mine = first?.guess ?? guess;
      return json({ ok: true, already: !r.meta?.changes, guess: mine, answer: view.owner.type, right: mine === view.owner.type, friendCoupon: await friendCoupon(db, dev, ip, id), ...after });
    }

    if (m[2] === "/join" && request.method === "POST") {
      const b = await body(request);
      const type = cleanType(b.type);
      const device = cleanDevice(b.device);
      if (!type || !device) return json({ error: "유형을 다시 골라 주세요." }, 400);
      const view = await loadForest(db, id);
      if (!view) return json({ error: "없는 숲이에요." }, 404);
      const dev = await sha(`forest-dev:${device}`);
      const owner = await db.prepare("SELECT 1 AS x FROM forest WHERE id = ? AND owner_device = ?").bind(id, dev).first();
      if (owner) return json({ ok: false, own: true, ...view });
      if (view.members.length >= MEMBER_CAP) return json({ ok: false, full: true, ...view });
      if (!(await allow(db, request, "join", 60))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      const via = b.via === "test" ? "test" : "known";
      const ip = await ipHash(request);
      const r = await db
        .prepare("INSERT OR IGNORE INTO forest_member (forest_id, type, nickname, via, device, ip, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, type, cleanNickname(b.nickname), via, dev, ip, Date.now())
        .run();
      const after = (await loadForest(db, id)) as ForestView;
      return json({ ok: true, already: !r.meta?.changes, friendCoupon: await friendCoupon(db, dev, ip, id), ...after });
    }

    return json({ error: "잘못된 요청이에요." }, 405);
  })().catch(() => json({ error: "잠시 뒤 다시 시도해 주세요." }, 500));
}

/**
 * 초대 페이지(/mori/forest/f/?id=…) HTML 의 제목·미리보기 문구를 그 숲 것으로 바꿉니다.
 * 정적 페이지 한 장을 모든 숲이 같이 쓰므로, 카톡·스레드 미리보기가 숲마다 달라지게 하려고 워커에서 고칩니다.
 */
export function rewriteInviteHtml(html: string, og: { title: string; description: string }): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const t = esc(og.title);
  const d = esc(og.description);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta[^>]+property="og:title"[^>]+content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta[^>]+name="twitter:title"[^>]+content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta[^>]+property="og:description"[^>]+content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta[^>]+name="twitter:description"[^>]+content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta[^>]+name="description"[^>]+content=")[^"]*(")/, `$1${d}$2`);
}

/**
 * 관리자 「우리 숲 · 친구가 본 내 모리」 표 (2026-10-08 바이럴 측정).
 *   participants  친구 참여(맞히기·심기, 기기 기준 중복 없이)
 *   madeOwn       참여한 친구 중 자기 숲을 만든 사람 — 받은 사람이 다시 보내는 비율
 *   바이럴 계수 ≈ (참여 ÷ 숲) × (madeOwn ÷ 참여). 1을 넘으면 저절로 퍼집니다.
 */
export type ForestStats = {
  forests: number;
  members: number;
  viaTest: number;
  guesses: number;
  guessRight: number;
  participants: number;
  forestsWithFriend: number;
  forestsAtGoal: number;
  madeOwn: number;
  coupons: { owner: number; friend: number; paid: number; discount: number };
};

export async function forestStats(db: D1Database): Promise<ForestStats | null> {
  try {
    await ensureForestSchema(db);
    const one = async (sql: string) => (await db.prepare(sql).first<Record<string, number>>()) ?? {};
    const f = await one("SELECT COUNT(*) AS n FROM forest");
    const mm = await one("SELECT COUNT(*) AS n, SUM(CASE WHEN via = 'test' THEN 1 ELSE 0 END) AS t FROM forest_member");
    const g = await one("SELECT COUNT(*) AS n, SUM(CASE WHEN g.guess = f.owner_type THEN 1 ELSE 0 END) AS r FROM forest_guess g JOIN forest f ON f.id = g.forest_id");
    const p = await one(
      `SELECT COUNT(DISTINCT device) AS n, COUNT(DISTINCT forest_id) AS forests,
              COUNT(DISTINCT CASE WHEN device IN (SELECT owner_device FROM forest) THEN device END) AS made
       FROM (SELECT forest_id, device FROM forest_guess UNION SELECT forest_id, device FROM forest_member)`,
    );
    const coupons = await couponStats(db);
    return {
      forests: Number(f.n ?? 0),
      members: Number(mm.n ?? 0),
      viaTest: Number(mm.t ?? 0),
      guesses: Number(g.n ?? 0),
      guessRight: Number(g.r ?? 0),
      participants: Number(p.n ?? 0),
      forestsWithFriend: Number(p.forests ?? 0),
      forestsAtGoal: coupons.owner,
      madeOwn: Number(p.made ?? 0),
      coupons,
    };
  } catch {
    return null;
  }
}
