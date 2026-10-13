"use client";

import { useEffect, useState } from "react";
import { reportPrice } from "../lib/report-config";

/**
 * 리포트 가격(9,900원 고정, 2026-10-14). 첫 그림에서는 비워 두고 붙은 뒤 채웁니다 —
 * 서버 그림과 어긋나지 않게(hydration) 하려는 것입니다. 이벤트·인상 안내는 없앴습니다.
 */
export function useReportPricing(): { ready: boolean; price: number } {
  const [state, setState] = useState({ ready: false, price: 0 });
  useEffect(() => {
    const id = setTimeout(() => setState({ ready: true, price: reportPrice() }), 0);
    return () => clearTimeout(id);
  }, []);
  return state;
}

export const won = (n: number) => `${n.toLocaleString()}원`;
