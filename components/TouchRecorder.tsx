"use client";

import { useEffect } from "react";

/**
 * 마지막 바깥 유입을 이 기기에 적어 둡니다(2026-10-04, 리포트 주문의 유입 경로 추적).
 *
 * 다른 사이트(스레드·검색·페이스북…)에서 들어왔거나 주소에 utm_ 이 붙어 있을 때만 덮어씁니다.
 * 사이트 안에서 이동할 때는 그대로 두므로, 주문할 때 「처음 어디서 왔는지」가 남습니다.
 * 저장하는 것: 리퍼러 주소(300자), 처음 연 페이지, utm 값, 시각 — 개인을 알아볼 수 있는 값은 없습니다.
 */
export const TOUCH_KEY = "mori-touch";

export default function TouchRecorder() {
  useEffect(() => {
    try {
      const ref = document.referrer;
      const external = ref && !new URL(ref).hostname.endsWith(location.hostname.replace(/^www\./, ""));
      const q = new URLSearchParams(location.search);
      const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => q.get(k) ?? "").join("/");
      const hasUtm = utm !== "//";
      if (!external && !hasUtm) return;
      localStorage.setItem(
        TOUCH_KEY,
        JSON.stringify({ ref: external ? ref.slice(0, 300) : "", landing: location.pathname.slice(0, 120), utm: hasUtm ? utm.slice(0, 120) : "", at: Date.now() }),
      );
    } catch {
      // 저장소를 못 써도 사이트는 그대로 동작합니다.
    }
  }, []);
  return null;
}
