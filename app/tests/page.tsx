import type { Metadata } from "next";
import TestDirectory from "../../components/TestDirectory";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import AdUnit, { ADSENSE_DISPLAY_SLOT } from "../../components/AdUnit";

export const metadata: Metadata = {
  title: "무료 심리테스트 모음",
  description:
    "MBTI 검사부터 애착유형, 사랑의 언어, 자존감, 번아웃까지 무료 심리테스트를 한곳에서 확인하세요.",
  alternates: { canonical: "/tests" },
  openGraph: {
    title: "무료 심리테스트 모음 | MBTI 검사",
    description: "회원가입 없이 간편하게 즐기는 무료 성격·연애·마음건강 테스트",
    url: "/tests",
  },
};

export default function TestsPage() {
  return (
    <main className="tests-page">
      <SiteHeader active="/tests" />
      <section className="directory-hero">
        <span className="eyebrow">무료 심리테스트</span>
        <h1>나를 알아가는<br />다양한 테스트</h1>
        <p>성격, 연애, 마음건강, 직장생활까지 궁금한 주제를 선택해 보세요.<br />완성된 테스트만 검사 시작 버튼이 표시됩니다.</p>
      </section>
      <AdUnit slot={ADSENSE_DISPLAY_SLOT} label="테스트 목록 광고" />
      <section className="directory-section" aria-label="심리테스트 목록">
        <TestDirectory />
      </section>
      <section className="directory-note">
        <h2>새로운 테스트가 계속 추가됩니다</h2>
        <p>각 테스트는 자기이해를 돕는 참고 자료이며 전문적인 심리 평가나 의료적 진단을 대신하지 않습니다.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
