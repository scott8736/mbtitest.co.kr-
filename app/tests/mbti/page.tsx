import type { Metadata } from "next";
import MbtiQuiz from "../../../components/MbtiQuiz";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";

export const metadata: Metadata = {
  title: "무료 MBTI 검사 40문항",
  description:
    "40개 문항으로 진행하는 무료 MBTI 검사입니다. 회원가입 없이 약 4분이면 16가지 성격유형 결과를 바로 확인할 수 있습니다.",
  keywords: ["MBTI 검사", "무료 MBTI 검사", "엠비티아이 검사", "MBTI 성격유형검사", "40문항 MBTI"],
  alternates: { canonical: "/tests/mbti/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/mbti/",
    title: "무료 MBTI 검사 40문항 | MBTI 검사",
    description: "가입 없이 바로 시작하는 40문항 무료 MBTI 성격유형 검사",
    images: [{ url: "/images/og/mbti-test-share.png", width: 1200, height: 630, alt: "무료 MBTI 검사 40문항" }],
  },
};

export default function MbtiTestPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "무료 MBTI 성격유형 검사",
    description: "40개 문항으로 16가지 성격유형을 확인하는 무료 MBTI 검사",
    url: "https://mbtitest.co.kr/tests/mbti/",
    inLanguage: "ko-KR",
    educationalLevel: "beginner",
    numberOfQuestions: 40,
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader active="/tests/mbti" />
      <MbtiQuiz />
      <SiteFooter />
    </main>
  );
}
