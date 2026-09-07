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

/** 리포트가 한 번에 받을 수 있는 최대 기간. 쿠팡이 정한 값입니다. */
export const MAX_REPORT_DAYS = 30;

/**
 * 수익 리포트 한 행.
 *
 * 이 리포트 하나에 클릭·주문·취소·수수료·거래액이 모두 들어 있습니다. 그래서
 * 실적 모니터링은 이것만 부르면 됩니다. 클릭·주문 리포트를 따로 부르면 같은
 * 값을 세 번 받으면서 호출 한도만 세 배로 씁니다.
 */
export type CommissionRow = {
  date: string;
  trackingCode: string;
  /** 채널 아이디. 링크를 만들 때 넣은 subId 가 그대로 돌아옵니다 */
  subId: string;
  commission: number;
  click: number;
  order: number;
  cancel: number;
  gmv: number;
};

export type ChannelTotal = {
  subId: string;
  click: number;
  order: number;
  cancel: number;
  commission: number;
  gmv: number;
};

const n = (value: unknown) => (typeof value === "number" ? value : Number(value)) || 0;

/**
 * 채널(subId)별로 합칩니다. 어느 화면이 얼마를 벌었는지 여기서 갈립니다.
 * 수수료가 큰 순서로, 같으면 클릭이 많은 순서로 정렬합니다.
 */
export function totalsBySubId(rows: CommissionRow[]): ChannelTotal[] {
  const byId = new Map<string, ChannelTotal>();
  for (const row of rows) {
    // 채널 아이디 없이 만든 링크는 빈 문자열로 돌아옵니다.
    const key = String(row.subId ?? "");
    const total = byId.get(key) ?? { subId: key, click: 0, order: 0, cancel: 0, commission: 0, gmv: 0 };
    total.click += n(row.click);
    total.order += n(row.order);
    total.cancel += n(row.cancel);
    total.commission += n(row.commission);
    total.gmv += n(row.gmv);
    byId.set(key, total);
  }
  return [...byId.values()].sort((a, b) => b.commission - a.commission || b.click - a.click);
}

/** 날짜(YYYYMMDD)별 수수료 합계. */
export function commissionByDay(rows: CommissionRow[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const day = String(row.date ?? "");
    byDay.set(day, (byDay.get(day) ?? 0) + n(row.commission));
  }
  return byDay;
}

/** 오늘까지 최근 days 일의 YYYYMMDD 목록. 값이 없는 날도 그래프에 자리를 둡니다. */
export function recentDays(days: number, now: Date = new Date()): string[] {
  return Array.from({ length: days }, (_, i) => reportDay(new Date(now.getTime() - (days - 1 - i) * 86400000)));
}
