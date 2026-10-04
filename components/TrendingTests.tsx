"use client";

import { useEffect, useState } from "react";
import { testCatalog } from "../lib/test-catalog";
import { onResultLinkClick } from "../lib/test-events";
import type { TrendingItem } from "../lib/trending";

/**
 * 홈 「요즘 뜨는 심리테스트」. 네이버 데이터랩 상승률(lib/trending.ts)로 고른 검사를
 * 누르면 바로 그 검사가 시작됩니다. 데이터는 /api/trending 에서 받고, 못 받으면
 * 아무것도 그리지 않습니다 — 홈의 나머지는 그대로입니다.
 * 디자인은 바로 위 「이번 시즌」 띠(.season-*)를 그대로 씁니다.
 */
export default function TrendingTests() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [at, setAt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/trending")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { at?: number; items?: TrendingItem[] } | null) => {
        if (!alive || !data?.items?.length) return;
        setItems(data.items);
        setAt(data.at ?? 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const cards = items
    .map((item) => {
      const meta = testCatalog.find((test) => test.slug === item.slug);
      return meta ? { ...item, meta } : null;
    })
    .filter((card) => card !== null);
  if (cards.length < 2) return null;

  // 오른 것이 없으면 「뜬다」고 말하지 않습니다.
  const anyRising = cards.some((card) => card.rising);
  const day = at ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).format(at) : "";

  return (
    <section className="season-strip trending-strip" aria-labelledby="trending-title">
      <div className="season-inner">
        <div className="season-head">
          <span className="eyebrow season-eyebrow">{anyRising ? "요즘 뜨는" : "요즘 많이 찾는"}</span>
          <h2 id="trending-title">{anyRising ? "요즘 사람들이 많이 찾기 시작한 심리테스트" : "요즘 많이 찾는 심리테스트"}</h2>
          <p>네이버 검색량을 지난주와 비교해 골랐어요{day ? ` (${day} 기준)` : ""}. 누르면 바로 시작합니다.</p>
        </div>
        <div className="season-cards trending-cards" onClick={onResultLinkClick("home-trending")}>
          {cards.map((card) => (
            <a
              key={card.slug}
              className="season-card"
              href={card.meta.href}
              style={{ "--accent": card.meta.color } as React.CSSProperties}
            >
              {card.rising && card.change !== null ? (
                <span className="trending-badge">검색 ▲{Math.round(card.change)}%</span>
              ) : (
                <span className="trending-badge quiet">꾸준히 찾는</span>
              )}
              <strong>{card.meta.shortTitle}</strong>
              <p>{card.meta.questionCount}문항 · {card.meta.duration}</p>
              <span className="season-go">
                테스트하기 <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
