import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import { zodiacFortunes, birthYears, zodiacIndex, samjaeSlugs, zodiacName } from "../../../lib/fortune-zodiac";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "2027 신년운세 | 정미년 띠별 운세·삼재 총정리",
  description:
    "2027년은 정미년, 붉은 양의 해입니다. 정미년이 어떤 해인지, 12띠별로 무엇이 달라지는지, 삼재와 본명년은 어느 띠인지 한 번에 정리했습니다.",
  keywords: ["2027 신년운세", "2027년 운세", "정미년", "2027 토정비결", "2027 띠별운세", "2027 삼재"],
  alternates: { canonical: "/fortune/2027/" },
  openGraph: {
    title: "2027 신년운세 | 정미년 띠별 운세 총정리",
    description: "붉은 양의 해, 2027 정미년의 흐름과 12띠별 운세.",
    url: "/fortune/2027/",
    type: "article",
  },
};

const faq: Array<[string, string]> = [
  [
    "2027년은 무슨 해인가요?",
    "2027년은 육십갑자로 정미년(丁未年), 붉은 양의 해입니다. 천간의 정화(丁火)와 지지의 미토(未土)가 만나 불의 기운이 흙을 데우는 구조라, 크게 벌이기보다 다져서 형태를 만드는 해로 읽습니다.",
  ],
  [
    "2027년 삼재는 어느 띠인가요?",
    "해묘미(亥卯未)에 해당하는 돼지띠·토끼띠·양띠입니다. 2025년 들삼재, 2026년 눌삼재를 지나 2027년이 날삼재로 마무리되는 해입니다. 마지막 해는 부담이 커지는 시기가 아니라 정리되는 시기로 봅니다.",
  ],
  [
    "2027년 본명년은 어느 띠인가요?",
    "양띠입니다. 자기 띠와 같은 해를 본명년이라 하며, 기운이 강해지는 만큼 이사·이직·관계 정리처럼 자리를 바꾸는 변화가 몰리기 쉽습니다.",
  ],
  [
    "신년운세는 언제 보는 것이 맞나요?",
    "사주에서 한 해의 시작은 양력 1월 1일이 아니라 입춘입니다. 2027년 운세는 2027년 입춘(2월 4일경)부터 적용된다고 보는 것이 일반적입니다. 그 이전은 아직 병오년의 흐름으로 읽습니다.",
  ],
];

export default function Year2027Page() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "2027 신년운세 | 정미년 띠별 운세·삼재 총정리",
      description: "붉은 양의 해, 2027 정미년의 흐름과 12띠별 운세 정리.",
      path: "/fortune/2027/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "2027 신년운세", href: "/fortune/2027/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 2027 신년운세
        </div>
        <span className={styles.eyebrow}>丁未年 · 붉은 양의 해</span>
        <h1>
          2027 신년운세
          <br />
          정미년은 어떤 해인가
        </h1>
        <p>
          2027년은 정미년입니다. 불의 기운인 정화(丁火)가 흙의 기운인 미토(未土)를 데우는 해라, 확장보다 다지기에
          어울립니다. 12띠별로 무엇이 달라지는지 아래에서 확인하세요.
        </p>
        <div className={styles.actions}>
          <a href="/fortune/saju/">내 사주로 자세히 보기</a>
          <a href="/fortune/zodiac/">띠별 운세 전체 보기</a>
        </div>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>2027 정미년, 한 줄로 말하면</strong>
          <p>
            벌리는 해가 아니라 <strong>정리해서 형태를 만드는 해</strong>입니다. 새로 세 가지를 시작하는 것보다 지금
            하고 있는 하나를 끝내는 쪽이 훨씬 큰 결과로 돌아옵니다.
          </p>
        </section>

        <AdUnit position="articleTop" label="2027 신년운세 상단 광고" />

        <nav className={styles.toc} aria-label="페이지 목차">
          <a href="#meaning">정미년의 의미</a>
          <a href="#flow">한 해의 흐름</a>
          <a href="#samjae">삼재와 본명년</a>
          <a href="#zodiac">띠별 운세</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>

        <section id="meaning" className={styles.section}>
          <h2>정미년(丁未年)은 어떤 해인가</h2>
          <p>
            육십갑자는 천간 열 글자와 지지 열두 글자가 짝을 이뤄 60년마다 한 바퀴를 돕니다. 2027년의 짝은 정(丁)과
            미(未)입니다. 정화는 큰 불이 아니라 촛불이나 화롯불처럼 오래 은근하게 타는 불이고, 미토는 여름 끝의
            메마르고 따뜻한 흙입니다.
          </p>
          <p>
            불이 흙을 생(生)하는 구조라 기운이 밖으로 터지지 않고 안으로 쌓입니다. 그래서 정미년은 눈에 띄는 도약보다
            &ldquo;조용하지만 단단한 성장&rdquo;에 어울리는 해로 해석합니다. 색으로는 붉은색, 동물로는 양이라 흔히
            <strong> 붉은 양의 해</strong>라고 부릅니다.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>이 해에 잘 맞는 일</h3>
              <ul>
                <li>벌여둔 일 가운데 하나를 끝까지 마무리하기</li>
                <li>계약·문서·정산처럼 형태를 확정하는 일</li>
                <li>배운 것을 정리해 자격이나 결과물로 만들기</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>이 해에 조심할 일</h3>
              <ul>
                <li>빠른 수익을 약속하는 제안</li>
                <li>준비 없이 벌이는 확장과 창업</li>
                <li>정에 이끌린 보증과 큰 금액의 대여</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="flow" className={styles.section}>
          <h2>2027년 한 해의 흐름</h2>
          <p>
            사주에서 한 해는 양력 1월 1일이 아니라 입춘부터 시작합니다. 2027년 운세는 2027년 2월 4일 무렵부터
            적용된다고 보는 것이 일반적입니다.
          </p>
          <h3>상반기 — 정리와 정산</h3>
          <p>
            지난 두 해에 걸쳐 미뤄둔 문제가 결론에 닿습니다. 인간관계, 직업, 재산, 결혼처럼 오래 끌던 일들의 방향이
            정해지는 시기라 마음이 무겁게 느껴질 수 있지만, 대부분 정리되는 쪽으로 흐릅니다.
          </p>
          <h3>하반기 — 다지기와 재출발</h3>
          <p>
            상반기에 정리를 끝낸 사람에게는 하반기부터 새 계획을 세울 여유가 생깁니다. 이 해에 다져둔 기반이 다음
            해의 움직임을 결정하므로, 화려한 결과보다 남는 구조를 만드는 데 시간을 쓰는 편이 유리합니다.
          </p>
        </section>

        <AdUnit position="articleBody" label="2027 신년운세 본문 광고" />

        <section id="samjae" className={styles.section}>
          <h2>2027년 삼재와 본명년</h2>
          <h3>삼재 — {samjaeSlugs.map(zodiacName).join(" · ")}</h3>
          <p>
            삼재는 세 해에 걸쳐 들어왔다 나가는 흐름입니다. 해묘미(亥卯未)생인 돼지띠·토끼띠·양띠는 2025년
            들삼재로 시작해 2026년 눌삼재를 지나, 2027년 날삼재로 삼재가 끝납니다. 마지막 해는 부담이 더해지는 해가
            아니라 그동안의 고생이 마무리되는 해로 봅니다.
          </p>
          <h3>본명년 — 양띠</h3>
          <p>
            2027년은 양띠의 본명년입니다. 자기 띠와 같은 해에는 기운이 강해지는 대신 변화의 폭도 커져, 예로부터
            본명년에는 크게 벌이기보다 자기 관리와 정리에 무게를 두라고 전해집니다.
          </p>
          <div className={styles.chips}>
            {samjaeSlugs.map((slug) => (
              <a key={slug} className={styles.chip} href={`/fortune/zodiac/${slug}/`}>
                {zodiacName(slug)} 자세히 보기 →
              </a>
            ))}
          </div>
        </section>

        <section id="zodiac" className={styles.section}>
          <h2>2027 정미년 띠별 운세</h2>
          <p>띠를 눌러 총운과 연애·재물·직장·건강 운세를 자세히 확인하세요.</p>
          {zodiacFortunes.map((zodiac) => (
            <div key={zodiac.slug}>
              <h3>
                {zodiac.emoji} {zodiac.name} — {birthYears(zodiacIndex(zodiac.slug), 1960, 2020).join(", ")}년생
              </h3>
              <p>{zodiac.yearOverview}</p>
              <p>
                <a href={`/fortune/zodiac/${zodiac.slug}/`}>{zodiac.name} 2027년 운세 자세히 보기 →</a>
              </p>
            </div>
          ))}
        </section>

        <section id="faq" className={styles.section}>
          <h2>자주 묻는 질문</h2>
          {faq.map(([question, answer]) => (
            <div key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <aside className={styles.notice}>
          신년운세는 육십갑자와 12지의 관계에서 나온 큰 흐름입니다. 같은 띠여도 태어난 달·일·시에 따라 해석이
          달라지므로, 개인의 상황은 네 기둥을 모두 세운 사주 풀이로 확인하시길 권합니다.
        </aside>

        <section className={styles.cta}>
          <h2>내 사주로 2027년을 보려면</h2>
          <p>생년월일시를 넣으면 네 기둥과 오행 분포, 일간 성향을 바로 계산합니다.</p>
          <a href="/fortune/saju/">무료 사주 풀이 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
