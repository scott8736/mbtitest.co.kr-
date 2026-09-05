import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import FortuneTool from "../../../components/FortuneTool";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "사주 MBTI | 사주로 본 기질과 내 MBTI 비교",
  description:
    "사주의 오행 분포를 MBTI 네 축으로 옮겨 내가 아는 MBTI와 비교합니다. 타고난 결과 지금의 선택이 어디서 갈리는지 확인해 보세요.",
  keywords: ["사주 MBTI", "사주 성격", "MBTI 사주", "오행 MBTI", "사주로 보는 성격"],
  alternates: { canonical: "/fortune/saju-mbti/" },
  openGraph: {
    title: "사주 MBTI | 사주로 본 기질과 내 MBTI 비교",
    description: "오행 분포를 MBTI 네 축으로 옮겨 비교합니다.",
    url: "/fortune/saju-mbti/",
    type: "website",
  },
};

const faq: Array<[string, string]> = [
  [
    "사주 MBTI는 공식 검사인가요?",
    "아닙니다. 사주의 오행 기질과 MBTI의 네 축을 나란히 놓고 비교해 보기 위해 만든 콘텐츠입니다. 학술적으로 검증된 변환식이 아니며, 공식 MBTI® 평가를 대신하지 않습니다.",
  ],
  [
    "사주와 MBTI 결과가 다르면 어느 쪽이 맞나요?",
    "어느 한쪽이 틀린 것이 아닙니다. 사주는 태어난 시점의 기운으로 타고난 결을 읽고, MBTI는 지금의 내가 선택하는 방식을 묻습니다. 두 결과가 갈리는 축은 대개 환경에 맞추며 만들어진 습관을 보여줍니다.",
  ],
  [
    "오행을 어떻게 MBTI 축으로 바꾸나요?",
    "목은 뻗어나가는 계획, 화는 밖으로 향하는 표현, 토는 손에 잡히는 현실, 금은 기준과 결단, 수는 안으로 스미는 사색이라는 전통적 기질 해석을 MBTI 네 축과 짝지었습니다. 결과 화면에 계산 방식을 그대로 공개합니다.",
  ],
  [
    "내 MBTI를 모르면 어떻게 하나요?",
    "먼저 무료 MBTI 검사로 유형을 확인한 뒤 다시 오시면 됩니다. 40개 문항으로 약 4분이면 끝납니다.",
  ],
];

export default function SajuMbtiPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "사주 MBTI | 사주로 본 기질과 내 MBTI 비교",
      description: "사주의 오행 분포를 MBTI 네 축으로 옮겨 비교합니다.",
      path: "/fortune/saju-mbti/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "사주 MBTI", href: "/fortune/saju-mbti/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 사주 MBTI
        </div>
        <span className={styles.eyebrow}>사주 × MBTI</span>
        <h1>
          사주 MBTI
          <br />
          타고난 결과 지금의 나
        </h1>
        <p>
          사주의 오행 분포를 MBTI 네 축으로 옮겨, 내가 아는 내 유형과 얼마나 겹치는지 비교합니다. 어긋나는 축이
          오히려 지금 무엇에 힘을 쓰고 있는지를 알려줍니다.
        </p>
      </header>

      <article className={styles.body}>
        <AdUnit position="testIntro" label="사주 MBTI 입력 전 광고" />

        <FortuneTool mode="saju-mbti" />

        <section className={styles.answer}>
          <strong>왜 사주와 MBTI를 함께 보나요?</strong>
          <p>
            사주는 태어난 시점의 기운으로 <strong>타고난 결</strong>을 읽고, MBTI는 지금의 내가 어떤 방식을{" "}
            <strong>선택하는지</strong>를 묻습니다. 질문이 다르기 때문에 결과가 갈리는 지점이 생기고, 그 지점이 가장
            많은 것을 알려줍니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>오행과 MBTI 네 축</h2>
          <p>
            오행에는 예로부터 기질이 함께 붙어 있었습니다. 아래 대응은 그 전통적 해석을 MBTI의 네 축과 짝지은
            것입니다. 계산식을 감추지 않고 그대로 공개하니, 동의하지 않는 부분은 참고만 하셔도 됩니다.
          </p>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>🌳 목(木) — 계획과 가능성</h3>
              <p>뻗어나가는 기운입니다. 아직 오지 않은 것을 그리는 쪽이라 직관(N)과 인식(P)에 가깝습니다.</p>
            </div>
            <div className={styles.card}>
              <h3>🔥 화(火) — 표현과 확산</h3>
              <p>밖으로 향하는 기운입니다. 외향(E)과 감정(F)의 결에 가깝습니다.</p>
            </div>
            <div className={styles.card}>
              <h3>🏔️ 토(土) — 현실과 안정</h3>
              <p>가운데를 잡아주는 기운입니다. 감각(S)과 판단(J)의 결에 가깝습니다.</p>
            </div>
            <div className={styles.card}>
              <h3>⚡ 금(金) — 기준과 결단</h3>
              <p>끊고 맺는 기운입니다. 사고(T)와 판단(J)의 결에 가깝습니다.</p>
            </div>
            <div className={styles.card}>
              <h3>💧 수(水) — 사색과 유연</h3>
              <p>안으로 스미는 기운입니다. 내향(I)과 인식(P)의 결에 가깝습니다.</p>
            </div>
            <div className={styles.card}>
              <h3>비교하는 방법</h3>
              <p>
                네 축마다 양쪽 점수를 계산해 높은 쪽을 고르고, 내가 선택한 MBTI와 글자를 맞춰봅니다. 네 축 중 몇
                개가 같은지가 결과로 나옵니다.
              </p>
            </div>
          </div>
        </section>

        <AdUnit position="articleBody" label="사주 MBTI 본문 광고" />

        <section className={styles.section}>
          <h2>결과를 읽는 법</h2>
          <h3>네 축이 모두 같다면</h3>
          <p>
            타고난 결과 지금의 선택이 크게 어긋나지 않는 상태입니다. 자기 방식대로 살고 있다는 뜻이라 에너지 소모가
            적은 편입니다.
          </p>
          <h3>두세 축이 다르다면</h3>
          <p>
            흔한 경우입니다. 환경에 맞추며 만들어진 습관이 사주의 결과 다른 방향으로 굳은 것입니다. 어느 쪽이 진짜
            나인지 고를 필요는 없고, 지금 어디에 힘이 들어가 있는지를 아는 것으로 충분합니다.
          </p>
          <h3>네 축이 모두 다르다면</h3>
          <p>
            지금의 역할이 타고난 결과 많이 다르다는 신호일 수 있습니다. 오래 유지하면 소진되기 쉬우니, 회복하는
            방식만큼은 사주 쪽 결에 맞춰 보시길 권합니다.
          </p>
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
          사주 MBTI는 두 가지 상징 체계를 나란히 놓고 보는 콘텐츠입니다. 학술적으로 검증된 변환이 아니며, 공식
          MBTI® 평가나 심리 진단을 대신하지 않습니다.
        </aside>

        <section className={styles.cta}>
          <h2>내 MBTI를 아직 모른다면</h2>
          <p>40개 질문으로 네 가지 성향 지표를 먼저 확인해 보세요.</p>
          <a href="/tests/mbti/">무료 MBTI 검사 시작 →</a>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
