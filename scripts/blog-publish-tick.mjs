#!/usr/bin/env node
/**
 * 블로그 예약 발행 반영 (2026-11-03~).
 *
 * 사이트는 정적 빌드라 예약 시각이 지나도 다시 빌드하기 전에는 글이 나타나지 않습니다.
 * 이 스크립트는 윈도우 예약 작업 「MBTI · 블로그 예약 발행 반영」이 하루 4번
 * (07:33 · 12:33 · 18:33 · 21:33 KST) 돌립니다.
 *
 *   1. lib/blog-scheduled/ 의 예약 글 중 「지난 실행 < 예약 시각 <= 지금」인 글을 찾는다.
 *   2. 없으면 아무것도 하지 않는다(커밋·빌드 0).
 *   3. 있으면 origin/main 과 같은 내용의 빈 커밋을 만들어 푸시 → Cloudflare Pages 가 다시 빌드
 *      (IndexNow 워크플로도 같이 돌아 새 주소를 알린다).
 *      작업 폴더·스테이징은 건드리지 않는다(git commit 대신 commit-tree). 로컬 main 이
 *      origin/main 과 같을 때만 로컬 main 도 따라 올린다.
 *   4. 새 글 주소가 200 이 될 때까지 최대 10분 확인해 로그에 남긴다.
 *
 * 푸시가 실패하면 「지난 실행」을 올리지 않으므로 다음 실행이 이어서 반영한다.
 * 상태·로그: D:\00 cloud\mbtitest.co.kr\blog-publish-state.json · blog-publish.log (저장소 밖)
 *
 *   node scripts/blog-publish-tick.mjs            # 실제 실행
 *   node scripts/blog-publish-tick.mjs --dry-run  # 무엇을 할지만 출력
 *   node scripts/blog-publish-tick.mjs --list     # 예약 글 전체와 공개 여부
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = join(root, "..");
const STATE = join(home, "blog-publish-state.json");
const LOG = join(home, "blog-publish.log");
const SITE = "https://mbtitest.co.kr";
const UA = "Mozilla/5.0 (compatible; mbtitest-publish-check bot)";
const args = new Set(process.argv.slice(2));
const dry = args.has("--dry-run");

function log(msg) {
  const line = `[${new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })} KST] ${msg}`;
  console.log(line);
  if (!dry && !args.has("--list")) appendFileSync(LOG, line + "\n", "utf8");
}

function git(...a) {
  return execFileSync("git", a, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function loadScheduled() {
  const { outputFiles } = await build({
    stdin: {
      contents: `export { scheduledPosts } from "./lib/blog-scheduled/index";
                 export { blogTime } from "./lib/blog-publish";`,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "neutral",
    write: false,
    logLevel: "silent",
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
}

const { scheduledPosts, blogTime } = await loadScheduled();
const now = Date.now();

if (args.has("--list")) {
  for (const p of [...scheduledPosts].sort((a, b) => blogTime(a.publishedAt) - blogTime(b.publishedAt))) {
    console.log(`${blogTime(p.publishedAt) <= now ? "공개" : "대기"}  ${p.publishedAt}  ${p.slug}`);
  }
  console.log(`예약 글 ${scheduledPosts.length}편`);
  process.exit(0);
}

let state = {};
try {
  state = JSON.parse(readFileSync(STATE, "utf8"));
} catch {
  /* 첫 실행 */
}
// 첫 실행은 6시간 전부터 본다(바로 앞 칸 하나를 놓치지 않게).
const since = Number.isFinite(state.lastRun) ? state.lastRun : now - 6 * 3600 * 1000;
const due = scheduledPosts.filter((p) => {
  const t = blogTime(p.publishedAt);
  return Number.isFinite(t) && t > since && t <= now;
});

function saveState() {
  if (dry) return;
  writeFileSync(STATE, JSON.stringify({ lastRun: now, lastRunKst: new Date(now).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }) }, null, 2));
}

if (!due.length) {
  log(`예약 시각이 지난 새 글 없음 (예약 글 ${scheduledPosts.length}편) — 빌드 안 함`);
  saveState();
  process.exit(0);
}

const slugs = due.map((p) => p.slug);
log(`시각이 지난 예약 글 ${due.length}편: ${slugs.join(", ")}`);
if (dry) {
  console.log("(--dry-run) 빈 커밋·푸시를 하지 않습니다.");
  process.exit(0);
}

let newSha;
try {
  git("fetch", "--quiet", "origin", "main");
  const base = git("rev-parse", "origin/main");
  const tree = git("rev-parse", "origin/main^{tree}");
  const msg = `블로그 예약 발행 반영 — ${due.length}편 (${slugs.slice(0, 4).join(", ")}${slugs.length > 4 ? " 외" : ""})\n\n예약 시각이 지난 글을 다시 빌드해 공개한다. 내용 변경 없는 빈 커밋(scripts/blog-publish-tick.mjs).`;
  newSha = execFileSync("git", ["commit-tree", tree, "-p", base, "-F", "-"], {
    cwd: root,
    input: msg,
    encoding: "utf8",
  }).trim();
  git("push", "--quiet", "origin", `${newSha}:refs/heads/main`);
  const local = git("rev-parse", "refs/heads/main");
  if (local === base) {
    git("update-ref", "refs/heads/main", newSha, base);
  } else {
    log(`주의: 로컬 main(${local.slice(0, 7)})이 origin/main(${base.slice(0, 7)})과 달라 로컬은 그대로 둠 — 다음 푸시 전 git pull --rebase`);
  }
  log(`빈 커밋 ${newSha.slice(0, 7)} 푸시 → Cloudflare Pages 빌드 시작`);
  saveState();
} catch (err) {
  log(`푸시 실패 — 다음 실행 때 다시 시도: ${String(err.stderr || err.message).trim().split("\n")[0]}`);
  process.exit(1);
}

// 실제로 보이는지 확인(최대 10분, 30초 간격). 글 HTML 만 받는다 — 광고·스크립트는 불러오지 않는다.
const pending = new Set(slugs);
for (let i = 0; i < 20 && pending.size; i += 1) {
  await new Promise((r) => setTimeout(r, 30_000));
  for (const slug of [...pending]) {
    try {
      const res = await fetch(`${SITE}/blog/${slug}/?v=${Date.now()}`, { headers: { "user-agent": UA }, redirect: "manual" });
      if (res.status === 200) pending.delete(slug);
    } catch {
      /* 다음 회차 */
    }
  }
}
if (pending.size) log(`10분 안에 200 이 아닌 글: ${[...pending].join(", ")} — Cloudflare Pages 빌드 상태를 확인`);
else log(`공개 확인(200): ${slugs.join(", ")}`);
