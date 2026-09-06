import { testCatalog } from "../lib/test-catalog";

/**
 * 페이지 사이를 잇는 CTA 카드 블록.
 *
 * 운세 콘텐츠는 검색으로 들어와도 다음으로 갈 곳이 없었고, 심리테스트 결과에는
 * 운세로 가는 길이 없었습니다. 한 컴포넌트로 두 방향을 모두 잇습니다.
 *
 * 광고와 붙여 놓지 마세요. 카드가 광고 바로 옆에 있으면 방문자가 광고를
 * CTA 로 착각해 누르고, 그런 클릭은 단가가 깎입니다. 본문 섹션을 하나 이상
 * 사이에 두고 배치합니다.
 */

type Card = { label: string; title: string; note: string; href: string; cta: string };

const FORTUNE_CARDS: Card[] = [
  { label: "운세", title: "오늘의 운세", note: "생년월일로 보는 오늘의 흐름", href: "/fortune/today/", cta: "오늘의 운세 보기" },
  { label: "사주", title: "무료 사주 보기", note: "타고난 기운과 성향 풀이", href: "/fortune/saju/", cta: "무료 사주 보기" },
  { label: "사주 × MBTI", title: "사주와 성격유형 비교", note: "두 가지를 함께 읽어보기", href: "/fortune/saju-mbti/", cta: "사주 MBTI 보기" },
];

/** 카탈로그에서 공개된 테스트만 골라 카드로 만듭니다. */
function testCards(slugs: string[]): Card[] {
  return slugs
    .map((slug) => testCatalog.find((item) => item.slug === slug && item.status === "published"))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      label: item.category,
      title: item.shortTitle,
      note: `${item.questionCount}문항 · ${item.duration}`,
      href: item.href,
      cta: "테스트 시작하기",
    }));
}

const DEFAULT_TEST_SLUGS = ["mbti", "adult-attachment", "egen-teto"];

export type CrossPromoVariant = "fortune" | "tests" | "mixed";

const HEADINGS: Record<CrossPromoVariant, { eyebrow: string; title: string }> = {
  fortune: { eyebrow: "TODAY'S FORTUNE", title: "성격을 봤다면, 오늘의 흐름도" },
  tests: { eyebrow: "NEXT TEST", title: "나를 알아보는 무료 심리테스트" },
  mixed: { eyebrow: "MORE", title: "이어서 볼 만한 것들" },
};

export default function CrossPromo({
  variant,
  testSlugs = DEFAULT_TEST_SLUGS,
  eyebrow,
  title,
}: {
  variant: CrossPromoVariant;
  testSlugs?: string[];
  eyebrow?: string;
  title?: string;
}) {
  const heading = HEADINGS[variant];
  const cards =
    variant === "fortune"
      ? FORTUNE_CARDS
      : variant === "tests"
        ? testCards(testSlugs)
        : [...testCards(testSlugs).slice(0, 2), ...FORTUNE_CARDS.slice(0, 2)];

  if (cards.length === 0) return null;

  return (
    <aside className={`related-results cross-promo cross-promo-${variant}`}>
      <span className="eyebrow">{eyebrow ?? heading.eyebrow}</span>
      <h2>{title ?? heading.title}</h2>
      <div>
        {cards.map((card) => (
          <a key={card.href} href={card.href}>
            <span>{card.label}</span>
            <strong>{card.title}</strong>
            <small>{card.note}</small>
            <i>{card.cta} →</i>
          </a>
        ))}
      </div>
    </aside>
  );
}
