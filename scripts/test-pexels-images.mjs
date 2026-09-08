#!/usr/bin/env node
/**
 * MBTI 외 테스트들의 결과 추천 카드마다 Pexels 에서 비슷한 사진을 찾아
 * lib/test-picks.ts 에 직접 적습니다. scripts/pexels-images.mjs(MBTI 전용)와
 * 같은 구조이되, 이 파일은 테스트 slug 로 한 번 더 감싸인 중첩 객체를 다룹니다.
 *
 *   node scripts/test-pexels-images.mjs            사진 없는 항목만
 *   node scripts/test-pexels-images.mjs --all      전부 다시
 *   node scripts/test-pexels-images.mjs --dry      무엇을 할지만 출력
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PICKS_FILE = path.join(ROOT, "lib", "test-picks.ts");

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

async function searchOnce(key, query, orientation) {
  const params = { query, per_page: "1", ...(orientation ? { orientation } : {}) };
  const url = `https://api.pexels.com/v1/search?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const json = await res.json();
  return json.photos?.[0] ?? null;
}

/**
 * square 사진이 없는 검색어도 있다(전체 결과는 있어도 정사각형 크롭이 0장인
 * 경우) — 그때는 방향 제한 없이 한 번 더 찾는다.
 */
async function search(key, query) {
  const photo = (await searchOnce(key, query, "square")) ?? (await searchOnce(key, query, null));
  if (!photo) throw new Error("검색 결과가 없습니다");
  return photo.src.medium;
}

/* -------------------------------------------------------------- content -- */

function collect(source) {
  const found = [];
  const blockRe = /^ {2}(?:"([a-z0-9-]+)"|([a-z0-9-]+)): \{\n([\s\S]*?)\n {2}\},$/gm;
  for (const block of source.matchAll(blockRe)) {
    const slug = block[1] ?? block[2];
    for (const m of block[3].matchAll(/ {4}(\w+): \{ label: "([^"]+)",[\s\S]*?\},/g)) {
      found.push({ slug, key: m[1], label: m[2], hasImage: m[0].includes("image:"), raw: m[0] });
    }
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
console.log(`항목 ${picks.length}개 · 사진 찾을 것 ${todo.length}개\n`);

if (DRY) {
  for (const p of todo) console.log(`  ${p.slug}.${p.key.padEnd(14)} ${p.label}`);
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
    console.log(`  ✓ ${pick.slug}.${pick.key.padEnd(14)} ${pick.label}`);
    ok += 1;
  } catch (error) {
    console.log(`  ✗ ${pick.slug}.${pick.key.padEnd(14)} ${pick.label} — ${error.message}`);
    failed.push(`${pick.slug}.${pick.key}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

if (ok > 0) fs.writeFileSync(PICKS_FILE, source, "utf8");

console.log(`\n완료 ${ok}개${failed.length ? ` · 실패 ${failed.length}개: ${failed.join(", ")}` : ""}`);
if (ok > 0) console.log("lib/test-picks.ts 가 수정됐습니다. git diff 로 확인하고 커밋하세요.");
