import { AFFILIATE_DISCLOSURE } from "../lib/affiliate";
import { mbtiPicks } from "../lib/mbti-picks";

/**
 * 결과 유형에 맞는 쿠팡 검색 링크 카드 한 장.
 *
 * 링크가 아직 없는 유형(scripts/coupang-links.mjs 를 안 돌렸거나 실패한 경우)은
 * 조용히 아무것도 보여주지 않습니다 — 빈 카드나 깨진 링크보다 낫습니다.
 */
export default function MbtiResultPick({ code }: { code: string }) {
  const pick = mbtiPicks[code];
  if (!pick?.coupangUrl) return null;

  return (
    <aside className="mbti-pick">
      <div className="mbti-pick-head">
        <span>{code} 유형에게 추천</span>
        <b>제휴</b>
      </div>
      <a href={pick.coupangUrl} target="_blank" rel="nofollow sponsored noreferrer noopener">
        <strong>{pick.label}</strong>
        <span>{pick.reason}</span>
        <i>쿠팡에서 보기 →</i>
      </a>
      <p className="mbti-pick-disclosure">{AFFILIATE_DISCLOSURE}</p>
    </aside>
  );
}
