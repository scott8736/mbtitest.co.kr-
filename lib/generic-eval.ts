import type { GenericTest, ScoreMap } from "./generic-tests";

/**
 * 성향 테스트 채점.
 *
 * components/GenericTestRunner 안에 있던 것을 꺼냈습니다. 화면 코드 안에 있으면
 * 테스트가 불러올 수 없어서, 아래 두 결함을 2026-09-30 전수 점검 전까지 아무도
 * 몰랐습니다.
 *
 * 1. 동점이면 무조건 첫 번째 결과
 *    가장 높은 점수를 고를 때 동점이면 results 의 첫 키가 이겼습니다. 무작위로
 *    답하면 4유형 테스트의 28~38% 가 동점이라, 첫 결과가 25% 가 아니라 34% 나
 *    나왔습니다(에니어그램 1번 18%/11%, 직업적성 현실형 23%/17%).
 *    지금은 동점인 유형끼리 맞붙은 문항에서 더 많이 고른 쪽, 그래도 같으면
 *    가장 나중에 고른 쪽을 씁니다. 둘 다 사용자의 답에서 나오는 기준이라
 *    결과 목록의 순서가 결과를 정하지 않습니다.
 *
 * 2. 번아웃 '주의 단계' 에 도달할 수 없음
 *    번아웃은 유형이 아니라 정도를 재는 테스트인데 max-score 로 채점했습니다.
 *    15문항 중 yellow 는 3문항에만 있어서 최대 3점이고, 나머지 12점 이상이
 *    green·red 둘에 나뉘므로 yellow 가 가장 높아지는 경우가 없었습니다.
 *    지금은 소진 쪽 답(red+yellow)의 개수로 단계를 나눕니다.
 */

/** 문항별로 고른 쪽. 2단계로 넘어갈 때 점수와 함께 저장합니다 */
export type Picks = Array<"a" | "b">;

export function evaluateTest(test: GenericTest, scores: ScoreMap, picks: Picks = []): string {
  if (test.evaluation === "egen-teto") {
    const egen = scores.egen || 0;
    const teto = scores.teto || 0;
    return Math.abs(egen - teto) <= 3 ? "balance" : egen > teto ? "egen" : "teto";
  }
  if (test.evaluation === "attachment") {
    const anxiety = (scores.anxiety || 0) + (scores.fear || 0);
    const avoidance = (scores.avoidance || 0) + (scores.fear || 0);
    if (anxiety >= 7 && avoidance >= 7) return "fearful";
    if (anxiety >= 7) return "anxious";
    if (avoidance >= 7) return "avoidant";
    return "secure";
  }
  if (test.evaluation === "mental-age") {
    const young = scores.young || 0;
    if (young >= 12) return "teen";
    if (young >= 9) return "twenties";
    if (young >= 6) return "thirties";
    if (young >= 3) return "forties";
    return "wise";
  }
  if (test.evaluation === "burnout") {
    // 15문항 중 소진 쪽 답의 개수. 1/3 이하 회복 가능, 2/3 이상 소진, 그 사이 주의.
    const load = (scores.red || 0) + (scores.yellow || 0);
    const third = test.questions.length / 3;
    if (load >= third * 2) return "red";
    if (load > third) return "yellow";
    return "green";
  }
  return maxScoreWinner(test, scores, picks);
}

function maxScoreWinner(test: GenericTest, scores: ScoreMap, picks: Picks): string {
  const keys = Object.keys(test.results);
  const top = Math.max(...keys.map((k) => scores[k] || 0));
  let tied = keys.filter((k) => (scores[k] || 0) === top);
  if (tied.length === 1) return tied[0];

  const keyOf = (map: ScoreMap) => Object.keys(map)[0];

  // 1) 동점인 유형끼리 맞붙은 문항에서 더 많이 고른 쪽
  const wins: Record<string, number> = Object.fromEntries(tied.map((k) => [k, 0]));
  test.questions.forEach((q, i) => {
    const pick = picks[i];
    if (!pick) return;
    const a = keyOf(q.aScores);
    const b = keyOf(q.bScores);
    if (!(a in wins) || !(b in wins)) return;
    wins[pick === "a" ? a : b]++;
  });
  const bestWins = Math.max(...tied.map((k) => wins[k]));
  tied = tied.filter((k) => wins[k] === bestWins);
  if (tied.length === 1) return tied[0];

  // 2) 그래도 같으면 가장 나중에 고른 쪽
  for (let i = picks.length - 1; i >= 0; i--) {
    const q = test.questions[i];
    if (!q || !picks[i]) continue;
    const chosen = keyOf(picks[i] === "a" ? q.aScores : q.bScores);
    if (tied.includes(chosen)) return chosen;
  }
  return tied[0];
}
