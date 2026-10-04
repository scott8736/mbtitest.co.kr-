"use client";

import { useEffect, useState } from "react";
import { MORI, moriImage, moriSharePath, shareText, type ShareChannel } from "../lib/mori";
import { recordShare } from "../lib/test-events";

type Percent = { axis: string; left: string; right: string; value: number };

/** 결과 화면 맨 위의 캐릭터. 예전 결과 카드 이미지(1200x630) 자리입니다. */
export function MoriPortrait({ code, name }: { code: string; name: string }) {
  const mori = MORI[code];
  if (!mori) return null;
  return (
    <figure className="mori-portrait" style={{ "--mori": mori.color } as React.CSSProperties}>
      <img src={moriImage(code)} width={720} height={720} alt={`${code} ${name} 모리 캐릭터`} />
      <figcaption>나의 캐릭터 <b>{code} 모리</b></figcaption>
    </figure>
  );
}

const mixRgb = (hex: string, toward: number, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (toward - v) * t));
};
const mix = (hex: string, toward: number, t: number) => `rgb(${mixRgb(hex, toward, t).join(",")})`;

/** 막대 색이 진하면(ESTJ 갈색·INTJ 남색 등) 막대 위 글자를 흰색으로. 검은 글자가 안 읽혔습니다(2026-10-04 휴대폰 확인). */
const inkOn = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3 ? "#ffffff" : "#1c2034";
};

/** 인스타 스토리용 9:16 카드를 그립니다. 성향 % 가 들어가 같은 유형이라도 사람마다 카드가 다릅니다. */
async function drawStoryCard(code: string, name: string, tagline: string, percents: Percent[], best: string): Promise<Blob | null> {
  const mori = MORI[code];
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx || !mori) return null;
  const font = (weight: number, size: number) => `${weight} ${size}px Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, mix(mori.color, 255, 0.86));
  bg.addColorStop(1, mix(mori.color, 255, 0.62));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.textAlign = "center";
  ctx.fillStyle = "#1c2034";
  ctx.font = font(700, 40);
  ctx.fillText("나의 MBTI 캐릭터", 540, 150);

  const img = new Image();
  img.src = moriImage(code);
  await img.decode();
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
    ctx.fillStyle = `rgb(${barRgb.join(",")})`;
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

/** 결과 설명 바로 아래 공유 버튼 네 개. 카카오 전용 버튼은 없습니다 — 카톡은 휴대폰 공유창으로 갑니다. */
export function MoriShare({ code, name, tagline, percents, best }: { code: string; name: string; tagline: string; percents: Percent[]; best: string }) {
  const [note, setNote] = useState("");
  // 카드는 화면이 열릴 때 미리 그려 둡니다. ① 공유될 모습을 먼저 보여 주고 ② 아이폰 사파리는 버튼을
  // 누른 직후에만 공유창을 열어 주는데, 누른 뒤에 그리면 그사이 허락이 풀려 공유창이 막힙니다.
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [zoom, setZoom] = useState(false);
  const percentKey = percents.map((p) => p.value).join(",");
  useEffect(() => {
    let alive = true;
    let made = "";
    drawStoryCard(code, name, tagline, percents, best)
      .then((blob) => {
        if (!alive || !blob) return;
        made = URL.createObjectURL(blob);
        setCard({ blob, url: made });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
    // percents 는 렌더마다 새 배열이라 값으로 비교합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, name, tagline, best, percentKey]);
  const url = `${location.origin}${moriSharePath(code)}`;
  const text = shareText(code, name);
  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(""), 2500);
  };

  const shareImage = async () => {
    recordShare("mori-image");
    const blob = card?.blob ?? (await drawStoryCard(code, name, tagline, percents, best));
    if (!blob) return;
    const file = new File([blob], `mori-${code.toLowerCase()}.png`, { type: "image/png" });
    // 휴대폰은 공유창에 이미지를 넘겨 인스타 스토리·카톡으로 바로 보냅니다. 안 되면 저장합니다.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        // 공유창을 닫은 것이면 끝. 공유가 막힌 것(NotAllowedError 등)이면 아래 저장으로 넘어갑니다.
        if ((error as Error).name === "AbortError") return;
      }
    }
    const link = document.createElement("a");
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    flash("카드를 저장했어요. 인스타 스토리에 올리고 링크 스티커로 사이트 주소를 붙여 보세요.");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      flash("링크를 복사했어요.");
    } catch {
      flash(url);
    }
  };

  const shareLink = async () => {
    recordShare("mori-link");
    if (navigator.share) {
      try {
        await navigator.share({ title: `나는 ${code} 모리`, text, url });
      } catch {
        // 공유창을 닫음
      }
      return;
    }
    await copy();
  };

  const threads = () => {
    recordShare("mori-threads");
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  };

  const copyLink = async () => {
    recordShare("mori-copy");
    await copy();
  };

  const buttons: Array<[ShareChannel, string, () => void]> = [
    ["mori-image", "📸 카드 저장 · 인스타 스토리", shareImage],
    ["mori-link", "💬 카톡 · 문자로 보내기", shareLink],
    ["mori-threads", "🧵 스레드에 올리기", threads],
    ["mori-copy", "🔗 링크 복사", copyLink],
  ];

  return (
    <div className="mori-share">
      <p className="mori-share-lead">내 모리를 친구에게 보여 주고, 친구는 어떤 모리인지 물어보세요.</p>
      <button type="button" className="mori-share-preview" onClick={() => card && setZoom(true)} aria-label="공유 카드 크게 보기" disabled={!card}>
        {card ? <img src={card.url} width={1080} height={1920} alt={`${code} 모리 공유 카드 미리보기`} /> : <span>카드 만드는 중…</span>}
        <small>{card ? "이 카드가 저장·공유돼요 · 눌러서 크게 보기" : ""}</small>
      </button>
      {zoom && card ? (
        <div className="mori-share-zoom" role="dialog" aria-label="공유 카드" onClick={() => setZoom(false)}>
          <img src={card.url} alt={`${code} 모리 공유 카드`} />
          <button type="button" onClick={() => setZoom(false)}>닫기</button>
        </div>
      ) : null}
      <div className="mori-share-buttons">
        {buttons.map(([key, label, onClick]) => (
          <button key={key} type="button" onClick={onClick}>{label}</button>
        ))}
      </div>
      <p className="mori-share-note" role="status">{note}</p>
    </div>
  );
}
