import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import { REPORT_CONSENT_TEXT, REPORT_CONSENT_VERSION, REPORT_PRODUCT, SELLER } from "../../lib/report-config";

export const metadata: Metadata = {
  title: "환불 안내",
  description: "유료 리포트 「모리 마음숲 안내서」의 청약철회·환불 기준입니다.",
  alternates: { canonical: "/refund/" },
};

export default function RefundPage() {
  return (
    <main className="info-page">
      <header className="simple-header"><Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link><Link href="/report/">리포트 안내</Link></header>
      <article className="info-article policy-copy">
        <span className="eyebrow">REFUND</span>
        <h1>환불 안내</h1>
        <p className="updated">적용 상품: {REPORT_PRODUCT} · 기준일: {REPORT_CONSENT_VERSION}</p>
        <h2>1. 열람 전 — 전액 환불</h2>
        <p>결제 후 리포트를 한 번도 열지 않았다면 결제일로부터 7일 안에 전액 환불해 드립니다. 열람 여부는 리포트를 처음 연 시각 기록으로 확인합니다.</p>
        <h2>2. 열람 후 — 청약철회 제한</h2>
        <p>리포트는 결제 즉시 내 점수로 만들어 제공되는 디지털 콘텐츠라, 한 번 열람하면 청약철회가 제한됩니다(전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항 제5호). 결제 전에 무료 미리보기 여섯 쪽과 이 안내를 보여 드리고, 주문할 때 아래 문구에 동의를 받습니다.</p>
        <p>「{REPORT_CONSENT_TEXT}」</p>
        <h2>3. 열람과 관계없이 환불하는 경우</h2>
        <ul>
          <li>리포트가 열리지 않거나 내용이 깨져 정상적으로 볼 수 없을 때</li>
          <li>주문한 유형·점수와 다른 리포트가 나왔을 때</li>
          <li>같은 주문이 실수로 두 번 결제됐을 때(중복 결제분)</li>
          <li>리포트 내용이 판매 페이지의 설명·광고와 다를 때 — 리포트를 받은 날부터 3개월, 다르다는 것을 안 날부터 30일 안에 청약철회할 수 있습니다(같은 법 제17조 제3항)</li>
        </ul>
        <h2>4. 환불 방법</h2>
        <p>문의하기의 오픈채팅, 전화·이메일({SELLER.contact}) 중 편한 곳으로 주문번호(또는 주문한 휴대폰 번호 뒤 4자리)와 사유를 알려 주세요. 카드·간편결제는 결제 취소로 환불합니다. 휴대폰 결제는 통신사의 취소 가능 기간이 지나면 결제 취소 대신 계좌로 환불해 드립니다. 취소 후 카드사 사정에 따라 3~7영업일이 걸릴 수 있습니다.</p>
        <p><Link href="/contact/">문의하기</Link> · <Link href="/report/find/">주문 다시 찾기</Link></p>
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
