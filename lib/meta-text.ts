/**
 * 검색 결과 요약(meta description)을 네이버 권장 길이 안으로 자릅니다(2026-10-08 전체 점검).
 * 네이버 웹마스터 가이드: description 80자 이내. 결과 문구를 이어 붙여 만드는 설명은 길이를 보장할 수 없어서
 * 여기서 한 번 거릅니다. 문장 끝(. ! ?)에서 끊고, 그럴 자리가 없으면 띄어쓰기에서 끊고 「…」를 붙입니다.
 * 본문에 쓰는 설명 원문은 그대로 둡니다 — <meta> 에 들어가는 값에만 씁니다.
 */
export const META_DESCRIPTION_MAX = 80;

export function clipDescription(text: string, max = META_DESCRIPTION_MAX): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = -1;
  for (const m of t.matchAll(/[.!?](?=\s|$)/g)) {
    const end = (m.index ?? 0) + 1;
    if (end > max) break;
    cut = end;
  }
  // 첫 문장이 너무 짧으면(30자 미만) 요약 노릇을 못 하니 띄어쓰기 기준으로 자릅니다
  if (cut >= 30) return t.slice(0, cut);
  const space = t.lastIndexOf(" ", max - 1);
  return `${t.slice(0, space > 30 ? space : max - 1).replace(/[,·\s]+$/, "")}…`;
}
