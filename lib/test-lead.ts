/**
 * 소개 화면 첫 문단 뒤에 붙는 한 문장.
 *
 * 검색 스니펫과 ChatGPT 같은 AI 답변은 첫 문단에서 답을 뽑아 갑니다. 2026-10-02
 * 점검 때 소개 페이지 68곳 중 첫 문단에 문항 수와 소요 시간을 함께 적은 곳이
 * 하나도 없었습니다(태그로만 떠 있었음). 데이터에서 숫자를 읽어 문장으로 씁니다.
 */
export function leadFacts(description: string, count: number, duration: string, resultCount?: number): string {
  const counted = new RegExp(`${count}\\s*(문항|문제)`).test(description);
  const head = counted ? `${duration}이면 끝나고` : `${count}문항, ${duration}이면 끝나고`;
  const result = resultCount && resultCount > 1 ? ` 결과는 ${resultCount}가지 중 하나로 나옵니다.` : " 결과가 바로 나옵니다.";
  return `${head}${result} 회원가입 없이 무료입니다.`;
}
