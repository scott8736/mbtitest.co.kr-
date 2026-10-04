/**
 * 홈 「요즘 뜨는 심리테스트」 (2026-10-04~).
 *
 * 관리자 트렌드 화면이 받아 둔 네이버 데이터랩 값(최근 7일 ÷ 직전 7일)을 그대로 씁니다.
 * 새로 부르는 API 는 없습니다. 관찰 키워드 중 **이 사이트에 실제로 있는 검사**에 맞는 것만
 * 카드로 내고, 「심리테스트」·「애니어그램테스트」처럼 맞는 검사가 없는 키워드는 버립니다.
 *
 * 숫자를 지어내지 않습니다. 상승 배지는 데이터랩 값이 있고 충분히 오른 것에만 붙이고,
 * 오른 것이 모자라면 제목을 「요즘 많이 찾는」으로 바꿔 상승이라고 말하지 않습니다.
 */

/** 데이터랩 키워드 → 검사 slug. 관리자에서 키워드를 바꾸면 여기에도 한 줄 넣어야 카드가 됩니다. */
export const TREND_KEYWORD_TESTS: Record<string, string> = {
  MBTI검사: "mbti",
  성격유형검사: "mbti",
  번아웃테스트: "burnout",
  자존감테스트: "self-esteem",
  연애테스트: "love-tendency",
  HSP테스트: "hsp",
  에겐테토: "egen-teto",
};

/** 상승 배지를 붙이는 최소 상승률(%). 몇 % 출렁임은 하루 이틀 차이로도 납니다. */
export const RISING_MIN_CHANGE = 10;
/**
 * 카드로 내는 최소 검색량(데이터랩 상대값, 최근 7일 평균). 이보다 적으면 카드에서 뺍니다.
 * 「에겐테토」 0.1 같은 바닥값은 몇 명 차이로도 수십 %가 되고, 「꾸준히 찾는」이라고 부를 수도 없습니다.
 */
export const MIN_RECENT = 1;
/** 카드 수 */
export const TRENDING_LIMIT = 4;

export type TrendInput = { keyword: string; recent: number; previous: number; change: number | null };
export type TrendingItem = { slug: string; keyword: string; change: number | null; rising: boolean };

/**
 * 데이터랩 행을 카드 목록으로 바꿉니다. 같은 검사로 가는 키워드가 둘이면(MBTI검사·성격유형검사)
 * 더 많이 오른 쪽 하나만 남깁니다. 오른 순서, 같으면 검색량 순입니다.
 */
export function pickTrending(rows: TrendInput[], known: (slug: string) => boolean): TrendingItem[] {
  const bySlug = new Map<string, TrendingItem & { recent: number }>();
  for (const row of rows) {
    const slug = TREND_KEYWORD_TESTS[row.keyword];
    if (!slug || !known(slug) || row.recent < MIN_RECENT) continue;
    const rising = row.change !== null && row.change >= RISING_MIN_CHANGE;
    const item = { slug, keyword: row.keyword, change: row.change, rising, recent: row.recent };
    const prev = bySlug.get(slug);
    if (!prev || (item.change ?? -Infinity) > (prev.change ?? -Infinity)) bySlug.set(slug, item);
  }
  return [...bySlug.values()]
    .sort((a, b) => Number(b.rising) - Number(a.rising) || (b.change ?? -Infinity) - (a.change ?? -Infinity) || b.recent - a.recent)
    .slice(0, TRENDING_LIMIT)
    .map(({ slug, keyword, change, rising }) => ({ slug, keyword, change, rising }));
}
