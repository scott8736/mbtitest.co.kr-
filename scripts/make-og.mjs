/**
 * 결과별 공유 이미지(OG 카드) 생성기.
 *
 * 왜 빌드가 아니라 스크립트로 미리 굽나
 *   satori 로 한글을 그리려면 한글 폰트 파일이 필요한데, 10MB 짜리를 저장소에
 *   넣고 배포 빌드마다 읽게 할 이유가 없습니다. 결과 종류는 테스트를 추가할
 *   때만 늘어나므로, 여기서 한 번 구워 PNG 를 커밋하고 빌드는 그 파일을
 *   그대로 서빙합니다. 폰트는 scripts/fonts/ 에 두고 저장소에서는 제외합니다.
 *
 * 왜 결과마다 따로 굽나
 *   카카오톡·트위터 같은 곳은 공유된 주소의 og:image 를 그대로 읽습니다.
 *   쿼리스트링으로는 바뀌지 않으므로, 결과마다 주소가 따로 있어야 하고
 *   (/tests/{slug}/r/{result}/) 그 주소마다 이미지가 따로 있어야 합니다.
 *   사이트 로고가 뜨는 썸네일은 아무도 누르지 않습니다.
 *
 * 사용법
 *   node scripts/make-og.mjs           # 없는 것만 생성
 *   node scripts/make-og.mjs --force   # 전부 다시 생성
 *
 * 출력: public/images/og/r/{slug}-{resultKey}.png (1200x630)
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import satori from "satori";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(root, "public", "images", "og", "r");
const FONT_PATH = join(root, "scripts", "fonts", "GothicA1-Bold.ttf");

const WIDTH = 1200;
const HEIGHT = 630;

/** 라이브러리 파일들이 확장자 없이 서로를 import 하므로 esbuild 로 한 번 묶습니다. */
async function loadTests() {
  const { outputFiles } = await build({
    stdin: {
      contents: `export { genericTests } from "./lib/generic-tests";
                 export { testCatalog } from "./lib/test-catalog";
                 export { typeData } from "./lib/mbti-data";`,
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

/**
 * 카드 구성.
 *
 * 썸네일은 대개 작게 보입니다. 그래서 결과 이름을 크게 하나 두고 나머지는
 * 받쳐주는 정도로만 둡니다. 줄이 많으면 축소됐을 때 전부 안 읽힙니다.
 */
function card({ eyebrow, name, tagline, traits, color }) {
  return el("div", {
    style: {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      backgroundImage: `linear-gradient(120deg, #12261f 0%, #1b3a49 34%, ${color} 96%)`,
      color: "#ffffff",
      fontFamily: "NotoKR",
    },
    children: [
      el("div", {
        style: { display: "flex", flexDirection: "column" },
        children: [
          // 결과 색을 글자 뒤가 아니라 이 막대로 보여줍니다. 배경에만 색을 쓰면
          // 밝은 색 결과에서 흰 글씨가 읽히지 않고, 어두운 색 결과끼리는
          // 썸네일에서 구분이 안 됩니다.
          el("div", {
            style: {
              display: "flex",
              width: 104,
              height: 12,
              borderRadius: 999,
              backgroundColor: color,
              marginBottom: 30,
            },
          }),
          text(eyebrow, {
            fontSize: 26,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.72)",
            marginBottom: 26,
          }),
          text(name, {
            fontSize: name.length > 10 ? 76 : 94,
            lineHeight: 1.12,
            letterSpacing: -2,
            marginBottom: 18,
          }),
          text(tagline, {
            fontSize: 32,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.9)",
            maxWidth: 940,
          }),
        ],
      }),
      el("div", {
        style: { display: "flex", flexDirection: "column" },
        children: [
          el("div", {
            style: { display: "flex", gap: 14, marginBottom: 34 },
            children: traits.slice(0, 3).map((trait) =>
              text(trait, {
                display: "flex",
                padding: "14px 28px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.16)",
                fontSize: 28,
              }),
            ),
          }),
          el("div", {
            style: { display: "flex", alignItems: "center", gap: 18 },
            children: [
              text("나도 테스트하기", { fontSize: 30 }),
              text("mbtitest.co.kr", {
                fontSize: 26,
                color: "rgba(255,255,255,0.66)",
              }),
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
    console.error(
      `한글 폰트를 찾지 못했습니다: ${FONT_PATH}\n` +
        "고딕 A1 또는 나눔고딕 같은 정적 인스턴스 한글 폰트(OFL) 을 그 경로에 두고 다시 실행하세요. 저장소에는 포함하지 않습니다.",
    );
    return 1;
  }

  const { genericTests, testCatalog, typeData } = await loadTests();
  await mkdir(OUT_DIR, { recursive: true });

  const fonts = [{ name: "NotoKR", data: font, weight: 700, style: "normal" }];

  let made = 0;
  let skipped = 0;
  const failed = [];

  for (const [slug, test] of Object.entries(genericTests)) {
    const item = testCatalog.find((entry) => entry.slug === slug);
    for (const [key, result] of Object.entries(test.results)) {
      const file = join(OUT_DIR, `${slug}-${key}.png`);
      if (!force && (await exists(file))) {
        skipped += 1;
        continue;
      }
      try {
        const svg = await satori(
          card({
            eyebrow: item?.title || test.title,
            name: result.name,
            tagline: result.tagline,
            traits: result.traits || [],
            color: result.color || "#738b6d",
          }),
          { width: WIDTH, height: HEIGHT, fonts },
        );
        await writeFile(file, await sharp(Buffer.from(svg)).png().toBuffer());
        made += 1;
      } catch (error) {
        failed.push(`${slug}-${key}: ${String(error).slice(0, 120)}`);
      }
    }
  }

  // MBTI 16유형. 방문이 가장 많은 검사인데 결과 카드가 없어서, 결과 화면에
  // 띄울 그림도 공유 썸네일도 없었습니다. 파일 이름은 mbti-{소문자코드}.png 입니다
  // (genericTests 의 mbti-love-compatibility-* 와 겹치지 않습니다).
  for (const [code, info] of Object.entries(typeData)) {
    const file = join(OUT_DIR, `mbti-${code.toLowerCase()}.png`);
    if (!force && (await exists(file))) {
      skipped += 1;
      continue;
    }
    try {
      const svg = await satori(
        card({
          eyebrow: "무료 MBTI 검사",
          // 네 글자를 가장 크게 둡니다. 썸네일로 줄어들면 이것만 읽힙니다.
          name: code,
          tagline: `${info.name} · ${info.tagline}`,
          traits: info.strengths || [],
          color: info.color || "#738b6d",
        }),
        { width: WIDTH, height: HEIGHT, fonts },
      );
      await writeFile(file, await sharp(Buffer.from(svg)).png().toBuffer());
      made += 1;
    } catch (error) {
      failed.push(`mbti-${code}: ${String(error).slice(0, 120)}`);
    }
  }

  console.log(`생성 ${made}장 / 건너뜀 ${skipped}장 / 실패 ${failed.length}장`);
  if (failed.length) failed.slice(0, 10).forEach((line) => console.log(`  ${line}`));
  console.log(`출력 위치: ${OUT_DIR}`);
  return failed.length ? 1 : 0;
}

process.exitCode = await main();
void dirname;
