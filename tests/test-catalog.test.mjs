import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

/**
 * 테스트 목록과 실제 문항 데이터가 어긋나지 않는지 봅니다.
 *
 * lib/test-meta.ts 는 이름표만, lib/new-tests.ts 는 문항만 담도록 나눠 두었습니다.
 * 나눠 두면 카탈로그를 읽는 클라이언트 화면이 문항 전체를 내려받지 않지만,
 * 대신 둘이 조용히 어긋날 수 있습니다. 그 어긋남을 여기서 잡습니다.
 *
 * 라이브러리 파일들이 확장자 없이 서로를 import 하므로 node 가 직접 읽지
 * 못합니다. 그래서 esbuild 로 한 번 묶은 뒤 불러옵니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { testCatalog } from "./lib/test-catalog";
      export { genericTests } from "./lib/generic-tests";
      export { newTestMeta, newTestSlugs } from "./lib/test-meta";
      export { newGenericTests } from "./lib/new-tests";
    `,
    resolveDir: new URL("..", import.meta.url).pathname,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const { testCatalog, genericTests, newTestMeta, newTestSlugs, newGenericTests } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);

test("newTestSlugs 가 실제 테스트 목록과 값·순서까지 같다", () => {
  // 사이트맵과 generateStaticParams 가 이 순서를 그대로 씁니다.
  assert.deepEqual(newTestSlugs, Object.keys(newGenericTests));
  assert.deepEqual(newTestSlugs, newTestMeta.map((meta) => meta.slug));
});

test("카탈로그에 있는 테스트는 모두 실제 문항을 가지고 있다", () => {
  // mbti 는 문항이 lib/mbti-data.ts 에 따로 있어 genericTests 에 없습니다.
  const missing = testCatalog
    .filter((item) => item.status === "published" && item.slug !== "mbti")
    .filter((item) => !genericTests[item.slug])
    .map((item) => item.slug);
  assert.deepEqual(missing, [], `문항이 없는 카탈로그 항목: ${missing.join(", ")}`);
});

test("문항이 있는 테스트는 모두 카탈로그에 올라와 있다", () => {
  const listed = new Set(testCatalog.map((item) => item.slug));
  const unlisted = Object.keys(genericTests).filter((slug) => !listed.has(slug));
  assert.deepEqual(unlisted, [], `카탈로그에 없는 테스트: ${unlisted.join(", ")}`);
});

test("카탈로그의 문항 수가 실제 문항 수와 같다", () => {
  // 이 숫자는 목록 카드와 검사 시작 화면, 메타 설명에 그대로 나갑니다.
  const wrong = testCatalog
    .filter((item) => genericTests[item.slug])
    .map((item) => ({ slug: item.slug, catalog: item.questionCount, real: genericTests[item.slug].questions.length }))
    .filter((row) => row.catalog !== row.real);
  assert.deepEqual(wrong, [], `문항 수가 틀린 항목: ${wrong.map((r) => `${r.slug} ${r.catalog}≠${r.real}`).join(", ")}`);
});

test("이름표와 테스트 데이터의 제목·설명이 같다", () => {
  const wrong = newTestMeta
    .filter((meta) => newGenericTests[meta.slug])
    .filter((meta) => {
      const t = newGenericTests[meta.slug];
      return t.title !== meta.title || t.description !== meta.description || t.eyebrow !== meta.eyebrow;
    })
    .map((meta) => meta.slug);
  assert.deepEqual(wrong, [], `이름표와 테스트가 다른 항목: ${wrong.join(", ")}`);
});
