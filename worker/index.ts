/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { robotsTxt, sitemapXml } from "../lib/site-urls";

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

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
