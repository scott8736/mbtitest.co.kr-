import { testPicks, type TestPick } from "./test-picks";
import { testCatalog, type TestCategory } from "./test-catalog";

/**
 * 결과별 추천이 아직 없는 결과에 대신 보여 줄 분야별 기본 추천.
 *
 * 2026-10-01 점검에서 성향 테스트 결과 218개 중 쿠팡 링크가 있는 것은 12개뿐이었고,
 * 링크가 없으면 카드가 조용히 숨겨져 결과 화면 50곳에 추천이 하나도 없었습니다.
 * 결과마다 링크를 새로 만들려면 쿠팡 API 를 200번 넘게 불러야 하는데, API 는
 * 1시간 30회를 넘기면 24시간 정지됩니다. 그래서 그동안은 이미 만들어 쓰고 있는
 * 링크를 분야별로 돌려씁니다. 결과별 링크가 생기면 그쪽이 먼저 나옵니다.
 *
 * 문구는 특정 결과를 가정하지 않게 썼습니다. 결과와 안 맞는 이유를 지어내지 않습니다.
 */
export const CATEGORY_FALLBACK: Record<TestCategory, TestPick> = {
  연애: {
    label: "커플 다이어리",
    reason: "관계의 좋은 순간을 기록해 두면 익숙해진 뒤에도 서로에게 고마운 점을 놓치지 않게 됩니다.",
    image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350",
    coupangUrl: "https://link.coupang.com/a/gSqVQmkVMG",
  },
  마음건강: {
    label: "감정 기록 노트",
    reason: "마음이 복잡한 날, 떠오르는 생각을 적어 두면 추측과 사실을 나눠 보는 데 도움이 됩니다.",
    image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350",
    coupangUrl: "https://link.coupang.com/a/gSqVSFkiiq",
  },
  성격: {
    label: "필사 노트",
    reason: "테스트로 알게 된 나의 성향을 한 줄씩 적어 두면, 비슷한 상황이 왔을 때 스스로를 더 빨리 알아차립니다.",
    image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350",
    coupangUrl: "https://link.coupang.com/a/gSmOsshYgD",
  },
  직장: {
    label: "위클리 플래너",
    reason: "일하는 방식은 한 주를 어떻게 나누느냐에서 가장 먼저 드러납니다. 일주일을 한눈에 정리해 보세요.",
    image: "https://images.pexels.com/photos/5946167/pexels-photo-5946167.jpeg?auto=compress&cs=tinysrgb&h=350",
    coupangUrl: "https://link.coupang.com/a/gSqV4ozqGO",
  },
  두뇌: {
    label: "화이트보드",
    reason: "퍼즐처럼 규칙을 찾는 문제는 머릿속보다 눈앞에 적어 놓고 풀 때 훨씬 잘 풀립니다.",
    image: "https://images.pexels.com/photos/8617769/pexels-photo-8617769.jpeg?auto=compress&cs=tinysrgb&h=350",
    coupangUrl: "https://link.coupang.com/a/gSmOD7zxZc",
  },
};

export type ResolvedPick = TestPick & { coupangUrl: string; specific: boolean };

/** 결과별 추천이 있으면 그것을, 없으면 테스트 분야의 기본 추천을 돌려줍니다 */
export function resolveTestPick(slug: string, resultKey: string): ResolvedPick | null {
  const own = testPicks[slug]?.[resultKey];
  if (own?.coupangUrl) return { ...own, coupangUrl: own.coupangUrl, specific: true };
  const category = testCatalog.find((item) => item.slug === slug)?.category;
  const fallback = category ? CATEGORY_FALLBACK[category] : undefined;
  return fallback?.coupangUrl ? { ...fallback, coupangUrl: fallback.coupangUrl, specific: false } : null;
}
