import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const { outputFiles } = await build({
  stdin: {
    contents: `export { leadFacts } from "./lib/test-lead"; export { genericTests } from "./lib/generic-tests"; export { screeners } from "./lib/screeners";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

test("첫 문단 문장에 문항 수·시간·결과 수가 들어간다", () => {
  assert.equal(
    mod.leadFacts("나의 연애 성향을 확인합니다.", 12, "약 2분", 4),
    "12문항, 약 2분이면 끝나고 결과는 4가지 중 하나로 나옵니다. 회원가입 없이 무료입니다.",
  );
});

test("설명에 이미 문항 수가 있으면 되풀이하지 않는다", () => {
  const s = mod.leadFacts("16문항으로 민감성을 확인합니다.", 16, "약 3분", 4);
  assert.ok(!s.includes("16문항"));
  assert.ok(s.startsWith("약 3분이면 끝나고"));
});

test("모든 테스트·자가진단의 첫 문단이 문항 수와 시간을 답한다", () => {
  const leads = [
    ...Object.values(mod.genericTests).map((t) => [t.slug, `${t.description} ${mod.leadFacts(t.description, t.questions.length, t.duration, Object.keys(t.results).length)}`]),
    ...mod.screeners.map((s) => [s.slug, `${s.description} ${mod.leadFacts(s.description, s.questions.length, s.duration)}`]),
  ];
  assert.ok(leads.length > 60);
  for (const [slug, lead] of leads) {
    assert.match(lead, /\d+\s*(문항|문제)/, `${slug}: 문항 수 없음`);
    assert.match(lead, /\d+\s*분/, `${slug}: 소요 시간 없음`);
  }
});
