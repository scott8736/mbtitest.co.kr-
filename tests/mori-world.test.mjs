import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * 모리 세계관 「마음숲」(2026-10-04). 이야기가 궁합표·이름과 어긋나지 않는지 봅니다.
 * 짝꿍은 MORI_BEST, 라이벌은 궁합 데이터의 「어려운 궁합」(challenges) 안에서만 고릅니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { MORI, MORI_BEST } from "./lib/mori";
      export { MORI_WORLD, MORI_PAIRS, VILLAGES, villageOf } from "./lib/mori-world";
      export { profiles, mbtiCodes } from "./lib/mbti-content";
      export { typeData } from "./lib/mbti-data";
    `,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
const codes = mod.mbtiCodes.map((c) => c.toUpperCase());

test("16모리 모두 말버릇·성격 한 줄·맡은 일이 있다", () => {
  assert.deepEqual(Object.keys(mod.MORI_WORLD).sort(), [...codes].sort());
  for (const c of codes) {
    const w = mod.MORI_WORLD[c];
    assert.ok(w.says && w.line && w.role, c);
  }
});

test("네 마을은 사이트 네 그룹과 같다 (마을마다 4모리)", () => {
  const groupWord = { nt: "탐구형", nf: "공감형", sj: "안정형", sp: "행동형" };
  for (const c of codes) {
    const v = mod.villageOf(c);
    assert.ok(mod.profiles[c.toLowerCase()].group.startsWith(groupWord[v]), `${c} ${v}`);
  }
  for (const k of Object.keys(mod.VILLAGES)) assert.equal(codes.filter((c) => mod.villageOf(c) === k).length, 4, k);
});

test("짝꿍은 최고 궁합(MORI_BEST)과 같고, 라이벌은 궁합표의 어려운 궁합 안에 있다", () => {
  for (const p of mod.MORI_PAIRS) {
    if (p.kind === "짝꿍") {
      assert.ok(mod.MORI_BEST[p.a] === p.b || mod.MORI_BEST[p.b] === p.a, `${p.a}×${p.b}`);
    } else {
      const ch = (c) => mod.profiles[c.toLowerCase()].challenges.map((x) => x.toUpperCase());
      assert.ok(ch(p.a).includes(p.b) || ch(p.b).includes(p.a), `${p.a}↔${p.b}`);
    }
  }
  assert.equal(mod.MORI_PAIRS.filter((p) => p.kind === "짝꿍").length, 8);
});

test("16Personalities 이름과 겹치는 별명을 다시 들여오지 않는다", () => {
  // 한국어판 별명과 영어판(Architect·Commander·Debater 등)을 옮긴 이름. 2026-10-04 교체.
  const banned = ["활동가", "옹호자", "중재자", "통솔자", "변론가", "사회운동가", "외교관", "수호자", "용의주도", "재기발랄", "청렴결백", "설계자", "지휘관", "토론가", "논리술사", "집정관", "선도자"];
  for (const c of codes) {
    for (const word of banned) {
      assert.ok(!mod.typeData[c].name.includes(word), `${c} ${mod.typeData[c].name}`);
      assert.ok(!mod.profiles[c.toLowerCase()].name.includes(word), `${c} ${mod.profiles[c.toLowerCase()].name}`);
    }
  }
});

test("이야기에 유형을 깎아내리는 말이 없다", () => {
  const harsh = ["최악", "답답한 유형", "피해야", "상극", "못된"];
  for (const p of mod.MORI_PAIRS) for (const w of harsh) assert.ok(!p.story.includes(w), `${p.a}${p.b} ${w}`);
});
