/**
 * 블로그 예약 발행 (2026-11-03~).
 *
 * 사이트는 정적 내보내기(output: "export")라 글이 보이는지는 **빌드 시각**에 정해집니다.
 * publishedAt 이 빌드 시각보다 미래인 글은 목록·상세(404)·사이트맵·RSS·관련 글
 * 어디에도 나가지 않습니다. 시각이 지나도 저절로 바뀌지 않으므로, 윈도우 예약 작업
 * 「MBTI · 블로그 예약 발행 반영」이 하루 4번(07:33·12:33·18:33·21:33 KST)
 * scripts/blog-publish-tick.mjs 를 돌려 시각이 지난 글이 있으면 빈 커밋을 푸시합니다
 * → Cloudflare Pages 가 다시 빌드합니다.
 *
 * publishedAt 형식
 *   - 예전 글: "2026-07-25" (날짜만) → 한국 시각 그날 0시로 읽습니다. 전부 과거라 그대로 보입니다.
 *   - 예약 글: "2026-11-04T07:30:00+09:00" (시각+시간대 필수)
 */

/** publishedAt/updatedAt 문자열을 밀리초로. 날짜만 있으면 KST 자정. 못 읽으면 NaN. */
export function blogTime(value: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Date.parse(`${value}T00:00:00+09:00`);
  return Date.parse(value);
}

/**
 * 빌드(모듈 로드) 시각. 한 빌드 안에서 목록과 상세가 같은 기준을 쓰게 한 번만 잽니다.
 * 날짜를 읽지 못하는 글은 실수로 공개되지 않게 숨깁니다(테스트가 먼저 잡습니다).
 */
const BUILD_NOW = Date.now();

export function isBlogPublished(post: { publishedAt: string }, now: number = BUILD_NOW): boolean {
  const t = blogTime(post.publishedAt);
  return Number.isFinite(t) && t <= now;
}
