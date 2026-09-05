import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { zodiacFortunes, birthYears, samjaeSlugs, zodiacBranch } from "../../../lib/fortune-zodiac";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "띠별 운세 | 12띠 성격·2027 정미년 운세·띠 궁합",
  description:
    "쥐띠부터 돼지띠까지 12띠의 성격과 2027 정미년 운세, 띠별 궁합을 정리했습니다. 태어난 해로 내 띠를 찾아 바로 확인하세요.",
  keywords: ["띠별 운세", "12띠 운세", "2027 띠별운세", "띠 궁합", "내 띠 찾기"],
  alternates: { canonical: "/fortune/zodiac/" },
  openGraph: { title: "띠별 운세 | 12띠 성격과 2027 정미년 흐름", url: "/fortune/zodiac/", type: "website" },
};

const faq: Array<[string, string]> = [
  [
    "내 띠는 어떻게 정해지나요?",
    "태어난 해의 지지(자축인묘…)로 정해집니다. 다만 사주에서는 한 해의 시작을 양력 1월 1일이 아니라 입춘(2월 4일경)으로 보기 때문에, 1월과 2월 초에 태어난 분은 전 해의 띠로 보는 것이 일반적입니다.",
  ],
  [
    "2027년에 삼재인 띠는 무엇인가요?",
    "2027 정미년은 해묘미(亥卯未)에 해당하는 돼지띠·토끼띠·양띠의 날삼재 해입니다. 2025년 들삼재, 2026년 눌삼재를 지나 마무리되는 해라, 새로 벌이기보다 정리에 어울리는 시기로 봅니다.",
  ],
  [
    "본명년(本命年)은 무엇인가요?",
    "자기 띠와 같은 해를 뜻합니다. 2027 정미년은 양띠의 본명년입니다. 기운이 강해지는 만큼 변화도 커지므로, 큰 확장보다 자기 관리에 무게를 두라는 조언이 전해집니다.",
  ],
];

export default function ZodiacListPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "띠별 운세 | 12띠 성격·2027 정미년 운세·띠 궁합",
      description: "12띠의 성격과 2027 정미년 운세, 띠별 궁합 정리.",
      path: "/fortune/zodiac/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "띠별 운세", href: "/fortune/zodiac/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 띠별 운세
        </div>
        <span className={styles.eyebrow}>12지 · 띠별 운세</span>
        <h1>
          띠별 운세
          <br />
          12띠 성격과 2027년 흐름
        </h1>
        <p>
          태어난 해로 정해지는 12띠입니다. 각 띠의 타고난 성향과 2027 정미년에 무엇이 달라지는지, 어떤 띠와 잘 맞는지를
          한 페이지씩 정리했습니다.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/2027/">2027 신년운세 총정리</a>
          <a href="/fortune/saju/">내 사주 계산하기</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>내 띠를 모르겠다면</strong>
          <p>
            태어난 해에서 4를 뺀 뒤 12로 나눈 나머지가 띠의 순번입니다. 아래 목록에 띠별로 해당하는 출생 연도를 모두
            적어두었으니 그대로 찾으시면 됩니다.
          </p>
        </section>

        <AdUnit position="articleTop" label="띠별 운세 목록 상단 광고" />

        <section className={styles.section}>
          <h2>12띠 한눈에 보기</h2>
          <div className={styles.tileGrid}>
            {zodiacFortunes.map((zodiac, index) => (
              <a key={zodiac.slug} className={styles.tile} href={`/fortune/zodiac/${zodiac.slug}/`}>
                <b>{zodiac.emoji}</b>
                <strong>{zodiac.name}</strong>
                <span>{zodiac.tagline}</span>
                <span>{birthYears(index, 1960, 2020).join(", ")}년생</span>
                <i>운세 보기 →</i>
              </a>
            ))}
          </div>
        </section>

        <AdUnit position="articleBody" label="띠별 운세 목록 본문 광고" />

        <section className={styles.section}>
          <h2>2027 정미년 삼재 띠</h2>
          <p>
            삼재는 세 해에 걸쳐 들어왔다 나가는 흐름입니다. 2027 정미년은 그 마지막 해인 날삼재에 해당하며,
            대상은 {samjaeSlugs.map((slug) => zodiacFortunes.find((z) => z.slug === slug)?.name).join(" · ")}입니다.
            마지막 해는 부담이 커지는 시기가 아니라 정리되는 시기이므로, 미뤄둔 일을 매듭짓는 데 쓰면 좋습니다.
          </p>
          <div className={styles.chips}>
            {samjaeSlugs.map((slug) => {
              const zodiac = zodiacFortunes.find((item) => item.slug === slug);
              if (!zodiac) return null;
              return (
                <a key={slug} className={styles.chip} href={`/fortune/zodiac/${slug}/`}>
                  {zodiac.emoji} {zodiac.name} 자세히
                </a>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2>띠와 오행</h2>
          <p>
            띠는 12지에 해당하고, 각 지지는 오행 가운데 하나에 속합니다. 같은 띠라도 태어난 달과 날에 따라 사주
            전체의 오행 균형이 달라지므로, 정확한 풀이는 네 기둥을 모두 세워야 합니다.
          </p>
          <div className={styles.chips}>
            {zodiacFortunes.map((zodiac) => {
              const branch = zodiacBranch(zodiac.slug);
              return (
                <span key={zodiac.slug} className={styles.chip}>
                  {zodiac.name} · {branch.ko}({branch.hanja}) · {branch.element}
                </span>
              );
            })}
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
          띠별 운세는 태어난 해 하나만 보고 12가지로 나눈 큰 흐름입니다. 개인의 상황을 더 정확히 보려면 연·월·일·시를
          모두 세우는 사주 풀이를 함께 참고하세요.
        </aside>

        <section className={styles.cta}>
          <h2>내 사주 네 기둥이 궁금하다면</h2>
          <p>생년월일시를 넣으면 오행 분포와 일간 성향까지 바로 계산합니다.</p>
          <a href="/fortune/saju/">무료 사주 풀이 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
