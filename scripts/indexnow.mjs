#!/usr/bin/env node
/**
 * 사이트맵에 새로 생긴 주소를 IndexNow 로 알립니다.
 *
 * ChatGPT 검색은 Bing 색인을 많이 씁니다. IndexNow 는 Bing 과 네이버가 함께 받는
 * "이 주소가 새로 생겼다" 알림이라, 크롤러가 올 때까지 기다리지 않아도 됩니다.
 * 색인을 보장하지는 않습니다.
 *
 * 배포된 사이트의 sitemap.xml 을 읽고, 이미 보낸 주소(저장소 밖 SENT 파일)를 빼고
 * 나머지만 보냅니다. lastmod 는 매 빌드 시각이라 쓸모가 없어 주소로만 가립니다.
 * 키 파일은 public/<KEY>.txt 입니다. IndexNow 키는 공개가 원칙이라 비밀이 아닙니다.
 *
 *   node scripts/indexnow.mjs            새 주소만 보냄
 *   node scripts/indexnow.mjs --dry      보낼 주소만 출력
 *   node scripts/indexnow.mjs <url>...   지정한 주소만 보냄(수정한 페이지 재알림)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// 도메인은 site.config.json 에서 읽습니다.
const HOST = JSON.parse(readFileSync(new URL("../site.config.json", import.meta.url), "utf8")).brand.domain;
const repo = fileURLToPath(new URL("..", import.meta.url));
// 보낸 기록은 검색엔진마다 따로 둡니다. 한쪽이 실패해도 다른 쪽에 중복으로 가지 않습니다.
const ENDPOINTS = [
  { name: "bing", url: "https://api.indexnow.org/indexnow" },
  { name: "naver", url: "https://searchadvisor.naver.com/indexnow" },
];
const sentFile = (name) => fileURLToPath(new URL(`../../indexnow-sent-${name}.txt`, import.meta.url));
const readSent = (name) => new Set(existsSync(sentFile(name)) ? readFileSync(sentFile(name), "utf8").split(/\r?\n/).filter(Boolean) : []);

const keyFile = readdirSync(`${repo}public`).find((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) throw new Error("public/ 에 IndexNow 키 파일이 없습니다.");
const key = keyFile.slice(0, -4);

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const explicit = args.filter((arg) => arg.startsWith("https://"));

let all = explicit;
if (!explicit.length) {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`, { headers: { "User-Agent": "mbtitest indexnow bot" } })).text();
  all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

// 키 파일이 배포돼 있어야 검색엔진이 받아 줍니다.
if (!dry) {
  const live = await fetch(`https://${HOST}/${keyFile}`);
  if (!live.ok || (await live.text()).trim() !== key) throw new Error(`키 파일이 아직 배포되지 않았습니다: /${keyFile}`);
}

for (const endpoint of ENDPOINTS) {
  const sent = readSent(endpoint.name);
  const urls = explicit.length ? explicit : all.filter((url) => !sent.has(url));
  console.log(`[${endpoint.name}] 보낼 주소 ${urls.length}개 (이미 보낸 것 ${sent.size}개)`);
  if (dry || !urls.length) continue;
  let ok = true;
  for (let i = 0; i < urls.length; i += 10000) {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls.slice(i, i + 10000) }),
    });
    // 200 받음, 202 받았고 키 확인 대기. 그 밖은 실패입니다.
    const good = response.status === 200 || response.status === 202;
    ok &&= good;
    console.log(`  → ${response.status}${good ? "" : " " + (await response.text()).slice(0, 200)}`);
  }
  if (ok) {
    for (const url of urls) sent.add(url);
    writeFileSync(sentFile(endpoint.name), [...sent].join("\n") + "\n");
  } else {
    process.exitCode = 1;
  }
}
