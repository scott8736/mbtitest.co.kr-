/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { robotsTxt, sitemapXml } from "../lib/site-urls";
import { handleAdmin } from "./admin";
import { ensureSchema } from "./schema";
import { handleTestEvent } from "./test-events";
import {
  classifyDevice,
  classifySource,
  isBot,
  isTrackablePath,
  RETENTION_DAYS,
  seoulDay,
  visitorHash,
} from "../lib/analytics";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // sitemap.xml 과 robots.txt 는 여기서 직접 응답합니다.
    //
    // next.config.ts 의 trailingSlash: true 때문에 /sitemap.xml 요청이
    // /sitemap.xml/ 로 308 리다이렉트되는데, 그 주소에는 라우트가 없어 404 가 됩니다
    // (app/sitemap.ts, app/robots.ts 는 이 빌드에서 어느 경로로도 잡히지 않습니다).
    // 크롤러는 robots.txt 를 슬래시 없는 정확한 주소로만 요청하므로,
    // 라우터에 넘기기 전에 가로채야 합니다.
    const metadataPath = url.pathname.replace(/\/$/, "");
    if (metadataPath === "/sitemap.xml") {
      return new Response(sitemapXml(), {
        headers: {
          "content-type": "application/xml; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }
    if (metadataPath === "/robots.txt") {
      return new Response(robotsTxt(), {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    }

    // 검사 진행 이벤트. 첫 문항에 답한 시점을 세어, 화면을 열자마자 나간
    // 사람과 몇 문항 풀다 그만둔 사람을 구분합니다.
    const testEvent = handleTestEvent(request, url, env, ctx);
    if (testEvent) return testEvent;

    // /admin 은 워커에서 직접 처리합니다. Next 페이지로 두면 output: "export" 의
    // 프리렌더가 Node 에서 cloudflare:workers 를 읽지 못해 빌드가 깨집니다.
    const admin = await handleAdmin(request, url, env?.DB);
    if (admin) return admin;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);

    // 접속 로그. 응답을 먼저 돌려주고 뒤에서 기록하므로 페이지 속도에 영향이 없고,
    // 기록이 실패해도 사이트는 그대로 동작합니다.
    if (request.method === "GET" && isTrackablePath(url.pathname)) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        ctx.waitUntil(recordPageView(request, url, env));
      }
    }

    return response;
  },
};

/**
 * 한 번의 페이지 조회를 D1 에 남깁니다.
 *
 * 저장하지 않는 것: IP 원본, 쿠키, 쿼리스트링. 방문자 식별은 날짜가 섞인
 * 해시라 하루가 지나면 이어붙일 수 없습니다.
 */
async function recordPageView(request: Request, url: URL, env: Env): Promise<void> {
  try {
    if (!env?.DB) return;

    const userAgent = request.headers.get("user-agent") ?? "";
    if (isBot(userAgent)) return;

    await ensureSchema(env.DB);

    const referrer = request.headers.get("referer") ?? "";
    const ip = request.headers.get("cf-connecting-ip") ?? "";
    const day = seoulDay();
    const cf = (request as Request & { cf?: { country?: string; city?: string } }).cf;

    await env.DB.prepare(
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

    // 보관 기간이 지난 행은 가끔씩만 정리합니다. 매 요청마다 지울 필요가 없습니다.
    if (Math.random() < 0.002) {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
      await env.DB.prepare(`DELETE FROM page_views WHERE day < ?`).bind(seoulDay(cutoff)).run();
    }
  } catch {
    // 통계 기록 실패가 사이트를 멈추게 하면 안 됩니다.
  }
}

export default worker;
