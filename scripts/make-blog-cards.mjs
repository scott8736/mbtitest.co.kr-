/**
 * 블로그 글의 대표 이미지 생성기.
 *
 * 왜 직접 굽나
 *   유튜브 화면이나 보도사진을 캡처해 쓰면 저작권과 초상권이 걸립니다. 광고가
 *   붙는 사이트라 더 그렇습니다. 대신 글이 이미 가진 값 — 제목과 멤버별 유형 —
 *   으로 카드를 만들면 권리 문제가 없고, 정보도 더 들어갑니다.
 *
 * 무엇을 그리나
 *   제목 한 줄과, 글 첫 섹션의 목록(멤버별 유형)을 칩으로 올립니다. 목록이 없는
 *   글은 키워드를 대신 씁니다. 인물 사진이 아니라 유형 표라, 썸네일로 줄어도
 *   무슨 글인지 읽힙니다.
 *
 * 사용법
 *   node scripts/make-blog-cards.mjs           # 없는 것만 생성
 *   node scripts/make-blog-cards.mjs --force   # 전부 다시 생성
 *
 * 출력: public/images/blog/{slug}.png (1200x630)
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import satori from "satori";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(root, "public", "images", "blog");
const FONT_PATH = join(root, "scripts", "fonts", "GothicA1-Bold.ttf");

const WIDTH = 1200;
const HEIGHT = 630;

// 글마다 색을 다르게 줍니다. 블로그 목록에서 카드가 나란히 놓이면
// 전부 같은 색일 때 한 장처럼 뭉쳐 보입니다.
const ACCENTS = ["#7657d6", "#ff8e7a", "#4f9685", "#c2763f", "#5f7fae", "#c56e93", "#8a6a9e", "#d9683f"];

async function loadPosts() {
  const { outputFiles } = await build({
    stdin: {
      contents: `export { blogPosts } from "./lib/blog-posts";`,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "neutral",
    write: false,
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
  );
}

const el = (type, props) => ({ type, props });
const text = (value, style) => el("div", { style, children: value });

/** 카드에 올릴 짧은 항목들을 고릅니다. 멤버별 유형이 있으면 그게 1순위입니다. */
function chipsFor(post) {
  const listed = post.sections.find((s) => s.bullets && s.bullets.length);
  // 목록이 짧은 항목일 때만 칩으로 씁니다. 문장 목록(조언 등)은 칩에 넘쳐 겹쳤습니다(2026-10-05).
  const short = (x) => x.length <= 16;
  if (listed) {
    const items = listed.bullets.map((line) => line.split("—")[0].trim()).filter(Boolean);
    if (items.every(short)) return items.slice(0, 9);
  }
  return (post.keywords || []).filter((k) => k.length <= 12).slice(0, 4);
}

/** 멤버별 유형이 있으면 "이름 유형" 형태로 한 줄씩 보여줍니다. */
function pairsFor(post) {
  const listed = post.sections.find((s) => s.bullets && s.bullets.length);
  if (!listed) return [];
  const pairs = listed.bullets
    .map((line) => {
      const [name, value] = line.split("—").map((x) => (x || "").trim());
      return value ? { name, value: value.replace(/\s*\(.*\)$/, "") } : null;
    })
    .filter(Boolean)
    .slice(0, 9);
  // 「이름 — 짧은 값」(예: RM — ENFP)일 때만 짝 칩. 값이 문장이면 넘쳐서 키워드 칩으로 넘깁니다(2026-10-05).
  return pairs.every((p) => p.name.length <= 18 && p.value.length <= 10) ? pairs : [];
}

// 2026-10-05 모리 마음숲 톤: 파스텔 바탕 + 오른쪽 위 모리. 제목에 유형이 있으면 그 모리, 없으면 글마다 고정된 모리.
const MORI16 = ["ENFP", "ISTJ", "INFJ", "ESTP", "ISFP", "ENTJ", "ESFJ", "INTP", "INFP", "ESTJ", "ENFJ", "ISTP", "ESFP", "INTJ", "ISFJ", "ENTP"];
function moriFor(post, index) {
  const m = post.title.match(/(?<![A-Z])[EI][SN][TF][JP](?![A-Z])/);
  return m ? m[0] : MORI16[index % MORI16.length];
}
const moriCache = new Map();
async function moriDataUri(code) {
  if (!moriCache.has(code)) {
    const png = await sharp(join(root, "public", "characters", `mori-${code.toLowerCase()}.webp`)).resize(300, 300).png().toBuffer();
    moriCache.set(code, `data:image/png;base64,${png.toString("base64")}`);
  }
  return moriCache.get(code);
}

function card(post, accent, mori) {
  const pairs = pairsFor(post);
  const chips = pairs.length ? [] : chipsFor(post);

  return el("div", {
    style: {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "58px 66px",
      position: "relative",
      backgroundImage: `linear-gradient(135deg, #f1eaff 0%, #fbf7ff 46%, #fff3ea 78%, ${accent}33 100%)`,
      color: "#172a46",
      fontFamily: "NotoKR",
    },
    children: [
      el("img", {
        src: mori,
        width: 250,
        height: 250,
        style: { position: "absolute", top: 54, right: 60, borderRadius: 64, border: "8px solid #ffffff", boxShadow: "0 18px 40px rgba(91,69,176,0.18)" },
      }),
      el("div", {
        style: { display: "flex", flexDirection: "column" },
        children: [
          el("div", {
            style: {
              display: "flex",
              width: 96,
              height: 11,
              borderRadius: 999,
              backgroundColor: accent,
              marginBottom: 26,
            },
          }),
          text(`16모리 마음숲 · ${post.category}`, {
            fontSize: 24,
            letterSpacing: 1,
            color: "#6a55ae",
            marginBottom: 22,
          }),
          text(post.title.split("—")[0].trim(), {
            fontSize: post.title.length > 26 ? 58 : 70,
            lineHeight: 1.18,
            letterSpacing: -2,
            maxWidth: 760,
          }),
        ],
      }),
      el("div", {
        style: { display: "flex", flexDirection: "column" },
        children: [
          pairs.length
            ? el("div", {
                style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 30 },
                children: pairs.map((p) =>
                  el("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "11px 18px",
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.88)",
                      border: "2px solid #e6def8",
                      fontSize: 25,
                    },
                    children: [
                      text(p.name, { color: "#5c6478" }),
                      text(p.value, { color: "#172a46" }),
                    ],
                  }),
                ),
              })
            : el("div", {
                style: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 30, maxWidth: 1060 },
                children: chips.map((c) =>
                  text(c, {
                    display: "flex",
                    padding: "12px 22px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.88)",
                      border: "2px solid #e6def8",
                    fontSize: 26,
                  }),
                ),
              }),
          el("div", {
            style: { display: "flex", alignItems: "center", gap: 16 },
            children: [
              text("내 모리 찾기 · 무료 MBTI 검사", { fontSize: 28, color: "#5b45b0" }),
              text("mbtitest.co.kr", { fontSize: 24, color: "#7d8197" }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const force = process.argv.includes("--force");

  let font;
  try {
    font = await readFile(FONT_PATH);
  } catch {
    console.error(`한글 폰트를 찾지 못했습니다: ${FONT_PATH}`);
    return 1;
  }

  const { blogPosts } = await loadPosts();
  await mkdir(OUT_DIR, { recursive: true });
  const fonts = [{ name: "NotoKR", data: font, weight: 700, style: "normal" }];

  let made = 0;
  let skipped = 0;
  const failed = [];

  for (const [index, post] of blogPosts.entries()) {
    const file = join(OUT_DIR, `${post.slug}.png`);
    if (!force && (await exists(file))) {
      skipped += 1;
      continue;
    }
    try {
      const svg = await satori(card(post, ACCENTS[index % ACCENTS.length], await moriDataUri(moriFor(post, index))), {
        width: WIDTH,
        height: HEIGHT,
        fonts,
      });
      await writeFile(file, await sharp(Buffer.from(svg)).png().toBuffer());
      made += 1;
    } catch (error) {
      failed.push(`${post.slug}: ${String(error).slice(0, 120)}`);
    }
  }

  console.log(`생성 ${made}장 / 건너뜀 ${skipped}장 / 실패 ${failed.length}장`);
  failed.slice(0, 8).forEach((line) => console.log(`  ${line}`));
  console.log(`출력 위치: ${OUT_DIR}`);
  return failed.length ? 1 : 0;
}

process.exitCode = await main();
