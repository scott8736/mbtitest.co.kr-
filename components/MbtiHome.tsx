import TestDirectory from "./TestDirectory";
import AdUnit from "./AdUnit";
import { typeData } from "../lib/mbti-data";

export default function MbtiHome() {
  return (
    <>
          <section className="hero wellness-hero">
            <div className="hero-copy">
              <span className="eyebrow">FREE PERSONALITY TEST</span>
              <h1>무료 MBTI 검사<br /><em>나를 이해하는 가장 선명한 질문</em></h1>
              <p>40개의 일상적인 질문으로 알아보는 무료 MBTI 검사. <br />지금의 나와 더 가까운 문장을 골라보세요.</p>
              <a className="primary-button" href="/tests/mbti/">무료 MBTI 검사 시작 <span>→</span></a>
              <div className="trust-chips"><span>✓ 가입 없음</span><span>⚡ 결과 즉시 확인</span></div>
            </div>
            <div className="hero-floating-card" aria-label="검사 특징">
              <span>PERSONALITY SIGNAL</span>
              <strong>16가지 유형</strong>
              <div><i>E · I</i><i>S · N</i><i>T · F</i><i>J · P</i></div>
            </div>
          </section>
          <AdUnit key="home-start-ad" position="testIntro" label="검사 시작 전 광고" />
          <section className="dimension-strip">
            {[
              ["E · I", "에너지 방향", "함께 또는 혼자"],
              ["S · N", "정보 인식", "사실 또는 가능성"],
              ["T · F", "판단 기준", "논리 또는 가치"],
              ["J · P", "생활 방식", "계획 또는 유연함"],
            ].map(([code, title, desc]) => <article key={code}><b>{code}</b><div><strong>{title}</strong><span>{desc}</span></div></article>)}
          </section>
          <section className="home-note">
            <p>성격은 네 글자로 끝나지 않습니다.</p>
            <h2>결과보다 중요한 건<br />나를 이해하는 과정이에요.</h2>
            <div className="note-grid"><span>솔직하게 답하기</span><span>너무 오래 고민하지 않기</span><span>편안한 마음으로 즐기기</span></div>
          </section>
          <section className="more-tests" aria-labelledby="more-tests-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">다른 심리테스트</span>
                <h2 id="more-tests-title">나를 이해하는 다음 질문</h2>
              </div>
              <a href="/tests/">전체 테스트 보기 <span>→</span></a>
            </div>
            <TestDirectory compact />
          </section>
          <section className="seo-content" aria-labelledby="mbti-guide-title">
            <div className="seo-intro">
              <span className="eyebrow">MBTI 성격유형 가이드</span>
              <h2 id="mbti-guide-title">MBTI 검사란 무엇인가요?</h2>
              <p>MBTI 검사는 사람의 성격 선호 경향을 에너지 방향, 정보 인식, 판단 기준, 생활 방식의 네 가지 지표로 살펴보는 성격테스트입니다. 각 지표의 결과를 조합하면 INTJ, ENFP처럼 네 글자로 된 16가지 성격유형을 확인할 수 있습니다.</p>
              <p>이 무료 엠비티아이 검사는 일상에서 자주 마주치는 상황을 바탕으로 구성했습니다. 결과는 자신을 이해하고 대화하는 데 참고하는 자료이며, 사람의 모든 성격이나 능력을 단정하는 진단은 아닙니다.</p>
            </div>
            <div className="guide-grid">
              <article><b>01</b><h3>문항을 편하게 읽기</h3><p>최근의 실제 모습을 떠올리며 두 문장 중 더 자연스러운 쪽을 선택하세요.</p></article>
              <article><b>02</b><h3>솔직하게 답하기</h3><p>되고 싶은 모습보다 평소 반복해서 보이는 행동을 기준으로 답하면 좋습니다.</p></article>
              <article><b>03</b><h3>결과를 참고하기</h3><p>유형별 강점과 주의점을 관계, 업무, 자기이해에 가볍게 활용해 보세요.</p></article>
            </div>
            <h2>MBTI 4가지 성격 지표</h2>
            <div className="indicator-grid">
              <article><strong>E 외향형 · I 내향형</strong><p>사람과 활동에서 에너지를 얻는지, 혼자 생각하는 시간에서 충전하는지를 살펴봅니다.</p></article>
              <article><strong>S 감각형 · N 직관형</strong><p>구체적인 사실과 경험을 우선하는지, 가능성과 의미를 먼저 보는지를 살펴봅니다.</p></article>
              <article><strong>T 사고형 · F 감정형</strong><p>논리와 원칙을 중심으로 판단하는지, 사람과 가치를 중요하게 보는지를 살펴봅니다.</p></article>
              <article><strong>J 판단형 · P 인식형</strong><p>계획과 결정을 선호하는지, 상황에 맞춘 유연한 선택을 편하게 느끼는지를 살펴봅니다.</p></article>
            </div>
            <section className="type-guide" aria-labelledby="type-guide-title">
              <span className="eyebrow">16가지 성격유형 한눈에 보기</span>
              <h2 id="type-guide-title">MBTI 유형별 특징</h2>
              <p className="section-lead">네 가지 지표를 조합하면 16가지 유형이 만들어집니다. 같은 유형이라도 성장 환경과 경험에 따라 모습은 달라질 수 있으므로 대표적인 성향으로 참고해 주세요.</p>
              {[
                ["NT", "분석형", "논리, 전략, 지식과 새로운 아이디어를 중시하는 유형", ["INTJ","INTP","ENTJ","ENTP"]],
                ["NF", "외교형", "공감, 의미, 성장과 사람 사이의 연결을 중시하는 유형", ["INFJ","INFP","ENFJ","ENFP"]],
                ["SJ", "관리자형", "책임, 안정, 현실적인 기준과 꾸준한 실행을 중시하는 유형", ["ISTJ","ISFJ","ESTJ","ESFJ"]],
                ["SP", "탐험가형", "경험, 감각, 유연성과 빠른 상황 대응을 중시하는 유형", ["ISTP","ISFP","ESTP","ESFP"]],
              ].map(([group, title, desc, codes]) => (
                <div className="type-group" key={group as string}>
                  <div className="group-heading"><b>{group as string}</b><div><h3>{title as string}</h3><p>{desc as string}</p></div></div>
                  <div className="type-cards">{(codes as string[]).map((code) => <article key={code}><strong>{code}</strong><h4>{typeData[code].name}</h4><p>{typeData[code].tagline}</p></article>)}</div>
                </div>
              ))}
            </section>
            <section className="article-body">
              <h2>무료 MBTI 검사를 더 정확하게 하는 방법</h2>
              <h3>되고 싶은 모습보다 평소 행동을 선택하세요</h3>
              <p>성격테스트를 할 때 이상적인 모습이나 직장에서 요구받는 역할을 기준으로 답하면 실제 선호와 다른 결과가 나올 수 있습니다. 특별한 날의 행동보다는 지난 몇 달 동안 자주 반복한 선택을 떠올리는 편이 좋습니다.</p>
              <h3>중간 성향도 자연스러운 결과입니다</h3>
              <p>외향과 내향, 사고와 감정처럼 두 성향은 서로 반대되는 능력이 아니라 어느 쪽을 조금 더 편하게 사용하는지를 보여주는 지표입니다. 결과 비율이 비슷하다면 상황에 따라 양쪽 특성이 모두 자연스럽게 나타날 수 있습니다.</p>
              <h3>검사 결과가 바뀌어도 틀린 것은 아닙니다</h3>
              <p>새로운 직무, 관계 변화, 생활환경과 현재 컨디션은 자기보고식 문항의 답변에 영향을 줄 수 있습니다. 결과가 달라졌다면 네 글자만 비교하기보다 각 지표의 비율과 설명에서 꾸준히 반복되는 부분을 살펴보세요.</p>
              <h2>MBTI 성격테스트 결과 활용법</h2>
              <div className="use-grid">
                <article><h3>대인관계</h3><p>상대의 유형을 단정하기보다 서로 편하게 느끼는 소통 방식이 왜 다른지 이해하는 대화의 출발점으로 활용하세요.</p></article>
                <article><h3>직장과 협업</h3><p>정보를 구체적으로 받을 때 편한지, 큰 그림부터 이해할 때 편한지 확인하면 업무 전달과 협업 방식을 조정하는 데 도움이 됩니다.</p></article>
                <article><h3>공부와 자기계발</h3><p>혼자 집중하는 시간과 함께 토론하는 시간, 계획형 학습과 유연한 탐색 중 어떤 환경에서 집중이 잘되는지 점검해 보세요.</p></article>
              </div>
              <div className="accuracy-note">
                <h2>검사 결과를 볼 때 꼭 알아둘 점</h2>
                <p>이 사이트의 무료 MBTI 검사는 자기이해를 돕기 위해 네 가지 선호 지표를 간단히 살펴보는 비공식 성격테스트입니다. 의료·상담 목적의 심리검사, 채용 평가 또는 공식 MBTI® 검사를 대신하지 않습니다. 중요한 결정을 내릴 때는 검사 결과 하나로 사람의 능력이나 적합성을 판단하지 마세요.</p>
              </div>
            </section>
            <AdUnit position="articleBody" label="콘텐츠 내 광고" />
            <div className="faq">
              <h2>MBTI 검사 자주 묻는 질문</h2>
              <details><summary>MBTI 검사는 무료인가요?</summary><p>네. 회원가입이나 결제 없이 40개 문항에 답하고 결과를 바로 확인할 수 있습니다.</p></details>
              <details><summary>검사 시간은 얼마나 걸리나요?</summary><p>보통 약 4분이 걸립니다. 너무 오래 고민하기보다 평소 모습에 가까운 답을 선택해 주세요.</p></details>
              <details><summary>MBTI 결과가 매번 달라질 수 있나요?</summary><p>현재의 환경, 역할, 컨디션과 답변 기준에 따라 결과가 달라질 수 있습니다. 한 번의 결과로 자신을 단정하지 않는 것이 좋습니다.</p></details>
              <details><summary>성격테스트 결과를 어떻게 활용하나요?</summary><p>나의 소통 방식과 선호를 이해하거나 서로의 차이를 대화하는 참고 자료로 활용할 수 있습니다.</p></details>
              <details><summary>전문 심리검사를 대신할 수 있나요?</summary><p>아닙니다. 이 검사는 자기이해를 위한 간이 성격테스트이며 전문적인 심리 평가나 진단을 대신하지 않습니다.</p></details>
            </div>
          </section>
    </>
  );
}
