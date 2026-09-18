import { buildChart, elementNames, elementLabels, type BirthInput, type SajuChart } from "./fortune-engine";

/**
 * 사주 궁합.
 *
 * 두 사람의 사주를 세워 세 가지를 봅니다.
 *
 *   1. 일간(日干) 오행 관계 — 사주에서 '나 자신'에 해당하는 글자끼리의 관계
 *   2. 띠(지지) 관계 — 삼합·육합·충
 *   3. 오행 보완 — 한쪽에 모자란 오행을 다른 쪽이 갖고 있는가
 *
 * 점수를 매기되 등급으로 읽히지 않게 씁니다. 궁합은 맞고 틀림이 아니라
 * 서로 다른 사용법을 아는 자료라는 것이 이 사이트가 다른 곳과 다르게 잡는
 * 지점이고, 결과 문구도 전부 그 전제로 씁니다.
 */

/** 오행 상생 순서 — 목생화, 화생토, 토생금, 금생수, 수생목 */
const GENERATES = [1, 2, 3, 4, 0];
/** 오행 상극 — 목극토, 화극금, 토극수, 금극목, 수극화 */
const OVERCOMES = [2, 3, 4, 0, 1];

export type ElementRelation = "생해줌" | "생받음" | "극함" | "극받음" | "같음";

export function elementRelation(a: number, b: number): ElementRelation {
  if (a === b) return "같음";
  if (GENERATES[a] === b) return "생해줌";
  if (GENERATES[b] === a) return "생받음";
  if (OVERCOMES[a] === b) return "극함";
  return "극받음";
}

/** 삼합 — 네 글자씩 묶이는 세 무리. 지지 인덱스 기준 */
const TRINE = [
  [8, 0, 4], // 신자진 — 수국
  [2, 6, 10], // 인오술 — 화국
  [11, 3, 7], // 해묘미 — 목국
  [5, 9, 1], // 사유축 — 금국
];
/** 육합 — 두 글자씩 짝 */
const SIX_HARMONY: Record<number, number> = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };

export type BranchRelation = "삼합" | "육합" | "충" | "보통";

export function branchRelation(a: number, b: number): BranchRelation {
  if (SIX_HARMONY[a] === b) return "육합";
  if (TRINE.some((group) => group.includes(a) && group.includes(b) && a !== b)) return "삼합";
  // 충 — 지지에서 여섯 칸 떨어진 짝
  if ((a + 6) % 12 === b) return "충";
  return "보통";
}

export type CoupleResult = {
  a: SajuChart;
  b: SajuChart;
  /** 0~100. 등급이 아니라 '얼마나 손이 덜 가는가' 로 읽습니다 */
  score: number;
  headline: string;
  summary: string;
  relation: ElementRelation;
  relationNote: string;
  branch: BranchRelation;
  branchNote: string;
  /** 서로 채워 주는 오행 */
  complements: { giver: "a" | "b"; element: number }[];
  complementNote: string;
  advice: string[];
};

const RELATION_NOTE: Record<ElementRelation, { score: number; note: string }> = {
  생해줌: {
    score: 30,
    note: "앞사람의 기운이 뒷사람을 밀어 주는 관계입니다. 한쪽이 내주고 한쪽이 받는 흐름이라 초반에 편안합니다. 다만 내주는 쪽이 오래 지치지 않는지는 따로 살펴야 합니다.",
  },
  생받음: {
    score: 30,
    note: "뒷사람의 기운이 앞사람을 밀어 주는 관계입니다. 받는 쪽이 힘을 얻는 구조인데, 고맙다는 말이 줄어드는 순간 관계가 기울기 시작합니다.",
  },
  같음: {
    score: 24,
    note: "같은 오행끼리입니다. 말이 빨리 통하고 설명할 일이 적습니다. 대신 둘 다 같은 자리에서 막히기 때문에, 막혔을 때 도와줄 사람이 서로가 아닐 수 있습니다.",
  },
  극함: {
    score: 16,
    note: "앞사람이 뒷사람을 누르는 관계로 봅니다. 나쁜 조합이라는 뜻이 아니라, 한쪽이 기준을 정하고 한쪽이 맞추는 모양이 되기 쉽다는 뜻입니다. 역할을 바꿔 보는 시간이 필요합니다.",
  },
  극받음: {
    score: 16,
    note: "뒷사람이 앞사람을 누르는 관계로 봅니다. 부딪히는 지점이 분명해서 오히려 규칙을 정하기 좋은 조합이기도 합니다. 그냥 두면 한쪽만 참게 됩니다.",
  },
};

const BRANCH_NOTE: Record<BranchRelation, { score: number; note: string }> = {
  삼합: { score: 30, note: "띠가 삼합으로 묶입니다. 같은 방향을 보는 무리로 보는 조합이라, 큰일을 함께 도모할 때 손발이 맞는다고 읽습니다." },
  육합: { score: 26, note: "띠가 육합으로 맞물립니다. 서로 없는 것을 채워 주는 짝으로 보는 조합입니다." },
  충: { score: 10, note: "띠가 서로 충하는 자리입니다. 부딪힌다는 뜻으로만 읽히지만, 변화가 필요한 시기에는 서로를 움직이게 하는 조합으로도 봅니다. 붙어 지내는 시간이 길수록 규칙이 필요합니다." },
  보통: { score: 18, note: "띠 사이에 특별한 묶임도 부딪힘도 없습니다. 관계의 모양을 두 사람이 직접 정해 나가는 조합입니다." },
};

export function buildCouple(first: BirthInput, second: BirthInput): CoupleResult {
  const a = buildChart(first);
  const b = buildChart(second);

  const relation = elementRelation(a.dayElement, b.dayElement);
  // 띠 관계는 입춘 보정이 들어간 zodiacIndex 로 봐야 실제 "띠"와 어긋나지 않습니다.
  const branch = branchRelation(a.zodiacIndex, b.zodiacIndex);

  // 서로 모자란 오행을 채워 주는지. 한쪽이 0개인 오행을 다른 쪽이 2개 이상 가지면 보완으로 봅니다.
  const complements: { giver: "a" | "b"; element: number }[] = [];
  for (let e = 0; e < 5; e += 1) {
    if (a.elementCounts[e] === 0 && b.elementCounts[e] >= 2) complements.push({ giver: "b", element: e });
    if (b.elementCounts[e] === 0 && a.elementCounts[e] >= 2) complements.push({ giver: "a", element: e });
  }

  const base = RELATION_NOTE[relation].score + BRANCH_NOTE[branch].score;
  // 바닥을 너무 올리면 네 단계 중 아래 두 개가 나오지 않아 숫자가 의미를 잃습니다.
  // base 는 26~60, 보완은 하나당 6점, 바닥 보정은 12점만 둡니다.
  const score = Math.min(100, base + complements.length * 6 + 12);

  const headline =
    score >= 78
      ? "손이 덜 가는 조합입니다"
      : score >= 62
        ? "맞춰 가면 잘 굴러가는 조합입니다"
        : score >= 48
          ? "규칙을 정해 두면 편해지는 조합입니다"
          : "서로 다른 쪽이 많은 조합입니다";

  const summary =
    score >= 78
      ? "따로 애쓰지 않아도 흐름이 맞는 편입니다. 다만 편한 관계일수록 말을 줄이게 되니, 확인하는 습관만 지키면 오래갑니다."
      : score >= 62
        ? "맞는 부분과 어긋나는 부분이 함께 있습니다. 어긋나는 쪽을 고치려 들기보다 서로 다르다는 것을 먼저 인정하는 편이 빠릅니다."
        : score >= 48
          ? "그냥 두면 같은 일로 반복해서 부딪히기 쉬운 조합입니다. 대신 규칙을 한 번 정해 두면 그 뒤로는 조용해집니다."
          : "닮은 데가 적습니다. 이건 맞지 않는다는 뜻이 아니라, 알아서 맞춰지지는 않는다는 뜻입니다. 말로 정한 것만 지켜집니다.";

  const complementNote = complements.length
    ? `${complements
        .map((c) => `${c.giver === "a" ? "첫 번째" : "두 번째"} 분이 ${elementLabels[c.element]} 기운을 채워 줍니다`)
        .join(". ")}. 상대에게 없는 것을 갖고 있다는 뜻이라, 서로 잘 못하는 일을 나눠 맡으면 편해집니다.`
    : "한쪽이 비어 있는 오행을 다른 쪽이 크게 갖고 있지는 않습니다. 비슷한 재료로 사는 두 사람이라, 부족한 부분은 밖에서 채우는 편이 낫습니다.";

  const advice: string[] = [];
  if (relation === "생해줌" || relation === "생받음") {
    advice.push("주는 쪽이 정해져 있는 조합입니다. 고맙다는 말을 미루지 마세요. 그 말이 줄면 흐름이 먼저 끊깁니다.");
  }
  if (relation === "극함" || relation === "극받음") {
    advice.push("부딪히는 지점이 분명한 조합입니다. 그 자리에서 누가 맞는지 가리기보다 둘 다 물러설 선을 미리 정해 두세요.");
  }
  if (relation === "같음") {
    advice.push("둘 다 같은 자리에서 막힙니다. 막혔을 때 물어볼 사람을 관계 밖에 하나씩 두세요.");
  }
  if (branch === "충") {
    advice.push("붙어 지내는 시간이 길수록 부딪힘이 커지는 조합입니다. 각자의 시간을 일정에 미리 넣어 두면 훨씬 조용해집니다.");
  }
  if (branch === "삼합" || branch === "육합") {
    advice.push("함께 뭔가를 시작할 때 잘 맞는 조합입니다. 미루던 일이 있다면 같이 하는 편이 빠릅니다.");
  }
  advice.push("궁합은 관계의 결말을 알려 주지 않습니다. 어디서 손이 더 가는지를 미리 알려 줄 뿐입니다.");

  return {
    a,
    b,
    score,
    headline,
    summary,
    relation,
    relationNote: RELATION_NOTE[relation].note,
    branch,
    branchNote: BRANCH_NOTE[branch].note,
    complements,
    complementNote,
    advice,
  };
}

export { elementNames };
