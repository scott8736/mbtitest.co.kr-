#!/usr/bin/env node
/**
 * MBTI 외 테스트들의 결과 추천 카드마다 쿠팡 제휴 링크를 만들어
 * lib/test-picks.ts 에 직접 적습니다. scripts/coupang-links.mjs(MBTI 전용)와
 * 같은 구조이되, 이 파일은 테스트 slug 로 한 번 더 감싸인 중첩 객체를 다룹니다.
 *
 *   node scripts/test-coupang-links.mjs                링크 없는 항목만
 *   node scripts/test-coupang-links.mjs --all          전부 다시
 *   node scripts/test-coupang-links.mjs --dry           무엇을 할지만 출력
 *   node scripts/test-coupang-links.mjs --limit=12      최대 이 개수만 (호출 한도 관리용)
 *   node scripts/test-coupang-links.mjs --slug=egen-teto  이 테스트만
 *
 * 쿠팡 오픈 API 는 딥링크·상품 검색 합쳐 1시간 30회를 넘기면 24시간 정지되고,
 * 세 번 정지되면 계정이 정지된다(coupang-api-spec 메모). 테스트가 많아 한 번에
 * 다 못 돌리므로 --limit 으로 나눠 돌린다.
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
const PICKS_FILE = path.join(ROOT, "lib", "test-picks.ts");

const args = new Set(process.argv.slice(2));
const REDO = args.has("--all");
const DRY = args.has("--dry");
const limitArg = [...args].find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const slugArg = [...args].find((a) => a.startsWith("--slug="));
const ONLY_SLUG = slugArg ? slugArg.split("=")[1] : null;

/* ------------------------------------------------------------------ keys -- */

function credentials() {
  if (process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY)
    return { accessKey: process.env.COUPANG_ACCESS_KEY, secretKey: process.env.COUPANG_SECRET_KEY };

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
  const json = await call(creds, "POST", DEEPLINK, { body: { coupangUrls: [searchUrl(keyword)], subId } });
  const first = json.data?.[0];
  const link = first?.shortenUrl ?? first?.landingUrl;
  if (!link) throw new Error("응답에 링크가 없습니다");
  return link;
}

/* -------------------------------------------------------------- content -- */

/**
 * lib/test-picks.ts 는 `"slug": { key: { label: "...", reason: "..." }, ... }`
 * 형태의 두 단 중첩입니다. 바깥 블록을 먼저 찾고, 그 안에서 항목을 찾습니다.
 */
function collect(source) {
  const found = [];
  const blockRe = /^ {2}(?:"([a-z0-9-]+)"|([a-z0-9-]+)): \{\n([\s\S]*?)\n {2}\},$/gm;
  for (const block of source.matchAll(blockRe)) {
    const slug = block[1] ?? block[2];
    if (ONLY_SLUG && slug !== ONLY_SLUG) continue;
    for (const m of block[3].matchAll(/ {4}(\w+): \{ label: "([^"]+)",[\s\S]*?\},/g)) {
      found.push({
        slug,
        key: m[1],
        label: m[2],
        hasLink: m[0].includes("coupangUrl"),
        subId: `${SUBID_PREFIX}_result_${slug}_${m[1]}`,
        raw: m[0],
      });
    }
  }
  return found;
}

function write(source, raw, link) {
  const stripped = raw.replace(/,?\s*coupangUrl:\s*"[^"]*"/, "");
  const replaced = stripped.replace(/,?\s*\},$/, `, coupangUrl: ${JSON.stringify(link)} },`);
  if (!source.includes(raw)) throw new Error("항목을 다시 찾지 못했습니다");
  return source.replace(raw, replaced);
}

/* ------------------------------------------------------------------ main -- */

let source = fs.readFileSync(PICKS_FILE, "utf8");
const all = collect(source);
const todo = (REDO ? all : all.filter((p) => !p.hasLink)).slice(0, LIMIT);
console.log(`항목 ${all.length}개 · 링크 만들 것 ${todo.length}개${Number.isFinite(LIMIT) ? ` (--limit=${LIMIT})` : ""}\n`);

if (DRY) {
  for (const p of todo) console.log(`  ${p.subId.padEnd(40)} ${p.label}`);
  process.exit(0);
}

if (todo.length === 0) process.exit(0);

const creds = credentials();
if (!creds) {
  console.error(`키가 없습니다. 저장소 루트에 coupang.env 를 만들고 두 줄을 넣으세요.

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
    console.log(`  ✓ ${pick.subId.padEnd(40)} ${pick.label}`);
    ok += 1;
  } catch (error) {
    console.log(`  ✗ ${pick.subId.padEnd(40)} ${pick.label} — ${error.message}`);
    failed.push(`${pick.slug}.${pick.key}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}

if (ok > 0) fs.writeFileSync(PICKS_FILE, source, "utf8");

console.log(`\n완료 ${ok}개${failed.length ? ` · 실패 ${failed.length}개: ${failed.join(", ")}` : ""}`);
if (ok > 0) console.log("lib/test-picks.ts 가 수정됐습니다. git diff 로 확인하고 커밋하세요.");
