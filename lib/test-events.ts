import type { ResultClickPlacement } from "./result-clicks";
import type { ShareChannel } from "./mori";

/**
 * 검사 진행 이벤트.
 *
 * page_views 만으로는 검사 화면을 열자마자 나간 사람과 몇 문항 풀다 그만둔
 * 사람이 한 숫자에 섞입니다. 둘은 고쳐야 할 곳이 정반대라 — 앞은 첫인상,
 * 뒤는 길이 — 첫 문항에 답한 시점을 따로 세어야 구분됩니다.
 *
 * 응답 내용은 보내지 않습니다. "누가 답을 시작했다"는 사실만 셉니다.
 */

/**
 * pick_click: 결과 화면의 쿠팡 추천 카드를 누름. 쿠팡 리포트의 채널별 클릭과 대조하려고 셉니다
 * report_*: 유료 정밀 리포트 수요 측정(2026-10-03~). 아직 상품이 없고, 결과 화면에
 *   목차와 가격만 보여 줘 몇 명이 사려고 하는지 봅니다. seen 은 카드가 화면에 들어온 수,
 *   click 은 「내 리포트 받기」, follow 는 그다음 스레드 팔로우 링크입니다.
 * saju_*: 결과 화면 「프리미엄 사주」 배너(2026-10-04~). slug 자리에 테스트가 아니라
 *   배너 자리(lib/sajulab.ts 의 SAJULAB_PLACEMENTS)를 넣습니다.
 * result_click: 결과 화면 링크 묶음을 누름(2026-10-05~). slug 자리에 묶음 이름
 *   (lib/result-clicks.ts 의 RESULT_CLICK_PLACEMENTS)을 넣습니다. 결과 다음에 어디로 가서
 *   사이트에 더 머무는지 보려고 셉니다.
 * share_click: 모리 캐릭터 카드 공유 버튼(2026-10-04 제작). slug 자리에 공유 수단
 *   (lib/mori.ts 의 SHARE_CHANNELS)을 넣습니다.
 */
/**
 * 판매 페이지(/report/) 안에서 어디까지 갔는지(2026-10-08~). 판매 페이지 → 결제창이 2.0% 라 어디서 빠지는지 보려고 셉니다.
 * page_has·page_none: 이 기기에 MBTI 결과가 있는/없는 방문(없으면 주문 폼 대신 「검사 먼저」만 보입니다)
 * form_seen: 주문 폼이 화면에 들어옴 · form_start: 폼 칸을 처음 누름 · submit: 결제 버튼 누름 · error: 결제창 대신 오류 문구가 뜸
 */
export const REPORT_STEP_KEYS = ["page_has", "page_none", "form_seen", "form_start", "submit", "error"] as const;
export type ReportStep = (typeof REPORT_STEP_KEYS)[number];

export type TestEventName =
  | "visited"
  | "answered"
  | "step2"
  | "teaser"
  | "completed"
  | "pick_click"
  | "report_seen"
  | "report_click"
  // 결과 카드 미리보기 띠를 둘째 쪽 이상 넘겨 본 사람(2026-10-06~). 클릭 없이 관심을 잽니다.
  | "report_peek"
  | "report_follow"
  // 판매 페이지 안 단계(2026-10-08~): slug 자리에 REPORT_STEP_KEYS 중 하나
  | "report_step"
  | "saju_seen"
  | "saju_click"
  | "result_click"
  | "share_click"
  // MBTI 결과 유형 분포(2026-10-04~): slug 자리에 유형(소문자), 동점 축은 mbti_tie 에 축 이름(ei·sn·tf·jp)
  | "mbti_type"
  | "mbti_tie";

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
export function recordCompletionOnce(slug: string, alsoRecord?: () => void): void {
  try {
    if (sessionStorage.getItem(COMPLETION_PENDING(slug)) !== "1") return;
    sessionStorage.removeItem(COMPLETION_PENDING(slug));
    recordTestEvent(slug, "completed");
    // 완주와 같은 순간에 한 번만 — 새로고침으로 결과를 다시 봐도 두 번 세지 않습니다.
    alsoRecord?.();
  } catch {
    // 위와 같습니다.
  }
}

/**
 * 같은 탭에서 한 번만 기록합니다. 리포트 카드는 스크롤을 오르내리거나 버튼을
 * 여러 번 누르면 같은 사람이 여러 건으로 잡혀 관심률이 부풀려집니다.
 */
const ONCE_KEY = (slug: string, name: TestEventName) => `test-event-once:${slug}:${name}`;

export function recordTestEventOnce(slug: string, name: TestEventName): void {
  try {
    const key = ONCE_KEY(slug, name);
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    // 저장이 막힌 브라우저에서는 중복이 섞일 수 있지만 기록은 합니다.
  }
  recordTestEvent(slug, name);
}

/**
 * 검사 화면 방문. 관리자 표의 「방문」은 페이지뷰라 새로고침·뒤로가기·재방문이 섞여
 * 응답 시작률이 실제보다 낮게 나옵니다(2026-10-03 MBTI 61%). 답하기 전까지는 같은
 * 탭에서 한 번만 세고, 첫 답을 하면 표시를 지워 다시 검사하는 사람은 새로 셉니다.
 */
export function recordVisitOnce(slug: string): void {
  recordTestEventOnce(slug, "visited");
}

/** 첫 문항에 답함. 방문 표시를 지워 같은 탭에서 다시 검사할 때 방문이 새로 세어지게 합니다. */
export function recordAnswered(slug: string): void {
  recordTestEvent(slug, "answered");
  try {
    sessionStorage.removeItem(ONCE_KEY(slug, "visited"));
  } catch {
    // 저장이 막힌 브라우저에서는 방문이 한 번만 세어질 뿐입니다.
  }
}

/** 결과 화면 링크 묶음 클릭. 탭당 묶음마다 한 번만 세어 「클릭 ÷ 완주」를 사람 비율로 읽게 합니다. */
export function recordResultClick(placement: ResultClickPlacement): void {
  recordTestEventOnce(placement, "result_click");
}

/**
 * 링크 묶음을 감싼 요소의 onClick 에 붙입니다. 카드 하나하나에 달지 않아도 되고,
 * 묶음 안의 빈 곳을 누른 것은 세지 않습니다.
 */
export function onResultLinkClick(placement: ResultClickPlacement) {
  return (event: { target: EventTarget | null }): void => {
    const target = event.target as { closest?: (selector: string) => unknown } | null;
    if (target?.closest?.("a[href]")) recordResultClick(placement);
  };
}

/** 모리 카드 공유. 탭당 수단마다 한 번만 세어 「공유 ÷ 완주」를 사람 비율로 읽게 합니다. */
export function recordShare(channel: ShareChannel): void {
  recordTestEventOnce(channel, "share_click");
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
