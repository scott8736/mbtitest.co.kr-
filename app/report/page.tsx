import type { Metadata } from "next";
import Link from "next/link";
import ReportBuy, { ReportPreview } from "../../components/ReportBuy";
import SiteFooter from "../../components/SiteFooter";
import ReportPriceBox from "../../components/ReportEvent";
import { REPORT_PRODUCT } from "../../lib/report-config";

export const metadata: Metadata = {
  title: "모리 마음숲 안내서 — 내 점수로 만든 리포트",
  description: "40문항 점수로 같은 유형 안에서도 내 성향의 농도에 맞춘 이야기를 11가지 주제로 풀어 드립니다.",
  alternates: { canonical: "/report/" },
};


// 장 설명은 원고(리포트_디자인/content)에 실제로 있는 내용만 씁니다.
const TOPICS: [string, string, string][] = [
  ["🎚️", "내 성향의 농도", "네 축을 내 실제 점수(반반·중간·뚜렷)에 맞춰 골라 쓴 글"],
  ["🌱", "나는 어떤 사람일까", "내 모리의 성격과 강점, 마음 습관"],
  ["💗", "연애할 때의 나", "끌리는 사람, 다툴 때의 나, 잘 맞는 짝꿍 모리"],
  ["🤝", "친구와 사람들 사이에서", "친구 관계와 모임에서 자연스럽게 맡는 역할"],
  ["💼", "일하는 방식", "일하는 스타일과 잘 어울리는 일"],
  ["📚", "공부할 때의 나", "집중이 잘 되는 공부 방법"],
  ["🪙", "돈을 대하는 마음", "돈을 쓰고 모으는 나의 습관"],
  ["🔋", "방전과 충전", "지칠 때 보내는 신호와 회복하는 법"],
  ["⏰", "하루의 리듬", "나에게 맞는 하루의 흐름"],
  ["🎨", "나를 꾸미는 색", "어울리는 색과 분위기"],
  ["📅", "앞으로 13개월 마음 달력", "이번 달부터 13개월, 달마다 마음 쓰는 법"],
];
const EXTRAS = ["📖 세계관 「마음숲 이야기」", "🐾 나와 다른 15모리와 지내는 법", "✍️ 써 보는 페이지", "🖼️ 오려 붙이는 포스터", "📱 휴대폰 배경화면 3종", "🔮 생년월일을 넣으면 사주 장 6쪽"];

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

        {/* 무료 미리보기 6쪽을 맨 위에(2026-10-04 사용자 요청). 아래 주문까지 내려가기 전에 실물을 먼저 보여 줍니다. */}
        <ReportPreview />
        <p className="rp-muted">무료 미리보기 6쪽 · 견본 이름 「하늘」 · 내 유형·점수로 만들어지는 나머지 쪽은 결제 후에 열립니다.</p>

        <div className="rp-price">
          <ReportPriceBox />
          <small>A5 104쪽(생년월일을 넣으면 110쪽) · PDF 저장 · 휴대폰 배경화면 3종 · 결제 후 바로 열람</small>
        </div>

        <h2>들어 있는 것</h2>
        <ol className="rp-chapters">
          {TOPICS.map(([icon, title, desc], i) => (
            <li key={title}>
              <span className="rp-ch-icon" aria-hidden="true">{icon}</span>
              <div>
                <small>{String(i + 1).padStart(2, "0")}</small>
                <b>{title}</b>
                <span>{desc}</span>
              </div>
            </li>
          ))}
        </ol>
        <p className="rp-extras-title">그 밖에 함께 들어 있는 것</p>
        <ul className="rp-extras">
          {EXTRAS.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div className="notice-box">
          <strong>읽기 전에</strong>
          <p>이 리포트는 공식 MBTI® 검사 결과가 아니라 자기이해를 돕는 콘텐츠입니다. 의료·심리 진단을 대신하지 않습니다. 사주 장은 전통 해석을 재미로 풀어 쓴 것으로 미래를 단정하지 않습니다.</p>
        </div>

        <h2>주문하기</h2>
        <ReportBuy />

        <h2>환불 안내</h2>
        <p>
          디지털 콘텐츠라 결제 후 리포트를 열람하면 청약철회가 제한됩니다(전자상거래법 제17조 제2항 제5호). 열람 전이라면 결제일로부터 7일 안에 전액 환불해 드립니다.
          리포트가 열리지 않거나 깨져 있거나, 이 페이지의 설명과 내용이 다르면 열람 여부와 관계없이 환불해 드립니다. <Link href="/refund/">자세한 환불 안내</Link>
        </p>
      </article>
      <SiteFooter ads={false} />
    </main>
  );
}
