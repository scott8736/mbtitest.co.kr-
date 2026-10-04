/**
 * 결과 화면 링크 묶음 클릭 (2026-10-05~). 결과를 본 사람이 어느 묶음을 눌러 사이트에
 * 더 머무는지 셉니다. 어디로 갔는지는 page_views 의 직전 페이지로 알 수 있지만, MBTI 결과
 * 화면에는 같은 주소로 가는 링크가 여러 묶음에 흩어져 있어(사주 등) 묶음은 따로 세야 합니다.
 *
 * 사주랩 배너와 같은 방식입니다 — slug 자리에 테스트가 아니라 묶음 이름을 넣고,
 * 브라우저·워커·관리자 표가 모두 이 목록을 읽어 등록 누락으로 클릭이 버려지는 일을 막습니다.
 */

/** 묶음 → 관리자 표에 찍힐 이름 */
export const RESULT_CLICK_PLACEMENTS = {
  "mbti-next": "MBTI 결과 · 다음 검사 (애착·에겐테토·정신연령)",
  "mbti-type": "MBTI 결과 · 유형 특징·궁합",
  "mbti-fortune": "MBTI 결과 · 운세·사주",
  "test-next": "성향 테스트 결과 · 다음 테스트",
} as const;

export type ResultClickPlacement = keyof typeof RESULT_CLICK_PLACEMENTS;

export const RESULT_CLICK_PLACEMENT_KEYS = Object.keys(RESULT_CLICK_PLACEMENTS) as ResultClickPlacement[];
