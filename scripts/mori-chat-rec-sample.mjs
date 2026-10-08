/**
 * 모리 대화 속 추천 견본 (2026-10-08). 실제 중계로 물어 [추천:id] 를 잘 붙이는지, 힘든 이야기엔 안 붙이는지 본다.
 *   node scripts/mori-chat-rec-sample.mjs <relay>/chat <secret파일>
 */
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [relayUrl, secretFile] = process.argv.slice(2);
const secret = readFileSync(secretFile, "utf8").trim();
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: { contents: `export { systemPrompt } from "./lib/mori-chat"; export { recInstruction } from "./worker/mori-chat"; export { takeRec } from "./lib/mori-chat-recs";`, resolveDir: repoRoot, loader: "ts" },
  bundle: true, format: "esm", platform: "neutral", write: false,
});
const C = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

const CASES = [
  { mori: "ENFP", say: "🎮 같이 할 놀이 없어?", since: 0, turn: 1 },
  { mori: "INFP", say: "🧪 심리테스트 하나 추천해 줘", since: 0, turn: 1 },
  { mori: "ISFJ", say: "🔮 볼 만한 운세 있어?", since: 0, turn: 1 },
  { mori: "ESFJ", say: "요즘 남자친구랑 자꾸 엇갈려", since: 3, turn: 3 },
  { mori: "INTJ", say: "주말에 할 거 없어서 심심해", since: 3, turn: 4 },
  { mori: "ISFJ", say: "요즘 너무 지치고 아무것도 하기 싫어", since: 3, turn: 3 },
  { mori: "ESTP", say: "오늘 점심 뭐 먹지", since: 0, turn: 2 },
];
for (const c of CASES) {
  const system = `${C.systemPrompt(c.mori, null)}\n${C.recInstruction(c.say, c.since, c.turn)}`;
  const res = await fetch(relayUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-relay-secret": secret, "user-agent": "mbtitest-qa-bot" },
    body: JSON.stringify({ system, contents: [{ role: "user", parts: [{ text: c.say }] }], tier: "free" }),
  });
  const j = await res.json();
  const { text, rec } = C.takeRec(j.text ?? "");
  console.log(`[${c.mori}] ${c.say}\n  → ${text.replace(/\n/g, " ")}\n  추천: ${rec ?? "-"}  (원문 표시 ${/\[추천/.test(j.text ?? "") ? "있음" : "없음"})`);
}
