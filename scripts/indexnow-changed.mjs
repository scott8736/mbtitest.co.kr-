#!/usr/bin/env node
/**
 * 배포가 끝난 뒤, 새로 생겼거나 본문이 바뀐 주소만 IndexNow 로 알립니다.
 * (.github/workflows/indexnow.yml 이 푸시마다 돌립니다)
 *
 * scripts/indexnow.mjs 는 "사이트맵에 처음 나온 주소"만 보냅니다. 고친 페이지는 다시 알리지 못합니다.
 * 이 스크립트는 운영 페이지마다 <main> 안 글자의 지문(sha256)을 STATE 파일에 남겨 두고,
 * 다음 배포 때 지문이 달라진 주소와 새 주소를 함께 보냅니다. 전송 자체는 scripts/indexnow.mjs 에 맡깁니다.
 *
 * - 머리말·꼬리말·스크립트는 지문에서 뺍니다. 디자인만 바꾼 배포는 0개가 나와야 합니다.
 * - 한 번에 MAX_CHANGED 개를 넘게 바뀌면 공통 부품이 바뀐 것으로 보고, 새 주소만 보냅니다
 *   (네이버: 새것·고친 것만 보낸다. 수백 개를 한꺼번에 밀면 무엇이 새것인지 사라진다).
 * - STATE 가 없으면(처음 실행) 지문만 만들고 보내지 않습니다. 기존 주소는 이미 보낸 상태입니다.
 * - 요청 UA 에 bot 을 넣어 사이트 접속 통계(isBot)에서 빠지게 합니다.
 *
 *   node scripts/indexnow-changed.mjs --state <파일>          비교 후 전송, STATE 갱신
 *   node scripts/indexnow-changed.mjs --state <파일> --dry    보낼 주소만 출력 (STATE 안 바꿈)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOST = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url), "utf8")).brand.domain;
const UA = "mbtitest indexnow bot";
const MAX_CHANGED = 40;

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const stateFile = args[args.indexOf("--state") + 1];
if (!args.includes("--state") || !stateFile) {
  console.error("사용법: node scripts/indexnow-changed.mjs --state <파일> [--dry]");
  process.exit(1);
}

export function fingerprint(html) {
  const a = html.indexOf("<main");
  const b = html.lastIndexOf("</main>");
  const main = a >= 0 && b > a ? html.slice(a, b) : html;
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const text = main
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(`${title}\n${desc}\n${text}`).digest("hex").slice(0, 16);
}

const xml = await (await fetch(`https://${HOST}/sitemap.xml`, { headers: { "User-Agent": UA } })).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) throw new Error("사이트맵에서 주소를 하나도 못 읽었습니다.");

// 8개씩 나눠 읽습니다. 실패한 주소는 지문을 남기지 않고 이전 값을 그대로 둡니다.
const now = {};
const failed = [];
for (let i = 0; i < urls.length; i += 8) {
  await Promise.all(urls.slice(i, i + 8).map(async (url) => {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 200) now[url] = fingerprint(await r.text());
      else failed.push(`${r.status} ${url}`);
    } catch (e) {
      failed.push(`ERR ${url}`);
    }
  }));
}
if (failed.length) console.log(`읽지 못한 주소 ${failed.length}개 (이번에는 건너뜀):\n  ` + failed.slice(0, 10).join("\n  "));

const prev = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : null;
const next = { ...(prev || {}), ...now };

if (!prev) {
  console.log(`기준 지문 ${Object.keys(now).length}개를 만들었습니다. 처음 실행이라 보내지 않습니다.`);
  if (!dry) writeFileSync(stateFile, JSON.stringify(next));
  process.exit(0);
}

const added = Object.keys(now).filter((u) => !(u in prev));
const changed = Object.keys(now).filter((u) => u in prev && prev[u] !== now[u]);
console.log(`새 주소 ${added.length}개, 본문이 바뀐 주소 ${changed.length}개`);
for (const u of added) console.log(`  [새] ${u}`);
for (const u of changed.slice(0, 50)) console.log(`  [바뀜] ${u}`);

let send = [...added, ...changed];
if (changed.length > MAX_CHANGED) {
  console.log(`바뀐 주소가 ${MAX_CHANGED}개를 넘어 공통 부품 변경으로 봅니다 — 새 주소만 보냅니다.`);
  send = added;
}
if (dry) process.exit(0);

if (send.length) {
  const sender = fileURLToPath(new URL("./indexnow.mjs", import.meta.url));
  const r = spawnSync(process.execPath, [sender, ...send], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error("전송 실패 — 지문을 갱신하지 않습니다(다음 배포 때 다시 보냅니다).");
    process.exit(1);
  }
} else {
  console.log("보낼 주소가 없습니다.");
}
writeFileSync(stateFile, JSON.stringify(next));
