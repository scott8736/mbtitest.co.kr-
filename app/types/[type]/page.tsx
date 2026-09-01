import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { mbtiCodes, getProfile, profiles, type MbtiCode } from "../../../lib/mbti-content";
import styles from "../../../lib/mbti.module.css";

export const dynamicParams = false;
export function generateStaticParams(){ return mbtiCodes.map((type)=>({type})); }

export async function generateMetadata({params}:{params:Promise<{type:string}>}):Promise<Metadata>{
  const {type}=await params; const p=getProfile(type); if(!p) return {};
  return {
    title:`${p.code} 특징 총정리: 연애·직업·궁합`,
    description:`${p.code} ${p.name}의 성격 특징, 강점과 단점, 연애 신호, 직업·업무 스타일, 스트레스 반응과 잘 맞는 MBTI 궁합을 자세히 확인하세요.`,
    alternates:{canonical:`/types/${type.toLowerCase()}/`},
    openGraph:{title:`${p.code} 특징과 연애·궁합 | MBTI 유형`,description:p.summary,url:`/types/${type.toLowerCase()}/`,type:"article"},
  };
}

export default async function TypePage({params}:{params:Promise<{type:string}>}){
  const {type}=await params; const p=getProfile(type); if(!p) notFound();
  const code=type.toLowerCase() as MbtiCode;
  const faq=[
    [`${p.code}는 어떤 성격인가요?`,p.summary],
    [`${p.code}가 연애할 때 보이는 특징은?`,p.love],
    [`${p.code}가 호감 있을 때 보내는 신호는?`,p.signal],
    [`${p.code}와 잘 맞는 MBTI는?`,`${p.code}는 ${p.matches.map(x=>profiles[x].code).join(", ")} 유형과 서로의 강점을 보완하기 쉽습니다. 다만 유형만으로 관계를 단정할 수 없으며 대화 습관과 가치관을 함께 살펴야 합니다.`],
    [`${p.code}가 스트레스받을 때는?`,p.stress],
  ];
  const jsonLd={"@context":"https://schema.org","@graph":[
    {"@type":"Article",headline:`${p.code} 특징 총정리: 연애·직업·궁합`,description:p.summary,inLanguage:"ko-KR",mainEntityOfPage:`https://mbtitest.co.kr/types/${code}/`,dateModified:"2026-07-25",author:{"@type":"Organization",name:"MBTI 검사"}},
    {"@type":"BreadcrumbList",itemListElement:[
      {"@type":"ListItem",position:1,name:"MBTI 검사",item:"https://mbtitest.co.kr/"},
      {"@type":"ListItem",position:2,name:"16가지 유형",item:"https://mbtitest.co.kr/types/"},
      {"@type":"ListItem",position:3,name:p.code,item:`https://mbtitest.co.kr/types/${code}/`}
    ]}
  ]};
  return <main className={styles.page}><ContentHeader active="/types"/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
    <header className={styles.hero}><div className={styles.crumbs}><a href="/">MBTI 검사</a> / <a href="/types/">16가지 유형</a> / {p.code}</div>
      <span className={styles.eyebrow}>{p.group}</span><h1>{p.code} 특징<br/>{p.name}</h1><p>{p.tagline}</p>
      <div className={styles.actions}><a href="/tests/mbti/">무료 MBTI 검사하기</a><a href={`/compatibility/${code}/`}>{p.code} 궁합 보기</a></div>
    </header>
    <article className={styles.body}>
      <section className={styles.answer}><strong>{p.code}는 어떤 성격인가요?</strong><p>{p.summary}</p></section>
      <AdUnit label={`${p.code} 유형 상단 광고`} />
      <nav className={styles.toc} aria-label="페이지 목차"><a href="#core">핵심 성향</a><a href="#strengths">강점과 주의점</a><a href="#love">연애와 호감 신호</a><a href="#work">직업·업무</a><a href="#stress">스트레스</a><a href="#communication">소통 방법</a><a href="#compatibility">유형별 궁합</a><a href="#faq">자주 묻는 질문</a></nav>
      <section id="core" className={styles.section}><h2>{p.code} 핵심 성향과 사고방식</h2><p>{p.core}</p><h3>{p.code}를 이해하는 핵심</h3><p>{p.misconception}</p></section>
      <section id="strengths" className={styles.section}><h2>{p.code} 장점과 주의할 점</h2><div className={styles.grid}><div className={styles.card}><h3>대표적인 강점</h3><ul>{p.strengths.map(x=><li key={x}>{x}</li>)}</ul></div><div className={styles.card}><h3>성장할 때 살펴볼 점</h3><ul>{p.cautions.map(x=><li key={x}>{x}</li>)}</ul></div></div></section>
      <section id="love" className={styles.section}><h2>{p.code} 연애 특징</h2><p>{p.love}</p><h3>{p.code}가 호감 있을 때 보내는 신호</h3><p>{p.signal}</p></section>
      <AdUnit placement="inArticle" label={`${p.code} 유형 본문 광고`} />
      <section id="work" className={styles.section}><h2>{p.code} 직업·업무·공부 스타일</h2><p>{p.work}</p><p>유형은 직업 적성을 결정하는 검사가 아닙니다. 실제 선택에서는 능력, 경험, 흥미, 생활 조건을 함께 고려해야 합니다.</p></section>
      <section id="stress" className={styles.section}><h2>{p.code}가 스트레스받을 때</h2><p>{p.stress}</p></section>
      <section id="communication" className={styles.section}><h2>{p.code}와 편안하게 소통하는 방법</h2><p>{p.communication}</p></section>
      <section id="compatibility" className={styles.section}><h2>{p.code}와 잘 맞는 MBTI 궁합</h2><p>{p.code}와 비교적 자연스럽게 강점을 보완하기 쉬운 유형은 {p.matches.map(x=>profiles[x].code).join(", ")}입니다. 차이를 더 의식적으로 조율해야 하는 유형으로는 {p.challenges.map(x=>profiles[x].code).join(", ")}가 자주 언급됩니다. 그러나 어떤 조합도 성공이나 실패를 결정하지 않습니다.</p><div className={styles.actions}><a href={`/compatibility/${code}/`}>{p.code} × 15개 유형 궁합 보기</a></div></section>
      <section id="faq" className={styles.section}><h2>{p.code} 자주 묻는 질문</h2>{faq.map(([q,a])=><div key={q}><h3>{q}</h3><p>{a}</p></div>)}</section>
      <aside className={styles.notice}>이 콘텐츠는 자기이해와 관계 대화를 돕는 비공식 정보입니다. 공식 MBTI® 평가나 의료·심리 진단을 대신하지 않으며, 같은 유형이라도 개인의 경험과 환경에 따라 모습은 달라질 수 있습니다.</aside>
      <section className={styles.cta}><h2>내 실제 MBTI 유형은 무엇일까요?</h2><p>40개 질문에 답하고 네 가지 성향 지표와 유형별 설명을 확인해 보세요.</p><a href="/tests/mbti/">무료 MBTI 검사 시작하기 →</a></section>
    </article><SiteFooter/></main>;
}
