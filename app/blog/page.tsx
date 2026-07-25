import type { Metadata } from "next";
import ContentHeader from "../../components/ContentHeader";
import SiteFooter from "../../components/SiteFooter";
import { blogCategories, blogPosts } from "../../lib/blog-posts";

export const metadata: Metadata = {
  title: "MBTI 검사·심리테스트 가이드",
  description:
    "MBTI 4가지 지표, 유형별 차이, 궁합, 애착유형, 번아웃, 자존감과 사랑의 언어를 쉽게 설명하는 심리테스트 콘텐츠입니다.",
  keywords: ["MBTI 검사", "심리테스트", "성격테스트", "MBTI 궁합", "애착유형 테스트"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "MBTI 검사·심리테스트 가이드",
    description: "나를 이해하고 관계를 돌아보는 MBTI·심리 콘텐츠와 무료 테스트",
    url: "https://mbtitest.co.kr/blog/",
    type: "website",
  },
};

export default function BlogPage() {
  const featured = blogPosts[0];

  return (
    <main>
      <ContentHeader active="/blog" />
      <section className="blog-hub-hero">
        <div>
          <span className="eyebrow">MBTI · PSYCHOLOGY GUIDE</span>
          <h1>
            나를 이해하는
            <br />
            MBTI·심리테스트 가이드
          </h1>
          <p>
            결과만 확인하고 끝내지 마세요. 성격과 관계에서 반복되는 패턴을 이해하고,
            지금의 나에게 맞는 테스트로 이어지는 실용적인 가이드를 제공합니다.
          </p>
          <div className="blog-hero-actions">
            <a className="primary-button" href="/">
              무료 MBTI 검사 시작하기
            </a>
            <a className="secondary-link" href="/tests">
              전체 심리테스트 보기 →
            </a>
          </div>
        </div>
        <aside className="blog-featured-card">
          <span>처음 읽는 분께 추천</span>
          <h2>{featured.title}</h2>
          <p>{featured.description}</p>
          <a href={`/blog/${featured.slug}/`}>MBTI 기본 가이드 읽기 →</a>
        </aside>
      </section>

      <section className="blog-hub-intro">
        <span>CONTENT HUB</span>
        <h2>검사 결과를 일상에서 활용하는 방법</h2>
        <p>
          MBTI 네 글자만 외우는 대신 각 지표가 실제 대화, 연애, 업무에서 어떻게
          나타나는지 살펴봅니다. 애착유형과 번아웃, 자존감처럼 검색에서 자주 만나는
          심리 개념도 과장된 진단 없이 이해하기 쉽게 정리했습니다.
        </p>
      </section>

      {blogCategories
        .filter((category) => category !== "전체")
        .map((category) => {
          const posts = blogPosts.filter((post) => post.category === category);
          if (!posts.length) return null;
          return (
            <section className="blog-category-section" key={category}>
              <div className="blog-category-heading">
                <span>{category}</span>
                <h2>{category === "MBTI 기초" ? "MBTI를 정확하게 이해하는 기본 글" : `${category} 콘텐츠`}</h2>
              </div>
              <div className="blog-grid">
                {posts.map((post) => (
                  <article key={post.slug}>
                    <span>{post.category}</span>
                    <h3>
                      <a href={`/blog/${post.slug}/`}>{post.title}</a>
                    </h3>
                    <p>{post.description}</p>
                    <small>{post.readTime}</small>
                    <a href={`/blog/${post.slug}/`}>{post.title} 읽기 →</a>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

      <section className="blog-hub-cta">
        <div>
          <span>어떤 글부터 읽을지 고민된다면</span>
          <h2>테스트로 현재의 나부터 확인해 보세요</h2>
          <p>가입 없이 바로 시작하고 결과에 맞는 성격·관계 콘텐츠를 이어서 볼 수 있습니다.</p>
        </div>
        <a href="/tests">나에게 맞는 심리테스트 찾기</a>
      </section>
      <SiteFooter />
    </main>
  );
}
