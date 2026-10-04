/**
 * /admin — 접속 현황 대시보드.
 *
 * Next 페이지가 아니라 워커에서 직접 처리합니다. next.config.ts 가
 * output: "export" 라 모든 라우트가 빌드 때 Node 에서 프리렌더되는데,
 * Node 는 cloudflare:workers 를 못 읽고 서버 액션도 동작하지 않습니다.
 * 여기서는 env.DB 를 인자로 받으므로 그 문제가 없습니다.
 *
 * 저장하는 것: 경로·리퍼러·기기·국가·날짜별 방문자 해시.
 * 저장하지 않는 것: IP 원본, 쿠키, 쿼리스트링.
 */
import { SAJULAB_PLACEMENTS, SAJULAB_PLACEMENT_KEYS } from "../lib/sajulab";
import { RESULT_CLICK_PLACEMENTS, RESULT_CLICK_PLACEMENT_KEYS } from "../lib/result-clicks";
import { loadRollups, mergeRollups } from "./rollup";
import { SHARE_CHANNELS, SHARE_CHANNEL_KEYS } from "../lib/mori";
import { tarotSlugs } from "../lib/tarot";
import { SOURCE_LABELS } from "../lib/analytics";
import {
  DEFAULT_TREND_KEYWORDS,
  fetchDocumentCount,
  fetchKeywordStats,
  fetchTrend,
  hasTrendKeys,
  loadCreds,
  readSetting,
  writeSetting,
  type KeywordRow,
  type TrendRow,
} from "./naver";
import { ensureSchema } from "./schema";
import {
  commissionByDay,
  createDeeplinks,
  keywordFromSearchUrl,
  fetchReport,
  MAX_REPORT_DAYS,
  recentDays,
  reportDay,
  searchUrl,
  totalsBySubId,
  type CommissionRow,
  type CoupangCreds,
  type Deeplink,
  type ReportRow,
} from "./coupang";

const COOKIE = "mbtitest_admin";
// 워커 런타임이 허용하는 최대치입니다. 이보다 크게 잡으면 crypto.subtle 이
// "iteration counts above 100000 are not supported" 로 거부합니다.
// (로컬 miniflare 는 더 큰 값도 통과시켜서 배포 후에야 드러납니다.)
const ITERATIONS = 100_000;
const SESSION_HOURS = 12;

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function derive(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return hex(bits);
}

/** 길이가 같을 때 비교 시간이 내용에 따라 달라지지 않게 합니다. */
function constantEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

const esc = (value: unknown) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function seoulDay(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

async function isSignedIn(request: Request, db: D1Database): Promise<boolean> {
  const token = readCookie(request, COOKIE);
  if (!token) return false;
  const row = await db
    .prepare("SELECT expires_at FROM admin_session WHERE token = ?")
    .bind(token)
    .first<{ expires_at: number }>();
  return Boolean(row && Number(row.expires_at) > Date.now());
}

const redirect = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { location: to, ...headers } });

const html = (body: string) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow" } });

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(title)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f7f8f3;color:#172a46;
font:15px/1.6 system-ui,-apple-system,"Malgun Gothic",sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:40px 20px 90px}
.login{min-height:100vh;display:grid;place-items:center;padding:24px}
.login form{width:100%;max-width:340px;display:flex;flex-direction:column;gap:10px;
padding:34px;border:1px solid #e5e0ef;border-radius:20px;background:#fff}
h1{margin:0;font-size:26px;letter-spacing:-.03em}h2{margin:0 0 16px;font-size:17px}
input{padding:12px 14px;border:1px solid #e5e0ef;border-radius:10px;font-size:15px}
button{padding:12px 18px;border:0;border-radius:10px;background:#7657d6;color:#fff;
font-size:15px;font-weight:700;cursor:pointer}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.head p{margin:6px 0 0;color:#697184;font-size:14px}
.ranges{display:flex;gap:6px}.ranges a{padding:8px 15px;border:1px solid #e5e0ef;border-radius:99px;
background:#fff;color:#172a46;font-size:14px;font-weight:600;text-decoration:none}
.ranges a.on{border-color:#7657d6;background:#7657d6;color:#fff}
.range-form{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:-8px 0 24px;font-size:14px;color:#697184}
.range-form input{padding:6px 10px;border:1px solid #e5e0ef;border-radius:10px;font:inherit;color:#172a46}
.range-form button{padding:7px 14px;border:0;border-radius:99px;background:#172a46;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.muted{color:#9aa0ad}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.cards div{padding:20px;border:1px solid #e5e0ef;border-radius:16px;background:#fff}
.cards b{display:block;font-size:26px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.cards span{display:block;margin-top:6px;color:#697184;font-size:13px}
.box{margin-bottom:26px;padding:24px;border:1px solid #e5e0ef;border-radius:18px;background:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.chart{display:flex;align-items:flex-end;gap:4px;height:180px}
.chart div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%;min-width:0}
.chart i{display:block;width:100%;min-height:2px;border-radius:5px 5px 0 0;background:#7657d6}
.chart small{color:#8a90a0;font-size:10px;white-space:nowrap}
ul.bars{list-style:none;margin:0;padding:0;display:grid;gap:9px}
ul.bars li{display:grid;grid-template-columns:minmax(90px,1.4fr) 3fr auto;gap:12px;align-items:center}
ul.bars span{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
ul.bars em{height:9px;border-radius:99px;background:#f0edf8;overflow:hidden;display:block}
ul.bars em i{display:block;height:100%;border-radius:99px;background:#7657d6}
ul.bars b{font-size:13px;font-variant-numeric:tabular-nums;color:#697184;font-weight:600}
.scroll{overflow-x:auto}table{width:100%;min-width:520px;border-collapse:collapse;font-size:14px}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #f0edf8}
th{font-size:12px;color:#697184;font-weight:600}td{font-variant-numeric:tabular-nums}
td:first-child{font-variant-numeric:normal}
.note{margin:-8px 0 16px;color:#697184;font-size:13px}
.empty{margin:0;color:#8a90a0;font-size:14px}
.err{margin:0 0 12px;color:#b6483c;font-size:14px;font-weight:700}
.ok{margin:0 0 12px;color:#3f7d5c;font-size:14px;font-weight:700}
.row{display:flex;gap:8px;flex-wrap:wrap}.row input{flex:1 1 220px}
.fields{display:grid;gap:14px}
.fields label{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:baseline}
.fields label span{font-size:14px;font-weight:600}
.fields label b{font-size:13px;font-weight:600}
.fields label input{grid-column:1/-1}
ol.steps{margin:0 0 22px;padding-left:20px;line-height:1.9;font-size:14px}
ol.steps a{color:#7657d6}
details summary{cursor:pointer;font-size:15px;font-weight:700;color:#4b4560}
details.box{margin-top:26px}
.ghost button{background:#e9e6f2;color:#4b4560}
button.copy{padding:7px 13px;font-size:13px;font-weight:600;background:#e9e6f2;color:#4b4560}
button.copy:disabled{opacity:.6;cursor:default}
.foot{color:#8a90a0;font-size:13px;line-height:1.7}
@media(max-width:820px){.cards{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}}
</style></head><body>${body}</body></html>`;
}

function bars(rows: { key: string; views: number }[], total: number, labels?: Record<string, string>): string {
  if (rows.length === 0) return `<p class="empty">아직 기록이 없습니다.</p>`;
  return `<ul class="bars">${rows
    .map(
      (r) => `<li><span>${esc(labels?.[r.key] ?? r.key)}</span>
<em><i style="width:${total ? (r.views / total) * 100 : 0}%"></i></em>
<b>${r.views.toLocaleString()}</b></li>`,
    )
    .join("")}</ul>`;
}

/**
 * 워커는 떠 있지만 D1 바인딩이 없을 때. 여기서 막히면 무엇을 해야 하는지
 * 알 길이 없으므로 필요한 절차를 화면에 적어 둡니다.
 */
function noDatabasePage(): string {
  return shell(
    "관리자",
    `<div class="wrap">
<h1>데이터베이스 연결 없음</h1>
<p class="note">워커는 정상 동작 중입니다. D1 바인딩 <b>DB</b> 만 아직 붙지 않았습니다.</p>
<div class="box"><h2>붙이는 순서</h2>
<ol style="margin:0;padding-left:20px;line-height:2">
<li>Cloudflare 대시보드 → <b>Storage &amp; Databases → D1</b> 에서 데이터베이스를 만듭니다 (없을 때만).</li>
<li><b>Workers &amp; Pages</b> 에서 이 프로젝트를 열고 <b>Settings → Bindings</b> 로 갑니다.</li>
<li>D1 데이터베이스 바인딩을 추가합니다. 변수 이름은 반드시 <b>DB</b>, 값은 1번에서 만든 데이터베이스입니다.</li>
<li>Production 에 추가하면 끝입니다. Preview 는 브랜치 미리보기용이라 선택 사항입니다.</li>
<li><b>Deployments → 최신 배포 → Retry deployment</b> 로 다시 배포합니다. 바인딩은 새 배포부터 적용됩니다.</li>
</ol>
<p class="note" style="margin:16px 0 0">테이블은 따로 만들 필요가 없습니다. 바인딩이 붙으면 첫 요청 때 자동으로 생성되고, 이어서 비밀번호 설정 화면이 나옵니다.</p>
</div></div>`,
  );
}

function setupPage(error: boolean): string {
  return shell(
    "관리자 초기 설정",
    `<div class="login"><form method="post" action="/admin/setup">
<h1>관리자 비밀번호 설정</h1>
<p class="note" style="margin:0">아직 계정이 없습니다. 여기서 정한 비밀번호는 해시로만 저장되며 저장소에는 남지 않습니다.</p>
${error ? `<p class="err">10자 이상으로 정해 주세요.</p>` : ""}
<input name="password" type="password" placeholder="새 비밀번호 (10자 이상)" autocomplete="new-password" minlength="10" required>
<button type="submit">설정</button></form></div>`,
  );
}

function loginPage(error: boolean): string {
  return shell(
    "관리자",
    `<div class="login"><form method="post" action="/admin/login">
<h1>관리자</h1>
${error ? `<p class="err">비밀번호가 맞지 않습니다.</p>` : ""}
<input name="password" type="password" placeholder="비밀번호" autocomplete="current-password" required>
<button type="submit">로그인</button></form></div>`,
  );
}

/**
 * 이벤트별 집계 시작일.
 *
 * 이 날 이전이 조회 기간에 걸치면 분모와 분자가 세어 온 기간이 달라 비율이
 * 100% 를 넘는 등 뜻 없는 값이 됩니다. 그럴 때는 숫자 대신 「-」 를 적습니다.
 */
const ANSWERED_SINCE = "2026-09-07";
const COMPLETED_SINCE = "2026-09-10";
/** 2단계 도착을 페이지뷰가 아니라 이벤트(사람당 한 번)로 세기 시작한 날 */
const STEP2_SINCE = "2026-10-01";
/** 결과 화면 쿠팡 카드 클릭을 직접 세기 시작한 날. 쿠팡 리포트에 결과 카드 채널(mbtitest_result_*)이
 *  30일간 한 건도 없어서, 안 누른 건지 눌렀는데 채널이 안 붙은 건지 가르려고 넣었습니다. */
const PICK_SINCE = "2026-10-01";
/** 유료 정밀 리포트 수요 측정 카드를 결과 화면에 붙인 다음 날. 10-03 은 붙이기 전 완주가
 *  섞여 있어 관심률이 낮게 나오므로 하루 뒤부터 비율을 냅니다. */
const REPORT_SINCE = "2026-10-04";
/** 결과 화면 「프리미엄 사주」 배너(사주랩)를 붙인 날. 이전 기간을 섞으면 0 이 끼어 비율이 낮아집니다. */
const SAJULAB_SINCE = "2026-10-04";
/** 검사 화면 방문을 사람당 한 번(답하기 전까지 탭당 한 번) 세기 시작한 다음 날.
 *  「방문」(페이지뷰)은 새로고침·재방문이 섞여 응답 시작률이 낮게 나온다. */
const VISIT_SINCE = "2026-10-04";

/** 결과 화면 링크 묶음 클릭(result_click)을 세기 시작한 날. 배포한 10-04 는 반나절만 섞여 다음 날부터 냅니다. */
const RESULT_CLICK_SINCE = "2026-10-05";

/**
 * 모리 캐릭터 카드 공유(share_click)·공유 페이지(/s/)를 세기 시작한 날. 배포는 10-04 저녁이지만
 * 그날은 D1 무료 한도를 넘겨 다음 날 09:00 까지 기록이 쌓이지 않아 10-05 부터 냅니다.
 */
const SHARE_SINCE = "2026-10-05";
const TYPE_SINCE = "2026-10-04";

/** 이보다 표본이 작으면 비율을 내지 않습니다. 몇 건짜리 비율은 뜻이 없습니다. */
const MIN_SAMPLE = 20;

/**
 * 붙여 넣은 API 키를 정리합니다. naver.env 에서 `NCP_APIGW_KEY=값` 줄을 통째로
 * 복사하거나 따옴표·공백·줄바꿈이 섞여 들어오는 일이 많습니다.
 */
export function cleanKey(raw: string): string {
  let value = raw.trim();
  const eq = value.lastIndexOf("=");
  if (eq >= 0 && /^[A-Za-z_][A-Za-z0-9_-]*\s*$/.test(value.slice(0, eq))) value = value.slice(eq + 1);
  return value.replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, "");
}

/** ?from=YYYY-MM-DD&to=YYYY-MM-DD. 잘못된 값이면 null 이라 최근 N일로 돌아갑니다 */
export function parseRange(url: URL): { from: string; to: string } | null {
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const ok = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
  if (!ok(from) || !ok(to) || from > to) return null;
  const today = seoulDay();
  return { from, to: to > today ? today : to };
}

async function dashboard(
  db: D1Database,
  days: number,
  notice: string,
  range: { from: string; to: string } | null = null,
): Promise<string> {
  // 설정을 바꾼 날 전·후를 비교하려면 날짜를 직접 지정할 수 있어야 합니다.
  const to = range?.to ?? seoulDay();
  const from = range?.from ?? seoulDay(new Date(Date.now() - (days - 1) * 86400000));
  // 하루 집계(worker/rollup.ts)만 읽습니다. 지난 날은 저장된 한 행, 오늘만 10분마다 새로 만듭니다.
  // 예전처럼 쿼리마다 page_views 기간 전체를 훑으면 30일 조회 한 번에 약 150만 행을 읽습니다.
  const { days: rollups, pending } = await loadRollups(db, from, to, seoulDay());
  const all = mergeRollups(rollups);
  const rowsOf = (map: Record<string, number>, limit?: number) => {
    const list = Object.entries(map).map(([key, views]) => ({ key, views })).sort((a, b) => b.views - a.views);
    return limit ? list.slice(0, limit) : list;
  };
  const withData = rollups.filter((r) => r.views > 0);
  const total = { views: all.views, visitors: all.visitors, days: withData.length };
  const daily = withData.map((r) => ({ day: r.day, views: r.views, visitors: r.visitors }));
  const sources = rowsOf(all.sources);
  const devices = rowsOf(all.devices);
  const paths = rowsOf(all.paths, 20);
  const countries = rowsOf(all.countries, 10);
  const referrers = rowsOf(all.referrers, 15);
  const steps = Object.entries(all.steps)
    .filter(([, s]) => s.intro > 0)
    .map(([slug, s]) => ({ slug, ...s }))
    .sort((a, b) => b.intro - a.intro)
    .slice(0, 15);

  // 첫 문항에 답한 수와 끝까지 푼 수. 방문만 하고 나간 사람, 풀다 그만둔 사람,
  // 끝낸 사람을 가릅니다. 완주는 결과 화면 조회수가 아니라 이벤트로 셉니다.
  // 결과 주소는 공유되고 새로고침되어 조회수가 완주 수보다 큽니다.
  const eventCount = (name: string, slug: string) => all.events[`${name}|${slug}`] ?? 0;
  const countsFor = (name: string) =>
    new Map(
      Object.entries(all.events)
        .filter(([key]) => key.startsWith(`${name}|`))
        .map(([key, count]) => [key.slice(name.length + 1), count] as [string, number]),
    );
  const answeredBySlug = countsFor("answered");
  const visitedBySlug = countsFor("visited");
  const completedBySlug = countsFor("completed");
  const step2BySlug = countsFor("step2");
  const pickBySlug = countsFor("pick_click");
  const reportSeen = eventCount("report_seen", "mbti");
  const reportClick = eventCount("report_click", "mbti");
  const reportFollow = eventCount("report_follow", "mbti");
  const reportCompleted = completedBySlug.get("mbti") ?? 0;

  // 사주랩 배너: slug 자리에 배너 자리 이름이 들어 있습니다(lib/sajulab.ts).
  const sajuTable = SAJULAB_PLACEMENT_KEYS.map((key) => ({
    key,
    label: SAJULAB_PLACEMENTS[key],
    seen: eventCount("saju_seen", key),
    click: eventCount("saju_click", key),
  })).sort((a, b) => b.click - a.click || b.seen - a.seen);
  const sajuSeenTotal = sajuTable.reduce((sum, row) => sum + row.seen, 0);
  const sajuClickTotal = sajuTable.reduce((sum, row) => sum + row.click, 0);
  const sajuRate = (click: number, seen: number) => {
    if (from < SAJULAB_SINCE) return "-";
    if (seen < MIN_SAMPLE) return "표본 부족";
    return ((click / seen) * 100).toFixed(1) + "%";
  };
  // 분모가 같은 기간을 세어 왔을 때만, 표본이 충분할 때만 비율을 냅니다.
  const reportRate = (part: number, whole: number) => {
    if (from < REPORT_SINCE) return "-";
    if (whole < MIN_SAMPLE) return "표본 부족";
    return ((part / whole) * 100).toFixed(1) + "%";
  };

  // 체류·회유. 계산 방식은 worker/rollup.ts 의 buildRollup 에 있습니다.
  const journeyDays = withData.map((r) => ({ day: r.day, ...r.journey }));
  const journey = all.journey;
  const pct = (part: number, whole: number) =>
    whole < MIN_SAMPLE ? "표본 부족" : ((part / whole) * 100).toFixed(1) + "%";
  const dwellRows = [
    { key: "1페이지만 보고 나감", views: journey.b0 },
    { key: "1분 미만", views: journey.b1 },
    { key: "1~3분", views: journey.b2 },
    { key: "3~10분", views: journey.b3 },
    { key: "10분 이상", views: journey.b4 },
  ];
  // MBTI 결과 화면에서 바로 이어서 연 페이지. 같은 사이트 안 이동만 봅니다.
  const afterMbti = rowsOf(all.afterMbti, 12);
  const afterMbtiTotal = Object.values(all.afterMbti).reduce((sum, n) => sum + n, 0);
  const clicksFor = (key: string) => eventCount("result_click", key);
  const mbtiCompleted = completedBySlug.get("mbti") ?? 0;
  const homeViews = all.paths["/"] ?? 0;
  // 타로는 카드를 뽑으면 완주로 셉니다. 공유 표에서는 타로를 따로 보므로 「다른 테스트」 분모에서 뺍니다.
  const tarotSet = new Set<string>(tarotSlugs);
  const tarotCompleted = [...completedBySlug].filter(([slug]) => tarotSet.has(slug)).reduce((sum, [, n]) => sum + n, 0);
  const otherCompleted = [...completedBySlug].filter(([slug]) => slug !== "mbti" && !tarotSet.has(slug)).reduce((sum, [, n]) => sum + n, 0);
  const share = all.share ?? { views: 0, visitors: 0, toTest: 0 };
  const shareTest = all.shareTest ?? { views: 0, visitors: 0, toTest: 0 };
  const typeRows = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"]
    .map((code) => ({ code, n: eventCount("mbti_type", code.toLowerCase()) }))
    .sort((a, b) => b.n - a.n);
  const typeTotal = typeRows.reduce((s, r) => s + r.n, 0);
  // 유형 기록(mbti_type)을 시작하기 전 기간의 추정: 결과 화면의 「내 유형 특징」·「내 궁합」 링크로 넘어간 페이지뷰.
  // 결과 화면 다음 페이지(afterMbti)는 page_views 로 만든 집계라 과거 기간도 나옵니다. 누른 사람만 잡히는 표본입니다.
  const estRows = typeRows
    .map(({ code }) => ({ code, n: (all.afterMbti[`/types/${code.toLowerCase()}/`] ?? 0) + (all.afterMbti[`/compatibility/${code.toLowerCase()}/`] ?? 0) }))
    .sort((a, b) => b.n - a.n);
  const estTotal = estRows.reduce((s, r) => s + r.n, 0);
  const letterTable = (rows: { code: string; n: number }[], total: number) =>
    (["EI", "SN", "TF", "JP"] as const)
      .map((ax) => {
        const l = rows.filter((r) => r.code.includes(ax[0])).reduce((s, r) => s + r.n, 0);
        return `<tr><td>${ax}</td><td>${ax[0]} ${l} (${total ? ((l / total) * 100).toFixed(1) : "0"}%)</td><td>${ax[1]} ${total - l} (${total ? (((total - l) / total) * 100).toFixed(1) : "0"}%)</td></tr>`;
      })
      .join("");
  const shareClicks = SHARE_CHANNEL_KEYS.map((key) => ({ key, label: SHARE_CHANNELS[key], clicks: eventCount("share_click", key) }));
  const sumClicks = (prefix: string) => shareClicks.filter((row) => row.key.startsWith(prefix)).reduce((sum, row) => sum + row.clicks, 0);
  const shareClickTotal = sumClicks("mori-");
  const testShareClickTotal = sumClicks("test-");
  const fortuneShareClickTotal = sumClicks("fortune-");
  const tarotShareClickTotal = sumClicks("tarot-");
  // 운세·사주·궁합은 완주 기록이 없어 비율을 내지 않습니다(분모 없음).
  const shareWhole = (key: string) =>
    key.startsWith("mori-") ? mbtiCompleted : key.startsWith("tarot-") ? tarotCompleted : key.startsWith("fortune-") || key.startsWith("type-") ? -1 : otherCompleted;
  const shareRateFor = (part: number, key: string) => (shareWhole(key) < 0 ? "-" : shareRate(part, shareWhole(key)));
  const perShare = (starts: number, clicks: number) => (from < SHARE_SINCE || clicks < MIN_SAMPLE ? "-" : (starts / clicks).toFixed(2));
  const shareRate = (part: number, whole: number) => {
    if (from < SHARE_SINCE) return "-";
    if (whole < MIN_SAMPLE) return "표본 부족";
    return ((part / whole) * 100).toFixed(1) + "%";
  };
  const clickRate = (click: number, whole: number) => {
    if (from < RESULT_CLICK_SINCE) return "-";
    if (whole < MIN_SAMPLE) return "표본 부족";
    return ((click / whole) * 100).toFixed(1) + "%";
  };

  const peak = Math.max(1, ...daily.map((d) => d.views));
  const ranges = [1, 7, 30, 90]
    .map((d) => `<a href="/admin/?days=${d}" class="${!range && d === days ? "on" : ""}">${d === 1 ? "오늘" : `${d}일`}</a>`)
    .join("");
  const rangeForm = `<form class="range-form" method="get" action="/admin/"><input type="date" name="from" value="${from}"> ~ <input type="date" name="to" value="${to}"> <button>기간 조회</button></form>`;

  return shell(
    "접속 현황",
    `<div class="wrap">
<div class="head"><div><h1>접속 현황</h1><p>${from} ~ ${to} (KST)</p></div><nav class="ranges">${ranges}<a href="/admin/trends/">트렌드</a><a href="/admin/keywords/">키워드 조회</a><a href="/admin/coupang/">쿠팡</a></nav></div>
${rangeForm}
${pending > 0 ? `<p class="note">지난 ${pending}일 집계가 아직 없습니다. 한 번에 7일씩 채우므로 새로고침하면 이어서 채웁니다.</p>` : ""}

<div class="cards">
<div><b>${total.views.toLocaleString()}</b><span>페이지뷰</span></div>
<div><b>${total.visitors.toLocaleString()}</b><span>방문자 (하루 단위 중복 제외)</span></div>
<div><b>${total.days ? Math.round(total.views / total.days).toLocaleString() : 0}</b><span>일평균 페이지뷰</span></div>
<div><b>${total.visitors ? (total.views / total.visitors).toFixed(1) : "0"}</b><span>방문당 페이지수</span></div>
</div>

<div class="box"><h2>일자별</h2>${
      daily.length === 0
        ? `<p class="empty">아직 기록이 없습니다. 배포 후 방문이 쌓이면 표시됩니다.</p>`
        : `<div class="chart">${daily
            .map(
              (d) =>
                `<div title="${d.day} · ${d.views} PV · ${d.visitors} 방문자"><i style="height:${(d.views / peak) * 100}%"></i><small>${d.day.slice(5)}</small></div>`,
            )
            .join("")}</div>`
    }</div>

<div class="grid">
<div class="box"><h2>유입 경로</h2>${bars(sources, total.views, SOURCE_LABELS)}</div>
<div class="box"><h2>기기</h2>${bars(devices, total.views, { mobile: "모바일", desktop: "데스크톱" })}</div>
</div>

<div class="box"><h2>많이 본 페이지</h2>${bars(paths, total.views)}</div>

<div class="box"><h2>테스트 완주율</h2>
<p class="note">
「방문」은 검사 화면이 열린 수, 「첫 응답」은 문항 하나라도 답한 수, 「완주」는 끝까지 풀고 결과를 받은 수입니다.
방문과 첫 응답의 차이가 크면 첫인상 문제, 「첫 응답 → 완주」가 낮으면 길이 문제입니다. 고칠 곳이 서로 달라 나눠 셉니다.
<br>「결과 조회」는 결과 화면 조회수입니다. 공유 링크로 들어온 사람과 새로고침이 섞여 있어 완주 수보다 큽니다. 비율에는 쓰지 않습니다.
<br>「쿠팡 클릭」은 결과 화면의 추천 카드를 누른 수입니다(${PICK_SINCE} 부터). 쿠팡 화면의 채널별 클릭과 비교해, 여기는 있는데 쿠팡에 없으면 채널(subId)이 안 붙고 있다는 뜻입니다.
<br>「고유 방문」은 검사 화면을 연 사람 수입니다. 답하기 전까지는 새로고침해도 한 번만 세고, 다시 검사하면 새로 셉니다. 「실제 시작률」 = 첫 응답 ÷ 고유 방문으로, 페이지뷰로 나눈 「응답 시작률」보다 정확합니다(${VISIT_SINCE} 부터, MBTI·일반 테스트만).
<br>「2단계」는 2단계 화면에 도착한 사람 수입니다. ${STEP2_SINCE} 부터는 사람당 한 번만 세고, 그 전 기간은 새로고침이 섞인 화면 조회수라 회색으로 표시합니다.
<br>첫 응답은 ${ANSWERED_SINCE}, 완주는 ${COMPLETED_SINCE} 부터 쌓기 시작했습니다. 조회 기간이 그 전을 포함하면 비율은 「-」로 나옵니다.
표본이 ${MIN_SAMPLE}건 미만이어도 비율 대신 「표본 부족」으로 적습니다.
</p>${
      steps.length === 0
        ? `<p class="empty">아직 기록이 없습니다.</p>`
        : `<div class="scroll"><table><thead><tr><th>테스트</th><th>방문</th><th>고유 방문</th><th>첫 응답</th><th>2단계</th><th>결과 조회</th><th>완주</th><th>응답 시작률</th><th>실제 시작률</th><th>완주율</th><th>쿠팡 클릭</th></tr></thead><tbody>${steps
            .map((s) => {
              const began = answeredBySlug.get(s.slug) ?? 0;
              const finished = completedBySlug.get(s.slug) ?? 0;
              // 조회 기간이 집계 시작 전을 포함하면 분모만 짧은 기간이라 비율이
              // 부풀려집니다. 표본이 작아도 마찬가지로 숫자를 내지 않습니다.
              const rate = (part: number, whole: number, since: string) => {
                if (from < since) return "-";
                if (whole < MIN_SAMPLE) return "표본 부족";
                return Math.round((part / whole) * 100) + "%";
              };
              return `<tr><td>${esc(s.slug)}</td><td>${s.intro}</td><td>${visitedBySlug.get(s.slug) ?? "-"}</td><td>${began || "-"}</td><td>${from >= STEP2_SINCE ? (step2BySlug.get(s.slug) ?? "-") : `<span class="muted">${s.step2}</span>`}</td><td>${s.result}</td><td>${finished || "-"}</td>
<td>${rate(began, s.intro, ANSWERED_SINCE)}</td><td>${rate(began, visitedBySlug.get(s.slug) ?? 0, VISIT_SINCE)}</td><td>${rate(finished, began, COMPLETED_SINCE)}</td><td>${pickBySlug.get(s.slug) ?? (from >= PICK_SINCE ? 0 : "-")}</td></tr>`;
            })
            .join("")}</tbody></table></div>`
    }</div>

<div class="box"><h2>체류·회유</h2>
<p class="note">
MBTI 하나만 하고 나가는지, 다른 검사로 이어 가며 머무는지를 봅니다. 새로 모으는 값 없이 접속 기록으로 계산합니다.
「방문자」는 하루 단위 사람(날짜가 바뀌면 다른 사람으로 셈)입니다. 「검사 2개+」는 서로 다른 검사 첫 화면(/tests/…, /check/…)을 2개 이상 연 사람입니다.
<b>「MBTI → 다른 검사」 = MBTI를 끝낸 사람(2단계와 결과를 모두 본 사람) 중 그 뒤에 다른 검사를 연 비율</b> — 회유 개선의 핵심 숫자입니다.
체류 시간은 첫 조회부터 마지막 조회까지라 마지막 페이지에 머문 시간은 빠집니다. 화면을 바꾼 날 전·후를 기간 조회로 나눠 비교하세요.
</p>
<div class="cards">
<div><b>${journey.visitors ? (journey.views / journey.visitors).toFixed(2) : "0"}</b><span>방문자당 페이지</span></div>
<div><b>${pct(journey.multi, journey.visitors)}</b><span>검사 2개 이상 한 방문자</span></div>
<div><b>${pct(journey.mbti_next, journey.mbti_done)}</b><span>MBTI → 다른 검사 (${journey.mbti_next.toLocaleString()} / ${journey.mbti_done.toLocaleString()})</span></div>
<div><b>${pct(journey.b3 + journey.b4, journey.visitors)}</b><span>3분 이상 머문 방문자</span></div>
</div>
${journeyDays.length === 0 ? `<p class="empty">아직 기록이 없습니다.</p>` : `<div class="scroll"><table><thead><tr><th>날짜</th><th>방문자</th><th>방문자당 페이지</th><th>검사 2개+</th><th>MBTI 완료자</th><th>→ 다른 검사</th><th>전환율</th><th>3분 이상</th></tr></thead><tbody>
${journeyDays.map((d) => `<tr><td>${d.day.slice(5)}</td><td>${d.visitors.toLocaleString()}</td><td>${d.visitors ? (d.views / d.visitors).toFixed(2) : "-"}</td><td>${pct(d.multi, d.visitors)}</td><td>${d.mbti_done}</td><td>${d.mbti_next}</td><td><b>${pct(d.mbti_next, d.mbti_done)}</b></td><td>${pct(d.b3 + d.b4, d.visitors)}</td></tr>`).join("")}
</tbody></table></div>`}
</div>

<div class="grid">
<div class="box"><h2>체류 시간 분포</h2>${bars(dwellRows, journey.visitors)}</div>
<div class="box"><h2>MBTI 결과 다음에 연 페이지</h2><p class="note">결과 화면에서 바로 이어서 연 페이지입니다(합계 ${afterMbtiTotal.toLocaleString()}). 「/」 는 다시 검사하기나 로고를 누른 경우입니다.</p>${bars(afterMbti, afterMbtiTotal)}</div>
</div>

<div class="box"><h2>결과 화면 링크 묶음 클릭</h2>
<p class="note">
결과 화면의 링크 묶음 중 어느 것이 사람을 붙잡는지 봅니다. 묶음 안의 카드를 누른 사람을 탭당 묶음마다 한 번만 셉니다.
<b>클릭률 = 클릭 ÷ 분모</b> (MBTI 묶음은 MBTI 완주, 「다음 테스트」는 MBTI를 뺀 테스트 완주, 홈 「요즘 뜨는 심리테스트」는 홈 페이지뷰). 쿠팡 카드·사주랩 배너·유료 리포트는 각 표에 따로 있습니다.
비율은 ${RESULT_CLICK_SINCE} 부터 냅니다.
</p>
<div class="scroll"><table><thead><tr><th>묶음</th><th>클릭</th><th>분모</th><th>클릭률</th></tr></thead><tbody>
${RESULT_CLICK_PLACEMENT_KEYS.map((key) => {
  const whole = key.startsWith("mbti-") ? mbtiCompleted : key.startsWith("home-") ? homeViews : otherCompleted;
  return `<tr><td>${esc(RESULT_CLICK_PLACEMENTS[key])}</td><td>${clicksFor(key)}</td><td>${whole || "-"}</td><td>${clickRate(clicksFor(key), whole)}</td></tr>`;
}).join("")}
</tbody></table></div>
</div>

<div class="box"><h2>MBTI 결과 분포</h2>
<p class="note">${TYPE_SINCE} 부터 기록합니다(그 전에는 유형을 남기지 않았습니다). 「동점」은 그 축이 5:5 로 끝난 완주 — 지금 채점은 동점을 E·S·T·J 로 보내므로
동점 비율이 높을수록 E·S·T·J 쪽이 부풀려져 있다는 뜻입니다. 16유형이 1/16씩 나와야 공평한 것은 아니고, 보기 위치·동점 때문에 결과가 바뀌지 않아야 공평합니다.</p>
${typeTotal === 0 ? `<p class="empty">아직 기록이 없습니다.</p>` : `<div class="scroll"><table><thead><tr><th>축</th><th>왼쪽</th><th>오른쪽</th><th>동점(→왼쪽으로 감)</th></tr></thead><tbody>
${(["EI", "SN", "TF", "JP"] as const).map((ax) => { const l = typeRows.filter((r) => r.code.includes(ax[0])).reduce((s, r) => s + r.n, 0); const tie = eventCount("mbti_tie", ax.toLowerCase()); return `<tr><td>${ax}</td><td>${ax[0]} ${l} (${((l / typeTotal) * 100).toFixed(1)}%)</td><td>${ax[1]} ${typeTotal - l} (${(((typeTotal - l) / typeTotal) * 100).toFixed(1)}%)</td><td>${tie} (${((tie / typeTotal) * 100).toFixed(1)}%)</td></tr>`; }).join("")}
</tbody></table></div>
<div class="scroll"><table><thead><tr><th>유형</th><th>완주</th><th>비율</th></tr></thead><tbody>
${typeRows.map((r) => `<tr><td>${r.code}</td><td>${r.n}</td><td>${((r.n / typeTotal) * 100).toFixed(1)}%</td></tr>`).join("")}
<tr><td><b>합계</b></td><td><b>${typeTotal}</b></td><td></td></tr>
</tbody></table></div>`}
<h3 style="margin:22px 0 6px;font-size:16px">지난 기간 추정 — 결과 화면에서 「내 유형 특징·궁합」을 누른 기록</h3>
<p class="note">유형 기록을 시작하기 전(${TYPE_SINCE} 이전)도 볼 수 있는 추정치입니다. 결과 화면의 내 유형 링크(/types/유형/·/compatibility/유형/)로 바로 넘어간 페이지뷰를 유형별로 셉니다.
<b>누른 사람만 잡히는 표본</b>이라 유형마다 누르는 성향이 다르면 어긋날 수 있고, 한 사람이 둘 다 누르면 두 번 셉니다. 기간을 90일로 넓혀 보세요.</p>
${estTotal === 0 ? `<p class="empty">이 기간에는 결과 화면에서 유형 페이지로 넘어간 기록이 없습니다.</p>` : `<div class="scroll"><table><thead><tr><th>축</th><th>왼쪽</th><th>오른쪽</th></tr></thead><tbody>${letterTable(estRows, estTotal)}</tbody></table></div>
<div class="scroll"><table><thead><tr><th>유형</th><th>클릭</th><th>비율</th></tr></thead><tbody>
${estRows.map((r) => `<tr><td>${r.code}</td><td>${r.n}</td><td>${((r.n / estTotal) * 100).toFixed(1)}%</td></tr>`).join("")}
<tr><td><b>합계</b></td><td><b>${estTotal}</b></td><td></td></tr>
</tbody></table></div>`}
</div>

<div class="box"><h2>모리 카드 공유</h2>
<p class="note">
MBTI 결과 화면의 캐릭터 카드, 다른 테스트(IQ·자가진단 포함) 결과 카드, 운세·사주·궁합 카드, 타로 카드의 공유 버튼입니다(2026-10-04~). 「공유」는 버튼을 누른 사람(탭당 수단마다 한 번),
비율은 MBTI 카드는 MBTI 완주, 다른 테스트 카드는 MBTI·타로를 뺀 테스트 완주, 타로 카드는 타로 완주(카드 뽑기) 대비입니다. 운세·사주·궁합은 완주 기록이 없어 비율을 내지 않습니다.
「공유 페이지」는 친구가 받은 링크(/s/유형/)를 연 사람, 「→ 검사 시작」은 그중 MBTI 검사 화면까지 간 사람입니다.
<b>공유 1번당 새 검사 = 검사 시작 ÷ 공유 합계</b> — 1을 넘으면 공유만으로 사람이 늘어납니다. 비율은 ${SHARE_SINCE} 부터 냅니다.
</p>
<div class="scroll"><table><thead><tr><th>공유 수단</th><th>공유</th><th>÷ 완주</th></tr></thead><tbody>
${shareClicks.map((row) => `<tr><td>${esc(row.label)}</td><td>${row.clicks}</td><td>${shareRateFor(row.clicks, row.key)}</td></tr>`).join("")}
<tr><td><b>MBTI 카드 합계</b></td><td><b>${shareClickTotal}</b></td><td><b>${shareRate(shareClickTotal, mbtiCompleted)}</b></td></tr>
<tr><td><b>다른 테스트 카드 합계</b></td><td><b>${testShareClickTotal}</b></td><td><b>${shareRate(testShareClickTotal, otherCompleted)}</b></td></tr>
<tr><td><b>운세·사주·궁합 카드 합계</b></td><td><b>${fortuneShareClickTotal}</b></td><td>-</td></tr>
<tr><td><b>타로 카드 합계</b></td><td><b>${tarotShareClickTotal}</b></td><td><b>${shareRate(tarotShareClickTotal, tarotCompleted)}</b></td></tr>
</tbody></table></div>
<div class="scroll"><table><thead><tr><th>받은 링크</th><th>조회</th><th>방문자</th><th>→ 검사 시작</th><th>시작률</th><th>공유 1번당 새 검사</th></tr></thead><tbody>
<tr><td>MBTI 모리 (/s/…)</td><td>${share.views}</td><td>${share.visitors}</td><td>${share.toTest}</td><td>${shareRate(share.toTest, share.visitors)}</td><td><b>${perShare(share.toTest, shareClickTotal)}</b></td></tr>
<tr><td>다른 테스트 (/tests/…/r/…)</td><td>${shareTest.views}</td><td>${shareTest.visitors}</td><td>${shareTest.toTest}</td><td>${shareRate(shareTest.toTest, shareTest.visitors)}</td><td><b>${perShare(shareTest.toTest, testShareClickTotal)}</b></td></tr>
</tbody></table></div>
</div>

<div class="box"><h2>유료 리포트 수요 측정 (MBTI)</h2>
<p class="note">
MBTI 결과 화면의 「정밀 리포트」 카드입니다. 상품은 아직 없고, 목차와 가격(출시가 6,900원)을 보여 주고 몇 명이 받으려 하는지 셉니다.
「노출」은 카드가 화면에 절반 이상 들어온 사람, 「클릭」은 「내 리포트 받기」를 누른 사람, 「팔로우」는 그다음 스레드 링크를 누른 사람입니다. 모두 탭당 한 번만 셉니다.
<b>관심률 = 클릭 ÷ 완주</b> 가 합격 판단에 쓰는 숫자입니다. 노출률이 낮으면 카드까지 내려오지 않는다는 뜻이라 자리를 옮길 문제이고, 노출 대비 클릭이 낮으면 상품 매력 문제입니다.
비율은 ${REPORT_SINCE} 부터 냅니다.
</p>
<div class="scroll"><table><thead><tr><th>완주</th><th>노출</th><th>클릭</th><th>팔로우</th><th>노출률</th><th>관심률</th><th>노출 대비 클릭</th></tr></thead><tbody>
<tr><td>${reportCompleted || "-"}</td><td>${reportSeen}</td><td>${reportClick}</td><td>${reportFollow}</td><td>${reportRate(reportSeen, reportCompleted)}</td><td><b>${reportRate(reportClick, reportCompleted)}</b></td><td>${reportRate(reportClick, reportSeen)}</td></tr>
</tbody></table></div>
</div>

<div class="box"><h2>사주랩 배너 클릭 (결과 화면)</h2>
<p class="note">
결과 화면의 「프리미엄 사주 보러 가기」 배너(유료 프리미엄 안내)입니다. 누르면 4ju.sajulab.kr/4ju 가 새 탭으로 열립니다.
「노출」은 배너가 화면에 절반 이상 들어온 사람, 「클릭」은 배너를 누른 사람입니다. 둘 다 탭당 한 번만 셉니다.
<b>클릭률 = 클릭 ÷ 노출</b>. 노출이 적은 자리는 배너까지 내려오지 않는다는 뜻이라 위치를 올릴 문제입니다.
사주랩 쪽에 실제로 도착한 수는 그쪽 통계로 대조하세요(새 탭이 막히거나 바로 닫으면 여기 클릭보다 적습니다).
비율은 ${SAJULAB_SINCE} 부터, 노출 ${MIN_SAMPLE}건 이상일 때만 냅니다. 자가진단(/check/)에는 배너를 달지 않았습니다.
</p>
<div class="scroll"><table><thead><tr><th>자리</th><th>노출</th><th>클릭</th><th>클릭률</th></tr></thead><tbody>
${sajuTable.map((row) => `<tr><td>${esc(row.label)}</td><td>${row.seen}</td><td>${row.click}</td><td>${sajuRate(row.click, row.seen)}</td></tr>`).join("")}
<tr><td><b>합계</b></td><td><b>${sajuSeenTotal}</b></td><td><b>${sajuClickTotal}</b></td><td><b>${sajuRate(sajuClickTotal, sajuSeenTotal)}</b></td></tr>
</tbody></table></div>
</div>

<div class="grid">
<div class="box"><h2>국가</h2>${bars(countries, total.views)}</div>
<div class="box"><h2>리퍼러</h2>${bars(referrers, total.views)}</div>
</div>

<div class="box"><h2>비밀번호 변경</h2>
<p class="note">비밀번호는 PBKDF2 해시로 데이터베이스에만 저장됩니다. 저장소에는 남지 않습니다.</p>
${notice === "ok" ? `<p class="ok">변경했습니다.</p>` : ""}
${notice === "fail" ? `<p class="err">현재 비밀번호가 맞지 않거나 새 비밀번호가 10자 미만입니다.</p>` : ""}
<form method="post" action="/admin/password" class="row">
<input name="current" type="password" placeholder="현재 비밀번호" autocomplete="current-password" required>
<input name="next" type="password" placeholder="새 비밀번호 (10자 이상)" autocomplete="new-password" minlength="10" required>
<button type="submit">변경</button></form></div>

<form method="post" action="/admin/logout" class="ghost"><button type="submit">로그아웃</button></form>

<p class="foot">IP 원본은 저장하지 않습니다. 방문자 구분은 날짜가 섞인 해시라 하루가 지나면 이어지지 않으며, 기록은 90일 뒤 자동으로 지워집니다.</p>
</div>`,
  );
}


/**
 * API 키 입력 한 칸.
 *
 * 저장 여부를 placeholder 가 아니라 라벨에 적습니다. 브라우저 자동완성이 값을
 * 채워 넣으면 placeholder 가 가려져서, 저장된 값과 자동완성된 값을 구분할 수
 * 없었습니다. autocomplete 를 꺼두는 것도 같은 이유입니다.
 */
function field(
  name: string,
  label: string,
  saved: string,
  opts: { secret?: boolean; hint?: string; pattern?: string } = {},
): string {
  return `<label>
<span>${esc(label)}${opts.hint ? ` <i style="font-style:normal;color:#8a90a0">— ${esc(opts.hint)}</i>` : ""}</span>
<b style="color:${saved ? "#3f7d5c" : "#b6483c"}">${saved || "미등록"}</b>
<input name="${name}" ${opts.secret ? 'type="password" autocomplete="new-password"' : 'type="text" autocomplete="off"'}
 ${opts.pattern ? `pattern="${opts.pattern}" inputmode="numeric"` : ""}
 spellcheck="false" placeholder="${saved ? "바꿀 때만 입력" : "값을 붙여넣으세요"}">
</label>`;
}

/**
 * 복사 버튼. 관리자 화면에서 유일하게 쓰는 스크립트라 파일로 빼지 않고 여기 둡니다.
 *
 * navigator.clipboard 는 보안 컨텍스트에서만 동작합니다. 배포는 https 라 되지만
 * 로컬 http 로 열면 막히므로, 그때는 낡은 execCommand 로 넘어갑니다.
 */
const COPY_SCRIPT = `<script>
document.addEventListener("click", function (e) {
  var target = e.target;
  var button = target && target.closest ? target.closest("button[data-copy]") : null;
  if (!button) return;
  var text = button.getAttribute("data-copy") || "";
  var was = button.textContent;
  var done = function (ok) {
    button.textContent = ok ? "복사됨" : "복사 실패";
    button.disabled = true;
    setTimeout(function () { button.textContent = was; button.disabled = false; }, 1500);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    return;
  }
  var box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
  document.body.removeChild(box);
  done(ok);
});
</script>`;

const MASK = (v: string) => (v ? `${v.slice(0, 4)}${"•".repeat(Math.max(0, v.length - 8))}${v.slice(-4)}` : "");

const num = (v: number) => (v < 0 ? "10 미만" : v.toLocaleString());

const TREND_CACHE_MS = 3600_000;

/** 저장해 둔 트렌드 결과. 관찰 목록이 바뀌었거나 오래됐으면 버립니다. */
function readCache(raw: string, keywords: string[], maxAge = TREND_CACHE_MS): { at: number; rows: TrendRow[] } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { at?: number; keywords?: string; rows?: TrendRow[] };
    if (!parsed.at || !Array.isArray(parsed.rows)) return null;
    if (parsed.keywords !== keywords.join("\n")) return null;
    if (Date.now() - parsed.at > maxAge) return null;
    return { at: parsed.at, rows: parsed.rows };
  } catch {
    return null;
  }
}

/**
 * 쿠팡 파트너스 화면.
 *
 * 키를 등록하고, 그 키가 실제로 통하는지 검색어 하나로 확인하고, 실적을
 * 채널별로 봅니다.
 *
 * 실적은 수익 리포트 하나만 부릅니다. 그 안에 클릭·주문·취소·수수료·거래액이
 * 모두 들어 있어서, 클릭·주문 리포트를 따로 부르면 같은 값을 세 번 받으면서
 * 호출 한도만 세 배로 씁니다. 채널을 걸러 받지 않고 전부 받아 여기서 나눕니다.
 */
function coupangPage(opts: {
  creds: CoupangCreds;
  subId: string;
  days: number;
  query: string;
  links: Deeplink[];
  rows: CommissionRow[];
  orders: ReportRow[];
  showOrders: boolean;
  error: string;
  saved: boolean;
}): string {
  const { creds, subId, days, query, links, rows, orders, showOrders, error, saved } = opts;
  const hasKeys = Boolean(creds.accessKey && creds.secretKey);

  const channels = totalsBySubId(rows);
  const sum = channels.reduce(
    (a, c) => ({
      click: a.click + c.click,
      order: a.order + c.order,
      cancel: a.cancel + c.cancel,
      commission: a.commission + c.commission,
      gmv: a.gmv + c.gmv,
    }),
    { click: 0, order: 0, cancel: 0, commission: 0, gmv: 0 },
  );

  const byDay = commissionByDay(rows);
  const series = recentDays(days).map((day) => byDay.get(day) ?? 0);
  const won = (v: number) => `${v.toLocaleString()}원`;
  const keep = query ? `&q=${encodeURIComponent(query)}` : "";

  const channelRows = channels.length
    ? channels
        .map((c) => {
          // 저장해 둔 채널은 눈에 띄게 둡니다. 여러 채널이 섞이면 어느 줄이
          // 이 사이트 것인지 한눈에 안 보입니다.
          const mine = Boolean(c.subId) && c.subId === subId;
          const name = c.subId || "(채널 없음)";
          return `<tr${mine ? ' style="background:#faf8ff"' : ""}>
<td>${esc(name)}${mine ? ' <b style="color:#7657d6;font-size:12px">저장된 채널</b>' : ""}</td>
<td>${c.click.toLocaleString()}</td><td>${c.order.toLocaleString()}</td><td>${c.cancel.toLocaleString()}</td>
<td>${won(c.commission)}</td><td>${won(c.gmv)}</td></tr>`;
        })
        .join("")
    : "";

  const performance = `<div class="box">
<div class="head" style="margin-bottom:18px"><div><h2 style="margin:0">실적</h2>
<p style="margin:6px 0 0;color:#697184;font-size:14px">채널별로 나눠 봅니다. 쿠팡은 매일 오후 3시에 갱신합니다.</p></div>
<nav class="ranges">${[7, 30]
    .map(
      (d) =>
        `<a class="${d === days ? "on" : ""}" href="/admin/coupang/?days=${d}${keep}">${d}일</a>`,
    )
    .join("")}</nav></div>
<div class="cards" style="margin-bottom:22px">
<div><b>${sum.click.toLocaleString()}</b><span>클릭</span></div>
<div><b>${sum.order.toLocaleString()}</b><span>주문 (취소 ${sum.cancel.toLocaleString()})</span></div>
<div><b>${won(sum.commission)}</b><span>수수료</span></div>
<div><b>${won(sum.gmv)}</b><span>거래액</span></div>
</div>
${
    series.some((v) => v > 0)
      ? `<div style="margin-bottom:20px">${sparkline(series, "#7657d6")}
<span style="margin-left:10px;color:#8a90a0;font-size:13px">일별 수수료</span></div>`
      : ""
  }
${
    channelRows
      ? `<div class="scroll"><table><thead><tr><th>채널</th><th>클릭</th><th>주문</th><th>취소</th><th>수수료</th><th>거래액</th></tr></thead>
<tbody>${channelRows}</tbody></table></div>`
      : `<p class="empty">최근 ${days}일 실적이 아직 없습니다. 링크를 걸고 클릭이 생기면 다음 날 오후에 들어옵니다.</p>`
  }
${
    showOrders
      ? orders.length
        ? `<div class="scroll" style="margin-top:22px"><table><thead><tr>${Object.keys(orders[0])
            .map((c) => `<th>${esc(c)}</th>`)
            .join("")}</tr></thead><tbody>${orders
            .slice(0, 50)
            .map((row) => `<tr>${Object.keys(orders[0]).map((c) => `<td>${esc(row[c] ?? "")}</td>`).join("")}</tr>`)
            .join("")}</tbody></table></div>`
        : `<p class="empty" style="margin-top:22px">주문 상세가 없습니다.</p>`
      : `<p class="note" style="margin:18px 0 0"><a href="/admin/coupang/?days=${days}&orders=1${keep}" style="color:#7657d6">주문 상세 보기</a>
 — 호출을 한 번 더 쓰므로 평소에는 받지 않습니다.</p>`
  }
</div>`;

  const linkTable = links.length
    ? `<div class="box"><h2>생성된 링크</h2>
<div class="scroll"><table><thead><tr><th>검색어</th><th>추적 링크</th><th></th></tr></thead><tbody>${links
        .map((l) => {
          const url = l.shortenUrl || l.landingUrl;
          // 표에는 검색어를 보여줍니다. 원본 주소는 길어서 표를 밀어내는데,
          // 정작 확인하고 싶은 건 "무엇으로 만들었나"입니다.
          const word = keywordFromSearchUrl(l.originalUrl);
          return `<tr>
<td title="${esc(l.originalUrl)}">${esc(word || l.originalUrl)}</td>
<td><a href="${esc(url)}" target="_blank" rel="noopener nofollow sponsored" style="color:#7657d6">${esc(url)}</a></td>
<td style="text-align:right"><button type="button" class="copy" data-copy="${esc(url)}">복사</button></td></tr>`;
        })
        .join("")}</tbody></table></div>
<p class="note" style="margin:14px 0 0">${
        subId
          ? `이 링크로 들어간 구매는 채널 <b>${esc(subId)}</b> 실적에 잡힙니다.`
          : "채널 아이디 없이 만들어서 어느 채널 실적인지 나뉘지 않습니다."
      } 위 실적 표에는 다음 날 오후 3시 이후에 나타납니다.</p>${COPY_SCRIPT}</div>`
    : "";

  return shell(
    "쿠팡 파트너스",
    `<div class="wrap">
<div class="head"><div><h1>쿠팡 파트너스</h1><p>실적 · 딥링크 생성</p></div>
<nav class="ranges"><a href="/admin/">접속 현황</a><a href="/admin/trends/">트렌드</a><a href="/admin/keywords/">키워드 조회</a></nav></div>

${saved ? `<p class="ok">저장했습니다.</p>` : ""}
${error ? `<div class="box"><p class="err" style="margin:0">${esc(error)}</p></div>` : ""}

${hasKeys ? performance : ""}

<div class="box"><h2>채널 아이디</h2>
<p class="note">
링크를 만들 때 붙는 <b>subId</b> 입니다. 실적이 이 값으로 나뉘어 들어오므로, 어느 화면이 얼마를 벌었는지 보려면 필요합니다.
<br>subId 는 파트너스에 미리 등록하지 않아도 됩니다 — 링크를 만들 때 자유롭게 정한 값이 리포트에 그대로 돌아옵니다. 원하는 이름을 적어 주세요.
<br>비워 두면 채널 없이 링크를 만듭니다. 이 칸은 비운 대로 저장됩니다.
</p>
<form method="post" action="/admin/coupang/channel" autocomplete="off" class="row">
<input name="sub_id" value="${esc(subId)}" placeholder="예: mbtitest" maxlength="50" spellcheck="false" autocomplete="off">
<button type="submit">저장</button></form></div>

${
      hasKeys
        ? `<div class="box"><h2>딥링크 만들어 보기</h2>
<p class="note">검색어를 넣으면 쿠팡 검색 주소를 추적 링크로 바꿉니다. 개별 상품이 아니라 검색 결과라서 품절·단종으로 링크가 죽지 않습니다.
${subId ? `채널 <b>${esc(subId)}</b> 로 만듭니다.` : "채널 아이디가 비어 있어 채널 없이 만듭니다."}</p>
<form method="get" class="row">
<input type="hidden" name="days" value="${days}">
<input name="q" value="${esc(query)}" placeholder="소음 차단 이어플러그" required autocomplete="off">
<button type="submit">생성</button></form></div>
${linkTable}`
        : ""
    }

<div class="box"><h2>API 키</h2>
<p class="note">
쿠팡 파트너스 → <b>내 정보 → 오픈 API 키 발급</b>에서 받습니다. 발급에 별도 승인이 필요할 수 있습니다.
<br>저장소에는 남지 않고 데이터베이스에만 보관됩니다. 암호화하지 않으므로 데이터베이스를 볼 수 있는 사람은 값을 확인할 수 있습니다.
</p>
<form method="post" action="/admin/coupang/save" autocomplete="off">
<div class="fields">
${field("access_key", "ACCESS KEY", creds.accessKey ? `등록됨 · ${MASK(creds.accessKey)}` : "")}
${field("secret_key", "SECRET KEY", creds.secretKey ? "등록됨" : "", { secret: true })}
</div>
<p class="note" style="margin:16px 0 12px">빈 칸은 기존 값을 그대로 둡니다.</p>
<button type="submit">저장</button></form></div>

<p class="foot">리포트는 한 시간에 500번까지 부를 수 있고 한 번에 ${MAX_REPORT_DAYS}일까지 봅니다.
이 화면은 열 때마다 한 번(주문 상세를 켜면 두 번) 부릅니다.</p>
</div>`,
  );
}

/** 30일 흐름을 작은 선그래프로 그립니다. 라이브러리 없이 좌표만 계산합니다. */
function sparkline(values: number[], color: string): string {
  if (values.length < 2) return "";
  const peak = Math.max(1, ...values);
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${28 - (value / peak) * 26}`)
    .join(" ");
  return `<svg viewBox="0 0 100 28" preserveAspectRatio="none" width="120" height="28" aria-hidden="true">
<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}

/**
 * 트렌드 화면.
 *
 * 네이버 실시간 급상승 검색어는 2021년에 폐지되어 순위를 그대로 받아올 방법이
 * 없습니다. 대신 데이터랩으로 관찰 목록의 30일 흐름을 받아, 최근 7일과 직전
 * 7일을 견준 상승률로 직접 순위를 만듭니다.
 */
function trendsPage(
  rows: TrendRow[],
  keywords: string[],
  error: string,
  hasOpen: boolean,
  saved: boolean,
  fetchedAt: number,
  hub: { idLen: number; keyLen: number } = { idLen: 0, keyLen: 0 },
): string {
  const sorted = [...rows].sort((a, b) => (b.change ?? -999) - (a.change ?? -999));

  // HUB 키가 없거나 조회가 실패하면 이 화면에서 바로 넣게 합니다. 키워드 조회 화면의
  // 접힌 칸에만 두었더니 찾지 못해 401 이 계속 났습니다(2026-10-01).
  // 값은 보여주지 않고 글자 수만 보여줍니다 — 정상은 ID 10자, KEY 40자입니다.
  // KEY 칸을 password 로 두면 브라우저가 관리자 비밀번호를 채워 넣을 수 있어 text 로 둡니다.
  const hasHub = hub.idLen > 0 && hub.keyLen > 0;
  const hubForm =
    hasHub && !error
      ? ""
      : `<div class="box"><h2>데이터랩 키 등록 (API HUB)</h2>
<p class="note">네이버 클라우드 API HUB 의 키 두 개를 넣으면 데이터랩을 HUB 로 조회합니다.
개발자센터 앱에 데이터랩 권한이 없어도 됩니다. 저장하면 바로 다시 조회합니다.
<br>지금 저장된 값: ID ${hub.idLen}자 · KEY ${hub.keyLen}자 (정상은 ID 10자 · KEY 40자)</p>
<form method="post" action="/admin/trends/hub" autocomplete="off">
<div class="fields">
<label><span>X-NCP-APIGW-API-KEY-ID</span><input name="hub_key_id" required autocomplete="off" spellcheck="false"></label>
<label><span>X-NCP-APIGW-API-KEY</span><input name="hub_key" required autocomplete="off" spellcheck="false"></label>
</div>
<button type="submit" style="margin-top:12px">저장하고 다시 조회</button></form></div>`;

  const list = sorted.length
    ? `<div class="scroll"><table><thead><tr>
<th>키워드</th><th>30일 흐름</th><th>최근 7일</th><th>직전 7일</th><th>상승률</th>
</tr></thead><tbody>${sorted
        .map((row) => {
          const up = (row.change ?? 0) > 0;
          const color = row.change === null ? "#8a90a0" : up ? "#3f7d5c" : "#b6483c";
          const label = row.change === null ? "-" : `${up ? "▲" : "▼"} ${Math.abs(row.change).toFixed(0)}%`;
          return `<tr><td>${esc(row.keyword)}</td>
<td>${sparkline(row.series.map((point) => point.ratio), color)}</td>
<td>${row.recent.toFixed(1)}</td><td>${row.previous.toFixed(1)}</td>
<td style="color:${color};font-weight:700">${label}</td></tr>`;
        })
        .join("")}</tbody></table></div>
<p class="note" style="margin:14px 0 0">상승률은 각 키워드가 <b>자기 자신의 2주 전과 견줘</b> 얼마나 올랐는지입니다. 세로 눈금은 조회 묶음 안에서의 상대값이라 키워드끼리 크기를 비교하면 안 됩니다. 절대 검색량은 키워드 조회 화면에서 봅니다.</p>`
    : "";

  return shell(
    "트렌드",
    `<div class="wrap">
<div class="head"><div><h1>트렌드</h1><p>네이버 데이터랩 · 최근 30일${fetchedAt ? ` · ${new Date(fetchedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 기준` : ""}</p></div>
<nav class="ranges"><a href="/admin/trends/?refresh=1">새로고침</a><a href="/admin/">접속 현황</a><a href="/admin/keywords/">키워드 조회</a><a href="/admin/coupang/">쿠팡</a></nav></div>

${saved ? `<p class="ok">저장했습니다.</p>` : ""}
${error ? `<div class="box"><p class="err" style="margin:0">${esc(error)}</p></div>` : ""}
${hubForm}

${
      hasOpen
        ? `<div class="box"><h2>지금 오르고 있는 키워드</h2>
<p class="note">관찰 목록을 상승률 순으로 세웁니다. 위에 있을수록 최근 2주 사이에 수요가 늘어난 주제입니다.</p>
${list || `<p class="empty">아직 불러오지 못했습니다.</p>`}</div>`
        : `<div class="box"><h2>개발자센터 키가 필요합니다</h2>
<p class="note">트렌드는 네이버 데이터랩 API 를 씁니다. developers.naver.com 의 Client ID 와 Secret 을
<a href="/admin/keywords/" style="color:#7657d6">키워드 조회 화면</a>에서 등록해 주세요.</p></div>`
    }

<div class="box"><h2>관찰 목록</h2>
<p class="note">한 줄에 하나씩, 최대 20개. 띄어쓰기 없이 붙여 쓰는 편이 정확합니다.</p>
<form method="post" action="/admin/trends/save">
<textarea name="keywords" rows="8" style="width:100%;padding:12px 14px;border:1px solid #e5e0ef;border-radius:10px;font:14px/1.7 system-ui;resize:vertical">${esc(keywords.join("\n"))}</textarea>
<p class="note" style="margin:12px 0">비우고 저장하면 기본 목록으로 돌아갑니다.</p>
<button type="submit">저장하고 다시 조회</button></form></div>

<div class="box"><h2>실시간 급상승 검색어는 왜 없나요</h2>
<p class="note" style="margin:0">네이버가 2021년 2월에 서비스를 종료해서 순위를 받아올 공개 API 가 없습니다.
바깥 사이트의 집계 화면을 긁어오는 방법은 그쪽이 화면을 바꾸면 바로 깨지고, 남의 서비스 자료라
계속 쓰기도 어렵습니다. 그래서 순위를 가져오는 대신 관찰 목록의 흐름으로 직접 만듭니다.
목록에 없는 주제는 잡히지 않으므로, 새 소재가 보이면 위에 추가해 두세요.</p></div>
</div>`,
  );
}

/**
 * 키워드 조회 화면.
 *
 * 검색광고 키가 없으면 등록 안내만, 있으면 조회 칸만 보여줍니다. 두 가지를
 * 한꺼번에 늘어놓으면 지금 무엇을 해야 하는지 알기 어렵습니다.
 * 개발자센터 키는 없어도 조회가 되므로 접어 둡니다.
 */
function keywordsPage(
  creds: { ad: { apiKey: string; secretKey: string; customerId: string }; open: { clientId: string; clientSecret: string } },
  query: string,
  rows: KeywordRow[],
  error: string,
  saved: boolean,
): string {
  const hasAd = Boolean(creds.ad.apiKey && creds.ad.secretKey && creds.ad.customerId);

  const table = rows.length
    ? `<div class="box"><div class="scroll"><table><thead><tr>
<th>키워드</th><th>PC</th><th>모바일</th><th>월 검색수</th><th>경쟁</th><th>블로그 문서</th><th>문서/검색</th>
</tr></thead><tbody>${rows
        .map((r) => {
          const ratio = r.documents !== null && r.total > 0 ? (r.documents / r.total).toFixed(1) : "-";
          return `<tr><td>${esc(r.keyword)}</td><td>${num(r.pc)}</td><td>${num(r.mobile)}</td>
<td><b>${num(r.total)}</b></td><td>${esc(r.competition)}</td>
<td>${r.documents === null ? "-" : r.documents.toLocaleString()}</td><td>${ratio}</td></tr>`;
        })
        .join("")}</tbody></table></div>
<p class="note" style="margin:14px 0 0">검색수가 크고 <b>문서/검색 비율이 낮을수록</b> 비집고 들어갈 틈이 큽니다.</p></div>`
    : "";

  const openKeys = `<div class="fields">
${field("client_id", "Client ID", creds.open.clientId ? `등록됨 · ${MASK(creds.open.clientId)}` : "")}
${field("client_secret", "Client Secret", creds.open.clientSecret ? "등록됨" : "", { secret: true })}
${field("hub_key_id", "API HUB Key ID (데이터랩용)", creds.hub.keyId ? `등록됨 · ${MASK(creds.hub.keyId)}` : "")}
${field("hub_key", "API HUB Key (데이터랩용)", creds.hub.key ? "등록됨" : "", { secret: true })}
</div>
<p class="note">트렌드 화면(데이터랩)은 API HUB 키가 있으면 그쪽으로 부릅니다. 개발자센터 앱에 데이터랩을 추가하지 않았으면 401(024)이 나기 때문입니다.</p>`;

  // 검색광고 키 등록 화면. 어디서 무엇을 복사해 오는지까지 적어 둡니다.
  const setup = `<div class="box">
<h2>검색광고 API 키 등록</h2>
<p class="note">이 세 가지를 넣으면 조회 칸이 나타납니다. 아래 순서대로 복사해 오세요.</p>
<ol class="steps">
<li><a href="https://searchad.naver.com" target="_blank" rel="noopener">searchad.naver.com</a> 에 로그인합니다. 네이버 아이디로 쓰는 <b>검색광고 계정</b>이며, 개발자센터와는 다른 사이트입니다.</li>
<li>오른쪽 위 <b>도구 → API 사용 관리</b> 로 들어갑니다.</li>
<li><b>네이버 검색광고 API</b> 에서 키를 발급하면 <b>액세스라이선스</b>와 <b>비밀키</b>가 나옵니다.</li>
<li><b>CUSTOMER_ID</b> 는 같은 화면에 적힌 숫자입니다. 이메일이 아닙니다.</li>
</ol>
<form method="post" action="/admin/keywords/save" autocomplete="off">
<div class="fields">
${field("ad_api_key", "액세스라이선스", creds.ad.apiKey ? `등록됨 · ${MASK(creds.ad.apiKey)}` : "")}
${field("ad_secret_key", "비밀키", creds.ad.secretKey ? "등록됨" : "", { secret: true })}
${field("ad_customer_id", "CUSTOMER_ID", creds.ad.customerId ? `등록됨 · ${esc(creds.ad.customerId)}` : "", {
    hint: "숫자만",
    pattern: "[0-9]+",
  })}
</div>
<p class="note" style="margin:16px 0 12px">브라우저가 자동으로 채워 넣은 값이 있으면 지우고 넣어 주세요.</p>
<button type="submit">저장</button>
<details style="margin-top:22px"><summary>개발자센터 키도 넣기 (선택)</summary>
<p class="note" style="margin:12px 0">블로그 문서 수를 함께 보여주는 용도입니다. 없어도 검색량 조회는 됩니다.
developers.naver.com 에서 발급합니다.</p>
${openKeys}</details>
</form></div>`;

  // 조회 화면. 키가 다 있으면 여기가 화면의 전부입니다.
  const search = `<div class="box">
<h2>검색량 조회</h2>
<p class="note">키워드를 쉼표로 구분해 한 번에 5개까지. 네이버가 연관 키워드도 함께 돌려줍니다.</p>
<form method="get" class="row">
<input name="q" value="${esc(query)}" placeholder="애니어그램 테스트, 도파민 중독 테스트, 성향 테스트" required autocomplete="off">
<button type="submit">조회</button></form></div>
${table}
<details class="box"><summary>API 키 바꾸기</summary>
<form method="post" action="/admin/keywords/save" autocomplete="off" style="margin-top:16px">
<div class="fields">
${field("ad_api_key", "액세스라이선스", `등록됨 · ${MASK(creds.ad.apiKey)}`)}
${field("ad_secret_key", "비밀키", "등록됨", { secret: true })}
${field("ad_customer_id", "CUSTOMER_ID", `등록됨 · ${esc(creds.ad.customerId)}`, { hint: "숫자만", pattern: "[0-9]+" })}
</div>
<h2 style="margin:24px 0 4px">개발자센터 키 (선택)</h2>
<p class="note">블로그 문서 수 조회용입니다.</p>
${openKeys}
<p class="note" style="margin:16px 0 12px">빈 칸은 기존 값을 그대로 둡니다.</p>
<button type="submit">저장</button></form></details>`;

  return shell(
    "키워드 조회",
    `<div class="wrap">
<div class="head"><div><h1>키워드 조회</h1><p>네이버 검색광고 키워드도구</p></div>
<nav class="ranges"><a href="/admin/">접속 현황</a><a href="/admin/trends/">트렌드</a><a href="/admin/coupang/">쿠팡</a></nav></div>

${saved ? `<p class="ok">저장했습니다.</p>` : ""}
${error ? `<div class="box"><p class="err" style="margin:0">${esc(error)}</p></div>` : ""}

${hasAd ? search : setup}
</div>`,
  );
}

/** /admin 요청이면 응답을 돌려주고, 아니면 null 을 돌려줘 Next 라우터로 넘깁니다. */
export async function handleAdmin(request: Request, url: URL, db: D1Database | undefined): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/admin" && !path.startsWith("/admin/")) return null;

  if (!db) return html(noDatabasePage());

  try {
    await ensureSchema(db);
  } catch (error) {
    return html(
      shell(
        "관리자",
        `<div class="wrap"><h1>데이터베이스를 준비하지 못했습니다</h1><p class="note">${esc(
          error instanceof Error ? error.message : String(error),
        )}</p></div>`,
      ),
    );
  }

  // 마이그레이션이 적용되지 않은 데이터베이스에는 관리자 행이 없습니다.
  // 그때는 로그인 대신 최초 1회 비밀번호 설정 화면을 보여줍니다.
  const account = await db.prepare("SELECT 1 AS ok FROM admin_user WHERE id = 1").first<{ ok: number }>();
  if (!account) {
    if (request.method === "POST" && path === "/admin/setup") {
      const password = String((await request.formData()).get("password") ?? "");
      if (password.length < 10) return redirect("/admin/?error=1");
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
      // 경쟁 상태에서 두 번 만들어지지 않도록 없을 때만 넣습니다.
      await db
        .prepare(
          `INSERT INTO admin_user (id, salt, password_hash)
           SELECT 1, ?, ? WHERE NOT EXISTS (SELECT 1 FROM admin_user WHERE id = 1)`,
        )
        .bind(salt, await derive(password, salt))
        .run();
      return redirect("/admin/");
    }
    return html(setupPage(url.searchParams.get("error") === "1"));
  }

  if (request.method === "POST") {
    const form = await request.formData();

    if (path === "/admin/login") {
      const row = await db.prepare("SELECT salt, password_hash FROM admin_user WHERE id = 1").first<{ salt: string; password_hash: string }>();
      const ok = row ? constantEquals(await derive(String(form.get("password") ?? ""), row.salt), row.password_hash) : false;
      if (!ok) return redirect("/admin/?error=1");

      const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
      await db.prepare("INSERT INTO admin_session (token, expires_at) VALUES (?, ?)").bind(token, Date.now() + SESSION_HOURS * 3600_000).run();
      await db.prepare("DELETE FROM admin_session WHERE expires_at < ?").bind(Date.now()).run();
      return redirect("/admin/", {
        "set-cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/admin; Max-Age=${SESSION_HOURS * 3600}`,
      });
    }

    if (path === "/admin/logout") {
      const token = readCookie(request, COOKIE);
      if (token) await db.prepare("DELETE FROM admin_session WHERE token = ?").bind(token).run();
      return redirect("/admin/", { "set-cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/admin; Max-Age=0` });
    }

    if (path === "/admin/coupang/save") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      for (const [key, formKey] of [["coupang_access_key", "access_key"], ["coupang_secret_key", "secret_key"]]) {
        const value = String(form.get(formKey) ?? "").trim();
        if (value) await writeSetting(db, key, value);
      }
      return redirect("/admin/coupang/?saved=1");
    }

    if (path === "/admin/coupang/channel") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      // 키와 달리 빈 값도 그대로 저장합니다. 잘못 넣은 채널을 지울 수 있어야
      // 하고, 폼이 따로라 실수로 다른 값을 덮어쓸 일이 없습니다.
      await writeSetting(db, "coupang_sub_id", String(form.get("sub_id") ?? "").trim().slice(0, 50));
      return redirect("/admin/coupang/?saved=1");
    }

    if (path === "/admin/trends/hub") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      const keyId = cleanKey(String(form.get("hub_key_id") ?? ""));
      const key = cleanKey(String(form.get("hub_key") ?? ""));
      if (keyId && key) {
        await writeSetting(db, "naver_hub_key_id", keyId);
        await writeSetting(db, "naver_hub_key", key);
      }
      return redirect("/admin/trends/?refresh=1&saved=1");
    }

    if (path === "/admin/trends/save") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      const list = String(form.get("keywords") ?? "")
        .split(/[\n,]/)
        .map((word) => word.trim())
        .filter(Boolean)
        .slice(0, 20);
      await writeSetting(db, "trend_keywords", list.join("\n"));
      return redirect("/admin/trends/?saved=1");
    }

    if (path === "/admin/keywords/save") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      const pairs: Array<[string, string]> = [
        ["naver_ad_api_key", String(form.get("ad_api_key") ?? "")],
        ["naver_ad_secret_key", String(form.get("ad_secret_key") ?? "")],
        ["naver_ad_customer_id", String(form.get("ad_customer_id") ?? "")],
        ["naver_client_id", String(form.get("client_id") ?? "")],
        ["naver_client_secret", String(form.get("client_secret") ?? "")],
        ["naver_hub_key_id", cleanKey(String(form.get("hub_key_id") ?? ""))],
        ["naver_hub_key", cleanKey(String(form.get("hub_key") ?? ""))],
      ];
      // CUSTOMER_ID 는 숫자입니다. 브라우저 자동완성이 이메일을 넣어두는 일이
      // 잦아서, 형식이 다르면 저장하지 않고 이유를 알려줍니다.
      const customerId = String(form.get("ad_customer_id") ?? "").trim();
      if (customerId && !/^\d+$/.test(customerId)) return redirect("/admin/keywords/?err=customer");

      // 빈 칸은 기존 값을 지우지 않습니다.
      for (const [key, value] of pairs) if (value.trim()) await writeSetting(db, key, value.trim());
      return redirect("/admin/keywords/?saved=1");
    }

    if (path === "/admin/password") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      const current = String(form.get("current") ?? "");
      const next = String(form.get("next") ?? "");
      const row = await db.prepare("SELECT salt, password_hash FROM admin_user WHERE id = 1").first<{ salt: string; password_hash: string }>();
      const ok = row && next.length >= 10 && constantEquals(await derive(current, row.salt), row.password_hash);
      if (!ok) return redirect("/admin/?changed=0");
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
      await db.prepare("UPDATE admin_user SET salt = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1")
        .bind(salt, await derive(next, salt)).run();
      return redirect("/admin/?changed=1");
    }

    return redirect("/admin/");
  }

  if (!(await isSignedIn(request, db))) return html(loginPage(url.searchParams.get("error") === "1"));

  if (path === "/admin/coupang") {
    const creds: CoupangCreds = {
      accessKey: await readSetting(db, "coupang_access_key"),
      secretKey: await readSetting(db, "coupang_secret_key"),
    };
    const subId = await readSetting(db, "coupang_sub_id");
    const asked = Number(url.searchParams.get("days"));
    const days = [7, MAX_REPORT_DAYS].includes(asked) ? asked : 7;
    const query = url.searchParams.get("q") ?? "";
    const showOrders = url.searchParams.get("orders") === "1";

    let links: Deeplink[] = [];
    let rows: CommissionRow[] = [];
    let orders: ReportRow[] = [];
    let error = "";

    if (creds.accessKey && creds.secretKey) {
      const to = reportDay(new Date());
      const from = reportDay(new Date(Date.now() - (days - 1) * 86400000));
      // 서로 독립이라 하나가 실패해도 나머지는 보여줍니다. 실적은 채널을
      // 걸러 받지 않습니다 — 전부 받아야 채널별로 나눠 볼 수 있습니다.
      const [commission, deep, orderRows] = await Promise.allSettled([
        fetchReport(creds, "commission", from, to),
        query.trim() ? createDeeplinks(creds, [searchUrl(query.trim())], subId) : Promise.resolve([]),
        showOrders ? fetchReport(creds, "orders", from, to) : Promise.resolve([]),
      ]);

      if (commission.status === "fulfilled") rows = commission.value as CommissionRow[];
      else error = commission.reason instanceof Error ? commission.reason.message : "실적 조회에 실패했습니다.";

      if (deep.status === "fulfilled") links = deep.value;
      else if (!error) error = deep.reason instanceof Error ? deep.reason.message : "링크 생성에 실패했습니다.";

      if (orderRows.status === "fulfilled") orders = orderRows.value;
      else if (!error) error = orderRows.reason instanceof Error ? orderRows.reason.message : "주문 상세 조회에 실패했습니다.";
    }

    return html(
      coupangPage({
        creds,
        subId,
        days,
        query,
        links,
        rows,
        orders,
        showOrders,
        error,
        saved: url.searchParams.get("saved") === "1",
      }),
    );
  }

  if (path === "/admin/trends") {
    const creds = await loadCreds(db);
    const stored = await readSetting(db, "trend_keywords");
    const keywords = stored ? stored.split("\n").filter(Boolean) : DEFAULT_TREND_KEYWORDS;
    const hasOpen = hasTrendKeys(creds.open, creds.hub);

    let rows: TrendRow[] = [];
    let error = "";
    let fetchedAt = 0;

    if (hasOpen) {
      // 데이터랩은 하루 단위로 갱신되므로 한 시간은 저장해 둔 값을 씁니다.
      // 화면을 열 때마다 부르면 느린 데다 일일 한도를 그냥 깎아먹습니다.
      const cached = readCache(await readSetting(db, "trend_cache"), keywords);
      const forced = url.searchParams.get("refresh") === "1";

      if (cached && !forced) {
        rows = cached.rows;
        fetchedAt = cached.at;
      } else {
        try {
          rows = await fetchTrend(creds.open, creds.hub, keywords);
          fetchedAt = Date.now();
          await writeSetting(db, "trend_cache", JSON.stringify({ at: fetchedAt, keywords: keywords.join("\n"), rows }));
        } catch (e) {
          error = e instanceof Error ? e.message : "조회에 실패했습니다.";
          // 새로 못 받았으면 오래된 값이라도 보여줍니다.
          const stale = readCache(await readSetting(db, "trend_cache"), keywords, Infinity);
          if (stale) {
            rows = stale.rows;
            fetchedAt = stale.at;
          }
        }
      }
    }
    return html(trendsPage(rows, keywords, error, hasOpen, url.searchParams.get("saved") === "1", fetchedAt, { idLen: creds.hub.keyId.length, keyLen: creds.hub.key.length }));
  }

  if (path === "/admin/keywords") {
    const creds = await loadCreds(db);
    const query = url.searchParams.get("q") ?? "";
    let rows: KeywordRow[] = [];
    let error =
      url.searchParams.get("err") === "customer"
        ? "CUSTOMER_ID 는 숫자만 넣을 수 있습니다. 브라우저가 채운 이메일 주소가 아닌지 확인해 주세요. 다른 값은 저장되지 않았습니다."
        : "";
    if (query.trim() && creds.ad.apiKey) {
      try {
        const words = query.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
        rows = await fetchKeywordStats(creds.ad, words);
        if (creds.open.clientId) {
          // 상위 20개만 문서 수를 덧붙입니다. 호출이 많아지면 느려집니다.
          rows = await Promise.all(
            rows.slice(0, 20).map(async (row) => ({ ...row, documents: await fetchDocumentCount(creds.open, row.keyword) })),
          );
        }
        rows.sort((a, b) => b.total - a.total);
      } catch (e) {
        error = e instanceof Error ? e.message : "조회에 실패했습니다.";
      }
    }
    return html(keywordsPage(creds, query, rows, error, url.searchParams.get("saved") === "1"));
  }

  const days = [1, 7, 30, 90].includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 7;
  const changed = url.searchParams.get("changed");
  return html(await dashboard(db, days, changed === "1" ? "ok" : changed === "0" ? "fail" : "", parseRange(url)));
}
