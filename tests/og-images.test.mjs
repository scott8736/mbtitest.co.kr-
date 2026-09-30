import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// new URL(..).pathname 은 윈도우에서 "/D:/..." 를 내놓아 esbuild 가 못 읽습니다.
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const OG_DIR = join(repoRoot, "public", "images", "og", "r");

/**
 * 결과별 공유 이미지가 빠짐없이 있는지 봅니다.
 *
 * 이게 빠지면 조용히 망가집니다. 페이지는 정상으로 보이고 빌드도 통과하는데,
 * 카카오톡으로 공유할 때만 썸네일이 깨지거나 사이트 로고가 뜹니다. 공유가
 * 이 카테고리의 전부라서, 테스트를 하나 추가하고 이미지를 안 구운 상태로
 * 배포되는 일을 여기서 막습니다.
 *
 * 없으면 이렇게 만듭니다: node scripts/make-og.mjs
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export { genericTests } from "./lib/generic-tests";
               export { typeData } from "./lib/mbti-data";
               export { blogPosts } from "./lib/blog-posts";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { genericTests, typeData, blogPosts } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

const allResults = Object.entries(genericTests).flatMap(([slug, t]) =>
  Object.keys(t.results).map((key) => ({ slug, key, file: `${slug}-${key}.png` })),
);

// MBTI 16유형은 genericTests 가 아니라 lib/mbti-data 에 있습니다. 방문이 가장
// 많은 검사라 카드가 빠지면 손해도 제일 큽니다.
const mbtiResults = Object.keys(typeData).map((code) => ({
  slug: "mbti",
  key: code.toLowerCase(),
  file: `mbti-${code.toLowerCase()}.png`,
}));

allResults.push(...mbtiResults);

test("모든 결과에 공유 이미지가 있다", () => {
  const missing = allResults
    .filter((row) => !existsSync(join(OG_DIR, row.file)))
    .map((row) => row.file);
  assert.deepEqual(
    missing,
    [],
    `공유 이미지가 없는 결과: ${missing.join(", ")}\n  node scripts/make-og.mjs 로 만드세요.`,
  );
});

test("공유 이미지가 빈 파일이 아니다", () => {
  // satori 가 실패하면 0바이트 파일이 남을 수 있습니다. 카카오는 그걸 무시합니다.
  const tooSmall = allResults
    .filter((row) => existsSync(join(OG_DIR, row.file)))
    .filter((row) => statSync(join(OG_DIR, row.file)).size < 5000)
    .map((row) => row.file);
  assert.deepEqual(tooSmall, [], `이미지가 너무 작습니다(생성 실패 의심): ${tooSmall.join(", ")}`);
});

test("결과 키에 주소로 쓸 수 없는 문자가 없다", () => {
  // 결과 키가 그대로 /tests/{slug}/r/{key}/ 주소와 파일 이름이 됩니다.
  const bad = allResults
    .filter((row) => !/^[a-z0-9-]+$/.test(row.key))
    .map((row) => `${row.slug}/${row.key}`);
  assert.deepEqual(bad, [], `주소로 쓸 수 없는 결과 키: ${bad.join(", ")}`);
});

test("MBTI 16유형이 빠짐없이 있다", () => {
  // 유형이 16개가 아니면 데이터 쪽이 깨진 것이고, 그 상태로 카드를 구우면
  // 없는 유형의 결과 화면이 빈 그림이 됩니다.
  assert.equal(mbtiResults.length, 16, `MBTI 유형이 16개가 아닙니다: ${mbtiResults.length}개`);
});

test("공유 이미지에 쓰는 결과 문구가 비어 있지 않다", () => {
  // 이름이나 한 줄 설명이 비면 카드가 빈칸으로 구워집니다.
  const empty = [];
  for (const [slug, t] of Object.entries(genericTests)) {
    for (const [key, result] of Object.entries(t.results)) {
      if (!result.name || !result.tagline || !result.color) empty.push(`${slug}/${key}`);
    }
  }
  assert.deepEqual(empty, [], `카드에 쓸 문구가 빈 결과: ${empty.join(", ")}`);
});

test("모든 블로그 글에 대표 이미지가 있다", () => {
  // 글 페이지의 <img>, og:image, 블로그 목록 카드가 모두 이 파일을 씁니다.
  // 빠지면 글 화면에 깨진 그림이 뜨고 공유 썸네일도 사라집니다.
  // 2026-09-30 전수 점검에서 enneagram-guide 가 이렇게 빠져 있었습니다.
  const BLOG_DIR = join(repoRoot, "public", "images", "blog");
  const missing = blogPosts
    .map((post) => post.slug)
    .filter((slug) => !existsSync(join(BLOG_DIR, `${slug}.png`)));
  assert.deepEqual(missing, [], `대표 이미지가 없는 글: ${missing.join(", ")}
  node scripts/make-blog-cards.mjs 로 만드세요.`);
});
