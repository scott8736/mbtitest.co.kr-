export const ADSENSE_CLIENT = "ca-pub-8646375689901020";

/**
 * 자리별 광고 슬롯 등록표.
 *
 * 애드센스에서 광고 단위를 새로 만들 때마다 아래 slot 값만 바꿔주면 됩니다.
 * 자리마다 슬롯을 나눠야 애드센스 보고서에서 "어느 자리가 얼마를 벌었는지"
 * 광고 단위별로 비교할 수 있습니다.
 *
 * NEW_UNIT 으로 표시된 자리는 아직 전용 광고 단위를 만들지 않은 곳입니다.
 * 그동안은 기존 디스플레이 단위로 대신 노출되므로 수익 공백은 없고,
 * 실제 슬롯 ID를 넣는 순간 해당 형식(멀티플렉스·인피드)으로 바뀝니다.
 */

/** 아직 애드센스에서 단위를 만들지 않은 자리 표시 */
const NEW_UNIT = "" as const;

/** 기존에 쓰던, 실제로 노출되고 있는 단위 두 개 */
const DISPLAY_UNIT = "4581470308";
const IN_ARTICLE_UNIT = "5081143693";

export type AdFormat = "display" | "inArticle" | "inFeed" | "multiplex";

export type AdPosition =
  | "resultTop"
  | "resultMiddle"
  | "resultBottom"
  | "testIntro"
  | "testListFeed"
  | "blogListFeed"
  | "articleTop"
  | "articleBody"
  | "pageFooter";

export type AdSlotConfig = {
  /** 애드센스 광고 단위 ID. 비어 있으면 아래 fallback 형식으로 노출됩니다. */
  slot: string;
  format: AdFormat;
  /** 인피드 단위에만 필요합니다. 애드센스 코드의 data-ad-layout-key 값. */
  layoutKey?: string;
  /** 사람이 읽는 자리 이름. 보고서와 대조할 때 씁니다. */
  name: string;
};

export const adSlots: Record<AdPosition, AdSlotConfig> = {
  // 결과 화면 — 페이지당 노출이 가장 많은 자리입니다.
  resultTop: { slot: DISPLAY_UNIT, format: "display", name: "결과 상단" },
  resultMiddle: { slot: IN_ARTICLE_UNIT, format: "inArticle", name: "결과 본문 중간" },
  resultBottom: { slot: NEW_UNIT, format: "multiplex", name: "결과 하단(멀티플렉스)" },

  // 검사 시작 화면 — 문항 진행 중에는 광고를 넣지 않습니다(오클릭 방지).
  testIntro: { slot: DISPLAY_UNIT, format: "display", name: "검사 시작 전" },

  // 목록 화면 — 카드 사이에 섞이는 인피드 형식이 자연스럽습니다.
  testListFeed: { slot: NEW_UNIT, format: "inFeed", name: "테스트 목록 인피드" },
  blogListFeed: { slot: NEW_UNIT, format: "inFeed", name: "블로그 목록 인피드" },

  // 읽는 화면 — 유형·궁합·콘텐츠 글.
  articleTop: { slot: DISPLAY_UNIT, format: "display", name: "콘텐츠 상단" },
  articleBody: { slot: IN_ARTICLE_UNIT, format: "inArticle", name: "콘텐츠 본문" },

  // 모든 페이지 하단 공통.
  pageFooter: { slot: DISPLAY_UNIT, format: "display", name: "페이지 하단" },
};

/**
 * 전용 단위가 아직 없으면 기존 디스플레이 단위로 내려서 노출합니다.
 * 멀티플렉스·인피드 형식은 그 형식으로 만든 단위에서만 동작하기 때문에,
 * 슬롯 ID가 없는 채로 형식만 지정하면 빈 자리가 됩니다.
 */
export function resolveAdSlot(position: AdPosition): {
  slot: string;
  format: AdFormat;
  layoutKey?: string;
  name: string;
} {
  const config = adSlots[position];
  if (config.slot) return config;
  return { slot: DISPLAY_UNIT, format: "display", name: `${config.name} (임시 디스플레이)` };
}

/** 형식별로 <ins> 에 붙는 애드센스 속성 */
export function adAttributes(format: AdFormat, layoutKey?: string) {
  switch (format) {
    case "inArticle":
      return { "data-ad-format": "fluid", "data-ad-layout": "in-article" } as const;
    case "inFeed":
      return { "data-ad-format": "fluid", "data-ad-layout-key": layoutKey } as const;
    case "multiplex":
      return { "data-ad-format": "autorelaxed" } as const;
    default:
      return { "data-ad-format": "auto", "data-full-width-responsive": "true" } as const;
  }
}
