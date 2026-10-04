/**
 * 「내 모리」 기억하기 (2026-10-04).
 *
 * MBTI 결과는 sessionStorage 에만 있어 탭을 닫으면 사라집니다. 다른 테스트 결과 카드에
 * 내 모리를 함께 그리려면(「INFP 모리 × 불안형 애착」) 유형을 오래 기억해야 해서 localStorage 에
 * 네 글자만 둡니다. 서버로 보내지 않고, 이 기기에만 남습니다.
 */
import { MORI } from "./mori";

const KEY = "my-mori";

export function saveMyMori(code: string): void {
  if (!MORI[code]) return;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // 저장이 막힌 브라우저에서는 다른 테스트 카드가 기본 카드로 나올 뿐입니다.
  }
}

export function readMyMori(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    return code && MORI[code] ? code : null;
  } catch {
    return null;
  }
}

/**
 * 마지막 MBTI 결과(유형 + 축 점수) 기억하기 (2026-10-04, 유료 리포트).
 * 리포트는 점수로 만들어지는데 결과가 sessionStorage 에만 있으면 탭을 닫는 순간 주문할 수 없게 됩니다.
 * 다른 날 블로그·유형 페이지로 다시 와도 「내 리포트」로 바로 갈 수 있게 이 기기에만 남깁니다(서버로 보내지 않음).
 */
const LAST_KEY = "mbti-last-result";
export type LastResult = { result: string; scores: Record<"EI" | "SN" | "TF" | "JP", number> };

export function saveLastResult(value: LastResult): void {
  if (!MORI[value.result]) return;
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ result: value.result, scores: value.scores }));
  } catch {
    // 저장이 막히면 리포트 주문 때 검사를 다시 하라고 안내될 뿐입니다.
  }
}

export function readLastResult(): LastResult | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as LastResult | null;
    return v && MORI[v.result] && v.scores ? v : null;
  } catch {
    return null;
  }
}
