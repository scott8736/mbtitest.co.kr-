import type { Metadata } from "next";
import AdUnit from "../../components/AdUnit";
import ContentHeader from "../../components/ContentHeader";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "MBTI 16가지 유형별 특징",
  description:
    "INTJ, ENFP, ISTJ 등 MBTI 16가지 성격유형의 특징과 강점, 관계 성향을 한눈에 확인하세요.",
  alternates: { canonical: "/types/" },
};

const groups = [
  [
    "분석형 NT",
    "논리와 전략, 새로운 아이디어를 중시합니다.",
    [
      ["INTJ", "전략가", "큰 그림과 장기 계획"],
      ["INTP", "사색가", "원리 탐구와 논리 분석"],
      ["ENTJ", "통솔자", "목표 설정과 빠른 실행"],
      ["ENTP", "변론가", "새로운 가능성과 토론"],
    ],
  ],
  [
    "외교형 NF",
    "사람의 성장과 의미, 깊은 연결을 중시합니다.",
    [
      ["INFJ", "옹호자", "통찰과 신념"],
      ["INFP", "중재자", "가치와 상상력"],
      ["ENFJ", "사회운동가", "공감형 리더십"],
      ["ENFP", "활동가", "열정과 가능성"],
    ],
  ],
  [
    "관리자형 SJ",
    "책임과 안정, 현실적인 실행을 중시합니다.",
    [
      ["ISTJ", "관리자", "정확성과 책임감"],
      ["ISFJ", "수호자", "세심한 돌봄"],
      ["ESTJ", "경영자", "조직력과 추진력"],
      ["ESFJ", "집정관", "협력과 관계 형성"],
    ],
  ],
  [
    "탐험가형 SP",
    "경험과 감각, 유연한 대응을 중시합니다.",
    [
      ["ISTP", "재주꾼", "실용적 문제 해결"],
      ["ISFP", "예술가", "감수성과 적응력"],
      ["ESTP", "사업가", "현장 판단과 행동"],
      ["ESFP", "연예인", "밝은 에너지와 센스"],
    ],
  ],
];

export default function Page() {
  return (
    <main>
      <ContentHeader active="/types" />
      <section className="content-hero">
        <span className="eyebrow">16 PERSONALITY TYPES</span>
        <h1>
          MBTI 16가지 유형
          <br />
          한눈에 보기
        </h1>
        <p>네 가지 성격 지표의 조합으로 만들어지는 16개 유형의 대표 특징을 살펴보세요.</p>
        <a className="content-cta" href="/">
          내 MBTI 검사하기 →
        </a>
      </section>

      <section className="content-body">
        <AdUnit position="articleTop" label="16가지 유형 상단 광고" />

        {groups.map(([title, desc, items]) => (
          <section className="type-section" key={title as string}>
            <div>
              <h2>{title as string}</h2>
              <p>{desc as string}</p>
            </div>
            <div className="seo-card-grid">
              {(items as string[][]).map(([code, name, trait]) => (
                <article key={code}>
                  <b>{code}</b>
                  <h3>{name}</h3>
                  <p>{trait}</p>
                  <a href={`/types/${code.toLowerCase()}/`}>{code} 상세 설명 →</a>
                  <a href={`/compatibility/${code.toLowerCase()}/`}>{code} 궁합 알아보기 →</a>
                </article>
              ))}
            </div>
          </section>
        ))}

        <AdUnit position="pageFooter" label="16가지 유형 하단 광고" />

        <section className="related-page-cta">
          <div>
            <span>내 유형을 아직 모른다면</span>
            <h2>40문항으로 현재의 MBTI 성향을 확인하세요</h2>
            <p>가입 없이 검사하고 네 가지 지표 비율과 유형별 강점을 바로 볼 수 있습니다.</p>
          </div>
          <div>
            <a className="primary" href="/">
              무료 MBTI 검사 시작하기
            </a>
            <a href="/compatibility/">내 유형의 궁합 보기 →</a>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
