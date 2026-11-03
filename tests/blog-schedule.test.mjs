/**
 * 블로그 예약 발행 (2026-11-03~, lib/blog-publish.ts · lib/blog-scheduled/).
 *
 * 미래 publishedAt 글은 빌드 때 blogPosts 에서 빠져 목록·상세·사이트맵·RSS 어디에도
 * 나가지 않는다. 여기서는 그 판정과 예약 글 형식을 지킨다.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { build } from "esbuild";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { outputFiles } = await build({
  stdin: {
    contents: `export { allBlogPosts, blogPosts } from "./lib/blog-posts";
               export { scheduledPosts } from "./lib/blog-scheduled/index";
               export { blogTime, isBlogPublished } from "./lib/blog-publish";
               export { siteUrls } from "./lib/site-urls";
               export { rssXml } from "./lib/rss";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const m = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

test("날짜만 있는 예전 글은 KST 자정, 예약 글은 적힌 시각으로 읽는다", () => {
  assert.equal(m.blogTime("2026-07-25"), Date.parse("2026-07-24T15:00:00Z"));
  assert.equal(m.blogTime("2026-11-04T07:30:00+09:00"), Date.parse("2026-11-03T22:30:00Z"));
  assert.ok(Number.isNaN(m.blogTime("11월 4일")));
});

test("경계값: 예약 시각 1ms 전은 숨김, 그 시각부터 공개, 못 읽는 날짜는 숨김", () => {
  const at = Date.parse("2026-11-04T07:30:00+09:00");
  const post = { publishedAt: "2026-11-04T07:30:00+09:00" };
  assert.equal(m.isBlogPublished(post, at - 1), false);
  assert.equal(m.isBlogPublished(post, at), true);
  assert.equal(m.isBlogPublished(post, at + 1), true);
  assert.equal(m.isBlogPublished({ publishedAt: "" }, at), false);
  assert.equal(m.isBlogPublished({ publishedAt: "2026-07-25" }, at), true);
});

test("예약 기능 전부터 있던 글은 하나도 빠지지 않는다", () => {
  const legacy = m.allBlogPosts.filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt));
  const shown = new Set(m.blogPosts.map((p) => p.slug));
  assert.ok(legacy.length > 0);
  assert.deepEqual(legacy.filter((p) => !shown.has(p.slug)).map((p) => p.slug), []);
});

test("예약 글은 시각과 +09:00 을 적고, slug 가 전체 글과 겹치지 않는다", () => {
  const bad = m.scheduledPosts
    .filter((p) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+09:00$/.test(p.publishedAt))
    .map((p) => `${p.slug}: ${p.publishedAt}`);
  assert.deepEqual(bad, [], "publishedAt 은 2026-11-04T07:30:00+09:00 형식");
  const seen = new Map();
  for (const p of m.allBlogPosts) seen.set(p.slug, (seen.get(p.slug) || 0) + 1);
  assert.deepEqual([...seen].filter(([, n]) => n > 1).map(([s]) => s), [], "slug 중복");
});

test("미래 글은 사이트맵·RSS 에 없다", () => {
  const future = m.allBlogPosts.filter((p) => !m.isBlogPublished(p));
  const sitemap = new Set(m.siteUrls().map((u) => u.path));
  const rss = m.rssXml();
  for (const p of future) {
    assert.ok(!sitemap.has(`/blog/${p.slug}/`), `사이트맵에 미래 글: ${p.slug}`);
    assert.ok(!rss.includes(`/blog/${p.slug}/`), `RSS 에 미래 글: ${p.slug}`);
  }
});

// ── 미니 테스트 블록 (lib/blog-quiz.ts) ──
const q = await build({
  stdin: { contents: `export * from "./lib/blog-quiz";`, resolveDir: repoRoot, loader: "ts" },
  bundle: true, format: "esm", platform: "neutral", write: false,
});
const quizLib = await import(`data:text/javascript;base64,${Buffer.from(q.outputFiles[0].text).toString("base64")}`);
const opts = (...scores) => scores.map((s, i) => ({ label: `보기${i}`, score: s }));
const scoreQuiz = {
  type: "quiz", title: "시험", cta: { label: "검사", href: "/tests/mbti/" },
  questions: Array.from({ length: 5 }, (_, i) => ({ q: `문항${i}`, options: opts(0, 1, 2) })),
  results: [
    { min: 0, max: 3, title: "낮음", body: "a" },
    { min: 4, max: 6, title: "중간", body: "b" },
    { min: 7, max: 10, title: "높음", body: "c" },
  ],
};

test("미니 테스트(점수형): 경계 합계가 맞는 결과로, 빈 문항이 있으면 결과 없음", () => {
  assert.deepEqual(quizLib.validateQuiz(scoreQuiz), []);
  assert.equal(quizLib.quizResult(scoreQuiz, [0, 0, 0, 1, 2]).title, "낮음"); // 3
  assert.equal(quizLib.quizResult(scoreQuiz, [0, 0, 1, 1, 2]).title, "중간"); // 4
  assert.equal(quizLib.quizResult(scoreQuiz, [2, 2, 2, 1, 0]).title, "높음"); // 7
  assert.equal(quizLib.quizResult(scoreQuiz, [2, 2, 2, 2, undefined]), undefined);
});

test("미니 테스트: 합계 구간이 비거나 문항 수가 5~8 밖이면 잡는다", () => {
  const gap = { ...scoreQuiz, results: scoreQuiz.results.filter((r) => r.title !== "중간") };
  assert.ok(quizLib.validateQuiz(gap).some((e) => e.includes("합계 4점")));
  assert.ok(quizLib.validateQuiz({ ...scoreQuiz, questions: scoreQuiz.questions.slice(0, 4) }).length > 0);
  assert.ok(quizLib.validateQuiz({ ...scoreQuiz, cta: { label: "x", href: "https://x" } }).length > 0);
});

test("미니 테스트(유형형): 가장 많이 고른 key, 동점은 results 앞쪽", () => {
  const typeQuiz = {
    ...scoreQuiz,
    questions: Array.from({ length: 6 }, (_, i) => ({ q: `문항${i}`, options: [{ label: "가", result: "a" }, { label: "나", result: "b" }] })),
    results: [{ key: "a", title: "A형", body: "x" }, { key: "b", title: "B형", body: "y" }],
  };
  assert.deepEqual(quizLib.validateQuiz(typeQuiz), []);
  assert.equal(quizLib.quizResult(typeQuiz, [1, 1, 1, 1, 0, 0]).title, "B형");
  assert.equal(quizLib.quizResult(typeQuiz, [1, 1, 1, 0, 0, 0]).title, "A형");
  const badKey = { ...typeQuiz, results: [typeQuiz.results[0]] };
  assert.ok(quizLib.validateQuiz(badKey).some((e) => e.includes("key: b")));
});

test("모든 글의 미니 테스트 블록이 형식을 지킨다", () => {
  const bad = [];
  for (const p of m.allBlogPosts)
    for (const s of p.sections)
      if (s.quiz) for (const e of quizLib.validateQuiz(s.quiz)) bad.push(`${p.slug}: ${e}`);
  assert.deepEqual(bad, []);
});
