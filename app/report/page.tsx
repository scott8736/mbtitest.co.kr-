import type { Metadata } from "next";
import Link from "next/link";
import ReportBuy, { ReportPreview } from "../../components/ReportBuy";
import SiteFooter from "../../components/SiteFooter";
import { REPORT_EVENT, REPORT_PRICE, REPORT_PRODUCT } from "../../lib/report-config";

export const metadata: Metadata = {
  title: "모리 마음숲 안내서 — 내 점수로 만든 리포트",
  description: "40문항 점수로 같은 유형 안에서도 내 성향의 농도에 맞춘 이야기를 11가지 주제로 풀어 드립니다.",
  alternates: { canonical: "/report/" },
};

const fmt = (d: string) => d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, dd) => `${y}년 ${Number(m)}월 ${Number(dd)}일`);

const TOPICS = [
  "내 성향의 농도 — 실제 점수로 고른 글",
  "나는 어떤 사람일까",
  "연애할 때의 나",
  "친구와 사람들 사이에서",
  "일하는 방식",
  "공부할 때의 나",
  "돈을 대하는 마음",
  "방전과 충전",
  "하루의 리듬",
  "나를 꾸미는 색",
  "앞으로 13개월 마음 달력",
];

export default function ReportPage() {
  return (
    <main className="info-page">
      <header className="simple-header">
        <Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link>
        <Link href="/report/find/">주문 다시 찾기</Link>
      </header>
      <article className="info-article rp">
        <span className="eyebrow">MORI REPORT</span>
        <h1>{REPORT_PRODUCT}</h1>
        <p>
          40문항 검사의 내 점수로, 같은 유형 안에서도 내 성향의 농도에 맞춘 이야기를 골라 11가지 주제로 풀어 드립니다.
          생년월일을 넣으면 사주 이야기가 한 장 더해집니다.
        </p>

        <div className="rp-price">
          {REPORT_EVENT.label ? (
            <span className="rp-event">
              {REPORT_EVENT.label} · {fmt(REPORT_EVENT.from)} ~ {fmt(REPORT_EVENT.to)}
            </span>
          ) : null}
          <b>{REPORT_PRICE.toLocaleString()}원</b>
          <small>A5 104쪽(생년월일을 넣으면 110쪽) · PDF 저장 · 휴대폰 배경화면 3종 · 결제 후 바로 열람</small>
        </div>

        <h2>무료 미리보기</h2>
        <p>실제 리포트의 앞부분 세 쪽입니다(견본 이름 「하늘」). 내 유형·점수로 만들어지는 쪽은 결제 후에 열립니다.</p>
        <ReportPreview />

        <h2>들어 있는 것</h2>
        <ol className="rp-topics">
          {TOPICS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p>그 밖에 세계관 「마음숲 이야기」, 나와 다른 15모리와 지내는 법, 써 보는 페이지, 액자용 포스터가 함께 들어 있습니다.</p>
        <div className="notice-box">
          <strong>읽기 전에</strong>
          <p>이 리포트는 공식 MBTI® 검사 결과가 아니라 자기이해를 돕는 콘텐츠입니다. 의료·심리 진단을 대신하지 않습니다. 사주 장은 전통 해석을 재미로 풀어 쓴 것으로 미래를 단정하지 않습니다.</p>
        </div>

        <h2>주문하기</h2>
        <ReportBuy />

        <h2>환불 안내</h2>
        <p>
          디지털 콘텐츠라 결제 후 리포트를 열람하면 청약철회가 제한됩니다(전자상거래법 제17조 제2항 제5호). 열람 전이라면 결제일로부터 7일 안에 전액 환불해 드립니다.
          내용에 오류가 있거나 열리지 않으면 열람 여부와 관계없이 환불해 드립니다. <Link href="/refund/">자세한 환불 안내</Link>
        </p>
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
