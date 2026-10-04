"use client";

import { useEffect, useState } from "react";
import SharePanel from "./SharePanel";
import { cardFont as font, centerWrap, inkOn, loadImage, mix, mixRgb, rgb } from "../lib/card-draw";
import { MORI, moriImage } from "../lib/mori";
import { readMyMori } from "../lib/my-mori";
import { onResultLinkClick } from "../lib/test-events";

/**
 * 성향 테스트 밖의 결과 화면(IQ·자가진단·운세·사주·궁합·타로)에 붙이는 공유 카드 (2026-10-04).
 *
 * MBTI 모리 카드·성향 테스트 카드와 같은 공유판(SharePanel)을 씁니다. 결과마다 그림이 따로 없으니
 * 큰 숫자·기호(점수, 타로 기호, 일간 글자)를 동그라미에 넣고, MBTI 를 했던 사람이면 그 옆에 내 모리를
 * 세웁니다 — 「내 모리가 받은 오늘의 운세」. 공유 수는 성향 테스트와 같은 test-* 로 셉니다.
 */
export type ResultShareProps = {
  /** 파일 이름·다시 그리기 판단에 씁니다. 결과가 바뀌면 같이 바뀌어야 합니다 */
  id: string;
  /** 카드 맨 위 한 줄 (예: 「IQ 퍼즐 20문제」) */
  kicker: string;
  /** 동그라미 안 큰 글자 (점수·기호) */
  big: string;
  /** 큰 글자 아래 작은 글자 (예: 「총운」) */
  bigLabel?: string;
  headline: string;
  sub?: string;
  pills?: string[];
  color: string;
  /** 친구가 눌러서 들어올 페이지 (예: /tests/iq/). 생략하면 지금 페이지 */
  path?: string;
  shareText: string;
  linkTitle: string;
};

async function drawResultCard(c: ResultShareProps, myMori: string | null): Promise<Blob | null> {
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
  ctx.fillText(myMori ? `${myMori} 모리의 ${c.kicker}` : c.kicker, 540, 150, 960);

  // 큰 동그라미: 내 모리가 있으면 오른쪽 아래에 작게 붙이고, 없으면 가운데 크게
  const circle = mixRgb(c.color, 0, 0.08);
  const drawBig = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgb(circle);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = inkOn(circle);
    const size = Math.round(r * (c.big.length <= 2 ? 0.95 : c.big.length <= 4 ? 0.62 : 0.46));
    ctx.font = font(900, size);
    ctx.textBaseline = "middle";
    ctx.fillText(c.big, cx, c.bigLabel ? cy - r * 0.12 : cy, r * 1.7);
    if (c.bigLabel) {
      ctx.font = font(800, Math.round(r * 0.2));
      ctx.fillText(c.bigLabel, cx, cy + r * 0.5, r * 1.6);
    }
    ctx.textBaseline = "alphabetic";
  };

  // 그림 + 글 덩어리 전체 높이를 먼저 재서 카드 가운데(220~1700)에 놓습니다.
  // 위에서부터 채우면 결과 글이 짧을 때 아래 절반이 비어 보입니다.
  const lineCount = (text: string, f: string, maxWidth: number) => {
    ctx.font = f;
    let lines = 1;
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines++;
        line = word;
      } else line = next;
    }
    return Math.min(lines, 2);
  };
  const headFont = font(900, 84);
  const subFont = font(600, 44);
  const pictureH = myMori ? 800 : 720;
  const headLines = lineCount(c.headline, headFont, 940);
  const subLines = c.sub ? lineCount(c.sub, subFont, 900) : 0;
  const blockH =
    pictureH + 150 + (headLines - 1) * 102 + (subLines ? 96 + (subLines - 1) * 60 : 0) + (c.pills?.length ? 140 : 0);
  const top = Math.max(210, 210 + (1700 - 210 - blockH) / 2);

  if (myMori) {
    const img = await loadImage(moriImage(myMori));
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(150, top, 720, 720, 60);
    ctx.clip();
    ctx.drawImage(img, 150, top, 720, 720);
    ctx.restore();
    drawBig(830, top + 650, 175);
  } else {
    drawBig(540, top + 360, 345);
  }

  ctx.fillStyle = mix(c.color, 0, 0.35);
  ctx.font = headFont;
  const headBottom = centerWrap(ctx, c.headline, 540, top + pictureH + 150, 940, 102);
  let y = headBottom;
  if (c.sub) {
    ctx.fillStyle = "#4b5266";
    ctx.font = subFont;
    y = centerWrap(ctx, c.sub, 540, headBottom + 96, 900, 60);
  }

  const pills = (c.pills ?? []).slice(0, 4);
  if (pills.length) {
    ctx.font = font(800, 34);
    const widths = pills.map((t) => ctx.measureText(t).width + 56);
    let x = 540 - (widths.reduce((a, b) => a + b, 0) + (pills.length - 1) * 16) / 2;
    const py = y + 70;
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
  }

  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 38);
  ctx.fillText(myMori ? "너는 어떤 결과야?" : "너도 해 봐! 나는 어떤 결과일까?", 540, 1790);
  ctx.fillStyle = "#4b5266";
  ctx.font = font(700, 34);
  ctx.fillText("mbtitest.co.kr 무료 심리테스트·운세", 540, 1860);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function ResultShareCard(props: ResultShareProps) {
  // localStorage 는 브라우저에서만 읽힙니다. 첫 렌더 뒤에 읽어야 서버 렌더와 어긋나지 않습니다.
  const [myMori, setMyMori] = useState<string | null | undefined>(undefined);
  useEffect(() => setMyMori(readMyMori()), []);
  if (myMori === undefined) return null;

  return (
    <SharePanel
      draw={() => drawResultCard(props, myMori)}
      drawKey={[props.id, props.big, props.headline, myMori ?? "-"].join("|")}
      fileName={`${props.id}.png`}
      url={`${location.origin}${props.path ?? location.pathname}`}
      text={`${props.shareText} 너도 해 봐 👀`}
      linkTitle={props.linkTitle}
      lead={myMori ? `내 ${myMori} 모리가 받은 결과예요. 친구 결과도 물어보세요.` : "결과 카드를 친구에게 보여 주고, 친구 결과도 물어보세요."}
      previewAlt={`${props.headline} 공유 카드 미리보기`}
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
