"use client";

import { useEffect } from "react";
import SharePanel from "./SharePanel";
import { cardFont as font, inkOn, loadImage, mix, mixRgb, rgb } from "../lib/card-draw";
import { MORI, moriImage, moriSharePath, shareText } from "../lib/mori";
import { MORI_WORLD, VILLAGES, villageOf } from "../lib/mori-world";
import { saveMyMori } from "../lib/my-mori";

type Percent = { axis: string; left: string; right: string; value: number };

/** 결과 화면 맨 위의 캐릭터. 예전 결과 카드 이미지(1200x630) 자리입니다. 내 유형을 기억해 다른 테스트 카드에 씁니다. */
export function MoriPortrait({ code, name }: { code: string; name: string }) {
  useEffect(() => saveMyMori(code), [code]);
  const mori = MORI[code];
  if (!mori) return null;
  return (
    <figure className="mori-portrait" style={{ "--mori": mori.color } as React.CSSProperties}>
      {MORI_WORLD[code] && <p className="mori-portrait-says">“{MORI_WORLD[code].says}”</p>}
      <img src={moriImage(code)} width={720} height={720} alt={`${code} ${name} 모리 캐릭터`} />
      {/* 「당신의 MBTI는」 대신 세계관 말투로 (모리 세계관 기획서, 2026-10-04) */}
      <figcaption>당신 마음숲에 사는 모리는 <b>{code} 모리</b>{MORI_WORLD[code] && <> · {VILLAGES[villageOf(code)].name}</>}</figcaption>
    </figure>
  );
}

/** 인스타 스토리용 9:16 카드를 그립니다. 성향 % 가 들어가 같은 유형이라도 사람마다 카드가 다릅니다. */
async function drawStoryCard(code: string, name: string, tagline: string, percents: Percent[], best: string): Promise<Blob | null> {
  const mori = MORI[code];
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx || !mori) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, mix(mori.color, 255, 0.86));
  bg.addColorStop(1, mix(mori.color, 255, 0.62));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 40);
  ctx.fillText("나의 MBTI 캐릭터", 540, 150);

  const img = await loadImage(moriImage(code));
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(130, 210, 820, 820, 64);
  ctx.clip();
  ctx.drawImage(img, 130, 210, 820, 820);
  ctx.restore();

  ctx.fillStyle = mix(mori.color, 0, 0.4);
  ctx.font = font(900, 150);
  ctx.fillText(`${code} 모리`, 540, 1215);
  ctx.fillStyle = "#1c2034";
  ctx.font = font(800, 56);
  ctx.fillText(name, 540, 1300);
  ctx.fillStyle = "#4b5266";
  ctx.font = font(600, 38);
  ctx.fillText(tagline, 540, 1362);

  // 성향 막대: 더 높은 쪽 글자와 %
  percents.forEach((p, i) => {
    const y = 1450 + i * 72;
    const leftWins = p.value >= 50;
    const pct = leftWins ? p.value : 100 - p.value;
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.roundRect(200, y, 680, 30, 15);
    ctx.fill();
    const barRgb = mixRgb(mori.color, 0, 0.15);
    ctx.fillStyle = rgb(barRgb);
    ctx.beginPath();
    ctx.roundRect(leftWins ? 200 : 200 + 680 * (1 - pct / 100), y, 680 * (pct / 100), 30, 15);
    ctx.fill();
    ctx.fillStyle = "#1c2034";
    ctx.font = font(800, 34);
    ctx.textAlign = "right";
    ctx.fillText(p.left, 180, y + 27);
    ctx.textAlign = "left";
    ctx.fillText(p.right, 900, y + 27);
    ctx.textAlign = "center";
    ctx.font = font(800, 26);
    ctx.fillStyle = inkOn(barRgb);
    ctx.fillText(`${leftWins ? p.left : p.right} ${pct}%`, leftWins ? 200 + 680 * (pct / 100) / 2 : 880 - 680 * (pct / 100) / 2, y + 23);
  });

  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 40);
  ctx.fillText(`찰떡궁합은 ${best} 모리`, 540, 1790);
  ctx.fillStyle = "#4b5266";
  ctx.font = font(700, 34);
  ctx.fillText("너는 어떤 모리? · mbtitest.co.kr", 540, 1860);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** 결과 설명 바로 아래 카드 미리보기와 공유 버튼. */
export function MoriShare({ code, name, tagline, percents, best }: { code: string; name: string; tagline: string; percents: Percent[]; best: string }) {
  return (
    <SharePanel
      draw={() => drawStoryCard(code, name, tagline, percents, best)}
      drawKey={[code, name, tagline, best, ...percents.map((p) => p.value)].join("|")}
      fileName={`mori-${code.toLowerCase()}.png`}
      url={`${location.origin}${moriSharePath(code)}`}
      text={shareText(code, name)}
      linkTitle={`나는 ${code} 모리`}
      lead="내 모리를 친구에게 보여 주고, 친구는 어떤 모리인지 물어보세요."
      previewAlt={`${code} 모리 공유 카드 미리보기`}
      channels={{ image: "mori-image", link: "mori-link", threads: "mori-threads", copy: "mori-copy" }}
    />
  );
}
