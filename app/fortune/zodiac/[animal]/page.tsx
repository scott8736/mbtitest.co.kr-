import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import SiteFooter from "../../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../../lib/fortune-catalog";
import {
  zodiacFortunes,
  getZodiac,
  birthYears,
  zodiacIndex,
  zodiacBranch,
  zodiacName,
  samjaeSlugs,
} from "../../../../lib/fortune-zodiac";
import { zodiacSlugs } from "../../../../lib/fortune-engine";
import styles from "../../../../lib/fortune.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return zodiacSlugs.map((animal) => ({ animal }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ animal: string }>;
}): Promise<Metadata> {
  const { animal } = await params;
  const zodiac = getZodiac(animal);
  if (!zodiac) return {};
  return {
    title: `${zodiac.name} 운세 총정리 | 성격·2027 정미년·궁합`,
    description: `${zodiac.name}의 타고난 성격과 2027 정미년 총운, 연애·재물·직장·건강 운세, 잘 맞는 띠 궁합까지 한 번에 확인하세요.`,
    keywords: zodiac.keywords,
    alternates: { canonical: `/fortune/zodiac/${zodiac.slug}/` },
    openGraph: {
      title: `${zodiac.name} 운세 | 성격과 2027년 흐름`,
      description: zodiac.tagline,
      url: `/fortune/zodiac/${zodiac.slug}/`,
      type: "article",
    },
  };
}

export default async function ZodiacDetailPage({ params }: { params: Promise<{ animal: string }> }) {
  const { animal } = await params;
  const zodiac = getZodiac(animal);
  if (!zodiac) notFound();

  const index = zodiacIndex(zodiac.slug);
  const branch = zodiacBranch(zodiac.slug);
  const years = birthYears(index, 1948, 2032);
  const isSamjae = samjaeSlugs.includes(zodiac.slug);
  const isOwnYear = zodiac.slug === "goat";

  const faq: Array<[string, string]> = [
    [`${zodiac.name}는 몇 년생인가요?`, `${years.join(", ")}년에 태어난 분이 ${zodiac.name}입니다. 다만 입춘(2월 4일경) 이전 출생이라면 사주에서는 전 해의 띠로 보는 것이 일반적입니다.`],
    [`${zodiac.name}의 성격은 어떤가요?`, zodiac.personality],
    [`2027년 ${zodiac.name} 운세는 어떤가요?`, zodiac.yearOverview],
    [
      `${zodiac.name}와 잘 맞는 띠는?`,
      `${zodiac.bestMatches.map(zodiacName).join(", ")}와 자연스럽게 호흡이 맞는 편입니다. 반대로 ${zodiac.hardMatches
        .map(zodiacName)
        .join(", ")}와는 속도와 방식의 차이를 의식적으로 조율해야 합니다. 다만 띠만으로 관계가 정해지지는 않습니다.`,
    ],
  ];

  const jsonLd = graph(
    articleJsonLd({
      headline: `${zodiac.name} 운세 총정리: 성격·2027 정미년·궁합`,
      description: zodiac.tagline,
      path: `/fortune/zodiac/${zodiac.slug}/`,
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "띠별 운세", href: "/fortune/zodiac/" },
      { name: zodiac.name, href: `/fortune/zodiac/${zodiac.slug}/` },
    ]),
    faqJsonLd(faq),
  );

  const others = zodiacFortunes.filter((item) => item.slug !== zodiac.slug);

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/zodiac/">띠별 운세</a> /{" "}
          {zodiac.name}
        </div>
        <span className={styles.eyebrow}>
          {branch.ko}({branch.hanja}) · {branch.element}
        </span>
        <h1>
          {zodiac.emoji} {zodiac.name} 운세
          <br />
          {zodiac.tagline}
        </h1>
        <p>
          {years.slice(0, 8).join(", ")}년생이 {zodiac.name}입니다. 타고난 성향과 2027 정미년의 흐름, 잘 맞는 띠까지
          아래에서 확인하세요.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/today/">오늘의 운세 보기</a>
          <a href="/fortune/saju/">내 사주 계산하기</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>{zodiac.name}는 어떤 성격인가요?</strong>
          <p>{zodiac.personality}</p>
        </section>

        <AdUnit position="articleTop" label={`${zodiac.name} 상단 광고`} />

        <nav className={styles.toc} aria-label="페이지 목차">
          <a href="#personality">성격과 강점</a>
          <a href="#year">2027년 총운</a>
          <a href="#detail">분야별 운세</a>
          <a href="#match">띠 궁합</a>
          <a href="#lucky">행운 정보</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>

        <section id="personality" className={styles.section}>
          <h2>{zodiac.name} 성격과 강점</h2>
          <p>{zodiac.personality}</p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>강점</h3>
              <ul>
                {zodiac.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.card}>
              <h3>주의할 점</h3>
              <ul>
                {zodiac.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="year" className={styles.section}>
          <h2>2027 정미년 {zodiac.name} 총운</h2>
          <p>{zodiac.yearOverview}</p>
          {isOwnYear && (
            <>
              <h3>본명년이란</h3>
              <p>
                2027 정미년은 {zodiac.name}의 본명년입니다. 자기 띠와 같은 해에는 기운이 강해지는 만큼 변화의 폭도
                커집니다. 예로부터 본명년에는 크게 벌이기보다 자기 관리와 정리에 무게를 두라고 전해집니다.
              </p>
            </>
          )}
          {isSamjae && (
            <>
              <h3>삼재는 어떻게 되나요?</h3>
              <p>
                {zodiac.name}는 2025년 들삼재, 2026년 눌삼재를 지나 2027년 날삼재로 삼재가 끝납니다. 마지막 해는
                새로 시작하는 시기라기보다 지난 부담을 정리하고 회복하는 시기로 봅니다.
              </p>
            </>
          )}
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>흐름이 좋은 달</h3>
              <p>{zodiac.goodMonths}</p>
            </div>
            <div className={styles.card}>
              <h3>조심할 달</h3>
              <p>{zodiac.carefulMonths}</p>
            </div>
          </div>
        </section>

        <AdUnit position="articleBody" label={`${zodiac.name} 본문 광고`} />

        <section id="detail" className={styles.section}>
          <h2>{zodiac.name} 분야별 운세</h2>
          <h3>연애·인간관계</h3>
          <p>{zodiac.yearLove}</p>
          <h3>재물</h3>
          <p>{zodiac.yearMoney}</p>
          <h3>직장·사업</h3>
          <p>{zodiac.yearWork}</p>
          <h3>건강</h3>
          <p>{zodiac.yearHealth}</p>
        </section>

        <section id="match" className={styles.section}>
          <h2>{zodiac.name} 띠 궁합</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>잘 맞는 띠</h3>
              <ul>
                {zodiac.bestMatches.map((slug) => (
                  <li key={slug}>
                    <a href={`/fortune/zodiac/${slug}/`}>{zodiacName(slug)}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.card}>
              <h3>조율이 필요한 띠</h3>
              <ul>
                {zodiac.hardMatches.map((slug) => (
                  <li key={slug}>
                    <a href={`/fortune/zodiac/${slug}/`}>{zodiacName(slug)}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p>
            띠 궁합은 12지의 합(合)과 충(沖) 관계에서 나온 큰 틀입니다. 실제 관계는 서로의 대화 습관과 생활 조건에
            훨씬 크게 좌우되므로, 참고 자료로만 보시기를 권합니다.
          </p>
        </section>

        <section id="lucky" className={styles.section}>
          <h2>{zodiac.name} 행운 정보</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>행운의 색</h3>
              <p>{zodiac.luckyColor}</p>
            </div>
            <div className={styles.card}>
              <h3>행운의 숫자</h3>
              <p>{zodiac.luckyNumber}</p>
            </div>
            <div className={styles.card}>
              <h3>행운의 방향</h3>
              <p>{zodiac.luckyDirection}</p>
            </div>
            <div className={styles.card}>
              <h3>오행</h3>
              <p>
                {branch.ko}({branch.hanja}) · {branch.element}
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className={styles.section}>
          <h2>{zodiac.name} 자주 묻는 질문</h2>
          {faq.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2>다른 띠 운세</h2>
          <div className={styles.chips}>
            {others.map((item) => (
              <a key={item.slug} className={styles.chip} href={`/fortune/zodiac/${item.slug}/`}>
                {item.emoji} {item.name}
              </a>
            ))}
          </div>
        </section>

        <aside className={styles.notice}>
          띠별 운세는 태어난 해 하나로 12가지를 나눈 큰 흐름입니다. 같은 띠여도 태어난 달·일·시에 따라 사주의 오행
          균형이 달라지므로, 더 정확한 풀이는 네 기둥을 모두 세워야 합니다.
        </aside>

        <section className={styles.cta}>
          <h2>{zodiac.name}인 나의 사주는?</h2>
          <p>생년월일시를 넣으면 네 기둥과 오행 분포, 일간 성향까지 바로 계산합니다.</p>
          <a href="/fortune/saju/">무료 사주 풀이 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
