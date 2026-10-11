/**
 * 결과 화면의 「프리미엄 사주」 배너 (2026-10-04~). 누르면 saju.mbtitest.co.kr 로 갑니다(2026-10-11, 그 전에는 4ju.sajulab.kr/4ju).
 * 이 사주 사이트는 이 사이트 운영자가 직접 운영하는 유료 사이트라 제휴 광고가 아닙니다 —
 * 그래서 「광고」 표시와 rel="sponsored" 를 붙이지 않습니다.
 *
 * 배너가 붙은 결과 화면의 종류를 여기 한 곳에 둡니다. 브라우저(배너)와 워커(이벤트 수신),
 * 관리자 표가 모두 이 목록을 읽어서, 배너를 새 화면에 붙이고 워커에 등록하지 않아
 * 클릭이 조용히 버려지는 일을 막습니다.
 *
 * 자가진단(/check/)에는 붙이지 않습니다. 우울·불안·치매 결과 옆에 "숨겨진 운명"을
 * 파는 것은 맞지 않다고 봤습니다 — 쿠팡 카드를 빼 둔 것과 같은 이유입니다.
 */

export const SAJULAB_URL = "https://saju.mbtitest.co.kr/";

/** 배너 자리 → 관리자 표에 찍힐 이름 */
export const SAJULAB_PLACEMENTS = {
  mbti: "MBTI 결과",
  test: "성향 테스트 결과 (50여 종)",
  shared: "공유 결과 페이지 (/tests/…/r/…)",
  iq: "IQ 테스트 결과",
  tarot: "타로 결과",
  "fortune-today": "오늘의 운세 결과",
  "fortune-saju": "무료 사주 결과",
  "fortune-saju-mbti": "사주 MBTI 결과",
  gunghap: "사주 궁합 결과",
} as const;

export type SajulabPlacement = keyof typeof SAJULAB_PLACEMENTS;

export const SAJULAB_PLACEMENT_KEYS = Object.keys(SAJULAB_PLACEMENTS) as SajulabPlacement[];
