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

const slots = {
  display: ADSENSE_DISPLAY_SLOT,
  inArticle: ADSENSE_IN_ARTICLE_SLOT,
} as const;

export default function AdUnit({
  slot,
  placement = "display",
  format,
  label = "광고",
}: {
  slot?: string;
  placement?: keyof typeof slots;
  format?: "auto" | "fluid" | "rectangle";
  label?: string;
}) {
  const resolvedSlot = slot || slots[placement];
  const resolvedFormat = format || (placement === "inArticle" ? "fluid" : "auto");
  const wrapperRef = useRef<HTMLElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const ad = adRef.current;
    if (!wrapper || !ad) return;

    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let animationFrame = 0;
    let attempts = 0;

    const syncStatus = () => {
      const status = ad.dataset.adStatus;
      if (status) wrapper.dataset.adState = status;
      else if (ad.dataset.adsbygoogleStatus) wrapper.dataset.adState = "processing";
    };

    const requestAd = () => {
      if (
        requestedRef.current ||
        ad.dataset.adsbygoogleStatus ||
        ad.dataset.adStatus
      ) {
        syncStatus();
        return;
      }

      const minimumWidth = placement === "inArticle" ? 250 : 1;
      if (ad.getBoundingClientRect().width < minimumWidth) return;

      attempts += 1;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        requestedRef.current = true;
        wrapper.dataset.adState = "requested";
      } catch {
        wrapper.dataset.adState = "retrying";
        if (attempts < 2) retryTimer = setTimeout(requestAd, 600);
      }
    };

    const statusObserver = new MutationObserver(syncStatus);
    statusObserver.observe(ad, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
    });

    const sizeObserver = new ResizeObserver(requestAd);
    sizeObserver.observe(ad);

    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    script?.addEventListener("load", requestAd);
    window.addEventListener("load", requestAd);
    animationFrame = requestAnimationFrame(requestAd);

    return () => {
      statusObserver.disconnect();
      sizeObserver.disconnect();
      script?.removeEventListener("load", requestAd);
      window.removeEventListener("load", requestAd);
      cancelAnimationFrame(animationFrame);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [placement, resolvedSlot]);

  return (
    <aside
      ref={wrapperRef}
      className="ad-unit"
      aria-label={label}
      data-ad-placement={placement}
      data-ad-state="pending"
    >
      <span className="ad-label">광고</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={resolvedSlot}
        data-ad-format={resolvedFormat}
        data-ad-layout={placement === "inArticle" ? "in-article" : undefined}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
