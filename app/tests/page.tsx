import type { Metadata } from "next";
import AdUnit from "../../components/AdUnit";
import TestDirectory from "../../components/TestDirectory";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

/**
 * 이 페이지는 "성향테스트" 라는 일반 검색어를 받는 자리입니다.
 *
 * 개별 테스트(연애 성향·소비 성향·업무 성향…)는 각자 자기 키워드를 물고 있지만,
 * 유형 이름을 모르는 채로 "성향테스트" 만 치고 들어오는 사람을 받을 페이지가
 * 없었습니다. 제목·h1·첫 문단에 그 말이 없으면 재료가 아무리 많아도 못 받습니다.
 *
 * 첫 문단은 서론이 아니라 답입니다. 지식스니펫은 결론이 세 번째 문단에 있으면
 * 뽑아가지 않습니다.
 */
export const metadata: Metadata = {
  title: "성향 테스트 모음 — 무료 심리테스트 50가지",
  description:
    "성향 테스트는 성격의 우열이 아니라 반응 방식의 차이를 봅니다. 연애·소비·업무·성격 성향 테스트와 MBTI, 애착유형, 자존감까지 무료로 한곳에 모았습니다.",
  keywords: [
    "성향테스트",
    "성향 테스트",
    "무료 심리테스트",
    "성격 테스트",
    "심리테스트 모음",
  ],
  alternates: { canonical: "/tests/" },
  openGraph: {
    title: "성향 테스트 모음 — 무료 심리테스트 50가지",
    description: "회원가입 없이 바로 하는 무료 성향·성격·연애·마음건강 테스트 모음",
    url: "/tests/",

    images: [{ url: "/images/og/mbti-test-share.jpg", width: 1200, height: 630 }],
  },
};

export default function TestsPage() {
  return (
    <main className="tests-page">
      <SiteHeader active="/tests" />
      <section className="directory-hero">
        <span className="eyebrow">무료 성향 테스트</span>
        <h1>성향 테스트<br />모음</h1>
        <p>성향 테스트는 성격의 좋고 나쁨을 가리는 검사가 아니라, 같은 상황에서 사람마다 다르게 나오는 반응 방식을 확인하는 도구입니다.<br />연애·소비·업무·관계 성향부터 MBTI와 마음건강 자가진단까지, 회원가입 없이 바로 할 수 있습니다.</p>
      </section>
      <section className="directory-section" aria-label="심리테스트 목록">
        <TestDirectory />
      </section>
      <AdUnit position="testListFeed" label="테스트 목록 인피드 광고" />
      <section className="directory-note">
        <h2>성향 테스트, 어떤 것부터 하면 좋을까요</h2>
        <p>
          알고 싶은 것이 분명하면 그 주제부터 고르는 편이 낫습니다. 나를 전반적으로 보고 싶다면 MBTI나
          에니어그램, 관계에서 반복되는 패턴이 궁금하다면 애착유형이나 연애 성향, 요즘 상태를 점검하고
          싶다면 자존감·번아웃 쪽입니다. 결과가 매번 똑같이 나오지 않는 것은 오류가 아니라 컨디션과
          환경이 답에 반영되기 때문입니다. 각 테스트는 자기이해를 돕는 참고 자료이며 전문적인 심리
          평가나 의료적 진단을 대신하지 않습니다.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
