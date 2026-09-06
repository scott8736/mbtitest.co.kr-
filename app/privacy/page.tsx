import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "MBTI 검사 사이트의 개인정보 및 쿠키·광고 이용 안내입니다.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/tests/">심리테스트 보기</Link></header>
      <article className="info-article policy-copy">
        <span className="eyebrow">PRIVACY</span>
        <h1>개인정보처리방침</h1>
        <p className="updated">시행일: 2026년 7월 25일 · 최종 개정: 2026년 9월 6일</p>
        <h2>1. 검사 답변</h2>
        <p>현재 제공되는 테스트 답변은 결과 계산을 위해 이용자의 브라우저에서 처리되며, 사이트 서버에 개인별 답변을 저장하지 않습니다.</p>
        <h2>2. 접속 기록</h2>
        <p>서비스 운영과 방문 통계 확인을 위해 아래 항목을 자동으로 수집합니다.</p>
        <ul>
          <li><b>수집 항목</b> — 방문한 페이지 주소, 유입 경로(리퍼러), 접속 기기 구분(모바일·데스크톱), 접속 국가·도시, 방문 시각, 방문자 구분값</li>
          <li><b>방문자 구분값</b> — IP 주소와 브라우저 정보에 <b>날짜별 값을 섞어 만든 일방향 해시</b>입니다. 원래의 IP 주소로 되돌릴 수 없고, 날짜가 바뀌면 같은 이용자도 다른 값이 되어 하루 단위 방문자 수 집계에만 쓰입니다.</li>
          <li><b>수집하지 않는 것</b> — IP 주소 원본, 이름·연락처 등 이용자를 특정할 수 있는 정보, 검사 답변 내용</li>
          <li><b>이용 목적</b> — 방문 통계 확인, 오류 파악, 콘텐츠 개선</li>
          <li><b>보유 기간</b> — <b>90일</b>이며, 기간이 지난 기록은 자동으로 삭제됩니다</li>
          <li><b>처리 위탁</b> — 기록은 사이트 운영에 사용하는 Cloudflare 인프라에 저장됩니다</li>
        </ul>
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
