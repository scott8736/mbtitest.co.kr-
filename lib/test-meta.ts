import type { TestCatalogItem, TestCategory } from "./test-catalog";

/**
 * 테스트의 이름표.
 *
 * 목록 카드와 라우팅에 필요한 값만 담습니다. 문항과 결과 문구는 무거워서
 * lib/new-tests.ts 에 따로 두었습니다.
 *
 * 나누어 둔 이유가 있습니다. 예전에는 lib/test-catalog.ts 가 lib/new-tests.ts 를
 * import 했는데, 그러면 카탈로그를 쓰는 클라이언트 컴포넌트(TestDirectory,
 * GenericTestRunner, CrossPromo, TestGuide)가 20개 테스트의 문항 전체를 함께
 * 내려받았습니다. 방향을 뒤집어서, 이제 무거운 쪽이 가벼운 쪽을 참조합니다.
 *
 * 한 값은 한 곳에만 둡니다. 여기 있는 값은 lib/new-tests.ts 에 없고, 그 반대도
 * 마찬가지입니다. tests/test-catalog.test.mjs 가 둘이 어긋나지 않는지 봅니다.
 */
export type TestMeta = {
  slug: string;
  title: string;
  shortTitle: string;
  /** 페이지 상단의 영문 라벨. 카탈로그에는 안 쓰고 테스트 화면에서만 씁니다 */
  eyebrow: string;
  description: string;
  category: TestCategory;
  icon: string;
  color: string;
  keywords: string[];
  questionCount: number;
  duration: string;
};

/**
 * 순서가 곧 사이트맵과 generateStaticParams 의 순서입니다.
 * 마지막 hsp 는 문항을 손으로 쓴 테스트라 생성기를 거치지 않습니다.
 */
export const newTestMeta: TestMeta[] = [
  { slug: "love-tendency", title: "연애 성향 테스트", shortTitle: "연애 성향",
    eyebrow: "LOVE TENDENCY", category: "연애", icon: "♡", color: "#d56f8c",
    questionCount: 12, duration: "약 2분",
    description: "애정 표현과 관계에서 중요하게 생각하는 기준으로 나의 연애 성향을 확인합니다.",
    keywords: ["연애 성향 테스트", "연애 심리테스트", "나의 연애 성향"] },
  { slug: "spending-style", title: "소비 성향 테스트", shortTitle: "소비 성향",
    eyebrow: "SPENDING STYLE", category: "성격", icon: "₩", color: "#b58a4f",
    questionCount: 12, duration: "약 2분",
    description: "돈을 쓰는 순간의 기준과 만족 방식으로 나의 소비 패턴을 알아봅니다.",
    keywords: ["소비 성향 테스트", "소비 유형", "나의 소비 습관"] },
  { slug: "lazy-mbti", title: "게으름 MBTI 테스트", shortTitle: "게으름 MBTI",
    eyebrow: "LAZY MBTI", category: "성격", icon: "z", color: "#7868b4",
    questionCount: 12, duration: "약 2분",
    description: "일을 미루는 이유와 에너지를 회복하는 방식으로 나의 게으름 유형을 확인합니다.",
    keywords: ["게으름 MBTI 테스트", "게으름 유형", "미루기 테스트"] },
  { slug: "dating-style", title: "연애 스타일 테스트", shortTitle: "연애 스타일",
    eyebrow: "DATING STYLE", category: "연애", icon: "♥", color: "#c86486",
    questionCount: 12, duration: "약 2분",
    description: "연락, 데이트, 갈등 해결 방식에서 나타나는 나의 연애 스타일을 알아봅니다.",
    keywords: ["연애 스타일 테스트", "연애 유형 테스트", "연애 연락 스타일"] },
  { slug: "mbti-love-compatibility", title: "MBTI 연애 궁합 테스트", shortTitle: "MBTI 연애 궁합",
    eyebrow: "MBTI LOVE MATCH", category: "연애", icon: "∞", color: "#7865c4",
    questionCount: 12, duration: "약 2분",
    description: "관계에서 원하는 소통과 생활 방식을 바탕으로 나와 잘 맞는 MBTI 궁합 스타일을 찾습니다.",
    keywords: ["MBTI 연애 궁합 테스트", "MBTI 궁합", "MBTI 커플 궁합"] },
  { slug: "vegetable-village-character", title: "채소마을 캐릭터 테스트", shortTitle: "채소마을 캐릭터",
    eyebrow: "VEGGIE VILLAGE", category: "성격", icon: "♧", color: "#5c9568",
    questionCount: 12, duration: "약 2분",
    description: "일상 속 반응으로 나와 닮은 독창적인 채소마을 캐릭터를 찾아보세요.",
    keywords: ["채소 캐릭터 테스트", "캐릭터 성격 테스트", "재미있는 테스트"] },
  { slug: "friendship-symbol", title: "우리의 우정 징표 테스트", shortTitle: "우정 징표",
    eyebrow: "FRIENDSHIP SIGN", category: "성격", icon: "☆", color: "#5f8bb2",
    questionCount: 12, duration: "약 2분",
    description: "친구 사이에서 내가 맡는 역할과 우리 우정을 상징하는 징표를 확인합니다.",
    keywords: ["우정 테스트", "친구 관계 테스트", "우리의 우정 징표 테스트"] },
  { slug: "dont-get-hurt", title: "상처받지 마 테스트", shortTitle: "상처받지 마",
    eyebrow: "HEART SHIELD", category: "마음건강", icon: "◇", color: "#7b75b3",
    questionCount: 12, duration: "약 2분",
    description: "상처를 받는 순간의 반응과 나에게 필요한 마음 보호 방법을 알아봅니다.",
    keywords: ["상처받지 마 테스트", "감정 방어 테스트", "마음 보호 테스트"] },
  { slug: "animal-keeper", title: "동물 사육사 테스트", shortTitle: "동물 사육사",
    eyebrow: "ANIMAL KEEPER", category: "성격", icon: "♢", color: "#638b73",
    questionCount: 12, duration: "약 2분",
    description: "돌봄과 문제 해결 방식으로 나에게 어울리는 동물 사육사 유형을 찾습니다.",
    keywords: ["동물 사육사 테스트", "동물 성격 테스트", "직업 성향 테스트"] },
  { slug: "family-letter-personality", title: "가정통신문 성격 테스트", shortTitle: "가정통신문 성격",
    eyebrow: "SCHOOL LETTER", category: "성격", icon: "□", color: "#7686ad",
    questionCount: 12, duration: "약 2분",
    description: "학창 시절 가정통신문을 대하는 모습으로 알아보는 재미형 성격 테스트입니다.",
    keywords: ["가정통신문 성격 테스트", "학창시절 성격 테스트", "재미있는 심리테스트"] },
  { slug: "christmas-cookie-personality", title: "크리스마스 쿠키 성격 테스트", shortTitle: "쿠키 성격",
    eyebrow: "CHRISTMAS COOKIE", category: "성격", icon: "✦", color: "#b4675b",
    questionCount: 12, duration: "약 2분",
    description: "연말을 보내는 취향으로 나와 닮은 크리스마스 쿠키 캐릭터를 찾아보세요.",
    keywords: ["크리스마스 쿠키 성격 테스트", "연말 심리테스트", "쿠키 캐릭터 테스트"] },
  { slug: "personality-guide", title: "남녀 성격 풀이법 테스트", shortTitle: "성격 풀이법",
    eyebrow: "PERSONALITY GUIDE", category: "성격", icon: "↔", color: "#657fa4",
    questionCount: 12, duration: "약 2분",
    description: "성별을 단정하지 않고 말과 행동을 해석하는 방식으로 나의 소통 성격을 확인합니다.",
    keywords: ["남자 성격 풀이법", "여자 성격 풀이법", "성격 해석 테스트"] },
  { slug: "couple-character", title: "커플 캐릭터 테스트", shortTitle: "커플 캐릭터",
    eyebrow: "COUPLE CHARACTER", category: "연애", icon: "♧", color: "#cf6f8b",
    questionCount: 12, duration: "약 2분",
    description: "연애할 때 나타나는 행동으로 나의 커플 캐릭터와 관계 속 역할을 확인합니다.",
    keywords: ["커플 캐릭터 테스트", "연애 캐릭터 테스트", "커플 성격 테스트"] },
  { slug: "f-flirting-simulation", title: "F썸녀·F썸남 꼬시기 시뮬레이션", shortTitle: "F썸 시뮬레이션",
    eyebrow: "F FLIRTING SIMULATION", category: "연애", icon: "F", color: "#bd6f9c",
    questionCount: 12, duration: "약 2분",
    description: "공감형 썸 상대와의 상황 선택을 통해 나의 호감 표현 방식을 확인합니다.",
    keywords: ["F썸녀 꼬시기", "F썸남 꼬시기", "썸 시뮬레이션", "연애 시뮬레이션"] },
  { slug: "healing-sprite", title: "힐링 요정 성격 테스트", shortTitle: "힐링 요정",
    eyebrow: "HEALING SPRITE", category: "마음건강", icon: "✧", color: "#689b83",
    questionCount: 12, duration: "약 2분",
    description: "지친 일상을 회복하는 방식으로 나와 닮은 독창적인 힐링 요정 캐릭터를 찾습니다.",
    keywords: ["힐링 캐릭터 테스트", "힐링 요정 테스트", "마음 회복 테스트"] },
  { slug: "self-reflection", title: "자아 성찰 성격 테스트", shortTitle: "자아 성찰",
    eyebrow: "SELF REFLECTION", category: "마음건강", icon: "○", color: "#6e75aa",
    questionCount: 12, duration: "약 2분",
    description: "생각과 감정을 돌아보는 방식으로 나의 자아 성찰 유형을 확인합니다.",
    keywords: ["자아 성찰 성격 테스트", "자기 성찰 테스트", "나를 알아보는 테스트"] },
  { slug: "first-impression", title: "첫인상 테스트", shortTitle: "첫인상",
    eyebrow: "FIRST IMPRESSION", category: "성격", icon: "◎", color: "#6b83b2",
    questionCount: 12, duration: "약 2분",
    description: "처음 만난 자리에서 드러나는 말투와 행동으로 사람들이 느끼는 나의 첫인상을 확인합니다.",
    keywords: ["첫인상 테스트", "나의 첫인상", "첫인상 성격 테스트"] },
  { slug: "future-person", title: "미래인 테스트", shortTitle: "미래인",
    eyebrow: "FUTURE PERSON", category: "성격", icon: "△", color: "#587fa5",
    questionCount: 12, duration: "약 2분",
    description: "변화와 기술, 새로운 가능성을 대하는 태도로 나의 미래인 유형을 알아봅니다.",
    keywords: ["미래인 테스트", "미래 성향 테스트", "미래의 나 테스트"] },
  { slug: "love-ability", title: "연애 능력 테스트", shortTitle: "연애 능력",
    eyebrow: "LOVE ABILITY", category: "연애", icon: "+", color: "#cb6d89",
    questionCount: 12, duration: "약 2분",
    description: "공감, 표현, 갈등 해결, 관계 유지에서 현재 나의 연애 강점을 확인합니다.",
    keywords: ["연애 능력 테스트", "연애 잘하는 법", "연애 심리테스트"] },
  { slug: "hsp", title: "HSP 테스트", shortTitle: "HSP 테스트",
    eyebrow: "HIGHLY SENSITIVE PERSON", category: "마음건강", icon: "◈", color: "#5f6fb0",
    questionCount: 16, duration: "약 3분",
    description: "16문항으로 감각 처리 민감성의 네 갈래 중 나에게 두드러지는 방향을 확인합니다.",
    keywords: ["HSP 테스트", "매우 예민한 사람", "예민함 테스트", "감각 처리 민감성"] },
];

const bySlug = new Map(newTestMeta.map((meta) => [meta.slug, meta]));

export function testMeta(slug: string): TestMeta {
  const meta = bySlug.get(slug);
  if (!meta) throw new Error(`lib/test-meta.ts 에 ${slug} 항목이 없습니다.`);
  return meta;
}

export const newTestCatalog: TestCatalogItem[] = newTestMeta.map((meta) => ({
  slug: meta.slug,
  title: meta.title,
  shortTitle: meta.shortTitle,
  description: meta.description,
  category: meta.category,
  questionCount: meta.questionCount,
  duration: meta.duration,
  icon: meta.icon,
  color: meta.color,
  href: `/tests/${meta.slug}/`,
  status: "published",
  keywords: meta.keywords,
}));

export const newTestSlugs = newTestMeta.map((meta) => meta.slug);
