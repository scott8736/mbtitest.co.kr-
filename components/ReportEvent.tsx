"use client";

import { useEffect, useState } from "react";
import { REPORT_EVENT, fmtEventDate, reportEventOn } from "../lib/report-config";

/**
 * 이벤트 기간인지 방문자 브라우저 시각으로 판단합니다(정적 페이지라 빌드 시각으로 정하면 기간이 지나도 남습니다).
 * 첫 그림에서는 꺼 둔 채로 그리고 붙은 뒤 켭니다 — 서버 그림과 어긋나지 않게.
 */
export function useReportEvent(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setOn(reportEventOn()), 0);
    return () => clearTimeout(id);
  }, []);
  return on;
}

/** 판매 페이지 가격 위 「오픈 기념 특별 이벤트 · 10월 5일 ~ 10월 31일」 */
export default function ReportEventRange() {
  const on = useReportEvent();
  if (!on) return null;
  return (
    <span className="rp-event">
      {REPORT_EVENT.label} · {fmtEventDate(REPORT_EVENT.from)} ~ {fmtEventDate(REPORT_EVENT.to)}
    </span>
  );
}
