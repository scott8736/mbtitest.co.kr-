/**
 * 104쪽 리포트 「전체 샘플」 열람 링크 (2026-10-14 사용자 요청: "실제 100장으로 보면 결제할 마음이 커진다").
 *
 * 관리자 → 리포트 → 「검수용 무료 리포트」로 발행한 것(pay_type = admin-free, 0원, 매출 제외)의 열람 토큰을
 * 유형별로 여기에 적습니다. 토큰이 없는 유형은 INFP 샘플로, INFP 도 없으면 카드가 뜨지 않습니다.
 * 샘플은 가상의 이름·점수로 만든 것이라 손님 정보가 아닙니다. 손님 주문 토큰은 절대 넣지 않습니다.
 */
export const REPORT_SAMPLE_TOKEN: Record<string, string> = {
  // INFP: "관리자 발행 이력의 「열기」 링크 ?o= 뒤 값",
};

export function reportSampleUrl(code?: string): string | null {
  const token = (code && REPORT_SAMPLE_TOKEN[code]) || REPORT_SAMPLE_TOKEN.INFP;
  return token ? `/report-app/?o=${token}` : null;
}
