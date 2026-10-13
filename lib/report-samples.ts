/**
 * 104쪽 리포트 「전체 샘플」 열람 링크 (2026-10-14 사용자 요청: "실제 100장으로 보면 결제할 마음이 커진다").
 *
 * 관리자 → 리포트 → 「검수용 무료 리포트」로 발행한 것(pay_type = admin-free, 0원, 매출 제외)의 열람 토큰을
 * 유형별로 여기에 적습니다. 내 유형 샘플이 없으면 있는 샘플을 「예시」로 보여 주고, 하나도 없으면 카드가 뜨지 않습니다.
 * 샘플은 가상의 이름·점수로 만든 것이라 손님 정보가 아닙니다. 손님 주문 토큰은 절대 넣지 않습니다.
 */
export const REPORT_SAMPLE_TOKEN: Record<string, string> = {
  // 2026-10-14 관리자 발행(ISTJ, 샘플 이름 「민호」, 생년월일 포함 110쪽)
  ISTJ: "48988030280f0826f90605f8a80475c3c49247a548886dc481857357ff8c024b",
};

/** 내 유형 샘플이 있으면 그것을, 없으면 있는 샘플 아무거나(예시)를 돌려줍니다. type 은 실제로 보여 주는 샘플의 유형입니다. */
export function reportSample(code?: string): { href: string; type: string } | null {
  const type = code && REPORT_SAMPLE_TOKEN[code] ? code : Object.keys(REPORT_SAMPLE_TOKEN)[0];
  return type ? { href: `/report-app/?o=${REPORT_SAMPLE_TOKEN[type]}`, type } : null;
}
