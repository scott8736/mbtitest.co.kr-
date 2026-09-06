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
import { fetchDocumentCount, fetchKeywordStats, loadCreds, writeSetting, type KeywordRow } from "./naver";
import { ensureSchema } from "./schema";

const COOKIE = "mbtitest_admin";
const ITERATIONS = 150_000;
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
.ghost button{background:#e9e6f2;color:#4b4560}
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

  const peak = Math.max(1, ...daily.map((d) => d.views));
  const ranges = [1, 7, 30, 90]
    .map((d) => `<a href="/admin/?days=${d}" class="${d === days ? "on" : ""}">${d === 1 ? "오늘" : `${d}일`}</a>`)
    .join("");

  return shell(
    "접속 현황",
    `<div class="wrap">
<div class="head"><div><h1>접속 현황</h1><p>${from} ~ ${to} (KST)</p></div><nav class="ranges">${ranges}<a href="/admin/keywords/">키워드 조회</a></nav></div>

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
<p class="note">검사가 단계별로 주소가 나뉘어 있어 어디서 그만두는지 보입니다.</p>${
      steps.length === 0
        ? `<p class="empty">아직 기록이 없습니다.</p>`
        : `<div class="scroll"><table><thead><tr><th>테스트</th><th>시작</th><th>2단계</th><th>결과</th><th>완주율</th></tr></thead><tbody>${steps
            .map(
              (s) =>
                `<tr><td>${esc(s.slug)}</td><td>${s.intro}</td><td>${s.step2}</td><td>${s.result}</td><td>${s.intro ? Math.round((s.result / s.intro) * 100) + "%" : "-"}</td></tr>`,
            )
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


const MASK = (v: string) => (v ? `${v.slice(0, 4)}${"•".repeat(Math.max(0, v.length - 8))}${v.slice(-4)}` : "");

const num = (v: number) => (v < 0 ? "10 미만" : v.toLocaleString());

function keywordsPage(
  creds: { ad: { apiKey: string; secretKey: string; customerId: string }; open: { clientId: string; clientSecret: string } },
  query: string,
  rows: KeywordRow[],
  error: string,
  saved: boolean,
): string {
  const hasAd = Boolean(creds.ad.apiKey && creds.ad.secretKey && creds.ad.customerId);

  const table = rows.length
    ? `<div class="scroll"><table><thead><tr>
<th>키워드</th><th>PC</th><th>모바일</th><th>월 검색수</th><th>경쟁</th><th>블로그 문서</th><th>문서/검색</th>
</tr></thead><tbody>${rows
        .map((r) => {
          const ratio = r.documents !== null && r.total > 0 ? (r.documents / r.total).toFixed(1) : "-";
          return `<tr><td>${esc(r.keyword)}</td><td>${num(r.pc)}</td><td>${num(r.mobile)}</td>
<td><b>${num(r.total)}</b></td><td>${esc(r.competition)}</td>
<td>${r.documents === null ? "-" : r.documents.toLocaleString()}</td><td>${ratio}</td></tr>`;
        })
        .join("")}</tbody></table></div>
<p class="note">검색수가 크고 <b>문서/검색 비율이 낮을수록</b> 비집고 들어갈 틈이 큽니다. 경쟁이 &lsquo;낮음&rsquo;이면서 검색수가 있는 키워드가 가장 좋습니다.</p>`
    : "";

  return shell(
    "키워드 조회",
    `<div class="wrap">
<div class="head"><div><h1>키워드 조회</h1><p>네이버 검색광고 키워드도구</p></div>
<nav class="ranges"><a href="/admin/">접속 현황</a></nav></div>

${saved ? `<p class="ok">저장했습니다.</p>` : ""}
${error ? `<div class="box"><p class="err">${esc(error)}</p></div>` : ""}

${
      hasAd
        ? `<div class="box"><h2>검색량 조회</h2>
<p class="note">한 번에 5개까지 조회되며, 네이버가 연관 키워드도 함께 돌려줍니다.</p>
<form method="get" class="row">
<input name="q" value="${esc(query)}" placeholder="에겐테토 테스트, 자존감 테스트, 번아웃" required>
<button type="submit">조회</button></form></div>
${table}`
        : `<div class="box"><p class="note">검색광고 API 키를 먼저 등록해 주세요.</p></div>`
    }

<div class="box"><h2>API 키</h2>
<p class="note">
저장소에는 남지 않고 데이터베이스에만 보관됩니다. 다만 암호화하지 않으므로 데이터베이스를 볼 수 있는 사람은 값을 확인할 수 있습니다.
<br>검색광고 키는 <b>광고관리시스템 → 도구 → API 사용 관리</b>에서, 아래 개발자센터 키는 선택 사항입니다(블로그 문서 수 조회용).
</p>
<form method="post" action="/admin/keywords/save">
<div class="row" style="margin-bottom:8px">
<input name="ad_api_key" placeholder="검색광고 액세스라이선스${creds.ad.apiKey ? ` (현재 ${MASK(creds.ad.apiKey)})` : ""}">
<input name="ad_secret_key" type="password" placeholder="검색광고 비밀키${creds.ad.secretKey ? " (등록됨)" : ""}">
<input name="ad_customer_id" placeholder="CUSTOMER_ID${creds.ad.customerId ? ` (현재 ${esc(creds.ad.customerId)})` : ""}">
</div>
<div class="row">
<input name="client_id" placeholder="개발자센터 Client ID (선택)${creds.open.clientId ? ` (현재 ${MASK(creds.open.clientId)})` : ""}">
<input name="client_secret" type="password" placeholder="개발자센터 Client Secret (선택)${creds.open.clientSecret ? " (등록됨)" : ""}">
<button type="submit">저장</button></div>
<p class="note" style="margin-top:10px">빈 칸은 기존 값을 그대로 둡니다.</p>
</form></div>
</div>`,
  );
}

/** /admin 요청이면 응답을 돌려주고, 아니면 null 을 돌려줘 Next 라우터로 넘깁니다. */
export async function handleAdmin(request: Request, url: URL, db: D1Database | undefined): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/admin" && !path.startsWith("/admin/")) return null;

  if (!db) return html(shell("관리자", `<div class="wrap"><h1>데이터베이스 연결 없음</h1><p class="note">D1 바인딩 DB 가 아직 붙지 않았습니다.</p></div>`));

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

    if (path === "/admin/keywords/save") {
      if (!(await isSignedIn(request, db))) return redirect("/admin/");
      const pairs: Array<[string, string]> = [
        ["naver_ad_api_key", String(form.get("ad_api_key") ?? "")],
        ["naver_ad_secret_key", String(form.get("ad_secret_key") ?? "")],
        ["naver_ad_customer_id", String(form.get("ad_customer_id") ?? "")],
        ["naver_client_id", String(form.get("client_id") ?? "")],
        ["naver_client_secret", String(form.get("client_secret") ?? "")],
      ];
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

  if (path === "/admin/keywords") {
    const creds = await loadCreds(db);
    const query = url.searchParams.get("q") ?? "";
    let rows: KeywordRow[] = [];
    let error = "";
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
