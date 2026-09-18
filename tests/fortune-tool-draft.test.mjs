import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

/**
 * FortuneTool.tsx 회귀 테스트.
 *
 * today/saju/saju-mbti 세 모드는 localStorage 에 저장된 생년월일 draft를
 * 공유한다. saju-mbti 모드만 쓰는 mbti 필드가 없는 draft를 resultOnly 화면이
 * 그대로 받아 쓰면 "내가 고른 MBTI는 undefined" 같은 깨진 결과가 나오던 버그가
 * 있었다 — draftMissingModeField() 가 이 경우를 가려내 입력 폼으로 돌려보낸다.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const stubCssModules = {
  name: "stub-css-modules",
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /\.css$/ }, () => ({ contents: "export default {};", loader: "js" }));
  },
};

async function bundle(contents) {
  const { outputFiles } = await build({
    stdin: { contents, resolveDir: repoRoot, loader: "tsx" },
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    plugins: [stubCssModules],
    write: false,
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);
}

const { draftMissingModeField } = await bundle(
  `export { draftMissingModeField } from "./components/FortuneTool";`,
);

test("today/saju 모드는 mbti 필드가 없어도 draft 를 그대로 쓴다", () => {
  assert.equal(draftMissingModeField("today", { mbti: "" }), false);
  assert.equal(draftMissingModeField("saju", { mbti: "" }), false);
  assert.equal(draftMissingModeField("today", null), false);
});

test("saju-mbti 모드는 mbti 가 없는(다른 모드에서 넘어온) draft 를 거부한다", () => {
  assert.equal(draftMissingModeField("saju-mbti", { mbti: "" }), true);
  assert.equal(draftMissingModeField("saju-mbti", null), true);
  assert.equal(draftMissingModeField("saju-mbti", undefined), true);
});

test("saju-mbti 모드는 mbti 가 채워진 draft 는 그대로 받아들인다", () => {
  assert.equal(draftMissingModeField("saju-mbti", { mbti: "INTJ" }), false);
});
