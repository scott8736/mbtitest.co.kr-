import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "MBTI 검사 사이트의 개인정보 및 쿠키·광고 이용 안내입니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/tests">심리테스트 보기</Link></header>
      <article className="info-article policy-copy">
        <span className="eyebrow">PRIVACY</span>
        <h1>개인정보처리방침</h1>
        <p className="updated">시행일: 2026년 7월 25일</p>
        <h2>1. 검사 답변</h2>
        <p>현재 제공되는 테스트 답변은 결과 계산을 위해 이용자의 브라우저에서 처리되며, 사이트 서버에 개인별 답변을 저장하지 않습니다.</p>
        <h2>2. 자동으로 수집될 수 있는 정보</h2>
        <p>서비스 품질 개선과 방문 통계 확인을 위해 접속 기기, 브라우저 종류, 방문 페이지, 접속 시간과 같은 비식별 이용 정보가 분석 도구를 통해 처리될 수 있습니다.</p>
        <h2>3. 쿠키와 광고</h2>
        <p>향후 Google AdSense 광고가 적용되면 Google과 광고 파트너가 쿠키를 사용하여 이용자의 관심사에 맞는 광고를 제공하거나 광고 성과를 측정할 수 있습니다. 이용자는 브라우저 설정에서 쿠키를 제한할 수 있습니다.</p>
        <h2>4. 외부 서비스</h2>
        <p>결과 공유 기능을 이용하면 사용자가 선택한 외부 서비스의 개인정보 처리방침이 적용될 수 있습니다.</p>
        <h2>5. 문의</h2>
        <p>개인정보와 관련한 문의는 문의하기 페이지를 통해 접수할 수 있습니다.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
