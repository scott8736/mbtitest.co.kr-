import type { Metadata } from "next";
import AdUnit from "../../components/AdUnit";
import ContentHeader from "../../components/ContentHeader";
import SiteFooter from "../../components/SiteFooter";
import { mbtiCodes, profiles } from "../../lib/mbti-content";

export const metadata: Metadata = {
  title: "MBTI 궁합표와 유형별 관계",
  description:
    "MBTI 궁합을 소통, 갈등, 생활 방식 관점에서 확인하고 관계를 더 편안하게 만드는 방법을 알아보세요.",
  alternates: { canonical: "/compatibility" },
};

const pairs = [
  ["INTJ × ENFP", "전략과 영감", "서로 다른 관점이 새로운 가능성을 만듭니다."],
  ["INFJ × ENTP", "통찰과 아이디어", "깊은 대화와 지적 자극이 강점입니다."],
  ["ISTJ × ESFP", "안정과 활력", "계획과 즐거움의 균형을 배울 수 있습니다."],
  ["ISFJ × ESTP", "배려와 행동", "세심함과 실행력이 서로를 보완합니다."],
  ["INFP × ENFJ", "가치와 공감", "진심 어린 지지와 성장 대화가 잘 맞습니다."],
  ["ISTP × ESFJ", "독립과 연결", "공간 존중과 따뜻한 표현의 조율이 중요합니다."],
];

export default function Page() {
  return (
    <main>
      <ContentHeader active="/compatibility" />
      <section className="content-hero">
        <span className="eyebrow">MBTI COMPATIBILITY</span>
        <h1>
          MBTI 궁합,
          <br />
          유형보다 중요한 것
        </h1>
        <p>좋고 나쁜 궁합을 단정하기보다 서로 다른 소통 방식과 갈등 해결법을 이해해 보세요.</p>
        <a className="content-cta" href="/">
          내 유형 먼저 확인하기 →
        </a>
      </section>

      <section className="content-body">
        <AdUnit label="MBTI 궁합 상단 광고" />

        <section className="type-section">
          <div>
            <h2>내 MBTI 유형을 선택하세요</h2>
            <p>선택한 유형과 나머지 15개 유형의 관계 설명을 확인할 수 있습니다.</p>
          </div>
          <div className="seo-card-grid">
            {mbtiCodes.map((code) => (
              <article key={code}>
                <b>{profiles[code].code}</b>
                <h3>{profiles[code].name} 궁합</h3>
                <p>{profiles[code].tagline}</p>
                <a href={`/compatibility/${code}`}>{profiles[code].code} 궁합 전체 보기 →</a>
              </article>
            ))}
          </div>
        </section>

        <h2>자주 찾는 MBTI 궁합 조합</h2>
        <div className="seo-card-grid compatibility-grid">
          {pairs.map(([pair, title, desc]) => (
            <article key={pair}>
              <b>{pair}</b>
              <h3>{title}</h3>
              <p>{desc}</p>
              <a href="/tests/mbti-love-compatibility">연애 궁합 테스트 →</a>
            </article>
          ))}
        </div>

        <section className="related-page-cta">
          <div>
            <span>두 사람의 관계 방식이 궁금하다면</span>
            <h2>나와 잘 맞는 MBTI 관계 스타일을 확인하세요</h2>
            <p>소통, 갈등 해결, 생활 방식에 관한 12문항으로 선호하는 궁합을 알아봅니다.</p>
          </div>
          <div>
            <a className="primary" href="/tests/mbti-love-compatibility">
              MBTI 연애 궁합 테스트
            </a>
            <a href="/types">16가지 유형 다시 보기 →</a>
          </div>
        </section>

        <section className="long-copy">
          <h2>MBTI 궁합표를 볼 때 알아둘 점</h2>
          <p>
            MBTI 궁합은 두 사람의 관계 성공 여부를 결정하는 공식이 아닙니다. 같은 유형이라도
            경험, 가치관, 애착 방식과 대화 습관에 따라 관계의 모습은 달라집니다.
          </p>
          <h3>에너지 방향을 존중하세요</h3>
          <p>
            외향형은 대화와 활동으로, 내향형은 혼자 정리하는 시간으로 회복하는 경향이
            있습니다. 연락 빈도보다 각자의 충전 방식을 먼저 합의하면 갈등을 줄일 수 있습니다.
          </p>
          <h3>판단 기준을 번역하세요</h3>
          <p>
            사고형의 해결책은 무관심이 아니며, 감정형의 공감 요구는 비논리적인 행동이
            아닙니다. 해결과 공감 중 무엇이 먼저 필요한지 말로 확인하는 것이 좋습니다.
          </p>
        </section>

        <AdUnit label="MBTI 궁합 하단 광고" />
      </section>
      <SiteFooter />
    </main>
  );
}
