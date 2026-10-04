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
