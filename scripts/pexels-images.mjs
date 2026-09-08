#!/usr/bin/env node
/**
 * MBTI 결과 추천 카드마다 검색어와 비슷한 사진을 Pexels 에서 찾아
 * lib/mbti-picks.ts 에 직접 적습니다.
 *
 *   node scripts/pexels-images.mjs            사진 없는 유형만
 *   node scripts/pexels-images.mjs --all      전부 다시
 *   node scripts/pexels-images.mjs --dry      무엇을 할지만 출력
 *
 * 쿠팡 상품 검색 API 를 쓰지 않는 이유: 그 API 는 딥링크와 호출 한도를
 * 나눠 쓰고(scripts/coupang-links.mjs 의 한 줄 요약: 1시간 30회), 상품이
 * 품절·단종되면 사진도 같이 죽는다. Pexels 는 검색어 기반 스톡 사진이라
 * 둘 다 해당 없다 — "이런 물건이다"라는 예시일 뿐 실제 판매 상품 사진이
 * 아니므로 오히려 그 편이 정확하다.
 *
 * 키는 저장소 루트 pexels.env 나 환경변수에서 읽고, 어디에도 커밋되지 않습니다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PICKS_FILE = path.join(ROOT, "lib", "mbti-picks.ts");

const args = new Set(process.argv.slice(2));
const REDO = args.has("--all");
const DRY = args.has("--dry");

function apiKey() {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY;

  const file = path.join(ROOT, "pexels.env");
  if (!fs.existsSync(file)) return null;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i > 0 && trimmed.slice(0, i).trim() === "PEXELS_API_KEY") return trimmed.slice(i + 1).trim();
  }
  return null;
}

async function search(key, query) {
  const url = `https://api.pexels.com/v1/search?${new URLSearchParams({ query, per_page: "1", orientation: "square" })}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const json = await res.json();
  const photo = json.photos?.[0];
  if (!photo) throw new Error("검색 결과가 없습니다");
  return photo.src.medium;
}

/* -------------------------------------------------------------- content -- */

function collect(source) {
  const found = [];
  for (const m of source.matchAll(
    /(\b[A-Z]{4}\b): \{\s*label: "([^"]+)",[\s\S]*?\},/g,
  )) {
    found.push({
      code: m[1],
      label: m[2],
      hasImage: m[0].includes("image:"),
      raw: m[0],
    });
  }
  return found;
}

function write(source, raw, imageUrl) {
  const stripped = raw.replace(/,?\s*image:\s*"[^"]*"/, "");
  const replaced = stripped.replace(/,?\s*\},$/, `, image: ${JSON.stringify(imageUrl)} },`);
  if (!source.includes(raw)) throw new Error("항목을 다시 찾지 못했습니다");
  return source.replace(raw, replaced);
}

/* ------------------------------------------------------------------ main -- */

let source = fs.readFileSync(PICKS_FILE, "utf8");
const picks = collect(source);
const todo = REDO ? picks : picks.filter((p) => !p.hasImage);
console.log(`유형 ${picks.length}개 · 사진 찾을 것 ${todo.length}개\n`);

if (DRY) {
  for (const p of todo) console.log(`  ${p.code.padEnd(6)} ${p.label}`);
  process.exit(0);
}

if (todo.length === 0) process.exit(0);

const key = apiKey();
if (!key) {
  console.error(`키가 없습니다. 저장소 루트에 pexels.env 를 만들고 한 줄을 넣으세요.

  PEXELS_API_KEY=발급받은키
`);
  process.exit(1);
}

let ok = 0;
const failed = [];
for (const pick of todo) {
  try {
    const image = await search(key, pick.label);
    source = write(source, pick.raw, image);
    console.log(`  ✓ ${pick.code.padEnd(6)} ${pick.label}`);
    ok += 1;
  } catch (error) {
    console.log(`  ✗ ${pick.code.padEnd(6)} ${pick.label} — ${error.message}`);
    failed.push(pick.label);
  }
  // 무료 등급 호출 한도(시간당 200회)가 있어 한 박자 쉬어 갑니다.
  await new Promise((r) => setTimeout(r, 250));
}

if (ok > 0) fs.writeFileSync(PICKS_FILE, source, "utf8");

console.log(
  `\n완료 ${ok}개${failed.length ? ` · 실패 ${failed.length}개: ${failed.join(", ")}` : ""}`,
);
if (ok > 0) console.log("lib/mbti-picks.ts 가 수정됐습니다. git diff 로 확인하고 커밋하세요.");
