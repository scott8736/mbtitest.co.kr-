import { mbtiPicks } from "../lib/mbti-picks";

/**
 * 결과 유형에 맞는 쿠팡 검색 링크 카드 한 장.
 *
 * 제휴 고지문구는 SiteFooter 가 모든 페이지 하단에 이미 띄우고 있어 여기서
 * 다시 넣지 않습니다. 링크가 아직 없는 유형(scripts/coupang-links.mjs 를
 * 안 돌렸거나 실패한 경우)은 조용히 아무것도 보여주지 않습니다 — 빈 카드나
 * 깨진 링크보다 낫습니다.
 */
export default function MbtiResultPick({ code }: { code: string }) {
  const pick = mbtiPicks[code];
  if (!pick?.coupangUrl) return null;

  return (
    <aside className="mbti-pick">
      <span className="mbti-pick-eyebrow">{code} 유형에게 추천</span>
      <a href={pick.coupangUrl} target="_blank" rel="nofollow sponsored noreferrer noopener">
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
