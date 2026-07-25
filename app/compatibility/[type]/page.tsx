import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdUnit from "../../../components/AdUnit";
import ContentHeader from "../../../components/ContentHeader";
import SiteFooter from "../../../components/SiteFooter";
import { mbtiCodes, getProfile, profiles, pairInsight, type MbtiCode } from "../../../lib/mbti-content";
import styles from "../../../lib/mbti.module.css";

export const dynamicParams=false;
export function generateStaticParams(){return mbtiCodes.map(type=>({type}));}
export async function generateMetadata({params}:{params:Promise<{type:string}>}):Promise<Metadata>{
  const {type}=await params; const p=getProfile(type); if(!p)return{};
  return{title:`${p.code} 궁합 총정리: 15개 유형별 연애 궁합`,description:`${p.code}와 INTJ, ENFP 등 15개 MBTI 유형의 연애·친구·직장 궁합, 잘 맞는 점과 갈등 해결법을 확인하세요.`,alternates:{canonical:`/compatibility/${type.toLowerCase()}`}};
}
export default async function CompatibilityTypePage({params}:{params:Promise<{type:string}>}){
  const {type}=await params; const p=getProfile(type); if(!p)notFound(); const code=type.toLowerCase() as MbtiCode;
  const others=mbtiCodes.filter(x=>x!==code);
  const jsonLd={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"MBTI 검사","item":"https://mbtitest.co.kr/"},{"@type":"ListItem","position":2,"name":"MBTI 궁합","item":"https://mbtitest.co.kr/compatibility/"},{"@type":"ListItem","position":3,"name":`${p.code} 궁합`,"item":`https://mbtitest.co.kr/compatibility/${code}/`}]};
  return <main className={styles.page}><ContentHeader active="/compatibility"/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
    <header className={styles.hero}><div className={styles.crumbs}><a href="/">MBTI 검사</a> / <a href="/compatibility">MBTI 궁합</a> / {p.code}</div><span className={styles.eyebrow}>MBTI COMPATIBILITY</span><h1>{p.code} 궁합<br/>15개 유형 총정리</h1><p>{p.code}와 각 유형의 관계를 연애, 소통, 갈등 해결 관점에서 살펴봅니다. 궁합은 등급이 아니라 서로 다른 사용 설명서를 이해하는 자료입니다.</p><div className={styles.actions}><a href={`/types/${code}`}>{p.code} 특징 보기</a><a href="/">내 유형 검사하기</a></div></header>
    <article className={styles.body}><section className={styles.answer}><strong>{p.code}와 잘 맞는 MBTI는?</strong><p>{p.code}는 {p.matches.map(x=>profiles[x].code).join(", ")}와 서로의 강점을 보완하기 쉽습니다. 하지만 실제 관계의 만족도는 유형보다 가치관, 애착 방식, 대화 습관과 갈등 후 회복 방식에 더 크게 영향을 받습니다.</p></section>
      <AdUnit label={`${p.code} 궁합 상단 광고`} />
      <section className={styles.section}><h2>{p.code} 궁합 한눈에 보기</h2><div className={styles.pairTable}>{others.map(other=>{const x=pairInsight(code,other);return <article className={styles.pairCard} key={other}><b>{p.code} × {profiles[other].code}</b><p>{x.summary}</p><a href={`#${other}`}>관계 해석 보기 ↓</a></article>})}</div></section>
      <AdUnit placement="inArticle" label={`${p.code} 궁합 본문 광고`} />
      {others.map(other=>{const q=profiles[other],x=pairInsight(code,other);return <section id={other} className={styles.section} key={other}><h2>{p.code}와 {q.code} 궁합</h2><p>{x.summary}</p><div className={styles.grid}><div className={styles.card}><h3>잘 맞는 부분</h3><p>{x.strength}</p></div><div className={styles.card}><h3>갈등하기 쉬운 부분</h3><p>{x.conflict}</p></div></div><h3>연애와 연락 방식</h3><p>{p.code}는 {p.love} 반면 {q.code}는 {q.love} 서로의 애정 표현이 다르다는 점을 먼저 인정하면 연락 빈도나 표현 방식 때문에 생기는 오해를 줄일 수 있습니다.</p><h3>관계를 편안하게 만드는 대화법</h3><p>{x.tip}</p></section>})}
      <aside className={styles.notice}>MBTI 궁합은 관계의 성공 여부를 예측하는 공식이 아닙니다. 유형 설명은 대화를 시작하는 참고 자료로만 활용하고 상대를 네 글자로 단정하지 마세요.</aside>
      <section className={styles.cta}><h2>두 사람의 유형부터 확인해 보세요</h2><p>무료 검사 결과를 확인한 뒤 서로의 차이를 대화해 보세요.</p><a href="/">무료 MBTI 검사 시작하기 →</a></section>
    </article><SiteFooter/></main>;
}
