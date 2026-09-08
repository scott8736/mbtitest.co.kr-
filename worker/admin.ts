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
import { SOURCE_LABELS } from "../lib/analytics";
import {
  DEFAULT_TREND_KEYWORDS,
  fetchDocumentCount,
  fetchKeywordStats,
  fetchTrend,
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

async function dashboard(db: D1Database, days: number, notice: string): Promise<string> {
  const to = seoulDay();
  const from = seoulDay(new Date(Date.now() - (days - 1) * 86400000));
  const q = async <T,>(sql: string, ...b: unknown[]) =>
    ((await db.prepare(sql).bind(...b).all<T>()).results ?? []) as T[];

  const total =
    (await db
      .prepare(
        `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors, COUNT(DISTINCT day) AS days
           FROM page_views WHERE day BETWEEN ? AND ?`,
      )
      .bind(from, to)
      .first<{ views: number; visitors: number; days: number }>()) ?? { views: 0, visitors: 0, days: 0 };

  const daily = await q<{ day: string; views: number; visitors: number }>(
    `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
       FROM page_views WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day`, from, to);
  const sources = await q<{ key: string; views: number }>(
    `SELECT source AS key, COUNT(*) AS views FROM page_views WHERE day BETWEEN ? AND ?
      GROUP BY source ORDER BY views DESC`, from, to);
  const devices = await q<{ key: string; views: number }>(
    `SELECT device AS key, COUNT(*) AS views FROM page_views WHERE day BETWEEN ? AND ?
      GROUP BY device ORDER BY views DESC`, from, to);
  const paths = await q<{ key: string; views: number }>(
    `SELECT path AS key, COUNT(*) AS views FROM page_views WHERE day BETWEEN ? AND ?
      GROUP BY path ORDER BY views DESC LIMIT 20`, from, to);
  const countries = await q<{ key: string; views: number }>(
    `SELECT CASE WHEN country='' THEN '알 수 없음' ELSE country END AS key, COUNT(*) AS views
       FROM page_views WHERE day BETWEEN ? AND ? GROUP BY key ORDER BY views DESC LIMIT 10`, from, to);
  const referrers = await q<{ key: string; views: number }>(
    `SELECT referrer AS key, COUNT(*) AS views FROM page_views
      WHERE day BETWEEN ? AND ? AND referrer<>'' AND source<>'internal'
      GROUP BY referrer ORDER BY views DESC LIMIT 15`, from, to);
  // MBTI 는 결과 주소가 /mbti-result/ 라 /tests/... 패턴 밖에 있어 따로 묶어줍니다.
  const steps = await q<{ slug: string; intro: number; step2: number; result: number }>(
    `WITH stages AS (
       SELECT
         CASE WHEN path = '/mbti-result/'        THEN 'mbti'
              WHEN path LIKE '/tests/%/step2/'   THEN substr(path, 8, length(path)-14)
              WHEN path LIKE '/tests/%/result/'  THEN substr(path, 8, length(path)-15)
              WHEN path LIKE '/tests/%/'         THEN substr(path, 8, length(path)-8)
         END AS slug,
         CASE WHEN path = '/mbti-result/'  THEN 'result'
              WHEN path LIKE '%/step2/'    THEN 'step2'
              WHEN path LIKE '%/result/'   THEN 'result'
              ELSE 'intro' END AS stage
       FROM page_views
       WHERE day BETWEEN ? AND ? AND (path LIKE '/tests/%/' OR path = '/mbti-result/')
     )
     SELECT slug,
            SUM(CASE WHEN stage='intro'  THEN 1 ELSE 0 END) AS intro,
            SUM(CASE WHEN stage='step2'  THEN 1 ELSE 0 END) AS step2,
            SUM(CASE WHEN stage='result' THEN 1 ELSE 0 END) AS result
       FROM stages WHERE slug IS NOT NULL AND slug <> ''
      GROUP BY slug HAVING intro > 0 ORDER BY intro DESC LIMIT 15`, from, to);

  // 첫 문항에 답한 수. 방문만 하고 나간 사람과 풀다 그만둔 사람을 가릅니다.
  const answered = await q<{ slug: string; count: number }>(
    `SELECT slug, COUNT(*) AS count FROM test_events
      WHERE day BETWEEN ? AND ? AND name = 'answered'
      GROUP BY slug`, from, to);
  const answeredBySlug = new Map(answered.map((row) => [row.slug, row.count]));

  const peak = Math.max(1, ...daily.map((d) => d.views));
  const ranges = [1, 7, 30, 90]
    .map((d) => `<a href="/admin/?days=${d}" class="${d === days ? "on" : ""}">${d === 1 ? "오늘" : `${d}일`}</a>`)
    .join("");

  return shell(
    "접속 현황",
    `<div class="wrap">
<div class="head"><div><h1>접속 현황</h1><p>${from} ~ ${to} (KST)</p></div><nav class="ranges">${ranges}<a href="/admin/trends/">트렌드</a><a href="/admin/keywords/">키워드 조회</a><a href="/admin/coupang/">쿠팡</a></nav></div>

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
「방문」은 검사 화면이 열린 수이고 「첫 응답」은 문항 하나라도 답한 수입니다. 둘의 차이가 크면 첫인상 문제,
「첫 응답 → 결과」가 낮으면 길이 문제입니다. 고칠 곳이 서로 달라 나눠 셉니다.
<br>첫 응답은 2026-09-07 부터 쌓기 시작했으므로 그 이전 기간에는 「-」로 나옵니다.
</p>${
      steps.length === 0
        ? `<p class="empty">아직 기록이 없습니다.</p>`
        : `<div class="scroll"><table><thead><tr><th>테스트</th><th>방문</th><th>첫 응답</th><th>2단계</th><th>결과</th><th>응답 시작률</th><th>완주율</th></tr></thead><tbody>${steps
            .map((s) => {
              const began = answeredBySlug.get(s.slug) ?? 0;
              const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) + "%" : "-");
              return `<tr><td>${esc(s.slug)}</td><td>${s.intro}</td><td>${began || "-"}</td><td>${s.step2}</td><td>${s.result}</td>
<td>${began ? pct(began, s.intro) : "-"}</td><td>${began ? pct(s.result, began) : pct(s.result, s.intro) + " (방문 기준)"}</td></tr>`;
            })
            .join("")}</tbody></table></div>`
    }</div>

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
): string {
  const sorted = [...rows].sort((a, b) => (b.change ?? -999) - (a.change ?? -999));

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
</div>`;

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
    const hasOpen = Boolean(creds.open.clientId && creds.open.clientSecret);

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
          rows = await fetchTrend(creds.open, keywords);
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
    return html(trendsPage(rows, keywords, error, hasOpen, url.searchParams.get("saved") === "1", fetchedAt));
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
  return html(await dashboard(db, days, changed === "1" ? "ok" : changed === "0" ? "fail" : ""));
}
