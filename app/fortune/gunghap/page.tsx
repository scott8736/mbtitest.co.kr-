import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import CoupleFortuneTool from "../../../components/CoupleFortuneTool";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "무료 사주 궁합 | 두 사람 생년월일로 보는 궁합",
  description:
    "두 사람의 생년월일만 넣으면 일간 오행 관계와 띠 궁합, 서로 채워 주는 기운까지 무료로 봅니다. 태어난 시간을 몰라도 볼 수 있습니다.",
  keywords: ["사주 궁합", "무료 궁합", "궁합보기", "생년월일 궁합", "커플 궁합", "결혼 궁합"],
  alternates: { canonical: "/fortune/gunghap/" },
  openGraph: {
    title: "무료 사주 궁합 | 생년월일로 보는 두 사람의 궁합",
    description: "일간 오행 관계와 띠 궁합을 바로 계산합니다.",
    url: "/fortune/gunghap/",
    type: "website",
    images: [{ url: "/images/og/mbti-test-share.jpg", width: 1200, height: 630 }],
  },
};

const faq: Array<[string, string]> = [
  [
    "궁합은 무엇을 보는 건가요?",
    "두 사람의 사주에서 '나 자신'에 해당하는 일간의 오행이 서로 돕는지 누르는지, 띠가 묶이는지 부딪히는지, 그리고 한쪽에 모자란 기운을 다른 쪽이 갖고 있는지를 봅니다. 관계의 결말을 맞히는 것이 아니라 어디에서 손이 더 가는지를 미리 보는 틀입니다.",
  ],
  [
    "태어난 시간을 몰라도 되나요?",
    "됩니다. 궁합은 일간과 띠를 중심으로 보기 때문에 태어난 시간이 없어도 계산됩니다. 시간을 알면 개인 사주 풀이가 더 정밀해지지만 궁합 자체는 세 기둥으로 충분합니다.",
  ],
  [
    "음력으로 넣어야 하나요?",
    "양력 생년월일을 넣어주세요. 이 계산기는 양력을 기준으로 간지를 세웁니다.",
  ],
  [
    "궁합이 나쁘면 헤어져야 하나요?",
    "아닙니다. 점수가 낮게 나오는 조합은 대개 '알아서 맞춰지지는 않는다'는 뜻입니다. 규칙을 정하면 조용해지는 관계가 많고, 반대로 점수가 높아도 확인하는 습관이 없으면 기울어집니다.",
  ],
  [
    "입력한 생년월일이 저장되나요?",
    "저장되지 않습니다. 계산은 이용자의 브라우저 안에서 이뤄지며 생년월일이 서버로 전송되지 않습니다.",
  ],
];

export default function GunghapPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "무료 사주 궁합 | 두 사람 생년월일로 보는 궁합",
      description: "일간 오행 관계와 띠 궁합, 서로 채워 주는 기운을 계산합니다.",
      path: "/fortune/gunghap/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "사주 궁합", href: "/fortune/gunghap/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 사주 궁합
        </div>
        <span className={styles.eyebrow}>사주 궁합 · 생년월일</span>
        <h1>
          무료 사주 궁합
          <br />
          두 사람의 기운이 만나는 자리
        </h1>
        <p>
          두 사람의 생년월일을 넣으면 일간 오행이 서로 돕는지 누르는지, 띠가 묶이는지 부딪히는지, 한쪽에 모자란 기운을
          다른 쪽이 채워 주는지까지 함께 봅니다. 태어난 시간은 몰라도 됩니다.
        </p>
      </header>

      <article className={styles.body}>
        <AdUnit position="testIntro" label="궁합 입력 전 광고" />

        <CoupleFortuneTool />

        <section className={styles.answer}>
          <strong>궁합은 등급이 아닙니다</strong>
          <p>
            궁합을 보러 오는 분들이 가장 먼저 묻는 것은 좋은지 나쁜지입니다. 그런데 사주에서 궁합은 합격과 불합격이
            아니라 두 사람이 서로를 어떻게 쓰게 되는지에 가깝습니다. 잘 맞는 조합은 손이 덜 가고, 덜 맞는 조합은
            손이 더 갑니다. 손이 더 간다고 못 사는 것은 아닙니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>무엇을 보고 계산하나</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>일간 오행 관계</h3>
              <p>
                일간은 태어난 날의 천간으로 사주에서 &lsquo;나 자신&rsquo;입니다. 두 사람의 일간 오행이 서로 생하는지
                극하는지를 봅니다. 생하는 쪽은 흐름이 편하고, 극하는 쪽은 부딪히는 지점이 분명합니다.
              </p>
            </div>
            <div className={styles.card}>
              <h3>띠 관계</h3>
              <p>
                띠끼리 삼합이나 육합으로 묶이면 같은 방향을 보는 조합으로 읽고, 여섯 칸 떨어져 충하면 부딪히는
                자리로 읽습니다. 충이 곧 나쁨은 아니며 서로를 움직이게 하는 조합으로 보기도 합니다.
              </p>
            </div>
            <div className={styles.card}>
              <h3>오행 보완</h3>
              <p>
                한쪽 사주에 아예 없는 오행을 다른 쪽이 넉넉히 갖고 있으면 보완으로 봅니다. 상대가 잘하는 일과 내가
                잘하는 일이 갈린다는 뜻이라, 역할을 나누면 편해집니다.
              </p>
            </div>
          </div>
        </section>

        <AdUnit position="articleBody" label="궁합 본문 광고" />

        <section className={styles.section}>
          <h2>오행이 서로 돕고 누르는 순서</h2>
          <p>
            상생은 목생화, 화생토, 토생금, 금생수, 수생목 순으로 돕는 흐름입니다. 상극은 목극토, 화극금, 토극수,
            금극목, 수극화로 누르는 관계입니다. 궁합에서 상생은 편안함으로, 상극은 긴장으로 나타나지만 긴장이 늘
            나쁜 것은 아닙니다. 둘 다 느슨해지면 관계가 멈추기도 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>자주 묻는 질문</h2>
          {faq.map(([q, a]) => (
            <div className={styles.card} key={q} style={{ marginBottom: 12 }}>
              <h3>{q}</h3>
              <p>{a}</p>
            </div>
          ))}
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
