/**
 * 모리 게임 「마음숲 산책」 (2026-10-07, 기획안 00_기획/모리게임_기획안.md 2단계 — 혼자 하는 줄기).
 *
 * 내 모리를 데리고 네 마을을 돌며 주민 모리 16명의 부탁을 듣습니다. 부탁은 늘 다른 검사 하나이고,
 * 검사를 마치고 돌아오면 그 결과 카드가 도감 「특별 모리」 칸에 들어갑니다. 한 마을 네 부탁을 다 풀면 마을 도장.
 * 목표는 MBTI 만 하고 나가는 사람을 다른 검사로 보내는 것입니다(기준 5.2%, 09-28~10-04).
 *
 * 부탁 대사는 주민의 말버릇(lib/mori-world.ts MORI_WORLD.says)으로 시작합니다 — tests/mori-forest.test.mjs 가 대조합니다.
 * 연결 검사는 모두 GenericTestRunner 검사라 결과 화면 한 곳(ForestReturn)에서 돌아오는 버튼을 붙입니다.
 * 이 파일은 워커(lib/result-clicks.ts)도 읽으므로 다른 파일을 import 하지 않습니다.
 */

export type ForestQuest = { mori: string; slug: string; ask: string };

/** 마을 순서는 lib/mori-world.ts VILLAGES(nt·nf·sj·sp)와 같고, 마을 안에서는 화면 왼쪽부터 놓입니다. */
export const FOREST_QUESTS: ForestQuest[] = [
  // 별빛 언덕 (NT)
  { mori: "INTP", slug: "mental-age", ask: "근데 그건 왜 그래? 궁금한 게 생겼어. 네 마음 나이부터 재 보자." },
  { mori: "INTJ", slug: "work-style", ask: "B안까지 이미 있어. 그런데 너는 일할 때 어떤 길로 가는지 아직 모르겠어." },
  { mori: "ENTJ", slug: "career", ask: "좋아, 지금 바로 시작! 너한테 꼭 맞는 일이 뭔지부터 찾아보자." },
  { mori: "ENTP", slug: "enneagram", ask: "반대로 생각해 보면? MBTI 말고 아홉 갈래 지도로 너를 다시 보면 재밌을걸." },
  // 달빛 호수 (NF)
  { mori: "INFP", slug: "self-reflection", ask: "이건 나만의 이야기야. 그런데 네 이야기도 궁금해. 너는 너를 얼마나 들여다봐?" },
  { mori: "INFJ", slug: "hsp", ask: "괜찮아, 다 알아. 작은 소리에도 마음이 흔들리는 날이 있지? 얼마나 섬세한지 보자." },
  { mori: "ENFJ", slug: "self-esteem", ask: "넌 할 수 있어! 그 말을 너 스스로에게 얼마나 해 주는지 같이 볼래?" },
  { mori: "ENFP", slug: "my-color", ask: "우와, 이거 재밌겠다! 너는 무슨 색이야? 나는 노랑!" },
  // 도토리 마을 (SJ)
  { mori: "ISFJ", slug: "adult-attachment", ask: "밥은 먹었어? 네 마음은 누구한테 기대고 있는지 궁금해." },
  { mori: "ISTJ", slug: "love-language", ask: "약속은 약속이야. 편지를 부치기 전에, 네가 마음을 어떤 말로 전하는지 알려 줘." },
  { mori: "ESTJ", slug: "godsaeng", ask: "순서대로 하자. 첫째, 네 갓생력부터 확인!" },
  { mori: "ESFJ", slug: "jjinchin", ask: "다 같이 모이자! 그런데 너는 친구들한테 어떤 친구야?" },
  // 바람 들판 (SP)
  { mori: "ESFP", slug: "egen-teto", ask: "파티 타임! 근데 너, 무대에선 에겐이야 테토야?" },
  { mori: "ESTP", slug: "dopamine-addiction", ask: "일단 해 보고! 너도 재밌는 거 보면 못 참지? 얼마나 끌리는지 재 보자." },
  { mori: "ISTP", slug: "spending-style", ask: "…고쳤어. 이번엔 네 지갑 차례. 돈 쓰는 습관 좀 볼까?" },
  { mori: "ISFP", slug: "aura", ask: "오늘 하늘 예쁘다. 너한테서는 어떤 분위기가 나는지 궁금해." },
];

export const FOREST_QUEST_SLUGS = FOREST_QUESTS.map((q) => q.slug);
export const questOf = (mori: string) => FOREST_QUESTS.find((q) => q.mori === mori);

/** 이 기기에만 남는 진행 상황. 서버로 보내지 않습니다(우리 숲·초대는 3단계에서 D1). */
export type ForestSave = {
  /** 만난 모리(도감). 내 모리는 처음부터 들어 있습니다 */
  met: string[];
  /** 끝낸 부탁: 검사 slug → 결과 키 */
  done: Record<string, string>;
  /** 부탁을 받고 검사하러 간 검사 slug. 결과 화면이 이 값을 보고 「숲으로 돌아가기」를 띄웁니다 */
  pending?: string;
  muted?: boolean;
  /** 도장 축하를 이미 보여 준 마을(nt·nf·sj·sp). 같은 축하가 두 번 뜨지 않게 */
  stamped?: string[];
  /** 마을 놀이 최고 별(주민 유형 → 0~3). 이름은 처음 만든 리듬 탭 때 것 — 네 마을 놀이 모두 여기 적습니다 */
  rhythm?: Record<string, number>;
};

const KEY = "mori-forest";

export function readForest(): ForestSave {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ForestSave> | null;
    return {
      met: Array.isArray(v?.met) ? v.met : [],
      done: v?.done && typeof v.done === "object" ? v.done : {},
      pending: v?.pending,
      // 처음 오는 사람은 소리 꺼진 채 시작합니다(10-07 사용자 결정 — 조용한 곳에서 열면 갑자기 소리가 나서).
      // 한 번 켜거나 끈 사람은 그 선택을 따릅니다.
      muted: typeof v?.muted === "boolean" ? v.muted : true,
      stamped: Array.isArray(v?.stamped) ? v.stamped : [],
      rhythm: v?.rhythm && typeof v.rhythm === "object" ? v.rhythm : {},
    };
  } catch {
    return { met: [], done: {}, stamped: [], muted: true };
  }
}

/** 마을 네 부탁을 다 풀면 도장. 마을은 주민 유형의 가운데 두 글자로 정해집니다(lib/mori-world.ts villageOf 와 같은 규칙). */
export function stampsOf(done: Record<string, string>): string[] {
  const village = (c: string) => (c[1] === "N" ? (c[2] === "T" ? "nt" : "nf") : c[3] === "J" ? "sj" : "sp");
  return ["nt", "nf", "sj", "sp"].filter((v) => FOREST_QUESTS.filter((q) => village(q.mori) === v).every((q) => q.slug in done));
}

export function writeForest(save: ForestSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 창 등)에서는 이번 방문 동안만 진행이 남습니다.
  }
}

/**
 * 결과 화면에서 부르는 곳. 이 검사가 숲에서 받은 부탁이면 끝낸 것으로 적고 true 를 돌려줍니다.
 * 부탁 없이 검사한 사람에게는 아무것도 바꾸지 않습니다 — 결과 화면에 게임 버튼이 갑자기 뜨지 않게.
 */
export function completeForestQuest(slug: string, resultKey: string): boolean {
  const save = readForest();
  if (save.pending !== slug && !(slug in save.done)) return false;
  save.done[slug] = resultKey;
  if (save.pending === slug) delete save.pending;
  writeForest(save);
  return true;
}
