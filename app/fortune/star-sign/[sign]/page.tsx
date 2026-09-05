import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import SiteFooter from "../../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../../lib/fortune-catalog";
import { starSigns, getStarSign, starSignName, starSignElementNotes } from "../../../../lib/fortune-star-signs";
import { starSignSlugs } from "../../../../lib/fortune-engine";
import styles from "../../../../lib/fortune.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return starSignSlugs.map((sign) => ({ sign }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign } = await params;
  const starSign = getStarSign(sign);
  if (!starSign) return {};
  return {
    title: `${starSign.name} 성격과 운세 | 날짜·궁합 총정리`,
    description: `${starSign.name}(${starSign.period})의 성격과 강점, 연애·일·돈을 대하는 방식, 잘 맞는 별자리 궁합을 정리했습니다.`,
    keywords: starSign.keywords,
    alternates: { canonical: `/fortune/star-sign/${starSign.slug}/` },
    openGraph: {
      title: `${starSign.name} 성격과 궁합`,
      description: starSign.tagline,
      url: `/fortune/star-sign/${starSign.slug}/`,
      type: "article",
    },
  };
}

export default async function StarSignDetailPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const starSign = getStarSign(sign);
  if (!starSign) notFound();

  const faq: Array<[string, string]> = [
    [`${starSign.name}는 몇 월 며칠부터인가요?`, `${starSign.period}에 태어난 분이 ${starSign.name}입니다. 경계일은 해마다 하루 정도 움직이므로 첫날이나 마지막 날 생일이라면 옆 별자리도 함께 읽어보세요.`],
    [`${starSign.name}의 성격은 어떤가요?`, starSign.personality],
    [
      `${starSign.name}와 잘 맞는 별자리는?`,
      `${starSign.bestMatches.map(starSignName).join(", ")}와 리듬이 잘 맞는 편입니다. 다만 별자리만으로 관계가 정해지지는 않으며, 대화 방식과 생활 조건이 훨씬 큰 영향을 줍니다.`,
    ],
    [`${starSign.name}의 원소와 지배 행성은?`, `${starSign.element} 원소이고 지배 행성은 ${starSign.ruler}입니다. ${starSignElementNotes[starSign.element]}`],
  ];

  const jsonLd = graph(
    articleJsonLd({
      headline: `${starSign.name} 성격과 운세: 날짜·궁합 총정리`,
      description: starSign.tagline,
      path: `/fortune/star-sign/${starSign.slug}/`,
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "별자리 운세", href: "/fortune/star-sign/" },
      { name: starSign.name, href: `/fortune/star-sign/${starSign.slug}/` },
    ]),
    faqJsonLd(faq),
  );

  const others = starSigns.filter((item) => item.slug !== starSign.slug);

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> /{" "}
          <a href="/fortune/star-sign/">별자리 운세</a> / {starSign.name}
        </div>
        <span className={styles.eyebrow}>
          {starSign.element} 원소 · {starSign.ruler}
        </span>
        <h1>
          {starSign.symbol} {starSign.name}
          <br />
          {starSign.tagline}
        </h1>
        <p>
          {starSign.period}에 태어난 분이 {starSign.name}입니다. 성격과 강점, 연애·일·돈을 대하는 방식, 잘 맞는
          별자리를 아래에서 확인하세요.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/today/">오늘의 운세 보기</a>
          <a href="/tests/mbti/">무료 MBTI 검사</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>{starSign.name}는 어떤 성격인가요?</strong>
          <p>{starSign.personality}</p>
        </section>

        <AdUnit position="articleTop" label={`${starSign.name} 상단 광고`} />

        <nav className={styles.toc} aria-label="페이지 목차">
          <a href="#personality">성격과 강점</a>
          <a href="#love">연애</a>
          <a href="#work">일과 돈</a>
          <a href="#year">2027년 흐름</a>
          <a href="#match">별자리 궁합</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>

        <section id="personality" className={styles.section}>
          <h2>{starSign.name} 성격과 강점</h2>
          <p>{starSign.personality}</p>
          <p>{starSignElementNotes[starSign.element]}</p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>강점</h3>
              <ul>
                {starSign.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.card}>
              <h3>주의할 점</h3>
              <ul>
                {starSign.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="love" className={styles.section}>
          <h2>{starSign.name}의 연애</h2>
          <p>{starSign.love}</p>
        </section>

        <AdUnit position="articleBody" label={`${starSign.name} 본문 광고`} />

        <section id="work" className={styles.section}>
          <h2>{starSign.name}의 일과 돈</h2>
          <h3>일하는 방식</h3>
          <p>{starSign.work}</p>
          <h3>돈을 대하는 방식</h3>
          <p>{starSign.money}</p>
        </section>

        <section id="year" className={styles.section}>
          <h2>2027년 {starSign.name} 흐름</h2>
          <p>{starSign.yearOutlook}</p>
        </section>

        <section id="match" className={styles.section}>
          <h2>{starSign.name} 궁합</h2>
          <div className={styles.chips}>
            {starSign.bestMatches.map((slug) => (
              <a key={slug} className={styles.chip} href={`/fortune/star-sign/${slug}/`}>
                {starSignName(slug)}
              </a>
            ))}
          </div>
          <p>
            같은 원소끼리는 리듬이 비슷해 편안하고, 마주 보는 별자리와는 서로 없는 것을 채워줍니다. 다만 실제 관계는
            별자리보다 대화 습관과 생활 조건에 훨씬 크게 좌우됩니다.
          </p>
        </section>

        <section id="lucky" className={styles.section}>
          <h2>{starSign.name} 행운 정보</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>행운의 색</h3>
              <p>{starSign.luckyColor}</p>
            </div>
            <div className={styles.card}>
              <h3>행운의 물건</h3>
              <p>{starSign.luckyItem}</p>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <h2>{starSign.name} 자주 묻는 질문</h2>
          {faq.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2>다른 별자리</h2>
          <div className={styles.chips}>
            {others.map((item) => (
              <a key={item.slug} className={styles.chip} href={`/fortune/star-sign/${item.slug}/`}>
                {item.symbol} {item.name}
              </a>
            ))}
          </div>
        </section>

        <aside className={styles.notice}>
          별자리 해석은 오랜 상징 체계에 기반한 참고 자료이며, 과학적으로 검증된 성격 분류가 아닙니다.
        </aside>

        <section className={styles.cta}>
          <h2>성격을 더 정확히 알고 싶다면</h2>
          <p>40개 질문으로 네 가지 성향 지표를 확인해 보세요.</p>
          <a href="/tests/mbti/">무료 MBTI 검사 시작 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
