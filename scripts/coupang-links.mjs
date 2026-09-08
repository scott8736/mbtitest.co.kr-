#!/usr/bin/env node
/**
 * MBTI 결과 화면 추천 카드마다 쿠팡 제휴 링크를 만들어 lib/mbti-picks.ts 에
 * 직접 적습니다. scent-of-travel(visitkorea) 의 scripts/coupang-links.mjs 와
 * 같은 구조입니다 — 상품이 아니라 검색 결과로 링크를 걸어, 품절·단종으로
 * 링크가 죽지 않게 합니다.
 *
 *   node scripts/coupang-links.mjs            링크 없는 유형만
 *   node scripts/coupang-links.mjs --all      전부 다시
 *   node scripts/coupang-links.mjs --dry      무엇을 할지만 출력
 *
 * subId 는 lib/affiliate.ts 의 mbtiPickSubId 와 같은 규칙(mbtitest_result_코드)을
 * 씁니다. 여기서 새로 계산하지 않고 그 파일에서 접두사를 그대로 읽습니다 —
 * 어긋나면 링크의 subId 와 /admin/coupang/ 리포트의 subId 가 달라져 실적이
 * 안 잡힙니다.
 *
 * 키는 저장소 루트 coupang.env 나 환경변수에서 읽고, 어디에도 커밋되지 않습니다.
 * 의존성 없음 — HMAC 은 node:crypto 여섯 줄입니다.
 */
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SUBID_PREFIX = (() => {
  const source = fs.readFileSync(path.join(ROOT, "lib", "affiliate.ts"), "utf8");
  const found = source.match(/SUBID_PREFIX = "([^"]+)"/)?.[1];
  if (!found) throw new Error("lib/affiliate.ts 에서 SUBID_PREFIX 를 찾지 못했습니다");
  return found;
})();
const PICKS_FILE = path.join(ROOT, "lib", "mbti-picks.ts");

const args = new Set(process.argv.slice(2));
const REDO = args.has("--all");
const DRY = args.has("--dry");

/* ------------------------------------------------------------------ keys -- */

function credentials() {
  if (process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY)
    return {
      accessKey: process.env.COUPANG_ACCESS_KEY,
      secretKey: process.env.COUPANG_SECRET_KEY,
    };

  const file = path.join(ROOT, "coupang.env");
  if (!fs.existsSync(file)) return null;

  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i > 0) env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env.COUPANG_ACCESS_KEY && env.COUPANG_SECRET_KEY
    ? { accessKey: env.COUPANG_ACCESS_KEY, secretKey: env.COUPANG_SECRET_KEY }
    : null;
}

/* ------------------------------------------------------------------- api -- */

const HOST = "https://api-gateway.coupang.com";
const BASE = "/v2/providers/affiliate_open_api/apis/openapi";
const DEEPLINK = `${BASE}/v1/deeplink`;

/** 쿠팡의 CEA 방식: 날짜 + 메서드 + 경로 + 쿼리('?' 없이) 를 HMAC-SHA256. */
function authorization(creds, method, apiPath, query = "") {
  const t = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const datetime =
    `${String(t.getUTCFullYear()).slice(-2)}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}` +
    `T${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}Z`;
  const signature = createHmac("sha256", creds.secretKey)
    .update(datetime + method.toUpperCase() + apiPath + query)
    .digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${creds.accessKey}, signed-date=${datetime}, signature=${signature}`;
}

async function call(creds, method, apiPath, { body } = {}) {
  const res = await fetch(`${HOST}${apiPath}`, {
    method,
    headers: {
      Authorization: authorization(creds, method, apiPath),
      "Content-Type": "application/json;charset=UTF-8",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json.rCode && json.rCode !== "0"))
    throw new Error(`${res.status} ${json.rCode ?? ""} ${json.rMessage ?? ""}`.trim());
  return json;
}

const searchUrl = (keyword) => `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;

async function makeLink(creds, keyword, subId) {
  const json = await call(creds, "POST", DEEPLINK, {
    body: { coupangUrls: [searchUrl(keyword)], subId },
  });
  const first = json.data?.[0];
  const link = first?.shortenUrl ?? first?.landingUrl;
  if (!link) throw new Error("응답에 링크가 없습니다");
  return link;
}

/* -------------------------------------------------------------- content -- */

/**
 * lib/mbti-picks.ts 는 데이터베이스가 아니라 타입이 붙은 TS 리터럴이라, 정규식으로
 * 항목을 찾아 그 한 줄만 정확히 바꿉니다. 파싱해서 다시 출력하면 주석과 서식이
 * 사라집니다.
 */
function collect(source) {
  const found = [];
  for (const m of source.matchAll(
    /(\b[A-Z]{4}\b): \{\s*label: "([^"]+)",\s*reason: "([^"]*)",?([\s\S]*?)\},/g,
  )) {
    found.push({
      code: m[1],
      label: m[2],
      hasLink: m[4].includes("coupangUrl"),
      subId: `${SUBID_PREFIX}_result_${m[1].toLowerCase()}`,
      raw: m[0],
    });
  }
  return found;
}

function write(source, raw, link) {
  const stripped = raw.replace(/,?\s*coupangUrl:\s*"[^"]*"/, "");
  // 프리티어가 여러 줄로 편 항목은 닫는 괄호 앞에 이미 쉼표가 있습니다. 같이
  // 걷어내지 않으면 `reason: "...",, coupangUrl:` 이 되어 파일이 깨집니다.
  const replaced = stripped.replace(/,?\s*\},$/, `, coupangUrl: ${JSON.stringify(link)} },`);
  if (!source.includes(raw)) throw new Error("항목을 다시 찾지 못했습니다");
  return source.replace(raw, replaced);
}

/* ------------------------------------------------------------------ main -- */

let source = fs.readFileSync(PICKS_FILE, "utf8");
const picks = collect(source);
const todo = REDO ? picks : picks.filter((p) => !p.hasLink);
console.log(`유형 ${picks.length}개 · 링크 만들 것 ${todo.length}개\n`);

if (DRY) {
  for (const p of todo) console.log(`  ${p.subId.padEnd(28)} ${p.label}`);
  process.exit(0);
}

if (todo.length === 0) process.exit(0);

const creds = credentials();
if (!creds) {
  console.error(`키가 없습니다. 저장소 루트에 coupang.env 를 만들고 두 줄을 넣으세요.
파트너스 → 오픈API 에서 발급받은 값입니다. 이 파일은 .gitignore 에 있습니다.

  COUPANG_ACCESS_KEY=액세스키
  COUPANG_SECRET_KEY=시크릿키
`);
  process.exit(1);
}

let ok = 0;
const failed = [];
for (const pick of todo) {
  try {
    const link = await makeLink(creds, pick.label, pick.subId);
    source = write(source, pick.raw, link);
    console.log(`  ✓ ${pick.subId.padEnd(28)} ${pick.label}`);
    ok += 1;
  } catch (error) {
    console.log(`  ✗ ${pick.subId.padEnd(28)} ${pick.label} — ${error.message}`);
    failed.push(pick.label);
  }
  // 호출 한도(딥링크·상품 합쳐 1시간 30회)가 있어 한 박자 쉬어 갑니다.
  await new Promise((r) => setTimeout(r, 400));
}

if (ok > 0) fs.writeFileSync(PICKS_FILE, source, "utf8");

console.log(
  `\n완료 ${ok}개${failed.length ? ` · 실패 ${failed.length}개: ${failed.join(", ")}` : ""}`,
);
if (ok > 0) console.log("lib/mbti-picks.ts 가 수정됐습니다. git diff 로 확인하고 커밋하세요.");
