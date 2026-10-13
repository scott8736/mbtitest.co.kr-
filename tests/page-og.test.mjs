import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 쪽마다 다른 og:image (네이버 검색 썸네일용).
 *
 * 운세·성향 테스트·자가진단·타로 쪽이 공통 이미지 한 장을 같이 쓰면 썸네일이 전부 같아집니다.
 * 이 테스트는 (1) 경로 → 이미지 경로가 쪽마다 겹치지 않고 (2) 파일이 실제로 있고 규격에 맞고
 * (3) 코드의 슬러그 목록(generateStaticParams 의 원천)이 매니페스트에서 빠지지 않고
 * (4) 해당 page.tsx 가 공통 이미지를 다시 쓰지 않는지 봅니다.
 *
 * 없으면 이렇게 만듭니다: python scripts/make_page_og.py
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export { pageOgImage } from "./lib/page-og";
               export { dreamSlugs } from "./lib/fortune-dreams";
               export { zodiacSlugs, starSignSlugs } from "./lib/fortune-engine";
               export { screenerSlugs } from "./lib/screeners";
               export { tarotSlugs } from "./lib/tarot";
               export { newTestSlugs } from "./lib/test-meta";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const lib = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const manifest = JSON.parse(readFileSync(join(repoRoot, "scripts", "page-og-manifest.json"), "utf8"));
const COMMON = "/images/og/mbti-mori-og.jpg";

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

test("매니페스트의 모든 쪽이 서로 다른 og 경로를 받는다", () => {
  const paths = manifest.map((m) => m.path);
  assert.equal(new Set(paths).size, paths.length, "매니페스트 경로 중복");
  const images = paths.map((p) => lib.pageOgImage(p));
  assert.equal(new Set(images).size, images.length, "og 이미지 경로 중복");
  assert.ok(!images.includes(COMMON));
});

test("모든 이미지가 있고 규격(1200x630, 5KB 이상, 비율 3:1 이내, 150px 초과)에 맞는다", () => {
  const bad = [];
  let total = 0;
  for (const m of manifest) {
    const file = join(repoRoot, "public", lib.pageOgImage(m.path));
    if (!existsSync(file)) {
      bad.push(`${m.path}: 파일 없음`);
      continue;
    }
    const size = statSync(file).size;
    total += size;
    const dim = jpegSize(readFileSync(file));
    if (size < 5000) bad.push(`${m.path}: ${size}바이트 (5,000 미만)`);
    if (size > 150 * 1024) bad.push(`${m.path}: ${size}바이트 (너무 큼)`);
    if (!dim || dim.w !== 1200 || dim.h !== 630) bad.push(`${m.path}: 크기 ${JSON.stringify(dim)}`);
  }
  assert.deepEqual(bad, [], `\n  python scripts/make_page_og.py 로 다시 만드세요.\n  ${bad.join("\n  ")}`);
  console.log(`og 이미지 ${manifest.length}장, 합계 ${Math.round(total / 1024)}KB`);
});

test("코드의 슬러그 목록이 매니페스트에서 빠지지 않는다", () => {
  const have = new Set(manifest.map((m) => m.path));
  const expected = [
    ...lib.dreamSlugs.map((s) => `/fortune/dream/${s}/`),
    ...lib.zodiacSlugs.map((s) => `/fortune/zodiac/${s}/`),
    ...lib.starSignSlugs.map((s) => `/fortune/star-sign/${s}/`),
    ...lib.screenerSlugs.map((s) => `/check/${s}/`),
    ...lib.tarotSlugs.map((s) => `/tarot/${s}/`),
    ...lib.newTestSlugs.map((s) => `/tests/${s}/`),
  ];
  const missing = expected.filter((p) => !have.has(p));
  assert.deepEqual(missing, [], `매니페스트에 없는 쪽: ${missing.join(", ")}`);
});

test("해당 page.tsx 가 공통 og 이미지를 다시 쓰지 않고 pageOgImage 를 쓴다", () => {
  const bad = [];
  const roots = ["fortune", "tests", "check", "tarot"];
  const dynamic = {
    "fortune/dream": "[slug]",
    "fortune/zodiac": "[animal]",
    "fortune/star-sign": "[sign]",
    check: "[slug]",
    tarot: "[slug]",
    tests: "[slug]",
  };
  for (const m of manifest) {
    const seg = m.path.replace(/^\/|\/$/g, "").split("/");
    const staticFile = join(repoRoot, "app", ...seg, "page.tsx");
    const parent = seg.slice(0, -1).join("/");
    const dynFile = dynamic[parent] ? join(repoRoot, "app", ...seg.slice(0, -1), dynamic[parent], "page.tsx") : null;
    const file = existsSync(staticFile) ? staticFile : dynFile;
    if (!file || !existsSync(file)) {
      bad.push(`${m.path}: page.tsx 를 못 찾음`);
      continue;
    }
    const src = readFileSync(file, "utf8");
    if (src.includes("mbti-mori-og")) bad.push(`${m.path}: 공통 이미지를 씀 (${file})`);
    if (!src.includes("pageOgImage(")) bad.push(`${m.path}: pageOgImage 를 안 씀 (${file})`);
  }
  assert.ok(roots.length);
  assert.deepEqual(bad, [], bad.join("\n  "));
});
