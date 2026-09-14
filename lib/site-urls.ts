import { blogPosts } from "./blog-posts";
import { mbtiCodes } from "./mbti-content";
import { newTestSlugs } from "./test-meta";
import { genericTests } from "./generic-tests";
import { zodiacSlugs, starSignSlugs } from "./fortune-engine";
import { dreamSlugs } from "./fortune-dreams";
import { screenerSlugs } from "./screeners";
import { tarotSlugs } from "./tarot";

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
    // 결과별 공유 페이지. 검사 화면(/result/)과 달리 링크를 받은 사람도 볼 수
    // 있는 공개 페이지라 색인합니다. "겉테토 속에겐" 처럼 결과 이름으로 찾는
    // 롱테일 검색을 여기서 받습니다.
    ...Object.entries(genericTests).flatMap(([slug, test]) =>
      Object.keys(test.results).map((key) => ({
        path: `/tests/${slug}/r/${key}/`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ),
    // 자가진단. 검사와 결과가 한 화면이라 주소가 하나뿐이고, 검색으로 들어오는
    // 유입이 가장 큰 영역이라 우선순위를 성향 테스트와 같게 둡니다.
    { path: "/check/", lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    ...screenerSlugs.map((slug) => ({
      path: `/check/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    // 오늘의 타로. 매일 카드가 바뀌므로 changeFrequency 는 daily 에 가장 가까운
    // weekly 로 두고, 재방문을 만드는 영역이라 우선순위를 높게 잡습니다.
    { path: "/tarot/", lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    ...tarotSlugs.map((slug) => ({
      path: `/tarot/${slug}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.88,
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
    ...["today", "saju", "saju-mbti", "gunghap", "2027"].map((page) => ({
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
  // Yeti 는 네이버 크롤러입니다. 위 와일드카드가 이미 허용하지만, 서치어드바이저는
  // 이름 붙은 그룹을 찾지 못하면 수집 설정을 확인하지 못했다고 표시합니다.
  // 이름 붙은 그룹은 와일드카드를 대체하므로 Disallow 도 그 안에 다시 적습니다.
  //
  // RSS 줄은 사이트맵과 별개입니다. 사이트맵이 "이 주소들이 있다" 라면 피드는
  // "이것이 새로 생겼다" 라, 네이버는 둘을 따로 받고 신규 수집은 피드가 빠릅니다.
  return `User-agent: *
Allow: /
Disallow: /admin

User-agent: Yeti
Allow: /
Disallow: /admin

Sitemap: ${SITE_ORIGIN}/sitemap.xml
RSS: ${SITE_ORIGIN}/rss.xml
`;
}
