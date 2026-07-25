import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "문의하기",
  description: "MBTI 검사 사이트의 오류 신고, 제휴 및 콘텐츠 관련 문의 안내입니다.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/tests">심리테스트 보기</Link></header>
      <article className="info-article">
        <span className="eyebrow">CONTACT</span>
        <h1>서비스 문의</h1>
        <p>검사 오류, 결과 설명, 콘텐츠 제안, 광고 및 제휴 관련 문의를 남겨주세요.</p>
        <div className="contact-card">
          <span>문의 이메일</span>
          <strong>charry333@gmail.com</strong>
          <a href="mailto:charry333@gmail.com">이메일 보내기 <span>→</span></a>
        </div>
        <div className="notice-box"><strong>문의 시 포함하면 좋은 내용</strong><p>이용한 테스트 이름, 사용 기기, 발생한 문제와 화면 상황을 함께 알려주시면 확인에 도움이 됩니다.</p></div>
      </article>
      <SiteFooter />
    </main>
  );
}
