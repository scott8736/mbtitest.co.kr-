"use client";

import { useEffect, useState } from "react";
import {
  REPORT_EVENT,
  REPORT_REGULAR_PRICE,
  eventEndNextDay,
  fmtEventDate,
  reportEventOn,
  reportPrice,
} from "../lib/report-config";

/**
 * 이벤트 기간·가격을 방문자 브라우저 시각으로 정합니다(정적 페이지라 빌드 시각으로 정하면 기간이 지나도 남습니다).
 * 첫 그림에서는 비워 두고 붙은 뒤 채웁니다 — 서버 그림과 어긋나지 않고, 끝난 이벤트 가격이 잠깐이라도 보이지 않게.
 */
export function useReportPricing(): { ready: boolean; eventOn: boolean; price: number } {
  const [state, setState] = useState({ ready: false, eventOn: false, price: 0 });
  useEffect(() => {
    const id = setTimeout(() => setState({ ready: true, eventOn: reportEventOn(), price: reportPrice() }), 0);
    return () => clearTimeout(id);
  }, []);
  return state;
}

export function useReportEvent(): boolean {
  return useReportPricing().eventOn;
}

export const won = (n: number) => `${n.toLocaleString()}원`;
/** 「11월 1일부터 14,900원」 */
export const afterEventText = () => `${fmtEventDate(eventEndNextDay())}부터 ${won(REPORT_REGULAR_PRICE)}`;

/** 판매 페이지 가격 상자: 이벤트 띠 + 가격 */
export default function ReportPriceBox() {
  const { ready, eventOn, price } = useReportPricing();
  return (
    <>
      {eventOn ? (
        <span className="rp-event">
          {REPORT_EVENT.label} · {fmtEventDate(REPORT_EVENT.from)} ~ {fmtEventDate(REPORT_EVENT.to)} · {afterEventText()}
        </span>
      ) : null}
      <b>{ready ? won(price) : " "}</b>
    </>
  );
}
