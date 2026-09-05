import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import FortuneTool from "../../../components/FortuneTool";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { zodiacFortunes } from "../../../lib/fortune-zodiac";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "오늘의 운세 무료 | 생년월일로 보는 총운·연애·재물",
  description:
    "생년월일만 넣으면 오늘의 총운과 연애·재물·직장·건강 지수를 바로 확인합니다. 가입도 결제도 없고, 입력한 정보는 저장되지 않습니다.",
  keywords: ["오늘의 운세", "오늘의운세 무료", "생년월일 운세", "무료 운세", "오늘 운세"],
  alternates: { canonical: "/fortune/today/" },
  openGraph: {
    title: "오늘의 운세 무료 | 생년월일로 30초 만에",
    description: "총운과 연애·재물·직장·건강 지수를 바로 확인하세요.",
    url: "/fortune/today/",
    type: "website",
  },
};

const faq: Array<[string, string]> = [
  [
    "오늘의 운세는 언제 바뀌나요?",
    "한국 시간 기준 매일 0시에 바뀝니다. 같은 날 안에서는 몇 번을 새로고침해도 결과가 같습니다. 날마다 다른 결과를 보여주려고 무작위로 뽑는 방식이 아니라, 생년월일과 날짜를 조합해 계산하기 때문입니다.",
  ],
  [
    "생년월일을 입력해도 안전한가요?",
    "입력한 값은 브라우저 안에서만 계산에 쓰입니다. 서버로 전송되지 않고 저장되지도 않습니다. 다음에 다시 열었을 때 편하도록 이 브라우저에만 값을 기억해 두며, 브라우저 저장소를 지우면 함께 사라집니다.",
  ],
  [
    "태어난 시간을 꼭 넣어야 하나요?",
    "오늘의 운세는 태어난 시간을 몰라도 볼 수 있습니다. 시간을 넣으면 사주 네 기둥이 모두 세워져 사주 풀이에서 더 자세한 해석이 나옵니다.",
  ],
  [
    "운세 점수는 무엇을 뜻하나요?",
    "생년월일과 오늘 날짜를 조합해 만든 지표입니다. 절대적인 좋고 나쁨이 아니라, 오늘 어느 영역에 신경을 더 쓰면 좋을지 가늠하는 참고 값으로 보시면 됩니다.",
  ],
];

export default function TodayFortunePage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "오늘의 운세 무료 | 생년월일로 보는 총운·연애·재물",
      description: "생년월일로 오늘의 총운과 분야별 지수를 확인하는 무료 운세.",
      path: "/fortune/today/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "오늘의 운세", href: "/fortune/today/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 오늘의 운세
        </div>
        <span className={styles.eyebrow}>무료 · 가입 없음</span>
        <h1>
          오늘의 운세
          <br />
          생년월일만 넣으면 됩니다
        </h1>
        <p>
          총운과 연애·재물·직장·건강 지수를 한 번에 확인합니다. 매일 0시에 갱신되고, 같은 날에는 몇 번을 봐도 결과가
          같습니다.
        </p>
      </header>

      <article className={styles.body}>
        <AdUnit position="testIntro" label="오늘의 운세 입력 전 광고" />

        <FortuneTool mode="today" />

        <section className={styles.answer}>
          <strong>오늘의 운세는 어떻게 계산하나요?</strong>
          <p>
            태어난 날의 간지(干支)와 오늘 날짜를 함께 계산해 흐름을 읽습니다. 무작위로 문구를 뽑는 방식이 아니라서,
            같은 사람이 같은 날 다시 열면 결과가 그대로입니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>운세 점수를 읽는 법</h2>
          <p>
            점수는 등수가 아니라 배분표에 가깝습니다. 오늘 재물운이 낮게 나왔다면 돈이 나간다는 뜻이라기보다, 지출
            결정을 미루는 편이 낫다는 신호로 읽으시면 됩니다.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>85점 이상</h3>
              <p>먼저 움직여도 되는 영역입니다. 미뤄둔 연락이나 제안이 있다면 오늘 꺼내보세요.</p>
            </div>
            <div className={styles.card}>
              <h3>65~84점</h3>
              <p>평소대로 진행해도 무리가 없습니다. 큰 변수 없이 흘러가는 구간입니다.</p>
            </div>
            <div className={styles.card}>
              <h3>50~64점</h3>
              <p>확인이 필요한 구간입니다. 숫자와 일정은 한 번 더 보고 넘어가세요.</p>
            </div>
            <div className={styles.card}>
              <h3>50점 미만</h3>
              <p>새로 벌이기보다 정리에 어울립니다. 결정을 하루 미뤄도 손해가 크지 않습니다.</p>
            </div>
          </div>
        </section>

        <AdUnit position="articleBody" label="오늘의 운세 본문 광고" />

        <section className={styles.section}>
          <h2>띠별로도 확인해 보세요</h2>
          <p>오늘의 운세가 하루의 흐름이라면, 띠별 운세는 한 해의 큰 방향입니다.</p>
          <div className={styles.chips}>
            {zodiacFortunes.map((zodiac) => (
              <a key={zodiac.slug} className={styles.chip} href={`/fortune/zodiac/${zodiac.slug}/`}>
                {zodiac.emoji} {zodiac.name}
              </a>
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
          오늘의 운세는 재미와 자기 점검을 위한 참고 자료입니다. 의료·법률·투자 판단을 대신하지 않으며, 결과를 근거로
          지출이나 계약을 결정하지 마세요.
        </aside>

        <section className={styles.cta}>
          <h2>타고난 기질도 궁금하다면</h2>
          <p>사주 네 기둥과 오행 분포로 나라는 사람의 결을 읽어봅니다.</p>
          <a href="/fortune/saju/">무료 사주 풀이 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
