import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 빌드 결과물 전체를 훑어 읽기를 막는 두 가지를 잡습니다.
 *
 * 왜 테스트로 두나
 *   같은 버그를 두 번 냈습니다. .generic-explain 은 `> div`(카드 격자)에만 폭이
 *   걸려 있는데 여섯 화면이 생 <p> 를 바로 넣습니다. 자가진단 한 곳만 고치고
 *   나머지 다섯을 놓쳐서, 타로 페이지는 한 줄이 화면 끝까지 가는 채로 배포됐습니다.
 *   눈으로 하는 점검은 페이지가 500개를 넘으면 반드시 빠집니다.
 *
 * 폭 검사는 선택자를 실제로 맞춰봅니다. "조상 클래스가 어딘가에서 max-width 를
 * 쓴 적이 있다" 로 판단하면 안 됩니다 — `.generic-explain>div{max-width}` 때문에
 * .generic-explain 아래 모든 것이 묶인 것처럼 보이고, 바로 그 착각이 이 버그를
 * 놓친 이유였습니다. 규칙의 주어가 그 요소 자신이어야 묶인 것입니다.
 *
 * dist/ 를 읽으므로 빌드 뒤에 돌아야 합니다. npm test 가 빌드부터 하므로 그대로 걸립니다.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(repoRoot, "dist", "client");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

let files = [];
try {
  files = walk(DIST);
} catch {
  // 빌드 전이면 검사할 것이 없습니다.
}

const pages = files.filter((f) => f.endsWith("index.html"));
const CSS = files
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

// @media 등의 블록 안쪽까지 훑기 위해 중첩을 신경쓰지 않고 규칙만 긁습니다.
const RULES = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => [m[1].trim(), m[2]])
  .filter(([sel]) => sel && !sel.startsWith("@"));

/* ---------------------------------------------------------------- 선택자 맞추기 */

/** ".a.b:not(.c)" 같은 한 덩어리를 태그·클래스·제외클래스로 나눕니다. */
function compound(part) {
  const nots = [...part.matchAll(/:not\(([^)]*)\)/g)].flatMap((m) =>
    [...m[1].matchAll(/\.([A-Za-z0-9_-]+)/g)].map((x) => x[1]),
  );
  const rest = part.replace(/:not\([^)]*\)/g, "").replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, "");
  const classes = [...rest.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
  const tag = (rest.match(/^([a-zA-Z][a-zA-Z0-9]*)/) || [])[1] || null;
  const unsupported = /[#[\]~+]/.test(rest);
  return { tag, classes, nots, unsupported };
}

/** 한 덩어리가 이 노드에 맞는지 */
function matchesCompound(c, node) {
  if (c.unsupported) return false;
  if (c.tag && c.tag !== node.tag) return false;
  if (c.classes.some((cls) => !node.classes.includes(cls))) return false;
  if (c.nots.some((cls) => node.classes.includes(cls))) return false;
  return true;
}

/**
 * 선택자가 chain 의 마지막 노드를 주어로 삼아 맞는지 봅니다.
 * chain 은 [조상…, 대상] 순서입니다.
 */
function matchesSelector(selector, chain) {
  const parts = selector.trim().split(/\s*([>\s])\s*/).filter((p) => p.trim());
  const compounds = [];
  const combinators = [];
  for (const part of parts) {
    if (part === ">") combinators[compounds.length - 1] = ">";
    else {
      compounds.push(compound(part));
      combinators.push(" ");
    }
  }
  if (!compounds.length) return false;

  let index = chain.length - 1;
  if (!matchesCompound(compounds[compounds.length - 1], chain[index])) return false;

  for (let c = compounds.length - 2; c >= 0; c -= 1) {
    const combinator = combinators[c];
    if (combinator === ">") {
      index -= 1;
      if (index < 0 || !matchesCompound(compounds[c], chain[index])) return false;
    } else {
      let found = false;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (matchesCompound(compounds[c], chain[i])) {
          index = i;
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
  }
  return true;
}

// 폭을 정하는 규칙만 추립니다. 쉼표로 묶인 선택자는 따로 떼어 둡니다.
const WIDTH_SELECTORS = [];
for (const [sel, body] of RULES) {
  if (!/(?:^|;|\s)(?:max-)?width\s*:/.test(body)) continue;
  for (const one of sel.split(",")) if (one.trim()) WIDTH_SELECTORS.push(one.trim());
}

/** 이 요소나 조상 중 하나가 폭 규칙의 주어인가 */
function isBounded(chain) {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const sub = chain.slice(0, i + 1);
    for (const sel of WIDTH_SELECTORS) {
      if (matchesSelector(sel, sub)) return true;
    }
  }
  return false;
}

/* ---------------------------------------------------------------- 페이지 훑기 */

const VOID = /^(br|img|meta|link|input|hr|source|area|base|col|embed|track|wbr)$/i;
const SKIP = /^(svg|script|style|path|circle|rect|g|defs|use|ellipse|line|polygon)$/i;

function unboundedParagraphs(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const source = (bodyMatch ? bodyMatch[1] : html).replace(/<script[\s\S]*?<\/script>/g, "");
  const found = [];
  const stack = [];
  const token = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
  let skipDepth = 0;
  let last = 0;
  let m;
  while ((m = token.exec(source))) {
    if (stack.length && !skipDepth) stack[stack.length - 1].text += source.slice(last, m.index);
    last = token.lastIndex;
    const [, closing, rawTag, attrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (SKIP.test(tag)) {
      if (closing) skipDepth = Math.max(0, skipDepth - 1);
      else if (!selfClose) skipDepth += 1;
      continue;
    }
    if (skipDepth || VOID.test(tag) || selfClose) continue;
    if (closing) {
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i].tag !== tag) continue;
        const node = stack[i];
        const chain = stack.slice(0, i + 1);
        if (tag === "p") {
          const clean = node.text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          if (clean.length >= 110 && !isBounded(chain)) found.push(clean.slice(0, 44));
        }
        stack.length = i;
        break;
      }
      continue;
    }
    const cls = attrs.match(/class="([^"]*)"/);
    stack.push({ tag, classes: cls ? cls[1].split(/\s+/).filter(Boolean) : [], text: "" });
  }
  return found;
}

test("긴 본문이 폭 제한 없이 화면 끝까지 퍼지는 곳이 없다", () => {
  const bad = [];
  for (const page of pages) {
    for (const hit of unboundedParagraphs(readFileSync(page, "utf8"))) {
      bad.push(`${page.slice(DIST.length).replace(/\\/g, "/")} — ${hit}…`);
    }
  }
  assert.deepEqual(
    bad.slice(0, 8),
    [],
    `폭 제한이 없는 본문이 ${bad.length}곳 있습니다. 그 문단을 주어로 삼는 규칙에 max-width 를 주세요.`,
  );
});

/* ---------------------------------------------------------------- 색 대비 */

function luminance(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) value = [...value].map((c) => c + c).join("");
  const parts = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// 6자리·3자리 hex 만 봅니다. #ffffff14 같은 8자리는 알파가 붙은 값이라,
// 불투명한 흰색으로 읽으면 어두운 배경 위 반투명 칩이 전부 걸립니다.
const HEX = "#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])";
const FG = new RegExp(`(?<!-)color:(${HEX})`);
const BG = new RegExp(`background(?:-color)?:(${HEX})`);

test("한 규칙 안에서 글씨와 배경의 대비가 4.5 미만인 곳이 없다", () => {
  const bad = new Set();
  for (const [sel, body] of RULES) {
    const fg = body.match(FG);
    const bg = body.match(BG);
    if (!fg || !bg) continue;
    const ratio = contrast(fg[1], bg[1]);
    if (ratio < 4.5) bad.add(`${sel.slice(0, 60)} — ${fg[1]} / ${bg[1]} = ${ratio.toFixed(2)}:1`);
  }
  assert.deepEqual(
    [...bad].slice(0, 8),
    [],
    "작은 글씨는 4.5:1 이 필요합니다. 색상과 채도는 두고 명도만 낮추면 인상이 유지됩니다.",
  );
});
