import { blogPosts, type BlogPost } from "./blog-posts";
import { SITE_ORIGIN } from "./site-urls";

/**
 * 블로그 글 피드.
 *
 * 실제 /rss.xml 파일은 app/rss.xml/route.ts 가 빌드 때 정적으로 만들어 냅니다.
 * 주소와 글 목록은 lib 한 곳에서만 가져오므로 사이트맵과 어긋나지 않습니다.
 */

const FEED_TITLE = "MBTI 검사 — 심리테스트와 운세 이야기";
const FEED_DESCRIPTION =
  "MBTI와 심리테스트, 연애와 관계, 마음건강, 운세를 다룬 글입니다. 가입 없이 읽고 바로 검사해 볼 수 있습니다.";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 의 날짜는 RFC 822 형식이어야 합니다. 글 데이터에는 "2026-07-25" 처럼
 * 날짜만 적혀 있어서, 그대로 Date 에 넣으면 UTC 자정으로 읽혀 한국 기준
 * 하루 전으로 보입니다. 그래서 KST 자정으로 못박아 읽습니다.
 */
function rfc822(date: string, fallback: Date): string {
  const parsed = new Date(`${date}T00:00:00+09:00`);
  return (Number.isNaN(parsed.getTime()) ? fallback : parsed).toUTCString();
}

/**
 * 피드에 싣는 최대 건수.
 *
 * 전부 밀어 넣으면 무엇이 새것인지 사라집니다. 피드는 목록이 아니라 소식이고,
 * 전체 주소는 사이트맵이 이미 넘기고 있으므로 여기는 최신 것만 담습니다.
 */
const MAX_ITEMS = 30;

/** 최신 글이 위로. 같은 날짜가 많아서 slug 로 순서를 고정합니다. */
export function feedPosts(): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug))
    .slice(0, MAX_ITEMS);
}

export function rssXml(now: Date = new Date()): string {
  const posts = feedPosts();
  const items = posts
    .map((post) => {
      const link = `${SITE_ORIGIN}/blog/${post.slug}/`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(post.publishedAt, now)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join("\n");

  // 글이 하나도 없으면 lastBuildDate 로 빌드 시각을 씁니다.
  const latest = posts.length ? rfc822(posts[0].publishedAt, now) : now.toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_ORIGIN}/blog/</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${latest}</lastBuildDate>
    <atom:link href="${SITE_ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
