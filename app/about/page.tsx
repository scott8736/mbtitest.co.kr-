import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "사이트 소개",
  description: "MBTI 검사와 무료 심리테스트 사이트의 운영 목적과 테스트 이용 안내입니다.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/tests/">심리테스트 보기</Link></header>
      <article className="info-article">
        <span className="eyebrow">ABOUT</span>
        <h1>나를 이해하는 질문을<br />더 쉽고 편안하게</h1>
        <p>MBTI 검사는 성격, 관계, 마음건강과 관련된 다양한 자기이해 테스트를 누구나 부담 없이 이용할 수 있도록 만드는 사이트입니다.</p>
        <h2>서비스 운영 원칙</h2>
        <div className="info-grid">
          <section><b>01</b><h3>명확한 안내</h3><p>문항 수, 소요 시간, 결과의 의미와 한계를 검사 전에 알기 쉽게 안내합니다.</p></section>
          <section><b>02</b><h3>편안한 이용</h3><p>회원가입을 요구하지 않고 모바일에서도 쉽게 선택할 수 있는 화면을 제공합니다.</p></section>
          <section><b>03</b><h3>책임 있는 결과</h3><p>사람을 단정하거나 전문적인 심리 진단을 대신하지 않도록 결과를 참고 자료로 제공합니다.</p></section>
        </div>
        <div className="notice-box"><strong>검사 이용 안내</strong><p>사이트의 테스트는 자기이해를 위한 비공식 간이 검사입니다. 의료·상담 목적의 진단이나 채용 평가를 대신하지 않습니다.</p></div>
      </article>
      <SiteFooter />
    </main>
  );
}
