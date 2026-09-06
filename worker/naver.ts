/**
 * 네이버 키워드 조회.
 *
 * 이 컨테이너에서는 네이버 API 로 나가는 연결이 막혀 있어서, 조회는 배포된
 * Cloudflare Worker 에서만 동작합니다. API 키는 저장소에 두지 않고 /admin 에서
 * 입력받아 D1 의 app_settings 에 보관합니다. 암호화는 하지 않으므로
 * 데이터베이스에 접근할 수 있는 사람은 값을 볼 수 있습니다.
 */

export type SearchAdCreds = { apiKey: string; secretKey: string; customerId: string };
export type OpenApiCreds = { clientId: string; clientSecret: string };

export type KeywordRow = {
  keyword: string;
  /** 월간 검색수. -1 은 네이버가 "10 미만"으로 감춘 값입니다 */
  pc: number;
  mobile: number;
  total: number;
  /** 낮음 / 중간 / 높음 */
  competition: string;
  /** 블로그 문서 수. 검색량 대비 문서가 적으면 비집고 들어갈 틈이 있습니다 */
  documents: number | null;
};

export async function readSetting(db: D1Database, key: string): Promise<string> {
  const row = await db.prepare("SELECT value FROM app_settings WHERE key = ?").bind(key).first<{ value: string }>();
  return row?.value ?? "";
}

export async function writeSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(key, value)
    .run();
}

export async function loadCreds(db: D1Database): Promise<{ ad: SearchAdCreds; open: OpenApiCreds }> {
  const [apiKey, secretKey, customerId, clientId, clientSecret] = await Promise.all([
    readSetting(db, "naver_ad_api_key"),
    readSetting(db, "naver_ad_secret_key"),
    readSetting(db, "naver_ad_customer_id"),
    readSetting(db, "naver_client_id"),
    readSetting(db, "naver_client_secret"),
  ]);
  return { ad: { apiKey, secretKey, customerId }, open: { clientId, clientSecret } };
}

/** 검색광고 API 는 timestamp.method.path 를 비밀키로 HMAC-SHA256 서명해야 합니다. */
async function sign(secretKey: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

/** 네이버 검색광고 키워드도구. 월간 검색수와 경쟁정도를 돌려줍니다. */
export async function fetchKeywordStats(creds: SearchAdCreds, keywords: string[]): Promise<KeywordRow[]> {
  const path = "/keywordstool";
  const timestamp = String(Date.now());
  const signature = await sign(creds.secretKey, `${timestamp}.GET.${path}`);
  // 키워드는 공백 없이, 최대 5개까지 한 번에 조회됩니다.
  const hintKeywords = keywords.map((k) => k.replace(/\s+/g, "")).slice(0, 5).join(",");

  const response = await fetch(`https://api.searchad.naver.com${path}?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1`, {
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": creds.apiKey,
      "X-Customer": creds.customerId,
      "X-Signature": signature,
    },
  });

  if (!response.ok) throw new Error(`검색광고 API ${response.status}: ${(await response.text()).slice(0, 200)}`);

  const data = (await response.json()) as {
    keywordList?: Array<{
      relKeyword: string;
      monthlyPcQcCnt: number | string;
      monthlyMobileQcCnt: number | string;
      compIdx: string;
    }>;
  };

  // "< 10" 처럼 문자열로 오는 값은 -1 로 표시해 두고 화면에서 "10 미만"으로 씁니다.
  const count = (value: number | string) => (typeof value === "number" ? value : /^\d+$/.test(value) ? Number(value) : -1);

  return (data.keywordList ?? []).map((row) => {
    const pc = count(row.monthlyPcQcCnt);
    const mobile = count(row.monthlyMobileQcCnt);
    return {
      keyword: row.relKeyword,
      pc,
      mobile,
      total: pc < 0 || mobile < 0 ? -1 : pc + mobile,
      competition: row.compIdx ?? "",
      documents: null,
    };
  });
}

/** 개발자센터 검색 API. 블로그 문서 수를 경쟁 강도의 대략적인 신호로 씁니다. */
export async function fetchDocumentCount(creds: OpenApiCreds, keyword: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=1`,
      { headers: { "X-Naver-Client-Id": creds.clientId, "X-Naver-Client-Secret": creds.clientSecret } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { total?: number };
    return typeof data.total === "number" ? data.total : null;
  } catch {
    return null;
  }
}
