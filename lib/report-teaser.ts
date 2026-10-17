/**
 * 리포트 흐린 미리보기 쪽 목록 (결과 화면 카드 ReportTeaser · 판매 페이지 ReportPreview 공용, 2026-10-18).
 *
 * public/report-app/teaser/<TYPE>.json (리포트_디자인/render_teaser.py 가 만듦, 본문 없음)을 읽어
 * 책 순서대로 쪽을 늘어놓고, 쪽마다 어느 장인지 이름표를 붙입니다(목차별 샘플 — 궁합·사주·돈이 눈에 띄게).
 * 사주 장은 생년월일을 넣어야 생기므로 104쪽에는 없고, 견본(s.webp)을 13개월 장 바로 앞에 끼웁니다.
 */
export type TeaserMeta = {
  total: number;
  cols: number;
  clear: number[];
  half: number[];
  scores?: number;
  saju?: boolean;
  chapters: { n: number; no: string; title: string }[];
};

export type TeaserSlide = {
  key: string;
  /** 쪽 번호. 사주 견본은 0 */
  n: number;
  kind: "clear" | "half" | "saju";
  src: string;
  /** 이 쪽이 속한 장의 시작 쪽(목차 칩에서 넘어갈 때 씀). 사주는 -1 */
  chapter: number;
  label: string;
};

export const SAJU_CHAPTER = -1;

/** 장 이름 앞에 붙는 표시. 사람들이 가장 궁금해하는 장(궁합·돈·연애·사주)을 눈에 띄게 합니다. */
const MARKS: [string, string][] = [
  ["16모리", "💞 궁합 · "],
  ["돈", "💰 "],
  ["연애", "💕 "],
  ["일하는", "💼 "],
  ["13개월", "📅 "],
  ["친구", "🤝 "],
  ["방전", "🔋 "],
  ["소장", "🖼️ "],
];

export function chapterLabel(c: { no: string; title: string }): string {
  const mark = MARKS.find(([k]) => c.title.includes(k))?.[1] ?? "";
  return `${mark}${c.no ? `${c.no} ` : ""}${c.title}`;
}

export const SAJU_LABEL = "🔮 사주 × 모리 · 생년월일을 넣으면 +6쪽";

export function teaserSlides(code: string, meta: TeaserMeta): TeaserSlide[] {
  const starts = [{ n: 1, no: "", title: "표지 · 차례" }, ...meta.chapters];
  const chapterOf = (n: number) => starts.filter((c) => c.n <= n).pop() ?? starts[0];
  const base = `/report-app/teaser/${code}`;
  const pages: TeaserSlide[] = [
    ...meta.clear.map((n) => ({ n, kind: "clear" as const })),
    ...meta.half.map((n) => ({ n, kind: "half" as const })),
  ]
    .sort((a, b) => a.n - b.n)
    .map(({ n, kind }) => {
      const c = chapterOf(n);
      return { key: `${kind}${n}`, n, kind, src: `${base}/${kind === "half" ? "h" : "c"}${n}.webp`, chapter: c.n, label: chapterLabel(c) };
    });
  if (!meta.saju) return pages;
  // 사주 견본은 13개월 장 바로 앞(실제 리포트에서 사주 장이 들어가는 자리)에
  const months = meta.chapters.find((c) => c.title.includes("13개월"))?.n ?? meta.total + 1;
  const at = pages.findIndex((p) => p.n >= months);
  const saju: TeaserSlide = { key: "saju", n: 0, kind: "saju", src: `${base}/s.webp`, chapter: SAJU_CHAPTER, label: SAJU_LABEL };
  return at < 0 ? [...pages, saju] : [...pages.slice(0, at), saju, ...pages.slice(at)];
}
