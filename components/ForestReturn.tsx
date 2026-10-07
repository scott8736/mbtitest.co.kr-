"use client";

import { useEffect, useState } from "react";
import { completeForestQuest, FOREST_QUESTS } from "../lib/mori-forest";
import { moriImage } from "../lib/mori";

/**
 * 숲 산책 게임에서 부탁을 받고 온 사람에게만 결과 맨 위에 「숲으로 돌아가기」를 띄웁니다(2026-10-07).
 * 부탁 없이 검사한 사람에게는 아무것도 그리지 않습니다 — 진행은 이 기기 localStorage 에만 있습니다.
 */
export default function ForestReturn({ slug, resultKey }: { slug: string; resultKey: string }) {
  const [mori, setMori] = useState<string | null>(null);

  useEffect(() => {
    const quest = FOREST_QUESTS.find((q) => q.slug === slug);
    if (quest && completeForestQuest(slug, resultKey)) setMori(quest.mori);
  }, [slug, resultKey]);

  if (!mori) return null;
  return (
    <a className="forest-return" href={`/mori/forest/?back=${encodeURIComponent(slug)}`}>
      <img src={moriImage(mori)} width={56} height={56} alt="" />
      <span>
        <b>부탁 완료! {mori} 모리가 기다려요</b>
        <small>결과는 도감 특별 모리 칸에 들어갔어요</small>
      </span>
      <i>🌳 숲으로 →</i>
    </a>
  );
}
