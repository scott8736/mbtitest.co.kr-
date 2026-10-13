/**
 * 브랜드 테스트 제작·제휴 문의 (/api/partners, 2026-10-13).
 *
 * /partners/ 폼이 보낸 문의를 D1 partner_inquiry 에 남기고 텔레그램으로 알립니다.
 * 같은 IP 는 한 시간에 5번까지만 받습니다(스팸 방지). IP 원본은 남기지 않습니다.
 */
import { sendTelegram } from "./telegram";

type Env = { DB?: D1Database };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

const LIMITS = { company: 60, name: 40, phone: 30, email: 120, product: 200, timing: 60, budget: 40, source: 40, message: 2000 } as const;
type Field = keyof typeof LIMITS;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

async function sha(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const schemaReady = new WeakMap<D1Database, Promise<unknown>>();
function ensureSchema(db: D1Database) {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = db.batch([
      db.prepare(
        "CREATE TABLE IF NOT EXISTS partner_inquiry (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, who TEXT NOT NULL, company TEXT, name TEXT, phone TEXT, email TEXT, product TEXT, timing TEXT, budget TEXT, source TEXT, message TEXT)",
      ),
      db.prepare("CREATE INDEX IF NOT EXISTS partner_inquiry_who_at ON partner_inquiry (who, at)"),
    ]);
    schemaReady.set(db, ready);
  }
  return ready;
}

export function handlePartners(request: Request, url: URL, env: Env, ctx: Ctx): Promise<Response> | null {
  if (url.pathname.replace(/\/+$/, "") !== "/api/partners") return null;
  return (async () => {
    if (request.method !== "POST") return json({ error: "POST 로 보내 주세요." }, 405);
    const db = env?.DB;
    if (!db) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 503);

    let raw: Record<string, unknown>;
    try {
      raw = (await request.json()) as Record<string, unknown>;
    } catch {
      return json({ error: "내용을 다시 확인해 주세요." }, 400);
    }
    // 사람에게는 보이지 않는 칸. 채워져 있으면 봇으로 보고 조용히 받은 척합니다.
    if (clean(raw.website, 200)) return json({ ok: true });

    const f = Object.fromEntries((Object.keys(LIMITS) as Field[]).map((k) => [k, clean(raw[k], LIMITS[k])])) as Record<Field, string>;
    if (!f.company || !f.name) return json({ error: "회사명과 담당자 이름을 적어 주세요." }, 400);
    if (!f.email && !f.phone) return json({ error: "이메일이나 연락처 중 하나는 적어 주세요." }, 400);
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return json({ error: "이메일 주소를 다시 확인해 주세요." }, 400);
    if (raw.agree !== true) return json({ error: "개인정보 수집·이용에 동의해 주세요." }, 400);

    await ensureSchema(db);
    const who = await sha(`partners:${request.headers.get("cf-connecting-ip") ?? ""}`);
    const now = Date.now();
    const row = await db.prepare("SELECT COUNT(*) AS n FROM partner_inquiry WHERE who = ? AND at > ?").bind(who, now - 3600_000).first<{ n: number }>();
    if (Number(row?.n ?? 0) >= 5) return json({ error: "잠시 뒤 다시 보내 주세요." }, 429);

    await db
      .prepare("INSERT INTO partner_inquiry (at, who, company, name, phone, email, product, timing, budget, source, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(now, who, f.company, f.name, f.phone, f.email, f.product, f.timing, f.budget, f.source, f.message)
      .run();

    const text = [
      "🧩 MBTI테스트 · 제휴 문의 · 브랜드 테스트",
      `${f.company} / ${f.name}`,
      f.phone && `연락처 ${f.phone}`,
      f.email && `이메일 ${f.email}`,
      f.product && `홍보 대상 ${f.product}`,
      f.timing && `희망 시기 ${f.timing}`,
      f.budget && `예산 ${f.budget}`,
      f.source && `알게 된 경로 ${f.source}`,
      f.message && `\n${f.message}`,
    ]
      .filter(Boolean)
      .join("\n");
    ctx.waitUntil(sendTelegram(db, text));
    return json({ ok: true });
  })();
}
