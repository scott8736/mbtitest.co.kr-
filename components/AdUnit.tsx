"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export const ADSENSE_CLIENT = "ca-pub-8646375689901020";
export const ADSENSE_DISPLAY_SLOT = "4581470308";
export const ADSENSE_IN_ARTICLE_SLOT = "5081143693";

export default function AdUnit({
  slot,
  format = "auto",
  label = "광고",
  layout,
}: {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  label?: string;
  layout?: "in-article";
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 차단기나 지연 로딩이 테스트 동작에 영향을 주지 않도록 합니다.
    }
  }, []);

  if (!slot) return null;

  return (
    <aside className="ad-unit" aria-label={label}>
      <span className="ad-label">광고</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </aside>
  );
}
