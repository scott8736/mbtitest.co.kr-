/**
 * 「우리 숲」 서버 (2026-10-07, 기획안 4절 — 같이 하는 줄기).
 *
 * 내 숲을 만들고(기기당 하나), 친구가 초대 링크(/mori/forest/f/?id=…)로 들어와 자기 모리를 심습니다.
 * 숲은 16칸(유형마다 한 칸). 같은 유형이 또 들어오면 하트만 늘어납니다. 순위·점수 비교 없음.
 *
 *   POST /api/forest/create        { type, nickname?, device }          → { id }
 *   GET  /api/forest/<id>                                               → { id, owner, members }
 *   POST /api/forest/<id>/join     { type, nickname?, via, device }     → { ok, already, members }
 *
 * 저장하지 않는 것: IP 원본, 기기 값 원본(해시만), 닉네임 외 개인정보. 닉네임은 선택이고 8자까지.
 * 표는 요청 때 IF NOT EXISTS 로 만듭니다(worker/schema.ts 와 같은 이유 — 배포가 마이그레이션을 돌리지 않음).
 */

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

export type ForestView = { id: string; owner: { type: string; nickname: string }; members: { type: string; nickname: string; via: string }[] };

/** 숲에 모인 서로 다른 유형(주인 포함) */
export function typesIn(view: ForestView): string[] {
  return [...new Set([view.owner.type, ...view.members.map((m) => m.type)])];
}

/** 카톡·스레드 미리보기 제목: 「달빛의 숲 5/16 · 아직 없는 모리 INTJ·ESFP…」 */
export function forestOgTitle(view: ForestView): { title: string; description: string } {
  const have = typesIn(view);
  const missing = MBTI_CODES.filter((c) => !have.includes(c));
  const name = view.owner.nickname ? `${view.owner.nickname}님의 숲` : `${view.owner.type} 모리의 숲`;
  return {
    title: `${name} ${have.length}/16 🌳`,
    description: missing.length
      ? `아직 없는 모리 ${missing.slice(0, 4).join("·")}${missing.length > 4 ? "…" : ""} — 내 모리를 심어 숲을 채워 줘!`
      : "16모리가 모두 모인 숲이에요. 들어와서 구경해 봐!",
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

let ready: Promise<void> | null = null;
function ensureForestSchema(db: D1Database): Promise<void> {
  if (!ready) {
    ready = db
      .batch(SCHEMA.map((s) => db.prepare(s)))
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        throw e;
      });
  }
  return ready;
}

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
  return { id: f.id, owner: { type: f.owner_type, nickname: f.nickname }, members: rows.results ?? [] };
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
      if (mine) {
        // 기기당 숲 하나. 닉네임·유형만 새로 고칩니다.
        await db.prepare("UPDATE forest SET owner_type = ?, nickname = ? WHERE id = ?").bind(type, cleanNickname(b.nickname), mine.id).run();
        return json({ id: mine.id });
      }
      if (!(await allow(db, request, "create", 20))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      for (let i = 0; i < 4; i++) {
        const id = newForestId(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
        const r = await db
          .prepare("INSERT OR IGNORE INTO forest (id, owner_type, nickname, owner_device, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(id, type, cleanNickname(b.nickname), dev, Date.now())
          .run();
        if (r.meta?.changes) return json({ id });
      }
      return json({ error: "잠시 뒤 다시 시도해 주세요." }, 500);
    }

    const m = path.match(/^\/api\/forest\/([a-z2-9]{8})(\/join)?$/);
    if (!m || !isForestId(m[1])) return json({ error: "없는 숲이에요." }, 404);
    const id = m[1];

    if (!m[2] && request.method === "GET") {
      const view = await loadForest(db, id);
      return view ? json(view) : json({ error: "없는 숲이에요." }, 404);
    }

    if (m[2] && request.method === "POST") {
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
      const r = await db
        .prepare("INSERT OR IGNORE INTO forest_member (forest_id, type, nickname, via, device, joined_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id, type, cleanNickname(b.nickname), via, dev, Date.now())
        .run();
      const after = (await loadForest(db, id)) as ForestView;
      return json({ ok: true, already: !r.meta?.changes, ...after });
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

/** 관리자 「우리 숲」 표: 숲 수 · 들어온 사람 · 한 숲당 평균 · 검사 거쳐 온 비율 */
export async function forestStats(db: D1Database): Promise<{ forests: number; members: number; viaTest: number } | null> {
  try {
    await ensureForestSchema(db);
    const f = await db.prepare("SELECT COUNT(*) AS n FROM forest").first<{ n: number }>();
    const mm = await db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN via = 'test' THEN 1 ELSE 0 END) AS t FROM forest_member").first<{ n: number; t: number }>();
    return { forests: Number(f?.n ?? 0), members: Number(mm?.n ?? 0), viaTest: Number(mm?.t ?? 0) };
  } catch {
    return null;
  }
}
