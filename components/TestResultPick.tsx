import { testPicks } from "../lib/test-picks";

/**
 * MBTI 외 테스트 결과 화면에 다는 추천 카드. MbtiResultPick 과 같은 스타일이지만
 * 조회 키가 4글자 코드가 아니라 (테스트 slug, 결과 키) 쌍입니다.
 *
 * GenericTestRunner 안에서 한 번만 쓰이므로 이 컴포넌트를 넣으면 26개 테스트
 * 결과 화면 전부에 자동으로 적용됩니다.
 */
export default function TestResultPick({ slug, resultKey }: { slug: string; resultKey: string }) {
  const pick = testPicks[slug]?.[resultKey];
  if (!pick?.coupangUrl) return null;

  return (
    <aside className="mbti-pick">
      <span className="mbti-pick-eyebrow">이 결과에 추천</span>
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
