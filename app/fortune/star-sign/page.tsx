import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { starSigns, starSignElementNotes } from "../../../lib/fortune-star-signs";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "별자리 운세 | 12별자리 성격·궁합·날짜 기준",
  description:
    "양자리부터 물고기자리까지 12별자리의 성격과 연애·일·돈의 방식, 잘 맞는 별자리를 정리했습니다. 생일로 내 별자리를 찾아보세요.",
  keywords: ["별자리 운세", "별자리 성격", "별자리 궁합", "별자리 날짜", "12별자리"],
  alternates: { canonical: "/fortune/star-sign/" },
  openGraph: { title: "별자리 운세 | 12별자리 성격과 궁합", url: "/fortune/star-sign/", type: "website" },
};

const faq: Array<[string, string]> = [
  [
    "별자리는 음력으로 보나요, 양력으로 보나요?",
    "양력 생일로 봅니다. 별자리는 태양이 지나는 황도 12궁을 기준으로 나눈 것이라 음력과는 관계가 없습니다.",
  ],
  [
    "생일이 경계에 걸쳐 있으면 어느 쪽인가요?",
    "별자리 경계일은 해마다 하루 정도 움직입니다. 3월 21일이나 4월 19일처럼 경계에 걸쳐 태어났다면 두 별자리 설명을 모두 읽고 자신에게 더 맞는 쪽을 참고하시는 편이 좋습니다.",
  ],
  [
    "별자리와 사주는 무엇이 다른가요?",
    "별자리는 태양의 위치 하나로 12가지를 나눕니다. 사주는 연·월·일·시 네 기둥을 세우고 오행의 균형까지 보기 때문에 훨씬 세분화된 풀이가 나옵니다.",
  ],
];

export default function StarSignListPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "별자리 운세 | 12별자리 성격·궁합·날짜 기준",
      description: "12별자리의 성격과 연애·일·돈의 방식, 잘 맞는 별자리 정리.",
      path: "/fortune/star-sign/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "별자리 운세", href: "/fortune/star-sign/" },
    ]),
    faqJsonLd(faq),
  );

  const elements = ["불", "흙", "공기", "물"] as const;

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 별자리 운세
        </div>
        <span className={styles.eyebrow}>황도 12궁</span>
        <h1>
          별자리 운세
          <br />
          12별자리 성격과 궁합
        </h1>
        <p>
          양력 생일로 정해지는 12별자리입니다. 각 별자리의 성격과 연애·일·돈을 대하는 방식, 잘 맞는 별자리를 한
          페이지씩 정리했습니다.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/today/">오늘의 운세 보기</a>
          <a href="/fortune/zodiac/">띠별 운세 보기</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>내 별자리는 어떻게 찾나요?</strong>
          <p>
            양력 생일이 속한 기간을 찾으면 됩니다. 경계일은 해마다 하루 정도 움직이므로, 기간의 첫날이나 마지막 날에
            태어났다면 양쪽을 모두 읽어보세요.
          </p>
        </section>

        <AdUnit position="articleTop" label="별자리 목록 상단 광고" />

        <section className={styles.section}>
          <h2>12별자리 한눈에 보기</h2>
          <div className={styles.tileGrid}>
            {starSigns.map((sign) => (
              <a key={sign.slug} className={styles.tile} href={`/fortune/star-sign/${sign.slug}/`}>
                <b>{sign.symbol}</b>
                <strong>{sign.name}</strong>
                <span>{sign.period}</span>
                <span>{sign.tagline}</span>
                <i>운세 보기 →</i>
              </a>
            ))}
          </div>
        </section>

        <AdUnit position="articleBody" label="별자리 목록 본문 광고" />

        <section className={styles.section}>
          <h2>네 가지 원소로 묶어 보기</h2>
          <p>
            12별자리는 불·흙·공기·물 네 원소로 나뉩니다. 같은 원소끼리는 기본 리듬이 비슷해 편안하고, 다른 원소와는
            서로 없는 것을 채워줍니다.
          </p>
          <div className={styles.grid}>
            {elements.map((element) => (
              <div key={element} className={styles.card}>
                <h3>{element} 원소</h3>
                <p>{starSignElementNotes[element]}</p>
                <div className={styles.chips}>
                  {starSigns
                    .filter((sign) => sign.element === element)
                    .map((sign) => (
                      <a key={sign.slug} className={styles.chip} href={`/fortune/star-sign/${sign.slug}/`}>
                        {sign.symbol} {sign.name}
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>자주 묻는 질문</h2>
          {faq.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <aside className={styles.notice}>
          별자리 해석은 오랜 시간 축적된 상징 체계이며, 과학적으로 검증된 성격 분류는 아닙니다. 자기이해와 대화를 위한
          참고 자료로 활용해 주세요.
        </aside>

        <section className={styles.cta}>
          <h2>성격을 더 자세히 알고 싶다면</h2>
          <p>40개 질문으로 확인하는 무료 MBTI 검사와 함께 보면 훨씬 선명해집니다.</p>
          <a href="/tests/mbti/">무료 MBTI 검사 시작 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
