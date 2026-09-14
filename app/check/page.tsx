import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import AdUnit from "../../components/AdUnit";
import { HELPLINES, screeners } from "../../lib/screeners";
import "./screener.css";

export const metadata: Metadata = {
  title: "무료 심리 자가진단 모음 — 우울·불안·ADHD·불면",
  description:
    "우울증, 불안장애, 성인 ADHD, 공황장애, 불면증, 스트레스, 스마트폰 중독, 가스라이팅까지 8가지 자가진단을 회원가입 없이 무료로 확인하세요.",
  keywords: [
    "심리 자가진단",
    "우울증 자가진단",
    "불안장애 자가진단",
    "성인 ADHD 자가진단",
    "무료 심리검사",
  ],
  alternates: { canonical: "/check/" },
};

export default function CheckIndexPage() {
  return (
    <main className="generic-test screener">
      <SiteHeader active="/check" />

      <section className="generic-intro">
        <span className="eyebrow">SELF CHECK</span>
        <h1>심리 자가진단 모음</h1>
        <p>
          지금 내 상태를 점수로 확인해 보는 선별 검사 8가지입니다. 회원가입 없이 2분이면
          끝나고, 응답은 어디에도 저장되지 않습니다.
        </p>
        <p className="test-disclaimer">
          모두 <b>진단이 아니라 선별 도구</b>입니다. 결과가 어떤 질환의 진단을 대신하지
          않으며, 정확한 확인은 정신건강의학과 전문의 또는 지역 정신건강복지센터에서
          받으시기 바랍니다.
        </p>
      </section>

      <section className="screener-list">
        {screeners.map((screener) => (
          <Link key={screener.slug} href={`/check/${screener.slug}/`}>
            <span className="screener-icon" style={{ background: screener.color }}>
              {screener.icon}
            </span>
            <b>{screener.title}</b>
            <span className="screener-desc">{screener.description}</span>
            <span className="screener-meta">
              {screener.questions.length}문항 · {screener.duration}
            </span>
          </Link>
        ))}
      </section>

      <AdUnit position="testListFeed" />

      <aside className="screener-help">
        <h2>도움이 필요할 때</h2>
        <ul>
          {HELPLINES.map((line) => (
            <li key={line.tel}>
              <a href={`tel:${line.tel}`}>{line.tel}</a>
              <span>
                {line.name} · {line.note}
              </span>
            </li>
          ))}
        </ul>
        <p>
          통화료는 들지 않습니다. 가까운 지역 정신건강복지센터 상담도 무료이며,
          1577-0199 로 전화하면 거주지 센터로 연결됩니다.
        </p>
      </aside>

      <section className="generic-explain">
        <h2>자가진단을 어떻게 읽어야 하나요</h2>
        <p>
          자가진단은 병을 찾아내는 도구가 아니라, 전문가를 만나볼 필요가 있는지를
          가늠하는 도구입니다. 의사가 쓰는 진단 기준은 증상의 종류뿐 아니라 기간, 일상
          기능에 미치는 영향, 다른 원인의 배제까지 함께 봅니다. 문항 점수만으로는 알 수
          없는 부분입니다.
        </p>
        <p>
          그래서 점수는 두 가지로만 읽으시면 됩니다. 낮으면 지금의 리듬을 유지하시고,
          높으면 한 번 확인해 보시라는 뜻입니다. 점수가 낮게 나왔는데도 힘들다면 그
          어려움이 사실이니, 점수를 근거로 참지 마세요.
        </p>
        <p>
          기간도 중요합니다. 대부분의 검사는 지난 2주 또는 한 달을 기준으로 묻습니다.
          힘든 일이 막 지나간 직후라면 점수가 높게 나오는 것이 자연스럽고, 2주쯤 뒤에
          다시 해보면 달라지는 경우가 많습니다.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
