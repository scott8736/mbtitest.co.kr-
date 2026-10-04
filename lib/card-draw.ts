/**
 * 공유 카드(9:16) 그리기에 쓰는 작은 도구들. MBTI 모리 카드와 다른 테스트 카드가 같이 씁니다.
 */

export const mixRgb = (hex: string, toward: number, t: number): number[] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (toward - v) * t));
};

export const rgb = (c: number[]) => `rgb(${c.join(",")})`;

export const mix = (hex: string, toward: number, t: number) => rgb(mixRgb(hex, toward, t));

/** 바탕색이 진하면 흰 글자, 밝으면 짙은 남색 글자. 진한 막대 위 검은 글자가 안 읽혔습니다(2026-10-04 휴대폰 확인). */
export const inkOn = (c: number[]): string => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3 ? "#ffffff" : "#1c2034";
};

export const cardFont = (weight: number, size: number) =>
  `${weight} ${size}px Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

/** 가운데 정렬로 maxWidth 안에 줄을 나눠 씁니다. 그린 마지막 줄의 y 를 돌려줍니다. */
export function centerWrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines);
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + (shown.length - 1) * lineHeight;
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}
