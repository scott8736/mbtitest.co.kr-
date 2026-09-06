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

export type TrendPoint = { period: string; ratio: number };
export type TrendRow = {
  keyword: string;
  /** 일자별 상대 검색량. 값은 이 조회 안에서의 최대치를 100 으로 둔 비율입니다 */
  series: TrendPoint[];
  /** 최근 7일 평균 */
  recent: number;
  /** 그 직전 7일 평균 */
  previous: number;
  /** 상승률(%). previous 가 0 이면 null */
  change: number | null;
};

const yyyymmdd = (at: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/**
 * 데이터랩 검색어 트렌드.
 *
 * 한 번에 키워드 그룹 5개까지만 되므로 5개씩 나눠 부릅니다. ratio 는 호출
 * 안에서의 상대값이라 다른 호출의 값과 크기를 비교하면 안 됩니다. 그래서
 * 화면에서는 절대 크기 대신 자기 자신의 최근 7일과 직전 7일을 견주는
 * 상승률만 씁니다. 이 값은 한 키워드 안에서 계산되므로 호출이 나뉘어도
 * 그대로 비교할 수 있습니다.
 */
export async function fetchTrend(creds: OpenApiCreds, keywords: string[], days = 30): Promise<TrendRow[]> {
  const endDate = yyyymmdd(new Date(Date.now() - 86400000));
  const startDate = yyyymmdd(new Date(Date.now() - days * 86400000));

  const batches: string[][] = [];
  for (let i = 0; i < keywords.length; i += 5) batches.push(keywords.slice(i, i + 5));

  const responses = await Promise.all(
    batches.map(async (batch) => {
      const response = await fetch("https://openapi.naver.com/v1/datalab/search", {
        method: "POST",
        headers: {
          "X-Naver-Client-Id": creds.clientId,
          "X-Naver-Client-Secret": creds.clientSecret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          timeUnit: "date",
          keywordGroups: batch.map((keyword) => ({ groupName: keyword, keywords: [keyword] })),
        }),
      });
      if (!response.ok) throw new Error(`데이터랩 API ${response.status}: ${(await response.text()).slice(0, 200)}`);
      return (await response.json()) as {
        results?: Array<{ title: string; data?: Array<{ period: string; ratio: number }> }>;
      };
    }),
  );

  return responses.flatMap((data) =>
    (data.results ?? []).map((result) => {
      const series = (result.data ?? []).map((point) => ({ period: point.period, ratio: point.ratio }));
      const ratios = series.map((point) => point.ratio);
      const recent = mean(ratios.slice(-7));
      const previous = mean(ratios.slice(-14, -7));
      return {
        keyword: result.title,
        series,
        recent,
        previous,
        change: previous > 0 ? ((recent - previous) / previous) * 100 : null,
      };
    }),
  );
}

/** 트렌드 화면의 기본 관찰 목록. /admin 에서 바꿀 수 있습니다. */
export const DEFAULT_TREND_KEYWORDS = [
  "MBTI검사",
  "HSP테스트",
  "애니어그램테스트",
  "에겐테토",
  "나르시시스트테스트",
  "심리테스트",
  "성격유형검사",
  "연애테스트",
  "번아웃테스트",
  "자존감테스트",
];
