/**
 * 공정위 「추천·보증 등에 관한 표시·광고 심사지침」이 요구하는 문구. 유료 링크가
 * 있는 화면은 항상 이 문구를 링크와 함께 보여줘야 하므로, 컴포넌트가 상수로
 * 가져다 씁니다.
 */
export const AFFILIATE_DISCLOSURE =
  "이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

/**
 * 이 사이트가 만드는 모든 subId 앞에 붙는 말.
 *
 * 쿠팡 파트너스 채널은 오픈 API로 만들 수 없어 파트너스 웹에서만 만들 수 있지만,
 * subId 는 링크를 만들 때 우리가 자유롭게 정하는 값이고 수익 리포트가 그 값을
 * 그대로 돌려준다 — 사전 등록 없이도 처음 만든 링크부터 리포트에 정확히 잡힌다
 * (scent-of-travel 에서 실측 확인, visitkorea_<장소>_g<번호> 로 48개 링크 운영 중).
 * `/admin/coupang/` 의 "등록하지 않은 값은 정산에서 빠질 수 있다"는 문구는
 * 상품 검색 API 얘기와 섞인 과한 주의였다.
 *
 * 링크를 만들 때(scripts/coupang-links.mjs)와 리포트를 읽을 때(worker/admin.ts 의
 * totalsBySubId) 같은 접두사를 봐야 실적이 한 사이트 것으로 묶인다.
 */
export const SUBID_PREFIX = "mbtitest";

/** 결과 화면 추천 카드 하나의 subId. 접두사 + 화면 + MBTI 코드. */
export const mbtiPickSubId = (code: string) => `${SUBID_PREFIX}_result_${code.toLowerCase()}`;
