#!/usr/bin/env node
/**
 * 「내 성향 신문」(1,900원, 2026-10-25) 견본 폴더 → 저장소 동기화 + 원고 암호화.
 *
 *   node scripts/sync-news.mjs            # 기본 견본 폴더: ../news_design
 *   node scripts/sync-news.mjs <견본폴더>
 *
 * 하는 일 (원고·틀이 바뀌면 그냥 다시 돌리면 됩니다 — 저장소 쪽 파일은 손으로 고치지 않습니다)
 *   1. content/<유형>.js (window.NEWS = {...}) 를 읽어 AES-256-GCM 으로 잠가 report/news/<유형>.json 에 둡니다.
 *      키는 책과 같은 D:/00 cloud/report_content.key (서버는 D1 app_settings.report_content_key 로 풉니다).
 *      평문이 그대로면 기존 암호문을 건드리지 않습니다(git 에 쓸데없는 변경이 안 생기게).
 *   2. report/news/index.ts 를 만듭니다(NEWS_SEALED·NEWS_READY_TYPES). 원고 + 그림 3장이 다 있는 유형만 「준비됨」.
 *   3. news.js 를 public/news-app/news.js 로 그대로 복사하고, news.html 은 맨 아래 원고 불러오는 부분만
 *      「주문 열쇠로 /api/report/news 에서 받기」로 바꿔 public/news-app/index.html 로 씁니다(HTML 주석은 뺍니다).
 *   4. img/<유형>/{front,love,work}.jpg 를 public/news-app/img/<유형>/ 로 복사합니다(글자 없는 삽화라 공개 경로).
 *
 * 키 값은 어디에도 출력하지 않습니다.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(process.argv[2] ?? join(repo, "..", "news_design"));
const KEY_FILE = process.env.REPORT_CONTENT_KEY_FILE ?? "D:/00 cloud/report_content.key";
const TYPES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
const IMGS = ["front", "love", "work"];
const SEALED_DIR = join(repo, "report", "news");
const APP_DIR = join(repo, "public", "news-app");

const fail = (m) => {
  console.error(`[sync-news] ${m}`);
  process.exit(1);
};
if (!existsSync(join(src, "news.html")) || !existsSync(join(src, "news.js"))) fail(`견본 폴더에 news.html·news.js 가 없습니다: ${src}`);
if (!existsSync(KEY_FILE)) fail(`해독 키 파일이 없습니다(책 sync_report.py 가 만든 것과 같은 파일): ${KEY_FILE}`);
const key = Buffer.from(readFileSync(KEY_FILE, "ascii").trim(), "base64");
if (key.length !== 32) fail("해독 키 길이가 32바이트가 아닙니다.");

/** content/<유형>.js 를 브라우저 없이 실행해 window.NEWS 를 꺼냅니다. */
function readNews(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(file, "utf8"), sandbox, { filename: file, timeout: 2000 });
  return sandbox.window.NEWS;
}

function seal(text) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(text, "utf8"), c.final(), c.getAuthTag()]);
  return { iv: iv.toString("base64"), ct: ct.toString("base64") };
}

function unseal(sealed) {
  try {
    const raw = Buffer.from(sealed.ct, "base64");
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(sealed.iv, "base64"));
    d.setAuthTag(raw.subarray(raw.length - 16));
    return Buffer.concat([d.update(raw.subarray(0, raw.length - 16)), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

mkdirSync(SEALED_DIR, { recursive: true });
const ready = [];
const report = [];
for (const t of TYPES) {
  const file = join(src, "content", `${t}.js`);
  if (!existsSync(file)) continue;
  let news;
  try {
    news = readNews(file);
  } catch (e) {
    report.push(`${t}: 원고 실행 오류 — 건너뜀 (${e.message})`);
    continue;
  }
  if (!news || news.code !== t) {
    report.push(`${t}: window.NEWS 가 없거나 code 가 ${t} 가 아님 — 건너뜀`);
    continue;
  }
  const missing = IMGS.filter((k) => !existsSync(join(src, "img", t, `${k}.jpg`))).map((k) => `${k}.jpg`);
  // 결제 폼 1면 견본(news_design/sample.py). 동의 문구 「무료 미리보기로 내용도 봤어요」가 신문에도 사실이 되게 필수.
  if (!existsSync(join(src, "sample", `${t}.jpg`))) missing.push("견본 sample");
  if (missing.length) {
    report.push(`${t}: ${missing.join("·")} 없음 — 아직 판매 안 함`);
    continue;
  }
  const plain = JSON.stringify(news);
  const out = join(SEALED_DIR, `${t}.json`);
  const prev = existsSync(out) ? unseal(JSON.parse(readFileSync(out, "utf8"))) : null;
  if (prev !== plain) writeFileSync(out, JSON.stringify(seal(plain)) + "\n");
  const imgDir = join(APP_DIR, "img", t);
  mkdirSync(imgDir, { recursive: true });
  for (const k of IMGS) copyFileSync(join(src, "img", t, `${k}.jpg`), join(imgDir, `${k}.jpg`));
  mkdirSync(join(APP_DIR, "sample"), { recursive: true });
  copyFileSync(join(src, "sample", `${t}.jpg`), join(APP_DIR, "sample", `${t}.jpg`));
  ready.push(t);
  report.push(`${t}: ${prev === plain ? "그대로" : prev === null ? "새로 잠금" : "바뀐 원고 다시 잠금"} · 그림 3장·견본 복사`);
}

// 견본에서 빠진 유형의 옛 암호문·그림은 지웁니다(index.ts 에서도 빠지므로 판매되지 않음).
for (const f of readdirSync(SEALED_DIR)) {
  const t = f.replace(/\.json$/, "");
  if (f.endsWith(".json") && TYPES.includes(t) && !ready.includes(t)) {
    rmSync(join(SEALED_DIR, f));
    rmSync(join(APP_DIR, "img", t), { recursive: true, force: true });
    rmSync(join(APP_DIR, "sample", `${t}.jpg`), { force: true });
    report.push(`${t}: 견본에 없어 저장소에서 뺌`);
  }
}

writeFileSync(
  join(SEALED_DIR, "index.ts"),
  [
    "// scripts/sync-news.mjs 가 만든 파일입니다. 손으로 고치지 마세요. 내용은 암호문입니다(worker/report-news.ts 가 푼다).",
    'import type { Sealed } from "../content/index";',
    ...ready.map((t) => `import ${t} from "./${t}.json";`),
    "",
    `export const NEWS_SEALED: Record<string, Sealed> = { ${ready.join(", ")} };`,
    "",
  ].join("\n"),
);

// 화면(결제 폼)용 목록. 암호문을 화면 번들에 끌어들이지 않으려고 따로 둡니다.
writeFileSync(
  join(SEALED_DIR, "ready.ts"),
  `// scripts/sync-news.mjs 가 만든 파일입니다. 신문 원고·그림이 다 올라간 유형 목록(화면용).\nexport const NEWS_READY_TYPES: readonly string[] = ${JSON.stringify(ready)};\n`,
);

// ── 틀·조판 복사 ──
mkdirSync(APP_DIR, { recursive: true });
copyFileSync(join(src, "news.js"), join(APP_DIR, "news.js"));

const LOADER = `<script id="content"></script>
<script>
// scripts/sync-news.mjs 가 넣은 부분. 주문 열쇠(?t=)로 결제된 신문 원고를 서버에서 받는다(원고는 이 폴더에 없다).
(function () {
  var app = document.getElementById("app");
  var say = function (m) { app.innerHTML = '<p style="margin:60px 20px;text-align:center;font:15px/1.7 \\'Noto Sans KR\\',sans-serif;color:#3a3328">' + m + '</p>'; };
  var q0 = new URLSearchParams(location.search);
  var t = q0.get("t") || q0.get("o") || "";
  if (!/^[0-9a-f]{64}$/.test(t)) { say("주소가 올바르지 않아요. 결제 완료 화면의 링크나 「주문 다시 찾기」로 열어 주세요."); return; }
  say("신문을 찍는 중이에요…");
  fetch("/api/report/news?o=" + t, { cache: "no-store" })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (res) {
      if (!res.ok) {
        if (res.j && res.j.product === "book") { location.replace("/report-app/?o=" + t); return; }
        say((res.j && res.j.error) || "신문을 불러오지 못했어요."); return;
      }
      var p = res.j.params, q = new URLSearchParams();
      Object.keys(p).forEach(function (k) { if (p[k] !== "" && p[k] !== null && p[k] !== undefined) q.set(k, String(p[k])); });
      window.PARAMS = q.toString();
      window.NEWS = res.j.news;
      // 이 기기에 기억 — /report/find/ 의 「이 기기에서 연 리포트」(components/ReportDone.tsx 와 같은 열쇠 이름)
      try {
        var KEY = "mori-reports", list = JSON.parse(localStorage.getItem(KEY) || "[]");
        if (!Array.isArray(list)) list = [];
        list = [{ token: t, orderNo: res.j.orderNo, type: p.type, product: "news", at: new Date().toISOString() }].concat(list.filter(function (r) { return r && r.token !== t; })).slice(0, 10);
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch (e) { /* 기억 못 해도 휴대폰 번호로 찾을 수 있다 */ }
      var s = document.createElement("script");
      s.src = "news.js";
      s.onerror = function () { say("신문을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요."); };
      document.body.appendChild(s);
    })
    .catch(function () { say("신문을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요."); });
})();
</script>`;

let html = readFileSync(join(src, "news.html"), "utf8");
const loaderRe = /<script id="content"><\/script>\s*<script>[\s\S]*?<\/script>/;
if (!loaderRe.test(html)) fail('news.html 에서 <script id="content"></script> 뒤의 불러오기 스크립트를 찾지 못했습니다. 틀이 바뀌었으면 이 스크립트의 loaderRe 를 고치세요.');
html = html.replace(loaderRe, () => LOADER).replace(/<!--[\s\S]*?-->\s*/g, "");
if (!/name="robots" content="noindex/.test(html)) html = html.replace("<head>", '<head>\n<meta name="robots" content="noindex,nofollow">');
writeFileSync(join(APP_DIR, "index.html"), html);

console.log(`[sync-news] 견본 ${src}`);
for (const line of report) console.log(`  ${line}`);
console.log(`[sync-news] 판매 가능 ${ready.length}개: ${ready.join(", ") || "(없음)"}`);
console.log("[sync-news] public/news-app/index.html · news.js 갱신");
