"use client";

import { recordResultClick } from "../lib/test-events";
import { reportSample } from "../lib/report-samples";

/**
 * 「104쪽 전체 샘플 보기」 카드 (2026-10-14 사용자 요청). 미리보기 6쪽만 보여 줄 때보다
 * 실제 완성본을 처음부터 끝까지 넘겨 보게 하면 결제할 마음이 커진다는 판단입니다.
 * 사용자가 새 창으로 열기를 지정해서 이 링크만 target="_blank" 입니다(사이트 나머지 링크는 현재 창).
 * 관리자가 발행한 샘플이 없으면(lib/report-samples.ts) 아무것도 그리지 않습니다.
 */
export default function ReportSampleCta({ code, placement = "report-sample" }: { code?: string; placement?: "report-sample" }) {
  const sample = reportSample(code);
  if (!sample) return null;
  const mine = Boolean(code) && sample.type === code;
  return (
    <a className="report-sample-cta" href={sample.href} target="_blank" rel="noopener" onClick={() => recordResultClick(placement)}>
      <span className="rsc-badge">{mine ? "실제 완성본 · 110쪽" : `${sample.type} 예시 · 실제 완성본 110쪽`}</span>
      <b>{mine ? `${code} 리포트, 첫 장부터 끝까지 먼저 넘겨 보세요` : "실제 리포트를 첫 장부터 끝까지 먼저 넘겨 보세요"}</b>
      <small>연애·일·돈·공부·13개월 마음 달력까지 — 샘플 이름으로 만든 진짜 결과물이에요{mine ? "" : ` (내 유형이 아니라 ${sample.type} 예시예요)`}</small>
      <i aria-hidden="true">📖 샘플 전체 보기 (새 창) →</i>
    </a>
  );
}
