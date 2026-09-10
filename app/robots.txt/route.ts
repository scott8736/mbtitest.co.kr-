import { robotsTxt } from "../../lib/site-urls";

/**
 * /robots.txt.
 *
 * app/robots.ts 로 두면 Next 가 규칙을 직렬화해 주지만, 거기에 담을 수 있는 것은
 * 그룹과 Sitemap 줄뿐입니다. 네이버에 알려 줘야 하는 RSS 줄이 들어가지 않아서
 * app/rss.xml/route.ts 와 같은 방식으로 직접 씁니다.
 *
 * 배포되는 파일은 이 라우트가 만든 out/robots.txt 입니다. scripts/build-pages.sh 의
 * _routes.json 이 /robots.txt 를 워커에서 빼 두어서, worker 쪽 같은 처리는
 * vite dev 워커에서만 쓰입니다.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(robotsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
