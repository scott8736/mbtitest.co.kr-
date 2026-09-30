/**
 * 검사 진행 이벤트.
 *
 * page_views 만으로는 검사 화면을 열자마자 나간 사람과 몇 문항 풀다 그만둔
 * 사람이 한 숫자에 섞입니다. 둘은 고쳐야 할 곳이 정반대라 — 앞은 첫인상,
 * 뒤는 길이 — 첫 문항에 답한 시점을 따로 세어야 구분됩니다.
 *
 * 응답 내용은 보내지 않습니다. "누가 답을 시작했다"는 사실만 셉니다.
 */

export type TestEventName = "answered" | "step2" | "completed";

/**
 * 2단계 도착. 완주와 같은 방식입니다 — 2단계 화면 조회수를 쓰면 새로고침과
 * 뒤로가기가 섞여 "첫 응답보다 2단계가 많은" 표가 나옵니다(2026-09-30 관리자 표).
 * 1단계를 끝낸 순간 표시를 남기고, 2단계 화면은 표시가 있을 때 한 번만 기록합니다.
 */
const STEP2_PENDING = (slug: string) => `test-step2-pending:${slug}`;

/** 문항당 약 6초로 잡은 남은 시간(분). 2단계 격려 문구에만 씁니다 */
export function remainingMinutes(remaining: number): number {
  return Math.max(1, Math.round((remaining * 6) / 60));
}

/** 1단계 마지막 문항에 답하고 2단계로 넘어가기 직전에 호출합니다. */
export function markStep2Reached(slug: string): void {
  try {
    sessionStorage.setItem(STEP2_PENDING(slug), "1");
  } catch {
    // 저장이 막힌 브라우저에서는 한 건 덜 세어질 뿐입니다.
  }
}

/** 2단계 화면이 앞 단계 답을 불러온 뒤 호출합니다. */
export function recordStep2Once(slug: string): void {
  try {
    if (sessionStorage.getItem(STEP2_PENDING(slug)) !== "1") return;
    sessionStorage.removeItem(STEP2_PENDING(slug));
    recordTestEvent(slug, "step2");
  } catch {
    // 위와 같습니다.
  }
}

/**
 * 완주 표시를 담아 두는 자리.
 *
 * 결과 화면의 조회수를 완주 수로 쓰면 안 됩니다. 결과 주소는 공유되고
 * 북마크되기 때문에, 검사를 하지 않은 사람이 링크를 열어도 한 건이 오르고
 * 새로고침도 매번 잡힙니다. 그래서 검사를 끝낸 순간에만 이 표시를 남기고,
 * 결과 화면은 표시가 있을 때 한 번만 기록합니다.
 */
const COMPLETION_PENDING = (slug: string) => `test-completed-pending:${slug}`;

/**
 * 기록은 실패해도 조용히 넘어갑니다. 통계 때문에 검사가 멈추면 안 됩니다.
 * sendBeacon 은 페이지를 떠나는 중에도 전송이 보장되고 응답을 기다리지
 * 않습니다. 없는 브라우저에서만 keepalive fetch 로 대신합니다.
 */
/** 검사를 끝낸 순간 호출합니다. 결과 화면으로 넘어가기 직전입니다. */
export function markTestCompleted(slug: string): void {
  try {
    sessionStorage.setItem(COMPLETION_PENDING(slug), "1");
  } catch {
    // 저장이 막힌 브라우저에서는 완주가 한 건 덜 세어질 뿐입니다.
  }
}

/** 결과 화면에서 호출합니다. 표시가 있을 때만 한 번 기록하고 지웁니다. */
export function recordCompletionOnce(slug: string): void {
  try {
    if (sessionStorage.getItem(COMPLETION_PENDING(slug)) !== "1") return;
    sessionStorage.removeItem(COMPLETION_PENDING(slug));
    recordTestEvent(slug, "completed");
  } catch {
    // 위와 같습니다.
  }
}

export function recordTestEvent(slug: string, name: TestEventName): void {
  try {
    const url = `/api/event?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`;
    if (typeof navigator !== "undefined" && navigator.sendBeacon && navigator.sendBeacon(url)) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    // 기록 실패가 검사를 막으면 안 됩니다.
  }
}
