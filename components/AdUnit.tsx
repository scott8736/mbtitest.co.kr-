"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdUnit({
  slot,
  format = "auto",
  label = "광고",
}: {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle";
  label?: string;
}) {
  useEffect(() => {
    if (!client || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers and delayed AdSense loading should not affect the test.
    }
  }, [slot]);

  if (!client || !slot) return null;

  return (
    <aside className="ad-unit" aria-label={label}>
      <span className="ad-label">광고</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
