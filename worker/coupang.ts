/**
 * 쿠팡 파트너스 오픈 API.
 *
 * 서명·경로는 공개 SDK(mooooburg-dev/coupang-partners-sdk-standalone)의 구현을
 * 확인해서 맞췄습니다. 네이버와 같은 이유로 워커에서만 부릅니다 — 정적 배포라
 * 브라우저에서 부르면 키가 그대로 노출됩니다. 키는 저장소에 두지 않고 /admin
 * 에서 입력받아 D1 의 app_settings 에 보관합니다.
 */

const HOST = "https://api-gateway.coupang.com";
const BASE = "/v2/providers/affiliate_open_api/apis/openapi";

export const COUPANG_PATHS = {
  deeplink: `${BASE}/v1/deeplink`,
  search: `${BASE}/products/search`,
  clicks: `${BASE}/reports/clicks`,
  orders: `${BASE}/reports/orders`,
  commission: `${BASE}/reports/commission`,
} as const;

export type CoupangCreds = { accessKey: string; secretKey: string };

/** UTC YYMMDDThhmmssZ. 쿠팡이 정한 형식이라 그대로 맞춰야 합니다. */
function signedDate(at: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    String(at.getUTCFullYear()).slice(-2) +
    p(at.getUTCMonth() + 1) +
    p(at.getUTCDate()) +
    "T" +
    p(at.getUTCHours()) +
    p(at.getUTCMinutes()) +
    p(at.getUTCSeconds()) +
    "Z"
  );
}

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Authorization 헤더.
 *
 * 서명 대상은 `날짜 + 메서드 + 경로 + 쿼리` 이고 쿼리에는 '?' 가 들어가지
 * 않습니다. 서명한 쿼리와 실제로 보내는 쿼리가 한 글자라도 다르면 거부되므로,
 * 아래 request() 가 쿼리 문자열을 한 번만 만들어 양쪽에 씁니다.
 */
async function authorization(creds: CoupangCreds, method: string, path: string, query: string): Promise<string> {
  const datetime = signedDate();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(creds.secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const message = datetime + method.toUpperCase() + path + query;
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return `CEA algorithm=HmacSHA256, access-key=${creds.accessKey}, signed-date=${datetime}, signature=${hex(mac)}`;
}

type CoupangResponse<T> = { rCode?: string; rMessage?: string; data?: T };

async function request<T>(
  creds: CoupangCreds,
  method: "GET" | "POST",
  path: string,
  params?: Record<string, string | number | undefined>,
  body?: unknown,
): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") search.append(key, String(value));
  }
  const query = search.toString();

  const response = await fetch(`${HOST}${path}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      Authorization: await authorization(creds, method, path, query),
      "Content-Type": "application/json",
    },
    body: method === "POST" && body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`쿠팡 API ${response.status}: ${text.slice(0, 300)}`);

  let parsed: CoupangResponse<T>;
  try {
    parsed = JSON.parse(text) as CoupangResponse<T>;
  } catch {
    throw new Error(`쿠팡 API 응답을 읽지 못했습니다: ${text.slice(0, 200)}`);
  }
  // 200 으로 오면서 본문에 실패가 담기는 경우가 있어 rCode 를 확인합니다.
  if (parsed.rCode && parsed.rCode !== "0") throw new Error(`쿠팡 API ${parsed.rCode}: ${parsed.rMessage ?? ""}`);
  return (parsed.data ?? ([] as unknown)) as T;
}

export type Deeplink = { originalUrl: string; shortenUrl: string; landingUrl: string };

/**
 * 쿠팡 주소를 추적 링크로 바꿉니다. 상품 주소뿐 아니라 검색 결과 주소도 됩니다.
 * subId 를 화면마다 다르게 넣으면 실적 리포트에서 나뉘어 보입니다.
 */
export async function createDeeplinks(creds: CoupangCreds, urls: string[], subId = ""): Promise<Deeplink[]> {
  return request<Deeplink[]>(creds, "POST", COUPANG_PATHS.deeplink, undefined, {
    coupangUrls: urls,
    subId,
  });
}

export type ReportKind = "clicks" | "orders" | "commission";

export type ReportRow = Record<string, string | number>;

/** 일자별 실적. 쿠팡은 매일 오후 3시에 갱신하므로 당일 값은 늦게 들어옵니다. */
export async function fetchReport(
  creds: CoupangCreds,
  kind: ReportKind,
  startDate: string,
  endDate: string,
  subId?: string,
): Promise<ReportRow[]> {
  return request<ReportRow[]>(creds, "GET", COUPANG_PATHS[kind], { startDate, endDate, subId });
}

/** YYYYMMDD. 리포트 API 가 요구하는 형식입니다. */
export function reportDay(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(at)
    .replace(/-/g, "");
}

/** 쿠팡 검색 결과 주소. 품절·단종으로 링크가 죽지 않습니다. */
export function searchUrl(keyword: string): string {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
}
