import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import FortuneTool from "../../../components/FortuneTool";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { elementLabels, elementSymbols } from "../../../lib/fortune-engine";
import { elementBalanceNotes } from "../../../lib/fortune-readings";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "무료 사주 풀이 | 사주팔자 네 기둥·오행 분포 계산",
  description:
    "생년월일시로 사주 네 기둥과 여덟 글자, 오행 분포와 일간 성향을 무료로 계산합니다. 태어난 시간을 몰라도 세 기둥으로 볼 수 있습니다.",
  keywords: ["무료 사주", "사주 풀이", "사주팔자", "만세력", "사주 무료 보기", "오행 분포"],
  alternates: { canonical: "/fortune/saju/" },
  openGraph: {
    title: "무료 사주 풀이 | 네 기둥과 오행 분포",
    description: "생년월일시로 사주팔자를 바로 계산합니다.",
    url: "/fortune/saju/",
    type: "website",
  },
};

const faq: Array<[string, string]> = [
  [
    "사주팔자가 무엇인가요?",
    "태어난 연·월·일·시를 각각 천간과 지지 두 글자로 세운 것이 네 기둥(사주)이고, 그 여덟 글자가 팔자입니다. 이 여덟 글자의 오행 균형과 관계를 읽는 것이 사주 풀이입니다.",
  ],
  [
    "태어난 시간을 모르면 사주를 못 보나요?",
    "볼 수 있습니다. 시주를 세우지 않고 연·월·일 세 기둥으로 풀이합니다. 전체 흐름과 일간 성향은 그대로 확인할 수 있고, 시간을 알면 해석이 더 정밀해집니다.",
  ],
  [
    "일간이 왜 중요한가요?",
    "일간은 태어난 날의 천간으로, 사주에서 '나 자신'에 해당합니다. 나머지 일곱 글자는 모두 이 글자를 기준으로 관계를 따지기 때문에, 일간을 알면 풀이의 뼈대가 잡힙니다.",
  ],
  [
    "오행이 한쪽에 몰려 있으면 나쁜 건가요?",
    "아닙니다. 오행은 많고 적음보다 균형과 쓰임이 중요합니다. 한쪽이 강하면 그 방향의 힘이 크다는 뜻이고, 약한 오행은 의식적으로 채우면 됩니다.",
  ],
  [
    "음력 생일로 넣어야 하나요?",
    "양력 생년월일을 넣어주세요. 이 계산기는 양력을 기준으로 간지를 세웁니다.",
  ],
];

export default function SajuPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "무료 사주 풀이 | 사주팔자 네 기둥·오행 분포 계산",
      description: "생년월일시로 사주 네 기둥과 오행 분포, 일간 성향을 계산합니다.",
      path: "/fortune/saju/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "무료 사주", href: "/fortune/saju/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 무료 사주
        </div>
        <span className={styles.eyebrow}>사주팔자 · 만세력</span>
        <h1>
          무료 사주 풀이
          <br />
          네 기둥과 오행 분포
        </h1>
        <p>
          생년월일시를 넣으면 사주 네 기둥과 여덟 글자를 세우고, 오행이 어디에 몰려 있는지, 일간이 어떤 성향인지를
          함께 풀어드립니다. 태어난 시간을 몰라도 세 기둥으로 볼 수 있습니다.
        </p>
      </header>

      <article className={styles.body}>
        <AdUnit position="testIntro" label="사주 입력 전 광고" />

        <FortuneTool mode="saju" />

        <section className={styles.answer}>
          <strong>사주는 무엇을 보는 건가요?</strong>
          <p>
            태어난 시점의 기운을 여덟 글자로 옮겨 적은 뒤, 그 글자들이 서로 돕는지 누르는지를 읽습니다. 미래를 맞히는
            도구라기보다 타고난 기질과 지금의 균형을 보는 틀에 가깝습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>사주 네 기둥이란</h2>
          <p>
            연주는 뿌리와 집안, 월주는 자라온 환경과 사회적 조건, 일주는 나 자신과 배우자, 시주는 말년과 결과를
            상징합니다. 각 기둥은 위의 천간 한 글자와 아래의 지지 한 글자로 이뤄집니다.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>연주(年柱)</h3>
              <p>태어난 해의 기운입니다. 뿌리, 집안, 어린 시절의 조건을 봅니다.</p>
            </div>
            <div className={styles.card}>
              <h3>월주(月柱)</h3>
              <p>태어난 달의 기운입니다. 사주 전체의 계절을 정하는 가장 중요한 기둥으로 봅니다.</p>
            </div>
            <div className={styles.card}>
              <h3>일주(日柱)</h3>
              <p>태어난 날의 기운입니다. 위의 천간이 곧 &lsquo;나&rsquo;를 뜻하는 일간입니다.</p>
            </div>
            <div className={styles.card}>
              <h3>시주(時柱)</h3>
              <p>태어난 시각의 기운입니다. 결과와 말년, 자녀를 보는 자리로 읽습니다.</p>
            </div>
          </div>
        </section>

        <AdUnit position="articleBody" label="사주 본문 광고" />

        <section className={styles.section}>
          <h2>오행 다섯 가지</h2>
          <p>
            여덟 글자는 각각 목·화·토·금·수 다섯 기운 가운데 하나에 속합니다. 어느 하나가 많거나 적은 것 자체는
            좋고 나쁨이 아니며, 전체의 균형과 쓰임이 중요합니다.
          </p>
          {elementLabels.map((label, index) => (
            <div key={label}>
              <h3>
                {elementSymbols[index]} {label}
              </h3>
              <p>{elementBalanceNotes[index].strong}</p>
              <p>{elementBalanceNotes[index].weak}</p>
            </div>
          ))}
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
          이 계산기는 절기가 아닌 양력 월을 기준으로 월주를 세우는 간이 방식을 씁니다. 절입일 부근에 태어난 경우
          월주가 한 칸 달라질 수 있으며, 정밀한 감정은 전문 역술 자료를 참고하세요. 사주 풀이는 자기이해를 돕는
          참고 자료이며 의료·법률·투자 판단을 대신하지 않습니다.
        </aside>

        <section className={styles.cta}>
          <h2>사주와 MBTI를 나란히 보면</h2>
          <p>타고난 결과 지금의 선택이 어디서 갈리는지 네 축으로 비교해 봅니다.</p>
          <a href="/fortune/saju-mbti/">사주 MBTI 비교하기 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
