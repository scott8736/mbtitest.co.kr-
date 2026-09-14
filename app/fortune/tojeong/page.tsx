import type { Metadata } from "next";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import LunarConverter from "../../../components/LunarConverter";
import { breadcrumbJsonLd, faqJsonLd, articleJsonLd, graph } from "../../../lib/fortune-catalog";
import styles from "../../../lib/fortune.module.css";

export const metadata: Metadata = {
  title: "토정비결 보는 법 | 괘 구하는 방법과 음력 변환기",
  description:
    "토정비결은 음력 생년월일로 상괘·중괘·하괘를 구해 144괘 중 하나를 봅니다. 계산 방식과 준비물, 양력 음력 변환기를 함께 정리했습니다.",
  keywords: ["토정비결", "토정비결 보는 법", "토정비결 괘", "음력 변환", "양력 음력 변환기", "신년운세"],
  alternates: { canonical: "/fortune/tojeong/" },
  openGraph: {
    title: "토정비결 보는 법 | 괘 구하는 방법과 음력 변환기",
    description: "상괘·중괘·하괘를 구하는 방식과 음력 변환기를 함께 정리했습니다.",
    url: "/fortune/tojeong/",
    type: "website",
    images: [{ url: "/images/og/mbti-test-share.jpg", width: 1200, height: 630 }],
  },
};

const faq: Array<[string, string]> = [
  [
    "토정비결은 무엇인가요?",
    "음력 생년월일로 세 자리 괘를 구해 그 해의 운을 보는 책입니다. 상괘·중괘·하괘를 각각 구해 붙이면 111부터 863까지 144가지 괘 중 하나가 나오고, 괘마다 그 해의 총운과 월별 운이 붙어 있습니다. 조선 명종 때 토정 이지함이 지었다고 전해지지만, 실제 저자에 대해서는 다른 견해도 있습니다.",
  ],
  [
    "토정비결 괘는 어떻게 구하나요?",
    "상괘는 나이와 그 해의 태세수를 더해 8로 나눈 나머지, 중괘는 태어난 음력 달의 날수와 월건수를 더해 6으로 나눈 나머지, 하괘는 음력 생일과 일진수를 더해 3으로 나눈 나머지입니다. 나머지가 0이면 각각 8, 6, 3으로 봅니다. 태세수·월건수·일진수는 간지별 조견표에서 찾습니다.",
  ],
  [
    "왜 음력이 필요한가요?",
    "토정비결은 음력 생월과 생일을 그대로 계산에 넣습니다. 양력 날짜를 넣으면 중괘와 하괘가 달라져 다른 괘가 나옵니다. 이 페이지의 변환기로 음력 생일을 먼저 확인하세요.",
  ],
  [
    "토정비결은 언제 보나요?",
    "그 해의 운을 보는 책이라 보통 설을 전후해 봅니다. 계산에 그 해의 태세수가 들어가므로 해가 바뀌면 괘도 바뀝니다.",
  ],
  [
    "사이트마다 괘가 다르게 나옵니다.",
    "토정비결은 판본마다 조견표와 해설이 조금씩 다릅니다. 나이를 세는 방식(한국 나이인지 만 나이인지)이나 윤달 처리에서도 갈립니다. 같은 사람이 다른 괘를 받는 일이 드물지 않습니다.",
  ],
  [
    "토정비결과 사주는 같은 건가요?",
    "다릅니다. 사주는 태어난 연·월·일·시를 여덟 글자로 세워 타고난 기질과 균형을 봅니다. 토정비결은 그 해 하나의 운을 144괘 중 하나로 보는 연운(年運) 책입니다.",
  ],
];

export default function TojeongPage() {
  const jsonLd = graph(
    articleJsonLd({
      headline: "토정비결 보는 법 | 괘 구하는 방법과 음력 변환기",
      description: "상괘·중괘·하괘 계산 방식과 음력 변환기를 정리했습니다.",
      path: "/fortune/tojeong/",
    }),
    breadcrumbJsonLd([
      { name: "MBTI 검사", href: "/" },
      { name: "무료 운세", href: "/fortune/" },
      { name: "토정비결", href: "/fortune/tojeong/" },
    ]),
    faqJsonLd(faq),
  );

  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / 토정비결
        </div>
        <span className={styles.eyebrow}>토정비결 · 음력</span>
        <h1>
          토정비결 보는 법
          <br />
          괘를 구하는 순서와 음력 변환
        </h1>
        <p>
          토정비결은 음력 생년월일로 상괘·중괘·하괘를 구해 144괘 중 하나를 봅니다. 계산에 쓰는 것이 양력이 아니라
          음력이라, 먼저 자기 음력 생일부터 확인해야 합니다.
        </p>
      </header>

      <article className={styles.body}>
        <section className={styles.answer}>
          <strong>먼저 답부터</strong>
          <p>
            토정비결의 괘는 세 자리 숫자입니다. 상괘(1~8), 중괘(1~6), 하괘(1~3)를 차례로 붙여 111부터 863까지
            144가지가 나오고, 괘마다 그 해의 총운과 월별 운이 적혀 있습니다. 세 괘 모두 음력 날짜와 그 해의 간지에서
            나오는 수를 써서 구합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>내 음력 생일부터 확인하기</h2>
          <p>
            토정비결은 음력 생월과 생일을 그대로 계산에 넣습니다. 양력으로 넣으면 중괘와 하괘가 달라져 아예 다른
            괘가 나옵니다. 아래에서 먼저 바꿔 보세요.
          </p>
        </section>

        <LunarConverter />

        <AdUnit position="articleBody" label="토정비결 본문 광고" />

        <section className={styles.section}>
          <h2>괘를 구하는 방식</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>상괘 (1~8)</h3>
              <p>
                나이에 그 해의 태세수를 더해 8로 나눈 나머지입니다. 나머지가 0이면 8로 봅니다. 태세수는 그 해
                간지에 해당하는 수를 조견표에서 찾습니다.
              </p>
            </div>
            <div className={styles.card}>
              <h3>중괘 (1~6)</h3>
              <p>
                태어난 음력 달의 날수(29일 또는 30일)에 월건수를 더해 6으로 나눈 나머지입니다. 나머지가 0이면
                6으로 봅니다. 생월 숫자가 아니라 그 달이 며칠까지 있었는지를 쓴다는 점이 헷갈리는 대목입니다.
              </p>
            </div>
            <div className={styles.card}>
              <h3>하괘 (1~3)</h3>
              <p>
                음력 생일에 일진수를 더해 3으로 나눈 나머지입니다. 나머지가 0이면 3으로 봅니다.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>왜 사이트마다 괘가 다를까</h2>
          <p>
            토정비결은 하나의 확정된 계산기가 아니라 판본이 여럿 있는 책입니다. 조견표의 수와 괘 해설이 판본마다
            조금씩 다르고, 나이를 한국 나이로 세는지 만 나이로 세는지, 윤달에 태어난 사람을 어떻게 처리하는지에서도
            갈립니다. 같은 사람이 두 곳에서 다른 괘를 받는 일이 드물지 않습니다.
          </p>
          <p>
            그래서 괘 번호 자체보다 그 해에 무엇을 조심하라고 적혀 있는지를 읽는 편이 낫습니다. 토정비결은 원래
            정초에 한 해의 마음가짐을 정하려고 보던 책입니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>토정비결과 사주는 다릅니다</h2>
          <p>
            사주는 태어난 연·월·일·시를 여덟 글자로 세워 타고난 기질과 오행의 균형을 봅니다. 평생 바뀌지 않는
            자료입니다. 토정비결은 그 해 하나의 운을 보는 연운 책이라 해마다 괘가 달라집니다. 둘은 보는 대상이
            다르므로 서로를 대신하지 않습니다.
          </p>
          <p>
            이 사이트에서는 <a href="/fortune/saju/">무료 사주 풀이</a>로 네 기둥과 오행 분포를,{" "}
            <a href="/fortune/gunghap/">사주 궁합</a>으로 두 사람의 관계를, <a href="/fortune/2027/">신년운세</a>로
            그 해의 흐름을 볼 수 있습니다.
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

        <section className={styles.answer}>
          <strong>이 페이지에 대해</strong>
          <p>
            이 페이지는 토정비결을 보는 방법과 준비물을 설명하고, 계산에 필요한 음력 날짜를 바꿔 주는 곳까지
            제공합니다. 괘를 자동으로 뽑아 주는 기능은 넣지 않았습니다. 태세수·월건수·일진수 조견표가 판본마다
            다른데, 확인되지 않은 표로 계산하면 그럴듯한 숫자가 나오면서 실제로는 틀린 괘를 보여주게 되기
            때문입니다. 조견표를 확정하는 대로 이 자리에 계산기를 붙일 예정입니다.
          </p>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
