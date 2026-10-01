"use client";

import { mbtiPicks } from "../lib/mbti-picks";
import { recordTestEvent } from "../lib/test-events";

/**
 * 결과 유형에 맞는 쿠팡 검색 링크 카드 한 장.
 *
 * 제휴 고지문구는 카드에 넣지 않습니다. 푸터(SiteFooter)에 한 번만 둡니다 — 사용자 규칙,
 * 2026-10-01. tests/result-exits.test.mjs 가 다시 들어오는 것을 막습니다. 링크가 아직 없는 유형(scripts/coupang-links.mjs 를
 * 안 돌렸거나 실패한 경우)은 조용히 아무것도 보여주지 않습니다 — 빈 카드나
 * 깨진 링크보다 낫습니다.
 */
export default function MbtiResultPick({ code }: { code: string }) {
  const pick = mbtiPicks[code];
  if (!pick?.coupangUrl) return null;

  return (
    <aside className="mbti-pick">
      <span className="mbti-pick-eyebrow">{code} 유형에게 추천</span>
      <a href={pick.coupangUrl} target="_blank" rel="nofollow sponsored noreferrer noopener" onClick={() => recordTestEvent("mbti", "pick_click")}>
        {pick.image ? <img src={pick.image} alt="" loading="lazy" decoding="async" /> : null}
        <span>
          <strong>{pick.label}</strong>
          <small>{pick.reason}</small>
          <i>자세히 보기 →</i>
        </span>
      </a>
    </aside>
  );
}
