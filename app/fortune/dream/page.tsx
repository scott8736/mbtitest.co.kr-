import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { dreamEntries, dreamCategories } from "../../../lib/fortune-dreams";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "꿈해몽 사전 | 돼지꿈·뱀꿈·이빨 빠지는 꿈 해석",
  description:
    "많이 찾는 꿈 29가지를 전통 해몽과 심리학 해석으로 함께 풀이했습니다. 돼지꿈, 뱀꿈, 이빨 빠지는 꿈, 죽는 꿈까지 상황별로 확인하세요.",
  keywords: ["꿈해몽", "꿈 해몽 사전", "돼지꿈 해몽", "뱀꿈 해몽", "이빨 빠지는 꿈"],
  alternates: { canonical: "/fortune/dream/" },
  openGraph: { title: "꿈해몽 사전 | 전통 해몽과 심리 해석", url: "/fortune/dream/", type: "website" },
};

const faq: Array<[string, string]> = [
  [
    "꿈해몽은 정말 맞나요?",
    "꿈이 미래를 알려준다는 과학적 근거는 없습니다. 다만 꿈은 최근의 감정과 관심사를 재료로 만들어지기 때문에, 지금 내가 무엇에 신경 쓰고 있는지를 읽는 단서로는 쓸모가 있습니다. 이 사전은 전통 해몽과 심리학 해석을 함께 실어 두 관점을 모두 볼 수 있게 했습니다.",
  ],
  [
    "같은 꿈인데 해석이 왜 다른가요?",
    "전통 해몽은 상징의 관습을, 심리학은 꾼 사람의 상태를 봅니다. 그래서 같은 뱀꿈도 전통에서는 재물로, 심리학에서는 변화의 전조로 읽습니다. 두 해석이 충돌하는 것이 아니라 보는 각도가 다른 것입니다.",
  ],
  [
    "악몽을 자주 꾸는데 괜찮을까요?",
    "수면 부족, 스트레스, 늦은 시간의 카페인·음주가 가장 흔한 원인입니다. 생활을 조정해도 악몽이 계속되고 일상에 지장이 있다면 수면 전문의와 상담해 보시길 권합니다.",
  ],
];

export default function DreamListPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "꿈해몽 사전 | 돼지꿈·뱀꿈·이빨 빠지는 꿈 해석",
      description: "많이 찾는 꿈을 전통 해몽과 심리학 해석으로 함께 풀이한 사전.",
      path: "/fortune/dream/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "꿈해몽", href: "/fortune/dream/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 꿈해몽
        </div>
        <span className={styles.eyebrow}>꿈해몽 사전</span>
        <h1>
          꿈해몽 사전
          <br />
          전통 해몽과 심리 해석을 함께
        </h1>
        <p>
          많이 찾는 꿈 {dreamEntries.length}가지를 정리했습니다. 옛날부터 전해오는 해몽과 현대 심리학의 설명을 나란히
          두어, 상황별로 어떻게 갈리는지까지 확인할 수 있습니다.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/today/">오늘의 운세 보기</a>
          <a href="/fortune/saju/">무료 사주 풀이</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>꿈해몽을 어떻게 읽어야 하나요?</strong>
          <p>
            꿈에 무엇이 나왔는지보다 그 장면에서 어떤 감정이었는지가 더 중요합니다. 같은 뱀꿈도 무서웠는지 신기했는지에
            따라 해석이 갈립니다. 각 페이지의 &lsquo;상황별 해석&rsquo;을 함께 보세요.
          </p>
        </section>

        <AdUnit position="articleTop" label="꿈해몽 목록 상단 광고" />

        {dreamCategories.map((category) => {
          const items = dreamEntries.filter((entry) => entry.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category} className={styles.section}>
              <h2>{category} 관련 꿈</h2>
              <div className={styles.tileGrid}>
                {items.map((entry) => (
                  <a key={entry.slug} className={styles.tile} href={`/fortune/dream/${entry.slug}/`}>
                    <b>{entry.emoji}</b>
                    <strong>{entry.title}</strong>
                    <span>{entry.summary}</span>
                    <i>해몽 보기 →</i>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        <AdUnit position="articleBody" label="꿈해몽 목록 본문 광고" />

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
          꿈해몽은 오랜 시간 전해 내려온 상징 해석이며 미래를 예측하는 도구가 아닙니다. 이 사전에 실린 행운의 숫자
          역시 재미를 위한 정보이므로, 이를 근거로 지출을 늘리지 마세요.
        </aside>

        <section className={styles.cta}>
          <h2>오늘 하루의 흐름이 궁금하다면</h2>
          <p>생년월일만 넣으면 오늘의 총운과 분야별 지수를 바로 확인할 수 있습니다.</p>
          <a href="/fortune/today/">오늘의 운세 보러 가기 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
