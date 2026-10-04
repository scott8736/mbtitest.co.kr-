/**
 * `GET /api/trending` — 홈 「요즘 뜨는 심리테스트」 카드 데이터.
 *
 * worker/index.ts(로컬 개발)와 worker/pages-entry.ts(실제 배포) 양쪽에서 부릅니다.
 * 관리자 트렌드 화면과 같은 캐시(app_settings.trend_cache)를 같이 씁니다. 캐시가
 * 6시간보다 오래되면 응답은 먼저 있는 값으로 돌려주고 뒤에서 한 번 새로 받습니다.
 * 데이터랩은 하루 단위로 갱신되고 일일 한도가 있어 방문마다 부르면 안 됩니다.
 */
import { testCatalog } from "../lib/test-catalog";
import { pickTrending } from "../lib/trending";
import { DEFAULT_TREND_KEYWORDS, fetchTrend, hasTrendKeys, loadCreds, readSetting, writeSetting, type TrendRow } from "./naver";
import { ensureSchema } from "./schema";

interface TrendingEnv {
  DB?: D1Database;
}

interface TrendingCtx {
  waitUntil(promise: Promise<unknown>): void;
}

const REFRESH_AFTER_MS = 6 * 3600_000;

const PUBLISHED = new Set(testCatalog.filter((item) => item.status === "published").map((item) => item.slug));

/** 같은 아이솔레이트에서 동시에 여러 번 새로 받지 않게 합니다. */
let refreshing: Promise<void> | null = null;

type Cache = { at: number; rows: TrendRow[] };

function parseCache(raw: string): Cache | null {
  try {
    const parsed = JSON.parse(raw) as { at?: number; rows?: TrendRow[] };
    return parsed.at && Array.isArray(parsed.rows) ? { at: parsed.at, rows: parsed.rows } : null;
  } catch {
    return null;
  }
}

async function refresh(db: D1Database): Promise<void> {
  const creds = await loadCreds(db);
  if (!hasTrendKeys(creds.open, creds.hub)) return;
  const stored = await readSetting(db, "trend_keywords");
  const keywords = stored ? stored.split("\n").filter(Boolean) : DEFAULT_TREND_KEYWORDS;
  const rows = await fetchTrend(creds.open, creds.hub, keywords);
  // 관리자 화면(readCache)이 읽는 형식 그대로 씁니다.
  await writeSetting(db, "trend_cache", JSON.stringify({ at: Date.now(), keywords: keywords.join("\n"), rows }));
}

function refreshOnce(db: D1Database): Promise<void> {
  refreshing ??= refresh(db)
    .catch(() => {
      // 못 받으면 있던 값을 계속 씁니다.
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export function handleTrending(request: Request, url: URL, env: TrendingEnv, ctx: TrendingCtx): Promise<Response> | null {
  if (url.pathname !== "/api/trending" || request.method !== "GET") return null;
  return trendingResponse(env, ctx);
}

async function trendingResponse(env: TrendingEnv, ctx: TrendingCtx): Promise<Response> {
  const empty = { at: 0, items: [] };
  try {
    const db = env?.DB;
    if (!db) return json(empty, 60);
    await ensureSchema(db);

    let cache = parseCache(await readSetting(db, "trend_cache"));
    if (!cache) {
      await refreshOnce(db);
      cache = parseCache(await readSetting(db, "trend_cache"));
    } else if (Date.now() - cache.at > REFRESH_AFTER_MS) {
      ctx.waitUntil(refreshOnce(db));
    }
    if (!cache) return json(empty, 300);

    return json({ at: cache.at, items: pickTrending(cache.rows, (slug) => PUBLISHED.has(slug)) }, 600);
  } catch {
    // 카드가 안 뜰 뿐 홈은 그대로 보여야 합니다.
    return json(empty, 60);
  }
}

function json(body: unknown, maxAge: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}`,
      "x-robots-tag": "noindex",
    },
  });
}
