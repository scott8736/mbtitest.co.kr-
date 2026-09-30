import { resolveTestPick } from "../lib/pick-fallback";
import { AFFILIATE_DISCLOSURE } from "../lib/affiliate";

/**
 * MBTI 외 테스트 결과 화면에 다는 추천 카드. MbtiResultPick 과 같은 스타일이지만
 * 조회 키가 4글자 코드가 아니라 (테스트 slug, 결과 키) 쌍입니다.
 *
 * 결과별 추천(lib/test-picks.ts)에 링크가 없으면 분야별 기본 추천
 * (lib/pick-fallback.ts)을 씁니다. 전에는 링크가 없으면 카드를 숨겨서 결과 화면
 * 54곳 중 50곳에 추천이 없었습니다.
 */
export default function TestResultPick({ slug, resultKey }: { slug: string; resultKey: string }) {
  const pick = resolveTestPick(slug, resultKey);
  if (!pick) return null;

  return (
    <aside className="mbti-pick">
      <span className="mbti-pick-eyebrow">{pick.specific ? "이 결과에 추천" : "함께 보면 좋은 추천"}</span>
      <a href={pick.coupangUrl} target="_blank" rel="nofollow sponsored noreferrer noopener">
        {pick.image ? <img src={pick.image} alt="" loading="lazy" decoding="async" /> : null}
        <span>
          <strong>{pick.label}</strong>
          <small>{pick.reason}</small>
          <i>자세히 보기 →</i>
        </span>
      </a>
      <p className="mbti-pick-disclosure">{AFFILIATE_DISCLOSURE}</p>
    </aside>
  );
}
