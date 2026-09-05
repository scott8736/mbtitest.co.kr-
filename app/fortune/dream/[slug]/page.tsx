import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import SiteFooter from "../../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../../lib/fortune-catalog";
import { dreamEntries, dreamSlugs, getDream } from "../../../../lib/fortune-dreams";
import styles from "../../../../lib/fortune.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return dreamSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dream = getDream(slug);
  if (!dream) return {};
  return {
    title: `${dream.title} 해몽 | 전통 해석과 심리학 풀이`,
    description: `${dream.title}은 무슨 뜻일까요? 전통 해몽과 현대 심리학 해석, 상황별로 갈리는 의미까지 정리했습니다.`,
    keywords: dream.keywords,
    alternates: { canonical: `/fortune/dream/${dream.slug}/` },
    openGraph: {
      title: `${dream.title} 해몽`,
      description: dream.summary,
      url: `/fortune/dream/${dream.slug}/`,
      type: "article",
    },
  };
}

export default async function DreamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dream = getDream(slug);
  if (!dream) notFound();

  const faq: Array<[string, string]> = [
    [`${dream.title}은 좋은 꿈인가요?`, `${dream.summary} ${dream.tradition}`],
    [`${dream.title}을 심리학에서는 어떻게 보나요?`, dream.psychology],
    ...dream.variations.slice(0, 2).map(
      (variation) => [`${dream.title}에서 ${variation.situation}면 무슨 뜻인가요?`, variation.meaning] as [string, string],
    ),
  ];

  const jsonLd = graph(
    articleJsonLd({
      headline: `${dream.title} 해몽: 전통 해석과 심리학 풀이`,
      description: dream.summary,
      path: `/fortune/dream/${dream.slug}/`,
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "꿈해몽", href: "/fortune/dream/" },
      { name: dream.title, href: `/fortune/dream/${dream.slug}/` },
    ]),
    faqJsonLd(faq),
  );

  const related = dream.related.map(getDream).filter((entry) => entry !== undefined);
  const more = dreamEntries.filter((entry) => entry.slug !== dream.slug).slice(0, 12);

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/dream/">꿈해몽</a> /{" "}
          {dream.title}
        </div>
        <span className={styles.eyebrow}>{dream.category} 관련 꿈</span>
        <h1>
          {dream.emoji} {dream.title} 해몽
        </h1>
        <p>{dream.summary}</p>
        <div className={styles.actions}>
          <a href="/fortune/dream/">다른 꿈 찾아보기</a>
          <a href="/fortune/today/">오늘의 운세 보기</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>{dream.title}은 무슨 뜻인가요?</strong>
          <p>{dream.tradition}</p>
        </section>

        <AdUnit position="articleTop" label={`${dream.title} 상단 광고`} />

        <nav className={styles.toc} aria-label="페이지 목차">
          <a href="#tradition">전통 해몽</a>
          <a href="#psychology">심리학 해석</a>
          <a href="#cases">상황별 해석</a>
          <a href="#advice">이렇게 해보세요</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>

        <section id="tradition" className={styles.section}>
          <h2>{dream.title} 전통 해몽</h2>
          <p>{dream.tradition}</p>
        </section>

        <section id="psychology" className={styles.section}>
          <h2>{dream.title} 심리학 해석</h2>
          <p>{dream.psychology}</p>
        </section>

        <AdUnit position="articleBody" label={`${dream.title} 본문 광고`} />

        <section id="cases" className={styles.section}>
          <h2>{dream.title} 상황별 해석</h2>
          <p>같은 꿈이라도 장면이 달라지면 해석이 갈립니다. 기억나는 쪽을 찾아보세요.</p>
          <ul className={styles.caseList}>
            {dream.variations.map((variation) => (
              <li key={variation.situation} className={styles.caseItem}>
                <b>{variation.situation}</b>
                <p>{variation.meaning}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="advice" className={styles.section}>
          <h2>이 꿈을 꿨다면</h2>
          <p>{dream.advice}</p>
          <h3>행운의 숫자</h3>
          <p>{dream.luckyNumbers}</p>
        </section>

        {related.length > 0 && (
          <section className={styles.section}>
            <h2>함께 찾아보는 꿈</h2>
            <div className={styles.tileGrid}>
              {related.map((entry) => (
                <a key={entry.slug} className={styles.tile} href={`/fortune/dream/${entry.slug}/`}>
                  <b>{entry.emoji}</b>
                  <strong>{entry.title}</strong>
                  <span>{entry.summary}</span>
                  <i>해몽 보기 →</i>
                </a>
              ))}
            </div>
          </section>
        )}

        <section id="faq" className={styles.section}>
          <h2>{dream.title} 자주 묻는 질문</h2>
          {faq.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2>다른 꿈 해몽</h2>
          <div className={styles.chips}>
            {more.map((entry) => (
              <a key={entry.slug} className={styles.chip} href={`/fortune/dream/${entry.slug}/`}>
                {entry.emoji} {entry.title}
              </a>
            ))}
          </div>
        </section>

        <aside className={styles.notice}>
          꿈해몽은 전해 내려온 상징 해석이며 미래를 예측하지 않습니다. 행운의 숫자도 재미를 위한 정보이므로, 이를
          근거로 지출을 늘리지 마세요. 악몽이 반복되고 일상에 지장이 있다면 수면 전문의와 상담을 권합니다.
        </aside>

        <section className={styles.cta}>
          <h2>오늘 하루의 흐름도 확인해 보세요</h2>
          <p>생년월일만 넣으면 총운과 연애·재물·직장·건강 지수가 바로 나옵니다.</p>
          <a href="/fortune/today/">오늘의 운세 보러 가기 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
