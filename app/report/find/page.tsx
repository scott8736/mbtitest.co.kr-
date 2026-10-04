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
        <p>결제할 때 쓴 휴대폰 번호를 넣으면 그 번호로 결제한 리포트를 찾아 드려요. 이 기기에서 연 적이 있으면 아래에 바로 보여요.</p>
        <ReportFind />
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
