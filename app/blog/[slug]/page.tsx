import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import ShareButtons from "../../../components/ShareButtons";
import { blogPosts, getBlogPost } from "../../../lib/blog-posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `https://mbtitest.co.kr/blog/${post.slug}/`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}/` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: "MBTI 검사",
      images: [
        {
          url: "/images/og/mbti-test-share.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/images/og/mbti-test-share.png"],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `https://mbtitest.co.kr/blog/${post.slug}/`;
  const related = post.relatedSlugs
    .map((relatedSlug) => getBlogPost(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const articleLength = [
    ...post.intro,
    ...post.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.bullets || []),
    ]),
  ].join("").length;
  const showLowerArticleAd = articleLength >= 2400;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "MBTI 검사 편집팀" },
    publisher: { "@type": "Organization", name: "MBTI 검사", url: "https://mbtitest.co.kr/" },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://mbtitest.co.kr/" },
      { "@type": "ListItem", position: 2, name: "MBTI·심리 콘텐츠", item: "https://mbtitest.co.kr/blog/" },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main>
      <ContentHeader active="/blog" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="blog-article">
        <nav className="breadcrumbs" aria-label="현재 위치">
          <a href="/">홈</a>
          <span>›</span>
          <a href="/blog/">콘텐츠</a>
          <span>›</span>
          <b>{post.category}</b>
        </nav>

        <header className="blog-article-header">
          <span>{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div>
            <time dateTime={post.updatedAt}>업데이트 {post.updatedAt.replaceAll("-", ".")}</time>
            <span>{post.readTime}</span>
            <span>MBTI 검사 편집팀</span>
          </div>
        </header>

        <div className="blog-article-layout">
          <div className="blog-article-content">
            <section className="article-intro">
              {post.intro.slice(0, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>

            <AdUnit
              position="articleBody"
              label={`${post.title} 본문 광고`}
            />

            {post.intro.length > 2 && (
              <section className="article-intro article-intro-followup">
                {post.intro.slice(2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            )}

            <aside className="article-inline-cta">
              <span>{post.cta.eyebrow}</span>
              <strong>{post.cta.title}</strong>
              <p>{post.cta.description}</p>
              <a href={post.cta.href}>{post.cta.label} →</a>
            </aside>

            {post.sections.map((section, index) => (
              <section className="article-section" key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {showLowerArticleAd && (
              <AdUnit
                position="articleBody"
                label={`${post.title} 하단 광고`}
              />
            )}

            {post.sources && post.sources.length > 0 && (
              <section className="article-section article-sources">
                <span>SOURCE</span>
                <h2>확인한 출처</h2>
                <p>화제성 순위와 MBTI 정보는 아래 공개 자료를 기준으로 확인했습니다.</p>
                <ul>
                  {post.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer">
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <aside className="article-disclaimer">
              <strong>콘텐츠 이용 안내</strong>
              <p>
                이 글과 테스트는 자기이해와 재미를 위한 일반 정보이며 의료적·심리학적 진단을
                대신하지 않습니다. 일상에 큰 어려움이 지속된다면 자격을 갖춘 전문가와 상담하세요.
              </p>
            </aside>

            <section className="article-final-cta">
              <span>{post.cta.eyebrow}</span>
              <h2>{post.cta.title}</h2>
              <p>{post.cta.description}</p>
              <a href={post.cta.href}>{post.cta.label}</a>
            </section>
          </div>

          <aside className="article-sidebar">
            <ShareButtons title={post.title} url={url} />
            <div>
              <span>이 글의 핵심 키워드</span>
              {post.keywords.map((keyword) => (
                <a href={`/blog/${post.slug}/`} key={keyword}>
                  #{keyword.replaceAll(" ", "")}
                </a>
              ))}
            </div>
            <div>
              <span>바로 테스트하기</span>
              <strong>{post.cta.title}</strong>
              <a href={post.cta.href}>{post.cta.label} →</a>
            </div>
          </aside>
        </div>
      </article>

      <section className="related-articles">
        <span>RELATED CONTENT</span>
        <h2>이어서 읽으면 좋은 글</h2>
        <div>
          {related.map((item) => (
            <a href={`/blog/${item.slug}/`} key={item.slug}>
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <i>글 읽기 →</i>
            </a>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
