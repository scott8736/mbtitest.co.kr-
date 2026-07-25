import { blogPosts } from "../../lib/blog-posts";

export const dynamic = "force-static";

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export function GET() {
  const items = blogPosts
    .map(
      (post) => `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>https://mbtitest.co.kr/blog/${post.slug}/</link>
          <guid>https://mbtitest.co.kr/blog/${post.slug}/</guid>
          <description>${escapeXml(post.description)}</description>
          <pubDate>${new Date(post.updatedAt).toUTCString()}</pubDate>
        </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>MBTI 검사·심리테스트 가이드</title>
        <link>https://mbtitest.co.kr/blog/</link>
        <description>MBTI 검사와 연애·성격·마음건강 테스트를 이해하는 실용적인 콘텐츠</description>
        <language>ko-KR</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
