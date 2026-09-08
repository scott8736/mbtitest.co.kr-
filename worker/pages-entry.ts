/**
 * 정적 배포용 워커.
 *
 * 배포 파이프라인이 `npm run build:pages`(= next build)의 산출물만 올리기 때문에
 * vinext 워커(worker/index.ts)는 라이브에 존재하지 않습니다. 그래서 관리자 화면과
 * 접속 로그처럼 서버가 필요한 기능은 이 파일을 out/_worker.js 로 번들해서
 * 정적 자산과 함께 올립니다.
 *
 * 여기서 하는 일은 두 가지뿐입니다.
 *   1. /admin 요청을 직접 처리한다
 *   2. HTML 응답 한 건을 D1 에 기록한다
 * 나머지 모든 요청은 손대지 않고 정적 자산(env.ASSETS)에 그대로 넘깁니다.
 */
import { handleAdmin } from "./admin";
import {
  classifyDevice,
  classifySource,
  isBot,
  isTrackablePath,
  RETENTION_DAYS,
  seoulDay,
  visitorHash,
} from "../lib/analytics";
import { ensureSchema } from "./schema";
import { handleTestEvent } from "./test-events";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 검사 진행 이벤트. 첫 문항에 답한 시점을 세어, 화면을 열자마자 나간
    // 사람과 몇 문항 풀다 그만둔 사람을 구분합니다.
    const testEvent = handleTestEvent(request, url, env, ctx);
    if (testEvent) return testEvent;

    try {
      const admin = await handleAdmin(request, url, env?.DB);
      if (admin) return admin;
    } catch (error) {
      // 관리자 화면이 깨지더라도 사이트는 계속 떠 있어야 합니다.
      if (url.pathname.replace(/\/+$/, "").startsWith("/admin")) {
        return new Response(`관리자 화면 오류: ${error instanceof Error ? error.message : String(error)}`, {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, nofollow" },
        });
      }
    }

    const response = await env.ASSETS.fetch(request);

    if (request.method === "GET" && isTrackablePath(url.pathname)) {
      const contentType = response.headers.get("content-type") ?? "";
      if (response.status === 200 && contentType.includes("text/html")) {
        ctx.waitUntil(recordPageView(request, url, env));
      }
    }

    return response;
  },
};

export default worker;

/**
 * 페이지 조회 한 건을 남깁니다. 응답을 먼저 돌려준 뒤 실행되므로 속도에 영향이 없고,
 * 실패해도 사이트는 그대로 동작합니다.
 *
 * 저장하지 않는 것: IP 원본, 쿠키, 쿼리스트링.
 */
async function recordPageView(request: Request, url: URL, env: Env): Promise<void> {
  try {
    const db = env?.DB;
    if (!db) return;

    const userAgent = request.headers.get("user-agent") ?? "";
    if (isBot(userAgent)) return;

    await ensureSchema(db);

    const referrer = request.headers.get("referer") ?? "";
    const ip = request.headers.get("cf-connecting-ip") ?? "";
    const day = seoulDay();
    const cf = (request as Request & { cf?: { country?: string; city?: string } }).cf;

    await db
      .prepare(
        `INSERT INTO page_views
           (path, referrer, source, device, country, city, visitor_hash, day)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        url.pathname.slice(0, 200),
        referrer.slice(0, 300),
        classifySource(referrer, url.hostname),
        classifyDevice(userAgent),
        cf?.country ?? "",
        cf?.city ?? "",
        await visitorHash(ip, userAgent, day),
        day,
      )
      .run();

    // 보관 기간이 지난 행은 가끔씩만 정리합니다.
    if (Math.random() < 0.002) {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
      await db.prepare(`DELETE FROM page_views WHERE day < ?`).bind(seoulDay(cutoff)).run();
    }
  } catch {
    // 통계 기록 실패가 사이트를 멈추게 하면 안 됩니다.
  }
}
