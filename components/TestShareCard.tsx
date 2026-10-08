"use client";

import { useEffect, useState } from "react";
import SharePanel from "./SharePanel";
import { cardFont as font, centerWrap, inkOn, loadImage, mix, mixRgb, rgb } from "../lib/card-draw";
import { MORI, moriImage, testMoriImage } from "../lib/mori";
import { readMyMori } from "../lib/my-mori";
import { onResultLinkClick } from "../lib/test-events";
import { SITE_DOMAIN } from "../lib/site-config";

/**
 * 다른 테스트(53개) 결과의 공유 카드 (2026-10-04).
 *
 *  B. MBTI 를 했던 사람: 내 모리 × 이 테스트 결과 — 「INFP 모리 × 불안형 애착」. 사람마다 조합이 달라
 *     공유할 이유가 생깁니다. 내 유형은 lib/my-mori.ts 가 이 기기에만 기억해 둡니다.
 *  A. 결과 전용 모리 그림이 있는 테스트(상위 3개 시험): 그 그림.
 *  C. 둘 다 없으면: 결과마다 구워 둔 카드 이미지 + 「MBTI로 내 모리 찾기」 — 다른 테스트에서 MBTI 로 넘어가는 길.
 */
type CardInput = {
  slug: string;
  resultKey: string;
  testTitle: string;
  displayName: string;
  tagline: string;
  traits: string[];
  color: string;
};

async function drawTestCard(c: CardInput, myMori: string | null): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const accent = myMori ? MORI[myMori].color : c.color;

  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, mix(accent, 255, 0.86));
  bg.addColorStop(1, mix(c.color, 255, 0.66));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 40);
  ctx.fillText(myMori ? `${myMori} 모리의 ${c.testTitle}` : c.testTitle, 540, 150);

  const resultMori = testMoriImage(c.slug, c.resultKey);
  if (myMori || resultMori) {
    const img = await loadImage(myMori ? moriImage(myMori) : resultMori!);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(130, 210, 820, 820, 64);
    ctx.clip();
    ctx.drawImage(img, 130, 210, 820, 820);
    ctx.restore();
    if (myMori) {
      // 내 모리가 이 결과를 달고 있다는 표시: 그림 아래쪽에 결과 이름 리본
      const ribbon = mixRgb(c.color, 0, 0.1);
      ctx.fillStyle = rgb(ribbon);
      ctx.beginPath();
      ctx.roundRect(190, 950, 700, 110, 55);
      ctx.fill();
      ctx.fillStyle = inkOn(ribbon);
      ctx.font = font(900, 52);
      ctx.fillText(c.displayName, 540, 1023, 640);
    }
  } else {
    const img = await loadImage(`/images/og/r/${c.slug}-${c.resultKey}.png`);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(60, 330, 960, 504, 40);
    ctx.clip();
    ctx.drawImage(img, 60, 330, 960, 504);
    ctx.restore();
  }

  // 그림(내 모리·결과 모리)이 있으면 그림이 1030 까지 내려오므로 제목을 그 아래에서 시작합니다.
  const hasPicture = Boolean(myMori || resultMori);
  ctx.fillStyle = mix(c.color, 0, 0.35);
  ctx.font = font(900, myMori ? 64 : 96);
  const nameBottom = centerWrap(ctx, myMori ? `${myMori} 모리 × ${c.displayName}` : c.displayName, 540, hasPicture ? 1170 : 1100, 940, myMori ? 78 : 110);
  ctx.fillStyle = "#4b5266";
  ctx.font = font(600, 40);
  const tagBottom = centerWrap(ctx, c.tagline, 540, nameBottom + 90, 900, 54);

  // 특징 알약 세 개
  ctx.font = font(800, 34);
  const pills = c.traits.slice(0, 3);
  const widths = pills.map((t) => ctx.measureText(t).width + 56);
  let x = 540 - (widths.reduce((a, b) => a + b, 0) + (pills.length - 1) * 16) / 2;
  const py = tagBottom + 70;
  const pillRgb = mixRgb(c.color, 255, 0.15);
  pills.forEach((t, i) => {
    ctx.fillStyle = rgb(pillRgb);
    ctx.beginPath();
    ctx.roundRect(x, py, widths[i], 70, 35);
    ctx.fill();
    ctx.fillStyle = inkOn(pillRgb);
    ctx.fillText(t, x + widths[i] / 2, py + 47);
    x += widths[i] + 16;
  });

  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 38);
  ctx.fillText(myMori ? "너는 어떤 결과야?" : "나는 어떤 모리일까? MBTI로 내 캐릭터 찾기", 540, 1790);
  ctx.fillStyle = "#4b5266";
  ctx.font = font(700, 34);
  ctx.fillText(`${SITE_DOMAIN} 무료 심리테스트`, 540, 1860);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function TestShareCard(props: CardInput & { shareText: string }) {
  // localStorage 는 브라우저에서만 읽힙니다. 첫 렌더 뒤에 읽어야 서버 렌더와 어긋나지 않습니다.
  const [myMori, setMyMori] = useState<string | null | undefined>(undefined);
  useEffect(() => setMyMori(readMyMori()), []);
  if (myMori === undefined) return null;

  const { slug, resultKey, displayName, testTitle, shareText } = props;
  return (
    <SharePanel
      draw={() => drawTestCard(props, myMori)}
      drawKey={[slug, resultKey, displayName, myMori ?? "-"].join("|")}
      fileName={`${slug}-${resultKey}.png`}
      url={`${location.origin}/tests/${slug}/r/${resultKey}/`}
      // shareText 가 이미 「나는 …!」 로 시작해서 앞에 이름을 또 붙이지 않습니다.
      text={`${shareText} 너도 해 봐 👀`}
      linkTitle={testTitle}
      lead={myMori ? `내 ${myMori} 모리가 받은 결과예요. 친구 결과도 물어보세요.` : "결과 카드를 친구에게 보여 주고, 친구 결과도 물어보세요."}
      previewAlt={`${displayName} 공유 카드 미리보기`}
      channels={{ image: "test-image", link: "test-link", threads: "test-threads", copy: "test-copy" }}
    >
      {myMori ? null : (
        <a className="mori-find-cta" href="/tests/mbti/" onClick={onResultLinkClick("test-mori-cta")}>
          🧩 아직 내 모리가 없어요 — <b>MBTI로 내 캐릭터 찾기 →</b>
        </a>
      )}
    </SharePanel>
  );
}
