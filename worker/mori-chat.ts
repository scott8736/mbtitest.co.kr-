/**
 * 「모리 AI 대화」 서버 (2026-10-08 초안). 규칙·숫자는 lib/mori-chat.ts.
 *
 *   GET  /api/mori-chat/quota    ?d=기기&r=리포트열쇠,…&p=대화권열쇠,…  → 오늘 남은 횟수
 *   POST /api/mori-chat/send     { device, mori, me?, history, message, reports?, passes? } → 모리 답
 *   POST /api/mori-chat/order    { phone, agree, consentVersion } → 대화권 결제창 주소(페이앱)
 *   POST /api/mori-chat/payapp   페이앱 결과 통보(feedbackurl). 검증 후 "SUCCESS"
 *   GET  /api/mori-chat/pass     ?p=열쇠 → 대화권 결제 상태·남은 횟수 (결제 직후 화면이 기다릴 때)
 *   POST /api/mori-chat/find     { phone } → 이 번호로 산 대화권 열쇠 (다른 기기·지운 뒤 다시 찾기)
 *
 * 횟수 쓰는 순서: 하루 무료 → 리포트 구매자 하루 몫 → 대화권. 결제한 사람(리포트·대화권)은 처음부터 유료 키로 답한다
 * (무료 키 429 로 돈 낸 사람이 「잠시 후」를 보지 않게). 실제 제미나이 호출은 mori-chat-api 워커(미국 고정)가 한다.
 *
 * 보안 원칙은 리포트 결제(worker/report.ts)와 같다: 금액은 서버가 정하고, 통보는 키·금액·결제요청번호가 다 맞아야 반영,
 * 상태는 한 방향으로만. 대화 내용은 저장하지 않는다 — 글자 수·쓴 횟수·모델만 남긴다.
 */
import {
  CHAT_CONSENT_VERSION,
  CHAT_FREE_PER_DAY,
  CHAT_FREE_PER_IP,
  CHAT_MAX_CHARS,
  CHAT_PASS_NAME,
  CHAT_PASS_PRICE,
  CHAT_PASS_SIZE,
  CHAT_REPORT_DAYS,
  CHAT_REPORT_PER_DAY,
  CRISIS_REPLY,
  SAFETY_REPLY,
  asksForRec,
  cleanHistory,
  isDistress,
  isCrisis,
  isMoriCode,
  systemPrompt,
  type ChatQuota,
} from "../lib/mori-chat";
import { PAYAPP_USERID, REPORT_PAY_TYPES, isSellerInfoComplete } from "../lib/report-config";
import { recListForPrompt, takeRec } from "../lib/mori-chat-recs";
import { kmaBase, kmaGrid, sceneAt, sceneHello, sceneLine, weatherFromNcst, type Scene } from "../lib/mori-chat-scene";
import { SITE_ORIGIN } from "../lib/site-urls";
import { readSetting } from "./naver";
import { sendTelegram } from "./telegram";
import { allowAttempt, constantEquals, ensureReportSchema, logEvent, newToken, payappKeys, payappPost, phoneHash, seoulToday } from "./report";

type Env = { DB?: D1Database };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

export const CHAT_SCHEMA = [
  // 쓴 횟수. 대화 내용은 남기지 않는다. kind: free · report · pass · crisis(안내문, 횟수 안 깎음) · wall(횟수가 없어 막힘)
  `CREATE TABLE IF NOT EXISTS mori_chat_usage (
     id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     day text NOT NULL,
     device text NOT NULL,
     ip text NOT NULL,
     kind text NOT NULL,
     ref text DEFAULT '' NOT NULL,
     mori text DEFAULT '' NOT NULL,
     model text DEFAULT '' NOT NULL,
     tier text DEFAULT '' NOT NULL,
     chars integer DEFAULT 0 NOT NULL,
     turn integer DEFAULT 0 NOT NULL,
     created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS mori_chat_usage_day_idx ON mori_chat_usage (day, device)`,
  `CREATE INDEX IF NOT EXISTS mori_chat_usage_ip_idx ON mori_chat_usage (day, ip)`,
  `CREATE INDEX IF NOT EXISTS mori_chat_usage_ref_idx ON mori_chat_usage (day, ref)`,
  `CREATE TABLE IF NOT EXISTS mori_chat_passes (
     token text PRIMARY KEY NOT NULL,
     order_no text NOT NULL UNIQUE,
     size integer NOT NULL,
     used integer DEFAULT 0 NOT NULL,
     price integer NOT NULL,
     test integer DEFAULT 0 NOT NULL,
     phone_last4 text NOT NULL,
     phone_hash text NOT NULL,
     status text DEFAULT 'pending' NOT NULL,
     mul_no text DEFAULT '' NOT NULL,
     payurl text DEFAULT '' NOT NULL,
     pay_type text DEFAULT '' NOT NULL,
     paid_at text DEFAULT '' NOT NULL,
     consent_version text NOT NULL,
     consent_at text NOT NULL,
     created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
     updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS mori_chat_passes_phone_idx ON mori_chat_passes (phone_hash)`,
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

const schemaReady = new WeakMap<object, Promise<void>>();
export function ensureChatSchema(db: D1Database): Promise<void> {
  let ready = schemaReady.get(db);
  if (!ready) {
    ready = ensureReportSchema(db)
      .then(() => db.batch(CHAT_SCHEMA.map((sql) => db.prepare(sql))))
      .then(() => undefined)
      .catch((error) => {
        schemaReady.delete(db);
        throw error;
      });
    schemaReady.set(db, ready);
  }
  return ready;
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/**
 * IPv6 는 앞 64비트(/64)만 씁니다. 한 회선이 /64 대역 안에서 주소를 마음대로 바꿀 수 있어,
 * 주소 전체로 세면 IP 상한이 풀립니다(2026-10-08 점검 5번).
 */
export function ipKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const a = head ? head.split(":") : [];
  const b = tail ? tail.split(":") : [];
  const full = ip.includes("::") ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b] : a;
  return `${full.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** 하루 단위 IP 해시. 날짜가 섞여 있어 다음 날과 이어붙일 수 없다. */
async function ipHash(request: Request, day: string): Promise<string> {
  const ip = ipKey(request.headers.get("cf-connecting-ip") ?? "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`mori-chat:${ip}:${day}`));
  return hex(new Uint8Array(digest)).slice(0, 32);
}

const USAGE_KEEP_DAYS = 90;
/** 화면이 보내는 기록 종류(횟수에 안 들어감). promo_* 의 ref 에는 카드 종류(report)나 테스트 slug. */
export const CHAT_EVENT_KINDS = ["promo_seen", "promo_click", "resume_seen", "resume_click", "chip_click"];
const DEVICE_RE = /^[a-z0-9-]{16,64}$/;
const TOKEN_RE = /^[0-9a-f]{64}$/;
const tokenList = (raw: unknown, max: number): string[] =>
  (Array.isArray(raw) ? raw : String(raw ?? "").split(","))
    .map((t) => String(t).trim())
    .filter((t) => TOKEN_RE.test(t))
    .slice(0, max);

export type RelayConfig = { url: string; secret: string };
export async function relayConfig(db: D1Database): Promise<RelayConfig> {
  return { url: await readSetting(db, "mori_chat_relay_url"), secret: await readSetting(db, "mori_chat_relay_secret") };
}

// ── 지금 숲의 풍경(시간대·특별한 날·날씨) ──

/** 격자마다 30분 동안 날씨를 기억합니다(아이솔레이트 안). 기상청을 매 요청 부르지 않게. */
const weatherCache = new Map<string, { at: number; weather: Scene["weather"] }>();
const WEATHER_TTL = 30 * 60_000;

/**
 * 손님 대략 위치(Cloudflare 가 주는 위경도, 없으면 서울) → 기상청 초단기실황. 키(kma_service_key)가 없거나
 * 실패하면 날씨 없이 시간대·특별한 날만 씁니다 — 날씨 때문에 대화가 느려지거나 멈추면 안 됩니다(4초 제한).
 */
export async function currentScene(db: D1Database, request: Request, now: number = Date.now(), fetcher: typeof fetch = fetch): Promise<Scene> {
  const at = new Date(now);
  let weather: Scene["weather"] = null;
  try {
    const key = await readSetting(db, "kma_service_key");
    if (key) {
      const cf = (request as Request & { cf?: { latitude?: string; longitude?: string; country?: string } }).cf;
      const inKorea = !cf?.country || cf.country === "KR";
      const lat = inKorea && cf?.latitude ? Number(cf.latitude) : 37.5665;
      const lon = inKorea && cf?.longitude ? Number(cf.longitude) : 126.978;
      const { nx, ny } = kmaGrid(lat, lon);
      const cacheKey = `${nx},${ny}`;
      const hit = weatherCache.get(cacheKey);
      if (hit && now - hit.at < WEATHER_TTL) {
        weather = hit.weather;
      } else {
        const base = kmaBase(at);
        // 공공데이터 키는 이미 인코딩된 값이라 그대로 붙입니다(다시 인코딩하면 「등록되지 않은 키」).
        const res = await fetcher(
          `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${key}&pageNo=1&numOfRows=20&dataType=JSON&base_date=${base.date}&base_time=${base.time}&nx=${nx}&ny=${ny}`,
          { signal: AbortSignal.timeout(4000) },
        );
        const j = (await res.json()) as { response?: { body?: { items?: { item?: { category: string; obsrValue: string }[] } } } };
        weather = weatherFromNcst(j.response?.body?.items?.item ?? []);
        weatherCache.set(cacheKey, { at: now, weather });
      }
    }
  } catch {
    weather = null;
  }
  return sceneAt(at, weather);
}

/** 대화가 열려 있는가: 관리자 스위치 + 중계 주소·키. */
export async function chatOpen(db: D1Database): Promise<boolean> {
  const relay = await relayConfig(db);
  return (await readSetting(db, "mori_chat_open")) === "1" && Boolean(relay.url && relay.secret);
}

/** 대화권 판매가 열려 있는가: 대화 열림 + 페이앱 키 + 판매자 표시 정보. */
export async function passSalesOpen(db: D1Database): Promise<boolean> {
  const keys = await payappKeys(db);
  return (await chatOpen(db)) && Boolean(keys.linkkey && keys.linkval) && isSellerInfoComplete();
}

/**
 * 페이앱 결제 시각(pay_date)은 「2026-10-08 12:34:56」 한국 시각, 관리자 무료 주문은 ISO(UTC).
 * 시간대 표시가 없으면 한국 시각으로 읽는다.
 */
export function parsePaidAt(value: string): number {
  if (!value) return NaN;
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(value)) return Date.parse(value);
  return Date.parse(`${value.replace(" ", "T")}+09:00`);
}

type Entitlement = {
  quota: ChatQuota;
  reportRef: string;
  passTokens: string[];
};

/** 오늘 남은 횟수를 계산한다. 브라우저가 보낸 열쇠는 서버가 하나씩 다시 확인한다. */
export async function computeQuota(
  db: D1Database,
  input: { device: string; ip: string; day: string; reports: string[]; passes: string[] },
  now: number = Date.now(),
): Promise<Entitlement> {
  const { device, ip, day } = input;
  const devFree = await db
    .prepare("SELECT COUNT(*) AS n FROM mori_chat_usage WHERE day = ? AND device = ? AND kind = 'free'")
    .bind(day, device)
    .first<{ n: number }>();
  const ipFree = await db
    .prepare("SELECT COUNT(*) AS n FROM mori_chat_usage WHERE day = ? AND ip = ? AND kind = 'free'")
    .bind(day, ip)
    .first<{ n: number }>();
  const free = Math.max(0, Math.min(CHAT_FREE_PER_DAY - Number(devFree?.n ?? 0), CHAT_FREE_PER_IP - Number(ipFree?.n ?? 0)));

  // 리포트 구매자: 결제일부터 7일(CHAT_REPORT_DAYS) 동안 하루 50번. 여러 권이면 가장 최근 것.
  let report = 0;
  let reportUntil = "";
  let reportRef = "";
  if (input.reports.length) {
    const marks = input.reports.map(() => "?").join(",");
    const rows = (await db
      .prepare(`SELECT order_no, paid_at FROM report_orders WHERE token IN (${marks}) AND status IN ('paid','partial')`)
      .bind(...input.reports)
      .all<{ order_no: string; paid_at: string }>()).results ?? [];
    const best = rows
      .map((r) => ({ ref: r.order_no, until: parsePaidAt(r.paid_at) + CHAT_REPORT_DAYS * 86400_000 }))
      .filter((r) => Number.isFinite(r.until) && r.until > now)
      .sort((a, b) => b.until - a.until)[0];
    if (best) {
      const used = await db
        .prepare("SELECT COUNT(*) AS n FROM mori_chat_usage WHERE day = ? AND kind = 'report' AND ref = ?")
        .bind(day, best.ref)
        .first<{ n: number }>();
      report = Math.max(0, CHAT_REPORT_PER_DAY - Number(used?.n ?? 0));
      // 끝나는 시각은 결제 시각이라 날짜만 보여 주면 그날 대화 중에 갑자기 막힌다 — 「10월 15일 14시」까지(점검 13번).
      const u = new Date(best.until + 9 * 3600_000);
      reportUntil = `${u.getUTCMonth() + 1}월 ${u.getUTCDate()}일 ${u.getUTCHours()}시`;
      reportRef = best.ref;
    }
  }

  // 대화권: 결제 완료된 것만, 오래된 것부터 쓴다.
  let pass = 0;
  let passTokens: string[] = [];
  if (input.passes.length) {
    const marks = input.passes.map(() => "?").join(",");
    const rows = (await db
      .prepare(`SELECT token, size, used FROM mori_chat_passes WHERE token IN (${marks}) AND status = 'paid' AND used < size ORDER BY created_at`)
      .bind(...input.passes)
      .all<{ token: string; size: number; used: number }>()).results ?? [];
    pass = rows.reduce((a, r) => a + (r.size - r.used), 0);
    passTokens = rows.map((r) => r.token);
  }

  const open = await chatOpen(db);
  return { quota: { open, free, report, reportUntil, pass, total: free + report + pass }, reportRef, passTokens };
}

async function recordUsage(
  db: D1Database,
  row: { day: string; device: string; ip: string; kind: string; ref?: string; mori?: string; model?: string; tier?: string; chars?: number; turn?: number },
): Promise<number> {
  const res = (await db
    .prepare("INSERT INTO mori_chat_usage (day, device, ip, kind, ref, mori, model, tier, chars, turn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(row.day, row.device, row.ip, row.kind, row.ref ?? "", row.mori ?? "", row.model ?? "", row.tier ?? "", row.chars ?? 0, row.turn ?? 0)
    .run()) as { meta?: { last_row_id?: number }; lastInsertRowid?: number | bigint };
  await purgeOld(db, row.day);
  return Number(res?.meta?.last_row_id ?? res?.lastInsertRowid ?? 0);
}

/** 횟수 기록은 90일만 둔다(개인정보처리방침 5-2). 아이솔레이트마다 하루 한 번은 꼭 지운다. */
let purgedDay = "";
async function purgeOld(db: D1Database, day: string): Promise<void> {
  if (purgedDay === day) return;
  purgedDay = day;
  await db.prepare("DELETE FROM mori_chat_usage WHERE day < ?").bind(seoulToday(new Date(Date.now() - USAGE_KEEP_DAYS * 86400_000))).run();
}

/**
 * 횟수 예약을 「세고 → 적기」가 아니라 조건부 INSERT 한 번으로 한다. 동시에 20개를 보내도 상한을 넘지 않게(점검 4번).
 * 넣었으면 그 행 번호, 상한이면 0.
 */
async function reserveUsage(
  db: D1Database,
  row: { day: string; device: string; ip: string; kind: "free" | "report"; ref: string; mori: string; chars: number; turn: number },
): Promise<number> {
  const cond =
    row.kind === "free"
      ? {
          sql: `(SELECT COUNT(*) FROM mori_chat_usage WHERE day = ? AND device = ? AND kind = 'free') < ?
            AND (SELECT COUNT(*) FROM mori_chat_usage WHERE day = ? AND ip = ? AND kind = 'free') < ?`,
          binds: [row.day, row.device, CHAT_FREE_PER_DAY, row.day, row.ip, CHAT_FREE_PER_IP] as (string | number)[],
        }
      : {
          sql: `(SELECT COUNT(*) FROM mori_chat_usage WHERE day = ? AND kind = 'report' AND ref = ?) < ?`,
          binds: [row.day, row.ref, CHAT_REPORT_PER_DAY] as (string | number)[],
        };
  const res = (await db
    .prepare(
      `INSERT INTO mori_chat_usage (day, device, ip, kind, ref, mori, chars, turn)
       SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE ${cond.sql}`,
    )
    .bind(row.day, row.device, row.ip, row.kind, row.ref, row.mori, row.chars, row.turn, ...cond.binds)
    .run()) as { meta?: { changes?: number; last_row_id?: number }; changes?: number; lastInsertRowid?: number | bigint };
  const changed = (res?.meta?.changes ?? res?.changes ?? 0) > 0;
  if (!changed) return 0;
  await purgeOld(db, row.day);
  return Number(res?.meta?.last_row_id ?? res?.lastInsertRowid ?? 0);
}

// ── 모니터링(2026-10-08 사용자 요청: 오류·헛점·개선점을 볼 수 있게) ──

/** 화면이 보내는 알림 함수(텔레그램). 없으면 조용히 넘어갑니다. */
export type Notify = (text: string) => void;

/** 하루에 한 번만 보내는 알림. app_settings 에 「보냈음」 표시를 남깁니다. */
export async function alertOnce(db: D1Database, key: string, text: string, notify?: Notify): Promise<boolean> {
  if (!notify) return false;
  const res = (await db
    .prepare("INSERT INTO app_settings (key, value) VALUES (?, '1') ON CONFLICT(key) DO NOTHING")
    .bind(`mori_chat_alert:${key}`)
    .run()) as { meta?: { changes?: number }; changes?: number };
  if ((res?.meta?.changes ?? res?.changes ?? 0) === 0) return false;
  notify(text);
  return true;
}

/** 오늘 오류가 이 수에 닿으면 알립니다(각각 하루 한 번). */
export const ERROR_ALERT_STEPS = [5, 20, 100];

/**
 * 오류 한 건 기록. 대화 내용 없이 종류만(ref: busy·failed·exception…). 손님에게는 이미 「횟수 그대로」 안내가 나갔습니다.
 * 오늘 건수가 5·20·100 에 닿으면 텔레그램으로 알립니다.
 */
export async function noteError(db: D1Database, day: string, reason: string, notify?: Notify): Promise<void> {
  try {
    await recordUsage(db, { day, device: "", ip: "", kind: "error", ref: reason.replace(/[^a-z0-9_-]/gi, "").slice(0, 40) });
    const row = await db.prepare("SELECT COUNT(*) AS n FROM mori_chat_usage WHERE day = ? AND kind = 'error'").bind(day).first<{ n: number }>();
    const n = Number(row?.n ?? 0);
    if (ERROR_ALERT_STEPS.includes(n)) {
      await alertOnce(db, `error:${day}:${n}`, `⚠️ 모리 대화 오류 오늘 ${n}건 (마지막: ${reason})\n관리자 /admin/report/#mori-chat 「점검」에서 종류를 확인하세요.`, notify);
    }
  } catch {
    // 기록 실패가 응답을 막으면 안 됩니다.
  }
}

/**
 * 무료 사용자가 유료 키로 넘어간 횟수의 하루 상한. 무료 키 8개가 다 막힌 날 누군가 몰아서 쓰면 실제 돈이 나가므로,
 * 이 수를 넘으면 무료 사용자는 무료 키만 쓴다(중계에 freeonly). 결제한 사람은 상관없다(점검 5번).
 */
export const FREE_PAID_FALLBACK_PER_DAY = 200;

/** 대화권 한 번 쓰기. 남은 게 있을 때만 한 칸 올린다(동시에 두 번 눌러도 넘치지 않게). */
async function takePass(db: D1Database, tokens: string[]): Promise<string> {
  for (const token of tokens) {
    const res = (await db
      .prepare("UPDATE mori_chat_passes SET used = used + 1, updated_at = CURRENT_TIMESTAMP WHERE token = ? AND status = 'paid' AND used < size")
      .bind(token)
      .run()) as { meta?: { changes?: number }; changes?: number };
    if ((res?.meta?.changes ?? res?.changes ?? 0) > 0) return token;
  }
  return "";
}

async function givePassBack(db: D1Database, token: string): Promise<void> {
  await db.prepare("UPDATE mori_chat_passes SET used = used - 1, updated_at = CURRENT_TIMESTAMP WHERE token = ? AND used > 0").bind(token).run();
}

type RelayReply = { ok: true; text: string; model: string; tier: string } | { ok: false; kind: "safety" | "busy" | "failed" };

/** 중계 워커 부르기. 같은 역할이 이어지면 합친다(제미나이는 user/model 이 번갈아 와야 안정적이다). */
export async function callRelay(
  relay: RelayConfig,
  body: { system: string; turns: { role: "user" | "model"; text: string }[]; tier: "free" | "paid" | "freeonly" },
  fetcher: typeof fetch = fetch,
): Promise<RelayReply> {
  const merged: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const t of body.turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.parts[0].text += `\n${t.text}`;
    else merged.push({ role: t.role, parts: [{ text: t.text }] });
  }
  try {
    const res = await fetcher(relay.url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-relay-secret": relay.secret },
      body: JSON.stringify({ system: body.system, contents: merged, tier: body.tier }),
      signal: AbortSignal.timeout(25_000),
    });
    const j = (await res.json()) as { text?: string; model?: string; tier?: string; error?: string };
    // 모델이 문장 사이에 빈칸을 두 개씩 넣는 일이 잦아 하나로 줄인다(줄바꿈은 둔다).
    const tidy = (s: string) => s.replace(/\*\*|__/g, "").replace(/[ \t]{2,}/g, " ").replace(/[ \t]+\n/g, "\n").trim();
    if (res.ok && j.text) return { ok: true, text: tidy(j.text).slice(0, 600), model: String(j.model ?? ""), tier: String(j.tier ?? "") };
    if (j.error === "safety") return { ok: false, kind: "safety" };
    return { ok: false, kind: j.error === "busy" ? "busy" : "failed" };
  } catch {
    return { ok: false, kind: "failed" };
  }
}

/**
 * 추천 지시. 추천해 달라는 말이면 꼭 하나, 아니면 둘째 답부터·지난 추천 뒤 2번 이상 지났을 때만 「어울리면」 하나.
 * sinceRec 은 화면이 센 값(지난 추천 카드 뒤 모리 답 수)이라 믿을 수 없지만, 틀려도 추천 빈도만 바뀐다.
 */
export function recInstruction(message: string, sinceRec: unknown, turn: number): string {
  const since = Number(sinceRec);
  // 힘들어하는 말에는 추천 자체를 꺼낸다(추천해 달라고 해도 이번에는 마음부터).
  if (isDistress(message)) return "상대가 힘든 이야기를 하고 있어. 이번 답에는 아무것도 추천하지 말고 마음을 받아 주는 데만 집중해.";
  const ask = asksForRec(message);
  const may = ask || (turn >= 2 && Number.isFinite(since) && since >= 2);
  if (!may) return "이번 답에는 사이트 안의 테스트·운세·게임을 추천하지 마.";
  return `${ask ? "상대가 추천을 원해. 아래 목록에서 대화에 가장 어울리는 것 하나를 골라 왜 어울리는지 한 문장으로 권해." : "대화와 정말 잘 어울릴 때만, 답 마지막에 아래 목록에서 하나를 골라 한 문장으로 가볍게 권해. 어울리는 게 없거나 상대가 힘들어하는 이야기면 권하지 마."}
권했다면 답 맨 끝에 [추천:id] 를 붙여(id 는 목록 그대로). 목록에 없는 테스트·운세·주소는 말하지 마. 가격·결과를 지어내지 마.
추천 목록:
${recListForPrompt()}`;
}

/** 대화 한 번. 순서: 열림 → 입력 확인 → 위험한 말 → 횟수 예약 → AI → 실패면 예약 되돌림. */
export async function handleSend(
  db: D1Database,
  request: Request,
  raw: Record<string, unknown>,
  deps: { fetcher?: typeof fetch; now?: number; weatherFetcher?: typeof fetch; notify?: Notify } = {},
): Promise<Response> {
  if (!(await chatOpen(db))) return json({ error: "모리 대화는 아직 준비 중이에요." }, 503);
  const device = String(raw.device ?? "");
  const mori = String(raw.mori ?? "").toUpperCase();
  const me = String(raw.me ?? "").toUpperCase();
  const message = String(raw.message ?? "").normalize("NFC").trim();
  if (!DEVICE_RE.test(device) || !isMoriCode(mori)) return json({ error: "화면을 새로고침해 주세요." }, 400);
  if (!message) return json({ error: "모리에게 할 말을 적어 주세요." }, 400);
  if (message.length > CHAT_MAX_CHARS) return json({ error: `한 번에 ${CHAT_MAX_CHARS}자까지 보낼 수 있어요.` }, 400);

  const now = deps.now ?? Date.now();
  const day = seoulToday(new Date(now));
  const ip = await ipHash(request, day);
  // 횟수와 상관없이 요청 자체를 묶는다(안내문 경로로 두드리는 것도 막게).
  if (!(await allowAttempt(db, `chat:${ip}`, "mori_chat", 120))) return json({ error: "잠시 뒤 다시 이야기해 줘요." }, 429);

  // 안내문이 나갔던 주고받음은 AI 에 넘기지 않는다.
  const history = cleanHistory(raw.history).filter((t) => !(t.role === "user" && isCrisis(t.text)) && t.text !== CRISIS_REPLY);
  const turn = history.filter((t) => t.role === "user").length + 1;

  // 위험한 말: AI 에 보내지 않는다. 횟수도 깎지 않는다.
  if (isCrisis(message)) {
    // 누가 보냈는지는 남기지 않는다(민감한 기록). 날짜별 건수만.
    await recordUsage(db, { day, device: "", ip: "", kind: "crisis", mori, chars: 0, turn: 0 });
    // 그날 처음 나간 안내는 알립니다(누가 보냈는지는 없음). 안내 흐름이 제대로 도는지 사람이 한 번씩 보게.
    await alertOnce(db, `crisis:${day}`, `🆘 오늘 처음으로 모리 대화에서 상담 전화 안내가 나갔어요 (${mori} 모리).\n보낸 사람은 기록하지 않아요. 안내 문구·번호가 맞는지만 가끔 확인해 주세요.`, deps.notify);
    const { quota } = await computeQuota(db, { device, ip, day, reports: tokenList(raw.reports, 10), passes: tokenList(raw.passes, 10) }, now);
    return json({ reply: CRISIS_REPLY, crisis: true, quota });
  }

  const ent = await computeQuota(db, { device, ip, day, reports: tokenList(raw.reports, 10), passes: tokenList(raw.passes, 10) }, now);
  const paidUser = Boolean(ent.reportRef) || ent.passTokens.length > 0;

  // 횟수 예약: 무료 → 리포트 → 대화권. 앞에서 센 숫자는 고르는 데만 쓰고, 실제 차감은 조건부로 한 번에 한다.
  let kind = "";
  let ref = "";
  let usageId = 0;
  const base = { day, device, ip, mori, chars: message.length, turn };
  if (ent.quota.free > 0) {
    usageId = await reserveUsage(db, { ...base, kind: "free", ref: "" });
    if (usageId) kind = "free";
  }
  if (!kind && ent.reportRef) {
    usageId = await reserveUsage(db, { ...base, kind: "report", ref: ent.reportRef });
    if (usageId) {
      kind = "report";
      ref = ent.reportRef;
    }
  }
  if (!kind && ent.passTokens.length) {
    ref = await takePass(db, ent.passTokens);
    if (ref) {
      kind = "pass";
      usageId = await recordUsage(db, { ...base, kind, ref });
    }
  }
  if (!kind) {
    await recordUsage(db, { day, device, ip, kind: "wall", mori, turn });
    const quota = (await computeQuota(db, { device, ip, day, reports: tokenList(raw.reports, 10), passes: tokenList(raw.passes, 10) }, now)).quota;
    return json({ error: "오늘 무료 대화를 다 썼어요.", needPay: true, quota }, 402);
  }

  // 무료 사용자의 유료 키 넘어가기 하루 상한
  let tier: "free" | "paid" | "freeonly" = paidUser ? "paid" : "free";
  if (!paidUser) {
    const spilled = await db
      .prepare("SELECT COUNT(*) AS n FROM mori_chat_usage WHERE day = ? AND kind = 'free' AND tier = 'paid'")
      .bind(day)
      .first<{ n: number }>();
    if (Number(spilled?.n ?? 0) >= FREE_PAID_FALLBACK_PER_DAY) {
      tier = "freeonly";
      await alertOnce(db, `cap:${day}`, `💸 오늘 무료 사용자의 유료 키 사용이 상한(${FREE_PAID_FALLBACK_PER_DAY}건)에 닿았어요. 지금부터 무료 사용자는 무료 키만 써요.\n무료 키 8개가 한도에 걸린 날이라 손님에게 「잠시 후」가 늘 수 있어요.`, deps.notify);
    }
  }

  const release = async () => {
    await db.prepare("DELETE FROM mori_chat_usage WHERE id = ?").bind(usageId).run();
    if (kind === "pass") await givePassBack(db, ref);
  };

  const reply = await callRelay(
    await relayConfig(db),
    {
      system: `${systemPrompt(mori, isMoriCode(me) ? me : null)}
${sceneLine(await currentScene(db, request, now, deps.weatherFetcher))}
${recInstruction(message, raw.sinceRec, turn)}`,
      turns: [...history, { role: "user", text: message }],
      tier,
    },
    deps.fetcher,
  );

  if (!reply.ok) {
    await release();
    // 안전 차단은 오류가 아니라 따로 셉니다. 나머지(busy·failed)는 오류로 남기고 알립니다.
    if (reply.kind === "safety") await recordUsage(db, { day, device: "", ip: "", kind: "blocked", mori });
    else await noteError(db, day, `relay-${reply.kind}`, deps.notify);
    const after = (await computeQuota(db, { device, ip, day, reports: tokenList(raw.reports, 10), passes: tokenList(raw.passes, 10) }, now)).quota;
    // 제미나이가 막은 말에는 위험한 말이 섞여 있을 수 있다 — 「다른 얘기 하자」로 끝내지 않고 상담 번호를 같이 보여 준다(점검 2번).
    if (reply.kind === "safety") return json({ reply: SAFETY_REPLY, crisis: true, quota: after });
    return json({ error: "모리가 잠깐 졸고 있어요. 조금 뒤에 다시 말을 걸어 줘요. (횟수는 그대로예요)", quota: after }, 503);
  }
  await db.prepare("UPDATE mori_chat_usage SET model = ?, tier = ? WHERE id = ?").bind(reply.model, reply.tier, usageId).run();
  const after = (await computeQuota(db, { device, ip, day, reports: tokenList(raw.reports, 10), passes: tokenList(raw.passes, 10) }, now)).quota;
  // 답 끝의 [추천:id] 를 떼어 카드 번호로 따로 돌려준다(목록에 없는 id 는 버림).
  const taken = takeRec(reply.text);
  const rec = isDistress(message) ? null : taken.rec;
  return json({ reply: taken.text || reply.text, rec, used: kind, quota: after });
}

// ── 대화권 결제 ──

/** 주문번호: MC + 한국 날짜(yymmdd) + 6자리 난수. 리포트(MR…)와 앞 글자로 갈린다. */
export function newPassOrderNo(now: Date = new Date()): string {
  const d = seoulToday(now).replace(/-/g, "").slice(2);
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `MC${d}-${String(n).padStart(6, "0")}`;
}

export async function createPassOrder(
  db: D1Database,
  input: { phone: string; test?: boolean; price?: number },
): Promise<{ ok: true; payurl: string; orderNo: string; token: string } | { ok: false; error: string }> {
  const token = newToken();
  const now = new Date();
  const price = input.price ?? CHAT_PASS_PRICE;
  let orderNo = "";
  for (let i = 0; i < 4 && !orderNo; i++) {
    const candidate = newPassOrderNo(now);
    try {
      await db
        .prepare(
          `INSERT INTO mori_chat_passes (token, order_no, size, price, test, phone_last4, phone_hash, consent_version, consent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(token, candidate, CHAT_PASS_SIZE, price, input.test ? 1 : 0, input.phone.slice(-4), await phoneHash(db, input.phone), CHAT_CONSENT_VERSION, now.toISOString())
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
      goodname: `${CHAT_PASS_NAME}${input.test ? " (시험)" : ""}`,
      price: String(price),
      recvphone: input.phone,
      smsuse: "n",
      feedbackurl: `${SITE_ORIGIN}/api/mori-chat/payapp`,
      // 열쇠는 주소에 싣지 않는다 — 광고 스크립트가 주소를 읽을 수 있다(점검 7번). 화면이 결제창을 열기 전에 기억해 둔다.
      returnurl: `${SITE_ORIGIN}/mori/chat/?paid=1`,
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
    await db.prepare("UPDATE mori_chat_passes SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE token = ?").bind(token).run();
    return { ok: false, error: "결제창을 열지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
  await db.prepare("UPDATE mori_chat_passes SET mul_no = ?, payurl = ?, updated_at = CURRENT_TIMESTAMP WHERE token = ?").bind(res.mul_no, res.payurl.slice(0, 300), token).run();
  await logEvent(db, orderNo, "payrequest", `mul_no=${res.mul_no} price=${price} chat-pass${input.test ? " test" : ""}`);
  return { ok: true, payurl: res.payurl, orderNo, token };
}

/**
 * 대화권은 「쓴 만큼 빼고 환불」이라 부분 취소(70·71)가 정상 경로다. 부분 취소가 오면 남은 횟수를 더 쓰지 못하게 닫는다
 * (환불은 페이앱 관리자에서 「남은 횟수 × 58원」으로 부분 취소한다 — 2,900원 / 50번).
 */
const PASS_TRANSITIONS: Record<string, { to: string; from: string[] }> = {
  "4": { to: "paid", from: ["pending"] },
  "8": { to: "cancelled", from: ["pending"] },
  "32": { to: "cancelled", from: ["pending"] },
  "9": { to: "refunded", from: ["paid", "partial"] },
  "64": { to: "refunded", from: ["paid", "partial"] },
  "70": { to: "partial", from: ["paid"] },
  "71": { to: "partial", from: ["paid"] },
};
const PASS_HEAD: Record<string, string> = {
  paid: "💬 모리 대화권 결제 완료", refunded: "↩️ 대화권 환불", partial: "↩️ 대화권 부분 취소", cancelled: "대화권 결제 요청 취소",
};

export async function handlePassFeedback(db: D1Database, form: URLSearchParams, notify?: (text: string) => void): Promise<string> {
  const get = (k: string) => (form.get(k) ?? "").trim();
  const keys = await payappKeys(db);
  const orderNo = get("var1");
  const authed = get("userid") === PAYAPP_USERID && constantEquals(get("linkkey"), keys.linkkey) && constantEquals(get("linkval"), keys.linkval);
  if (!authed) {
    await logEvent(db, orderNo, "feedback_rejected", `chat-pass auth mul_no=${get("mul_no")} state=${get("pay_state")}`);
    return "FAIL";
  }
  const row = await db
    .prepare("SELECT token, price, status, mul_no, used, size, test, phone_last4 FROM mori_chat_passes WHERE order_no = ?")
    .bind(orderNo)
    .first<{ token: string; price: number; status: string; mul_no: string; used: number; size: number; test: number; phone_last4: string }>();
  if (!row || !row.mul_no || row.mul_no !== get("mul_no") || String(row.price) !== get("price")) {
    await logEvent(db, orderNo, "feedback_rejected", `chat-pass mismatch mul_no=${get("mul_no")} price=${get("price")} state=${get("pay_state")}`);
    return "FAIL";
  }
  const state = get("pay_state");
  const move = PASS_TRANSITIONS[state];
  if (move) {
    const marks = move.from.map(() => "?").join(",");
    const extra = state === "4" ? ", paid_at = ?, pay_type = ?" : "";
    const binds: (string | number)[] = [move.to];
    if (state === "4") binds.push(get("pay_date") || new Date().toISOString(), get("pay_type"));
    const res = (await db
      .prepare(`UPDATE mori_chat_passes SET status = ?${extra}, updated_at = CURRENT_TIMESTAMP WHERE token = ? AND status IN (${marks})`)
      .bind(...binds, row.token, ...move.from)
      .run()) as { meta?: { changes?: number }; changes?: number };
    const changed = (res?.meta?.changes ?? res?.changes ?? 0) > 0;
    if (notify && changed) {
      const at = new Date(Date.now() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ");
      notify([
        `${PASS_HEAD[move.to] ?? move.to}${row.test ? " (시험)" : ""}`,
        `${CHAT_PASS_NAME} · ${row.price.toLocaleString()}원 · 쓴 횟수 ${row.used}/${row.size}`,
        `주문 ${orderNo} · 휴대폰 ***-${row.phone_last4}`,
        `${at} (한국 시각)`,
      ].join("\n"));
    }
  }
  await logEvent(db, orderNo, "feedback", `chat-pass state=${state} type=${get("pay_type")} mul_no=${get("mul_no")}`);
  return "SUCCESS";
}

// ── 경로 ──

export function handleMoriChat(request: Request, url: URL, env: Env, ctx: Ctx): Promise<Response> | null {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith("/api/mori-chat/")) return null;
  return (async () => {
    const db = env?.DB;
    if (!db) return json({ error: "준비 중이에요." }, 503);
    await ensureChatSchema(db);

    if (path === "/api/mori-chat/quota" && (request.method === "POST" || request.method === "GET")) {
      // 열쇠는 본문(POST)으로 받는다. GET 은 배포 직후 옛 화면용으로만 남긴다.
      let body: { d?: unknown; r?: unknown; p?: unknown } = {};
      if (request.method === "POST") {
        try {
          body = await request.json();
        } catch {
          body = {};
        }
      } else {
        body = { d: url.searchParams.get("d"), r: url.searchParams.get("r"), p: url.searchParams.get("p") };
      }
      const device = String(body.d ?? "");
      if (!DEVICE_RE.test(device)) return json({ error: "화면을 새로고침해 주세요." }, 400);
      const day = seoulToday();
      const passes = tokenList(body.p, 20);
      const { quota } = await computeQuota(db, {
        device, ip: await ipHash(request, day), day,
        reports: tokenList(body.r, 10), passes: passes.slice(0, 10),
      });
      // 이 기기가 들고 있는 대화권 열쇠 중 아직 쓸모 있는 것(결제 완료·남음, 또는 하루 안의 결제 대기). 화면이 나머지를 지운다(점검 12번).
      const alive = passes.length
        ? ((await db
            .prepare(
              `SELECT token FROM mori_chat_passes WHERE token IN (${passes.map(() => "?").join(",")})
                AND ((status = 'paid' AND used < size) OR (status = 'pending' AND created_at > datetime('now', '-1 day')))`,
            )
            .bind(...passes)
            .all<{ token: string }>()).results ?? []).map((r) => r.token)
        : [];
      // 첫인사 앞머리(hello)도 서버가 만들어 보냅니다 — 음력 계산 라이브러리를 화면 묶음에 싣지 않으려고.
      const scene = await currentScene(db, request);
      return json({ quota, passOpen: await passSalesOpen(db), passAlive: alive, scene: { ...scene, hello: sceneHello(scene) } });
    }

    // 화면 기록: 추천 카드 노출·클릭, 「이어서 이야기하기」 누름. 횟수와 상관없는 기록이라 kind 만 받습니다.
    if (path === "/api/mori-chat/event" && request.method === "POST") {
      let raw: { device?: unknown; kind?: unknown; mori?: unknown; ref?: unknown };
      try {
        raw = await request.json();
      } catch {
        return json({ ok: false }, 400);
      }
      const device = String(raw.device ?? "");
      const kind = String(raw.kind ?? "");
      if (!DEVICE_RE.test(device) || !CHAT_EVENT_KINDS.includes(kind)) return json({ ok: false }, 400);
      const day = seoulToday();
      const ip = await ipHash(request, day);
      if (!(await allowAttempt(db, `chat:${ip}`, "mori_chat_event", 200))) return json({ ok: false }, 429);
      const mori = String(raw.mori ?? "").toUpperCase();
      const ref = String(raw.ref ?? "").replace(/[^a-z0-9-]/g, "").slice(0, 40);
      await recordUsage(db, { day, device, ip, kind, ref, mori: isMoriCode(mori) ? mori : "" });
      return json({ ok: true });
    }

    if (path === "/api/mori-chat/send" && request.method === "POST") {
      let raw: Record<string, unknown>;
      try {
        raw = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: "보낸 내용을 읽지 못했어요." }, 400);
      }
      return handleSend(db, request, raw, { notify: (msg) => ctx.waitUntil(sendTelegram(db, msg)) });
    }

    if (path === "/api/mori-chat/order" && request.method === "POST") {
      if (!(await passSalesOpen(db))) return json({ error: "대화권은 아직 판매 준비 중이에요." }, 503);
      const day = seoulToday();
      if (!(await allowAttempt(db, `chat:${await ipHash(request, day)}`, "chat_order", 10))) return json({ error: "잠시 뒤 다시 시도해 주세요." }, 429);
      let raw: { phone?: unknown; agree?: unknown; consentVersion?: unknown };
      try {
        raw = await request.json();
      } catch {
        return json({ error: "주문 내용을 읽지 못했어요." }, 400);
      }
      const phone = String(raw.phone ?? "").replace(/\D/g, "");
      if (!/^01[016789]\d{7,8}$/.test(phone)) return json({ error: "휴대폰 번호를 다시 확인해 주세요." }, 400);
      if (raw.agree !== true || raw.consentVersion !== CHAT_CONSENT_VERSION) return json({ error: "안내에 동의해 주세요." }, 400);
      const made = await createPassOrder(db, { phone });
      return made.ok ? json({ payurl: made.payurl, orderNo: made.orderNo, token: made.token }) : json({ error: made.error }, 502);
    }

    if (path === "/api/mori-chat/payapp" && request.method === "POST") {
      const body = await request.text();
      return text(await handlePassFeedback(db, new URLSearchParams(body), (msg) => ctx.waitUntil(sendTelegram(db, msg))));
    }

    if (path === "/api/mori-chat/pass" && request.method === "GET") {
      const token = url.searchParams.get("p") ?? "";
      if (!TOKEN_RE.test(token)) return json({ error: "대화권을 찾지 못했어요." }, 404);
      const row = await db.prepare("SELECT order_no, status, size, used FROM mori_chat_passes WHERE token = ?").bind(token).first<{ order_no: string; status: string; size: number; used: number }>();
      if (!row) return json({ error: "대화권을 찾지 못했어요." }, 404);
      return json({ status: row.status, orderNo: row.order_no, left: row.status === "paid" ? row.size - row.used : 0 });
    }

    if (path === "/api/mori-chat/find" && request.method === "POST") {
      const day = seoulToday();
      if (!(await allowAttempt(db, `chat:${await ipHash(request, day)}`, "chat_find", 8))) return json({ error: "시도가 너무 많아요. 한 시간 뒤 다시 시도해 주세요." }, 429);
      let raw: { phone?: unknown };
      try {
        raw = await request.json();
      } catch {
        return json({ error: "입력을 읽지 못했어요." }, 400);
      }
      const digits = String(raw.phone ?? "").replace(/\D/g, "");
      if (!/^01[016789]\d{7,8}$/.test(digits)) return json({ error: "휴대폰 번호를 다시 확인해 주세요." }, 400);
      const rows = (await db
        // 시험·관리자 검수용(test=1)은 찾기에 나오지 않는다 — 관리자 주문은 정해진 가짜 번호라 누구나 넣을 수 있다(점검 1번).
        .prepare("SELECT token, size, used FROM mori_chat_passes WHERE phone_hash = ? AND test = 0 AND status = 'paid' AND used < size ORDER BY created_at DESC LIMIT 10")
        .bind(await phoneHash(db, digits))
        .all<{ token: string; size: number; used: number }>()).results ?? [];
      if (!rows.length) return json({ error: "이 번호로 남은 대화권이 없어요." }, 404);
      return json({ passes: rows.map((r) => ({ token: r.token, left: r.size - r.used })) });
    }

    return json({ error: "없는 주소예요." }, 404);
  })().catch(async (error) => {
    // 서버 예외도 오류 표에 남깁니다(무엇이 터졌는지 이름만).
    const db = env?.DB;
    if (db) await noteError(db, seoulToday(), `exception-${error instanceof Error ? error.name : "unknown"}`, (msg) => ctx.waitUntil(sendTelegram(db, msg)));
    return json({ error: "잠시 문제가 생겼어요. 다시 시도해 주세요." }, 500);
  });
}
