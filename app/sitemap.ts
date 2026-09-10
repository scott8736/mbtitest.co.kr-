import type { MetadataRoute } from "next";
import { SITE_ORIGIN, siteUrls } from "../lib/site-urls";

export const dynamic = "force-static";

/**
 * 라이브에 나가는 /sitemap.xml 은 이 라우트가 만든 out/sitemap.xml 입니다.
 * scripts/build-pages.sh 의 _routes.json 이 그 주소를 워커에서 빼 두어서,
 * worker/index.ts 의 같은 처리는 vite dev 워커에서만 쓰입니다.
 *
 * 주소 목록은 lib/site-urls.ts 한 곳에서 가져오므로 둘이 어긋나지 않습니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return siteUrls().map(({ path, lastModified, changeFrequency, priority }) => ({
    url: `${SITE_ORIGIN}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
