import type { Metadata } from "next";
import Link from "next/link";
import ReportDone from "../../../components/ReportDone";
import SiteFooter from "../../../components/SiteFooter";

export const metadata: Metadata = {
  title: "결제 확인",
  robots: { index: false, follow: false },
};

export default function ReportDonePage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/report/find/">주문 다시 찾기</Link></header>
      <article className="info-article rp">
        <span className="eyebrow">MORI REPORT</span>
        <h1>결제 확인</h1>
        <ReportDone />
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
