/**
 * 접속 로그 수집·조회에 공통으로 쓰는 값들.
 * 워커와 /admin 양쪽에서 import 하므로 브라우저 API 에 의존하지 않습니다.
 */

/** KST 기준 YYYY-MM-DD */
export function seoulDay(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** 로그를 남기지 않을 경로. 관리자 화면과 자산 요청은 통계에서 뺍니다. */
export function isTrackablePath(path: string): boolean {
  if (path.startsWith("/admin")) return false;
  if (path.startsWith("/_")) return false;
  if (path.startsWith("/api/")) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return false;
  return true;
}

const BOT_PATTERN = /bot|crawler|spider|crawling|slurp|facebookexternalhit|preview|monitor|lighthouse|headless|curl|wget|python-requests/i;

export function isBot(userAgent: string): boolean {
  return BOT_PATTERN.test(userAgent);
}

/** 리퍼러를 사람이 읽는 유입 출처로 묶습니다. */
export function classifySource(referrer: string, host: string): string {
  if (!referrer) return "direct";
  let hostname: string;
  try {
    hostname = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (hostname === host || hostname.endsWith(`.${host}`)) return "internal";

  const table: Array<[RegExp, string]> = [
    [/(^|\.)google\./, "google"],
    [/(^|\.)naver\./, "naver"],
    [/(^|\.)daum\.|(^|\.)kakao\./, "daum"],
    [/(^|\.)bing\./, "bing"],
    [/(^|\.)zum\./, "zum"],
    [/(^|\.)instagram\./, "instagram"],
    [/(^|\.)facebook\.|(^|\.)fb\./, "facebook"],
    [/(^|\.)youtube\.|(^|\.)youtu\.be/, "youtube"],
    [/(^|\.)twitter\.|(^|\.)x\.com/, "x"],
    [/(^|\.)threads\./, "threads"],
    [/(^|\.)tiktok\./, "tiktok"],
    [/(^|\.)tistory\.|(^|\.)blog\./, "blog"],
  ];
  for (const [pattern, name] of table) if (pattern.test(hostname)) return name;
  return "other";
}

export const SOURCE_LABELS: Record<string, string> = {
  google: "구글",
  naver: "네이버",
  daum: "다음·카카오",
  bing: "빙",
  zum: "줌",
  instagram: "인스타그램",
  facebook: "페이스북",
  youtube: "유튜브",
  x: "X(트위터)",
  threads: "스레드",
  tiktok: "틱톡",
  blog: "블로그",
  direct: "직접 유입",
  internal: "사이트 내부",
  other: "기타",
};

export function classifyDevice(userAgent: string): string {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent) ? "mobile" : "desktop";
}

/**
 * 방문자 식별용 해시. IP 원본은 저장하지 않습니다.
 * 날짜를 섞기 때문에 하루가 지나면 같은 사람도 다른 값이 되어,
 * 하루 단위 순방문자 집계만 가능하고 장기 추적은 되지 않습니다.
 */
export async function visitorHash(ip: string, userAgent: string, day: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}|${userAgent}|${day}|mbtitest`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 로그 보관 기간(일). 지난 행은 자동으로 지웁니다. */
export const RETENTION_DAYS = 90;
