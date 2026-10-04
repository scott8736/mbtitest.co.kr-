"use client";

/**
 * 사이트 곳곳의 「100쪽 리포트」 안내 카드 (2026-10-04, 사용자 목표 「모든 페이지에서 유료 결제로」).
 *
 * - 이 기기에 MBTI 결과가 있고 그 유형 원고가 준비됐으면 → 「내 {유형} 리포트」 → /report/ (점수 그대로 주문)
 * - 결과가 없으면 → 40문항 무료 검사로 보냅니다(리포트는 점수로 만들어지므로 검사가 먼저입니다)
 * - pageType(유형·궁합 페이지의 그 유형)이 있으면 문구에 씁니다.
 * ?from= 값은 주문의 「어느 버튼으로 왔는지」로 관리자 주문 표에 남습니다.
 * 마음건강 자가진단(/check)에는 붙이지 않습니다 — 판매 카드가 어울리지 않는 자리입니다.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { readLastResult } from "../lib/my-mori";
import { moriImage } from "../lib/mori";
import { REPORT_EVENT, REPORT_PRICE } from "../lib/report-config";
import { REPORT_READY_TYPES } from "../report/content/ready";

const fmt = (d: string) => d.replace(/^\d{4}-(\d{2})-(\d{2})$/, (_, m, dd) => `${Number(m)}월 ${Number(dd)}일`);

export default function ReportCrossSell({ from, pageType }: { from: string; pageType?: string }) {
  const [mine, setMine] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setMine(readLastResult()?.result ?? null), 0);
    return () => clearTimeout(id);
  }, []);

  const ready = mine && REPORT_READY_TYPES.includes(mine);
  const showType = ready ? mine : pageType && REPORT_READY_TYPES.includes(pageType) ? pageType : REPORT_READY_TYPES[0] ?? "INFP";
  const href = ready ? `/report/?from=${from}` : "/tests/mbti/";
  const title = ready
    ? `내 점수로 만든 ${mine} 100쪽 안내서`
    : pageType
      ? `${pageType}라도 다 같지 않아요 — 내 점수로 만든 100쪽 안내서`
      : "결과 한 장 말고, 내 점수로 만든 100쪽 안내서";
  const sub = ready
    ? "내 검사 점수 그대로 · 연애·일·돈·관계 11가지 주제 · 미리보기 6쪽 무료"
    : "40문항 무료 검사를 마치면 내 성향 농도에 맞춘 104쪽 리포트를 미리 볼 수 있어요";

  return (
    <aside className="report-xsell">
      {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
      <img className="report-xsell-mori" src={moriImage(showType)} alt="" width={88} height={88} loading="lazy" />
      <div className="report-xsell-text">
        <span>MORI REPORT{REPORT_EVENT.label ? ` · ${REPORT_EVENT.label} ${fmt(REPORT_EVENT.to)}까지 ${REPORT_PRICE.toLocaleString()}원` : ""}</span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </div>
      <Link className="report-xsell-button" href={href}>
        {ready ? "미리보기 6쪽 보기" : "무료 검사하고 받기"} →
      </Link>
    </aside>
  );
}
