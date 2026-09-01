"use client";

import { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  adAttributes,
  resolveAdSlot,
  type AdPosition,
} from "../lib/ad-slots";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export { ADSENSE_CLIENT };

export default function AdUnit({
  position = "pageFooter",
  label,
}: {
  /** 자리 이름. 슬롯 ID와 형식은 lib/ad-slots.ts 에서 가져옵니다. */
  position?: AdPosition;
  label?: string;
}) {
  const { slot, format, layoutKey, name } = resolveAdSlot(position);
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

      // 인아티클·인피드·멀티플렉스는 좁은 폭에서 렌더가 실패하므로 폭을 먼저 확인합니다.
      const minimumWidth = format === "display" ? 1 : 250;
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
  }, [format, slot]);

  return (
    <aside
      ref={wrapperRef}
      className="ad-unit"
      aria-label={label || name}
      data-ad-placement={position}
      data-ad-state="pending"
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        {...adAttributes(format, layoutKey)}
      />
    </aside>
  );
}
