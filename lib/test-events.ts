/**
 * 검사 진행 이벤트.
 *
 * page_views 만으로는 검사 화면을 열자마자 나간 사람과 몇 문항 풀다 그만둔
 * 사람이 한 숫자에 섞입니다. 둘은 고쳐야 할 곳이 정반대라 — 앞은 첫인상,
 * 뒤는 길이 — 첫 문항에 답한 시점을 따로 세어야 구분됩니다.
 *
 * 응답 내용은 보내지 않습니다. "누가 답을 시작했다"는 사실만 셉니다.
 */

export type TestEventName = "answered";

/**
 * 기록은 실패해도 조용히 넘어갑니다. 통계 때문에 검사가 멈추면 안 됩니다.
 * sendBeacon 은 페이지를 떠나는 중에도 전송이 보장되고 응답을 기다리지
 * 않습니다. 없는 브라우저에서만 keepalive fetch 로 대신합니다.
 */
export function recordTestEvent(slug: string, name: TestEventName): void {
  try {
    const url = `/api/event?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`;
    if (typeof navigator !== "undefined" && navigator.sendBeacon && navigator.sendBeacon(url)) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    // 기록 실패가 검사를 막으면 안 됩니다.
  }
}
