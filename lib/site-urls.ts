import { blogPosts } from "./blog-posts";
import { mbtiCodes } from "./mbti-content";
import { newTestSlugs } from "./new-tests";
import { zodiacSlugs, starSignSlugs } from "./fortune-engine";
import { dreamSlugs } from "./fortune-dreams";

export const SITE_ORIGIN = "https://mbtitest.co.kr";

export type SiteUrl = {
  path: string;
  lastModified: Date;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
};

/**
 * 사이트맵에 올릴 주소 목록.
 *
 * next.config.ts 의 trailingSlash: true 에 맞춰 모두 슬래시로 끝냅니다.
 * 검사를 진행하는 화면과 결과 화면은 noindex 이므로 여기에 넣지 않습니다.
 */
export function siteUrls(now: Date = new Date()): SiteUrl[] {
  return [
    { path: "/", lastModified: now, changeFrequency: "monthly", priority: 1 },
    { path: "/tests/", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...[
      "egen-teto",
      "adult-attachment",
      "mental-age",
      "love-language",
      "self-esteem",
      "burnout",
      "work-style",
      ...newTestSlugs,
    ].map((slug) => ({
      path: `/tests/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...["result", "types", "compatibility", "blog"].map((page) => ({
      path: `/${page}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...mbtiCodes.flatMap((code) => [
      {
        path: `/types/${code}/`,
        lastModified: new Date("2026-07-25"),
        changeFrequency: "monthly" as const,
        priority: 0.85,
      },
      {
        path: `/compatibility/${code}/`,
        lastModified: new Date("2026-07-25"),
        changeFrequency: "monthly" as const,
        priority: 0.82,
      },
    ]),
    // 운세 영역. 도구 화면도 읽을 콘텐츠가 함께 있으므로 사이트맵에 넣습니다.
    { path: "/fortune/", lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    ...["today", "saju", "saju-mbti", "2027"].map((page) => ({
      path: `/fortune/${page}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })),
    ...["zodiac", "star-sign", "dream"].map((page) => ({
      path: `/fortune/${page}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...zodiacSlugs.map((slug) => ({
      path: `/fortune/zodiac/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.82,
    })),
    ...starSignSlugs.map((slug) => ({
      path: `/fortune/star-sign/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...dreamSlugs.map((slug) => ({
      path: `/fortune/dream/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.78,
    })),
    ...blogPosts.map((post) => ({
      path: `/blog/${post.slug}/`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...["about", "contact", "privacy"].map((page) => ({
      path: `/${page}/`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

export function sitemapXml(now?: Date): string {
  const entries = siteUrls(now)
    .map(
      ({ path, lastModified, changeFrequency, priority }) => `  <url>
    <loc>${SITE_ORIGIN}${path}</loc>
    <lastmod>${lastModified.toISOString()}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

export function robotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
}
