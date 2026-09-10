import { rssXml } from "../../lib/rss";

/**
 * next.config.ts 가 output: "export" 라서 이 라우트는 빌드 때 한 번 실행되고
 * 그 결과가 정적 파일로 떨어집니다. app/sitemap.ts 와 같은 방식입니다.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(rssXml(), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
