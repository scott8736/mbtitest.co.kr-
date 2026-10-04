import type { Metadata } from "next";
import Link from "next/link";
import { ReportFind } from "../../../components/ReportDone";
import SiteFooter from "../../../components/SiteFooter";

export const metadata: Metadata = {
  title: "주문 다시 찾기",
  robots: { index: false, follow: false },
};

export default function ReportFindPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/report/">리포트 안내</Link></header>
      <article className="info-article rp">
        <span className="eyebrow">MORI REPORT</span>
        <h1>주문 다시 찾기</h1>
        <p>결제 완료 화면의 주문번호와, 결제할 때 쓴 휴대폰 번호 뒤 4자리를 넣어 주세요.</p>
        <ReportFind />
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
