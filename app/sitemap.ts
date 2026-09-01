import type { MetadataRoute } from "next";
import { SITE_ORIGIN, siteUrls } from "../lib/site-urls";

export const dynamic = "force-static";

/**
 * 실제로 /sitemap.xml 을 응답하는 곳은 worker/index.ts 입니다.
 * trailingSlash: true 때문에 이 라우트가 어느 경로로도 잡히지 않아서인데,
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
