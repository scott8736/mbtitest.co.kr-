import { SITE_ORIGIN } from "./site-urls";

/** 운세 허브에 노출되는 메뉴. 사이트맵과 내부링크가 이 목록을 함께 씁니다. */
export type FortuneEntry = {
  href: string;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  keywords: string[];
  /** 도구형(입력 후 결과) 인지, 읽는 콘텐츠인지 */
  kind: "tool" | "content";
};

export const fortuneEntries: FortuneEntry[] = [
  {
    href: "/fortune/today/",
    title: "오늘의 운세",
    shortTitle: "오늘의 운세",
    description: "생년월일만 넣으면 오늘의 총운과 연애·재물·직장·건강 지수를 바로 확인합니다.",
    emoji: "☀️",
    keywords: ["오늘의 운세", "오늘의운세 무료", "생년월일 운세"],
    kind: "tool",
  },
  {
    href: "/fortune/saju/",
    title: "무료 사주 풀이",
    shortTitle: "무료 사주",
    description: "생년월일시로 사주 네 기둥과 오행 분포, 일간 성향을 계산해 풀이합니다.",
    emoji: "📜",
    keywords: ["무료 사주", "사주 풀이", "사주팔자 무료", "만세력"],
    kind: "tool",
  },
  {
    href: "/fortune/saju-mbti/",
    title: "사주 MBTI",
    shortTitle: "사주 MBTI",
    description: "사주에서 읽은 기질과 내가 아는 MBTI가 얼마나 겹치는지 비교합니다.",
    emoji: "🔮",
    keywords: ["사주 MBTI", "사주 성격", "MBTI 사주 궁합"],
    kind: "tool",
  },
  {
    href: "/fortune/zodiac/",
    title: "띠별 운세",
    shortTitle: "띠별 운세",
    description: "12띠의 성격과 2027 정미년 흐름, 띠별 궁합을 한 곳에서 봅니다.",
    emoji: "🐲",
    keywords: ["띠별 운세", "2027 띠별운세", "띠 궁합"],
    kind: "content",
  },
  {
    href: "/fortune/star-sign/",
    title: "별자리 운세",
    shortTitle: "별자리 운세",
    description: "12별자리의 성격과 연애·일·돈의 방식, 잘 맞는 별자리를 정리했습니다.",
    emoji: "✨",
    keywords: ["별자리 운세", "별자리 성격", "별자리 궁합"],
    kind: "content",
  },
  {
    href: "/fortune/dream/",
    title: "꿈해몽 사전",
    shortTitle: "꿈해몽",
    description: "돼지꿈·뱀꿈·이빨 빠지는 꿈까지, 전통 해몽과 심리 해석을 함께 읽습니다.",
    emoji: "🌙",
    keywords: ["꿈해몽", "꿈 해몽 사전", "돼지꿈 해몽"],
    kind: "content",
  },
  {
    href: "/fortune/2027/",
    title: "2027 정미년 신년운세",
    shortTitle: "2027 신년운세",
    description: "붉은 양의 해가 어떤 흐름인지, 띠별로 무엇이 달라지는지 미리 정리했습니다.",
    emoji: "🐑",
    keywords: ["2027 신년운세", "2027년 운세", "정미년", "2027 토정비결"],
    kind: "content",
  },
];

export type Crumb = { name: string; href: string };

/** BreadcrumbList JSON-LD. 검색 결과에 경로가 함께 나오게 합니다. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_ORIGIN}${crumb.href}`,
    })),
  };
}

export function faqJsonLd(items: Array<[string, string]>) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
  updated = "2026-09-05",
}: {
  headline: string;
  description: string;
  path: string;
  updated?: string;
}) {
  return {
    "@type": "Article",
    headline,
    description,
    inLanguage: "ko-KR",
    mainEntityOfPage: `${SITE_ORIGIN}${path}`,
    dateModified: updated,
    author: { "@type": "Organization", name: "MBTI 검사" },
    publisher: { "@type": "Organization", name: "MBTI 검사", url: `${SITE_ORIGIN}/` },
  };
}

export function graph(...nodes: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
