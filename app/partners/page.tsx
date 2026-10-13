import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import PartnerForm from "../../components/PartnerForm";

export const metadata: Metadata = {
  title: "브랜드 심리테스트 제작·제휴",
  description: "브랜드 맞춤 MBTI·심리테스트를 기획부터 결과 화면·공유 카드까지 만들어 드립니다. 견적은 문의로.",
  alternates: { canonical: "/partners/" },
};

const PACKAGES = [
  {
    name: "기본",
    period: "약 7일",
    items: ["질문 10개 · 결과 8가지", "사이트 기본 디자인에 브랜드 색 적용", "결과 화면 브랜드 버튼 1개", "카카오톡·스레드 공유 버튼"],
  },
  {
    name: "표준",
    period: "약 14일",
    items: ["질문 12~16개 · 결과 16가지", "브랜드 맞춤 디자인·결과 그림", "결과별 공유 카드 이미지", "결과 화면 쿠폰·구매 버튼", "공개 후 2주 참여·클릭 리포트"],
  },
  {
    name: "맞춤",
    period: "협의",
    items: ["질문·결과 수 자유", "자체 도메인 연결", "결과 유형별 다른 쿠폰 지급", "참여자 정보 수집(별도 동의·위탁 계약)"],
  },
];

const STEPS = ["문의 남기기", "견적·일정 회신 (1~2일)", "주제·질문·결과 기획안 확인", "제작·디자인 검수 (수정 2회)", "공개 · 2주 뒤 결과 리포트"];


const FAQ = [
  ["트래픽(참여자 수)을 보장하나요?", "보장하지 않습니다. 제작한 테스트는 공유되기 쉽게 만들고 우리 사이트 목록에도 2주간 노출하지만, 참여자 수를 약속하는 상품은 팔지 않습니다."],
  ["결과는 과학적인 검사인가요?", "아닙니다. 재미로 즐기는 브랜드 테스트로 만들며, 결과 화면에 그렇게 안내합니다. 정신건강·자가진단 성격의 테스트에는 브랜드를 붙이지 않습니다."],
  ["MBTI 이름을 써도 되나요?", "MBTI®는 The Myers-Briggs Company의 등록상표라, 테스트 제목에는 「성향 테스트」「○○ 유형」처럼 다른 이름을 권해 드립니다."],
  ["비용은 얼마인가요?", "질문·결과 수, 디자인 범위, 쿠폰 연동 여부에 따라 달라집니다. 아래 문의를 남겨 주시면 견적과 일정을 함께 보내드립니다."],
];

export default function PartnersPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <main className="info-page">
      <header className="simple-header">
        <Link className="logo" href="/">
          <span className="brain-mark">✦</span>
          <b>MBTI 검사</b>
        </Link>
        <Link href="/tests/">심리테스트 보기</Link>
      </header>
      <article className="info-article partner-page">
        <span className="eyebrow">PARTNERS</span>
        <h1>브랜드 심리테스트 제작</h1>
        <p>
          브랜드에 맞춘 MBTI·심리테스트를 기획부터 질문, 결과 화면, 공유 카드까지 만들어 드립니다. 결과 화면에는 쿠폰이나 구매 버튼을 넣어 테스트를 마친
          사람이 바로 브랜드로 넘어가게 합니다. 비용과 일정은 원하시는 범위를 듣고 견적으로 안내해 드립니다.
        </p>

        <h2>이런 걸 만들어요</h2>
        <ul className="partner-points">
          <li>
            <strong>브랜드 맞춤 테스트</strong> 「나에게 어울리는 ○○ 찾기」처럼 제품과 결과를 이어 주는 테스트
          </li>
          <li>
            <strong>결과 화면 쿠폰·구매 버튼</strong> 결과 유형마다 다른 제품·쿠폰으로 연결
          </li>
          <li>
            <strong>공유 카드</strong> 결과를 카카오톡·인스타 스토리용 이미지로 저장·공유
          </li>
        </ul>

        <h2>제작 범위</h2>
        <div className="partner-packages">
          {PACKAGES.map((p) => (
            <section key={p.name} className="partner-package">
              <span>{p.name}</span>
              <small>제작 기간 {p.period}</small>
              <ul>
                {p.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <h2>진행 순서</h2>
        <ol className="partner-steps">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h2>이 사이트에서 직접 운영 중인 테스트</h2>
        <p>
          제작은 이 사이트에서 매일 쓰이는 검사 화면·결과 화면·공유 기능 그대로 만듭니다.{" "}
          <Link href="/tests/mbti/">MBTI 성격유형 검사</Link>, <Link href="/mori/">16모리 마음숲</Link>, <Link href="/tests/">심리테스트 모음</Link>에서
          직접 해 보실 수 있습니다.
        </p>

        <h2>자주 묻는 질문</h2>
        <dl className="partner-faq">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>

        <h2 id="inquiry">제휴 문의</h2>
        <PartnerForm />
        <div className="notice-box">
          <strong>카카오톡으로 먼저 물어보셔도 돼요</strong>
          <p>
            <a href="https://open.kakao.com/o/s2sMEJQi" rel="noopener noreferrer">
              문의 오픈채팅 →
            </a>
          </p>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <SiteFooter />
    </main>
  );
}
