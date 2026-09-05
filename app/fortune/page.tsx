import type { Metadata } from "next";
import AdUnit from "../../components/AdUnit";
import ContentHeader from "../../components/ContentHeader";
import SiteFooter from "../../components/SiteFooter";
import { fortuneEntries, breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../lib/fortune-catalog";
import { zodiacFortunes } from "../../lib/fortune-zodiac";
import { starSigns } from "../../lib/fortune-star-signs";
import { dreamEntries } from "../../lib/fortune-dreams";
import styles from "../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "무료 운세 | 오늘의 운세·사주·띠별·별자리·꿈해몽",
  description:
    "가입 없이 보는 무료 운세 모음입니다. 생년월일로 보는 오늘의 운세와 사주 풀이, 12띠·12별자리 운세, 꿈해몽 사전을 한 곳에서 확인하세요.",
  keywords: [
    "무료 운세",
    "오늘의 운세",
    "무료 사주",
    "띠별 운세",
    "별자리 운세",
    "꿈해몽",
    "2027 신년운세",
  ],
  alternates: { canonical: "/fortune/" },
  openGraph: {
    title: "무료 운세 | 오늘의 운세·사주·띠별·별자리·꿈해몽",
    description: "생년월일로 보는 오늘의 운세와 사주 풀이, 띠별·별자리 운세, 꿈해몽을 한 곳에서.",
    url: "/fortune/",
    type: "website",
  },
};

const faq: Array<[string, string]> = [
  [
    "운세를 보려면 회원가입을 해야 하나요?",
    "아니요. 이 사이트의 운세는 모두 가입이나 결제 없이 볼 수 있습니다. 생년월일은 브라우저 안에서만 계산에 쓰이고 서버로 저장되지 않습니다.",
  ],
  [
    "사주와 띠별 운세는 무엇이 다른가요?",
    "띠별 운세는 태어난 해 하나만 보고 12가지로 나눠 읽습니다. 사주는 연·월·일·시 네 기둥을 모두 세워 오행의 균형까지 보기 때문에 훨씬 개인화된 풀이가 나옵니다.",
  ],
  [
    "태어난 시간을 모르면 사주를 볼 수 없나요?",
    "볼 수 있습니다. 시주를 세우지 않고 연·월·일 세 기둥만으로 풀이합니다. 전체 흐름과 일간 성향은 그대로 확인할 수 있고, 시간을 알면 해석이 더 정밀해집니다.",
  ],
  [
    "운세 결과를 그대로 믿어도 되나요?",
    "재미와 자기이해를 위한 참고 자료로 보시길 권합니다. 이 사이트의 운세는 전통 명리 규칙에 따라 계산한 결과와 일반적인 해석을 함께 보여줄 뿐, 의료·법률·투자 판단을 대신하지 않습니다.",
  ],
];

export default function FortuneHubPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "무료 운세 | 오늘의 운세·사주·띠별·별자리·꿈해몽",
      description: "생년월일로 보는 오늘의 운세와 사주 풀이, 12띠·12별자리 운세, 꿈해몽 사전.",
      path: "/fortune/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / 무료 운세
        </div>
        <span className={styles.eyebrow}>FORTUNE</span>
        <h1>
          무료 운세
          <br />
          오늘의 운세부터 사주까지
        </h1>
        <p>
          가입도 결제도 없습니다. 생년월일만 있으면 오늘의 운세와 사주 네 기둥을 바로 계산하고, 띠별·별자리 운세와
          꿈해몽까지 한 자리에서 확인할 수 있습니다.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/today/">오늘의 운세 보기</a>
          <a href="/fortune/saju/">무료 사주 풀이</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>어떤 운세부터 보면 좋을까요?</strong>
          <p>
            오늘 하루가 궁금하면 오늘의 운세, 나라는 사람의 기질이 궁금하면 사주 풀이입니다. 태어난 해만 알아도
            띠별 운세를 볼 수 있고, 어젯밤 꾼 꿈이 마음에 남았다면 꿈해몽 사전에서 찾아보세요.
          </p>
        </section>

        <AdUnit position="articleTop" label="운세 허브 상단 광고" />

        <section className={styles.section}>
          <h2>운세 메뉴</h2>
          <div className={styles.tileGrid}>
            {fortuneEntries.map((entry) => (
              <a key={entry.href} className={styles.tile} href={entry.href}>
                <b>{entry.emoji}</b>
                <strong>{entry.title}</strong>
                <span>{entry.description}</span>
                <i>{entry.kind === "tool" ? "바로 계산하기 →" : "자세히 보기 →"}</i>
              </a>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>띠별 운세 바로가기</h2>
          <p>
            태어난 해로 정해지는 12띠입니다. 입춘(2월 4일경) 이전에 태어났다면 사주에서는 전 해의 띠로 보는
            관습이 있어, 계산기에서는 이 기준을 함께 적용합니다.
          </p>
          <div className={styles.chips}>
            {zodiacFortunes.map((zodiac) => (
              <a key={zodiac.slug} className={styles.chip} href={`/fortune/zodiac/${zodiac.slug}/`}>
                {zodiac.emoji} {zodiac.name}
              </a>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>별자리 운세 바로가기</h2>
          <p>생일이 별자리 경계에 걸쳐 있다면 해마다 하루 정도 차이가 날 수 있습니다. 각 페이지에 기간을 적어두었습니다.</p>
          <div className={styles.chips}>
            {starSigns.map((sign) => (
              <a key={sign.slug} className={styles.chip} href={`/fortune/star-sign/${sign.slug}/`}>
                {sign.symbol} {sign.name}
              </a>
            ))}
          </div>
        </section>

        <AdUnit position="articleBody" label="운세 허브 본문 광고" />

        <section className={styles.section}>
          <h2>많이 찾는 꿈해몽</h2>
          <div className={styles.chips}>
            {dreamEntries.slice(0, 14).map((dream) => (
              <a key={dream.slug} className={styles.chip} href={`/fortune/dream/${dream.slug}/`}>
                {dream.emoji} {dream.title}
              </a>
            ))}
            <a className={styles.chip} href="/fortune/dream/">
              전체 보기 →
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2>운세와 성격 검사를 함께 보면</h2>
          <p>
            사주가 태어난 시점의 기운으로 기질을 읽는다면, MBTI는 지금의 내가 선택하는 방식을 묻습니다. 두 가지를
            나란히 놓으면 &ldquo;타고난 결&rdquo;과 &ldquo;지금의 습관&rdquo;이 어디서 갈라지는지 보입니다.
          </p>
          <div className={styles.actions}>
            <a href="/fortune/saju-mbti/">사주 MBTI 비교하기</a>
            <a href="/tests/mbti/">무료 MBTI 검사</a>
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
          이 페이지의 운세는 전통 명리·점성 규칙에 따라 계산한 결과와 일반적인 해석을 함께 제공하는 참고 자료입니다.
          의료·법률·투자 판단을 대신하지 않으며, 입력한 생년월일은 브라우저 안에서만 계산에 쓰이고 서버에 저장되지 않습니다.
        </aside>

        <section className={styles.cta}>
          <h2>생년월일만 있으면 됩니다</h2>
          <p>오늘의 총운과 연애·재물·직장·건강 지수를 30초 만에 확인해 보세요.</p>
          <a href="/fortune/today/">오늘의 운세 보러 가기 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
