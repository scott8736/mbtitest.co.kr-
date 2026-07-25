export type TestCategory = "성격" | "연애" | "마음건강" | "직장";
export type TestStatus = "published" | "planned";

export type TestCatalogItem = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: TestCategory;
  questionCount: number;
  duration: string;
  icon: string;
  color: string;
  href: string;
  status: TestStatus;
  keywords: string[];
};

/**
 * 새 테스트를 추가할 때 이 목록에 항목을 등록합니다.
 * 실제 질문·점수·결과 화면이 완성된 뒤 status를 published로 변경합니다.
 */
export const testCatalog: TestCatalogItem[] = [
  {
    slug: "mbti",
    title: "무료 MBTI 성격유형 검사",
    shortTitle: "MBTI 검사",
    description: "40개 문항으로 나의 16가지 성격유형과 네 가지 성향 지표를 확인합니다.",
    category: "성격",
    questionCount: 40,
    duration: "약 4분",
    icon: "✦",
    color: "#527263",
    href: "/",
    status: "published",
    keywords: ["MBTI 검사", "엠비티아이 검사", "성격테스트"],
  },
  {
    slug: "egen-teto",
    title: "에겐녀·테토녀 성향 테스트",
    shortTitle: "에겐·테토",
    description: "공감 중심의 에겐 성향과 행동 중심의 테토 성향 중 나는 어느 쪽인지 확인합니다.",
    category: "성격",
    questionCount: 20,
    duration: "약 2~3분",
    icon: "◐",
    color: "#ff806f",
    href: "/tests/egen-teto",
    status: "published",
    keywords: ["에겐녀 테스트", "테토녀 테스트", "에겐남 테스트", "테토남 테스트"],
  },
  {
    slug: "adult-attachment",
    title: "애착유형 테스트",
    shortTitle: "애착유형",
    description: "관계에서 나타나는 안정형·불안형·회피형 성향을 알아보는 테스트입니다.",
    category: "연애",
    questionCount: 24,
    duration: "약 3분",
    icon: "♡",
    color: "#9b6f72",
    href: "/tests/adult-attachment",
    status: "published",
    keywords: ["애착유형 테스트", "불안형 테스트", "회피형 테스트"],
  },
  {
    slug: "mental-age",
    title: "정신연령 테스트",
    shortTitle: "정신연령",
    description: "호기심과 책임감, 변화에 대한 태도로 지금 내 마음의 나이를 재미있게 확인합니다.",
    category: "성격",
    questionCount: 15,
    duration: "약 2분",
    icon: "∞",
    color: "#7a68ce",
    href: "/tests/mental-age",
    status: "published",
    keywords: ["정신연령 테스트", "정신나이 테스트", "나의 정신연령"],
  },
  {
    slug: "love-language",
    title: "5가지 사랑의 언어 테스트",
    shortTitle: "사랑의 언어",
    description: "내가 사랑을 표현하고 받아들이는 방식을 다섯 가지 언어로 살펴봅니다.",
    category: "연애",
    questionCount: 20,
    duration: "약 3분",
    icon: "◇",
    color: "#a57b58",
    href: "/tests/love-language",
    status: "published",
    keywords: ["사랑의 언어 테스트", "연애 심리테스트"],
  },
  {
    slug: "self-esteem",
    title: "자존감 테스트",
    shortTitle: "자존감",
    description: "일상에서 나를 바라보는 태도와 자기 존중의 현재 상태를 점검합니다.",
    category: "마음건강",
    questionCount: 20,
    duration: "약 3분",
    icon: "○",
    color: "#6d7f9b",
    href: "/tests/self-esteem",
    status: "published",
    keywords: ["자존감 테스트", "자기이해 테스트"],
  },
  {
    slug: "burnout",
    title: "직장인 번아웃 테스트",
    shortTitle: "번아웃",
    description: "업무 피로와 정서적 소진 신호를 가볍게 점검하는 직장인 테스트입니다.",
    category: "직장",
    questionCount: 18,
    duration: "약 2분",
    icon: "△",
    color: "#85745f",
    href: "/tests/burnout",
    status: "published",
    keywords: ["번아웃 테스트", "직장인 심리테스트"],
  },
  {
    slug: "work-style",
    title: "직장인 업무성향 테스트",
    shortTitle: "업무성향",
    description: "협업, 의사결정, 실행 방식에서 나타나는 나의 업무 스타일을 알아봅니다.",
    category: "직장",
    questionCount: 24,
    duration: "약 3분",
    icon: "□",
    color: "#587985",
    href: "/tests/work-style",
    status: "published",
    keywords: ["업무성향 테스트", "직장인 성격테스트"],
  },
];

export const testCategories: Array<"전체" | TestCategory> = [
  "전체",
  "성격",
  "연애",
  "마음건강",
  "직장",
];
