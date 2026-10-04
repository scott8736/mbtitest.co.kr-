import type { Metadata } from "next";
import IqTestRunner from "../../../components/IqTestRunner";
import { iqFaq } from "../../../lib/iq-test";
import "../../check/screener.css";
import "./iq.css";

// 아이큐테스트 10,780 + IQ테스트 7,900 (월간, 네이버 검색광고 2026-09-29).
// 템플릿 " | MBTI 검사" 를 붙여 34자.
export const metadata: Metadata = {
  title: "IQ 테스트 무료 | 20문제 두뇌 퍼즐",
  description: "수열·언어·논리·수리 20문제로 보는 무료 IQ 테스트. 맞힌 개수와 영역별 정답률, 문제별 해설을 바로 확인하세요.",
  keywords: ["IQ 테스트", "아이큐 테스트", "IQ 테스트 무료", "아이큐 테스트 무료", "지능 테스트", "두뇌 테스트"],
  alternates: { canonical: "/tests/iq/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/iq/",
    title: "IQ 테스트 무료 | 20문제 두뇌 퍼즐",
    description: "수열·언어·논리·수리 20문제. 몇 문제나 맞힐 수 있을까요?",
    images: [{ url: "/images/og/mbti-mori-share.jpg", width: 1200, height: 630, alt: "IQ 테스트" }],
  },
};

export default function Page() {
  // 화면에 보이는 문답과 같은 문구를 씁니다.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: iqFaq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <IqTestRunner />
    </>
  );
}
