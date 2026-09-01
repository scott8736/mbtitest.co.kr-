import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "../lib/site-urls";

export const dynamic = "force-static";

/** 실제 응답은 worker/index.ts 에서 합니다. app/sitemap.ts 의 주석 참고. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
