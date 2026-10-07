import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { clipDescription } from "../lib/meta-text.ts";

// 네이버 웹마스터 가이드: description 80자 이내(2026-10-08 전체 점검에서 48곳이 넘었습니다)

test("clipDescription: 짧으면 그대로, 길면 문장 끝에서, 문장 끝이 없으면 띄어쓰기에서 … 로", () => {
  assert.equal(clipDescription("짧은 설명입니다."), "짧은 설명입니다.");
  const two = "첫 문장은 서른 글자를 넘기도록 조금 길게 써 둔 요약 문장입니다. 두 번째 문장은 붙이면 팔십 자를 확실히 넘겨 버리도록 일부러 아주 길게 늘여 쓴 덧붙임 문장입니다.";
  assert.equal(clipDescription(two), "첫 문장은 서른 글자를 넘기도록 조금 길게 써 둔 요약 문장입니다.");
  const noStop = "마침표 없이 계속 이어지는 아주 긴 문장 ".repeat(5);
  const c = clipDescription(noStop);
  assert.ok(c.length <= 80 && c.endsWith("…"), c);
  assert.equal(clipDescription("  공백이\n  여러 개  "), "공백이 여러 개");
});

function* htmlFiles(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

const dist = new URL("../dist/client/", import.meta.url);
test("빌드된 모든 페이지의 meta description 이 80자 이내", { skip: !existsSync(dist) && "빌드 결과 없음" }, () => {
  const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const over = [];
  let n = 0;
  for (const f of htmlFiles(fileURLToPath(dist))) {
    const m = readFileSync(f, "utf8").match(/<meta name="description" content="([^"]*)"/);
    if (!m) continue;
    n++;
    const d = decode(m[1]);
    if (d.length > 80) over.push(`${d.length} ${f.split("client")[1]}`);
  }
  assert.ok(n > 300, `페이지 ${n}개만 읽음`);
  assert.deepEqual(over, []);
});
