/**
 * 마을 미니게임 (2026-10-07, 바람 들판 리듬 탭에 이어 사용자 "만들어").
 *
 * 도토리 마을 = 도토리 받기 · 별빛 언덕 = 별자리 잇기 · 달빛 호수 = 등불 기억. 바람 들판 리듬 탭은 lib/forest-rhythm.ts.
 * 주민마다 성격에 맞춘 변형이 있고(ENTP 는 거꾸로 잇기 등), 초대 대사는 말버릇으로 시작합니다(tests/mori-forest.test.mjs).
 * 채점은 순수 함수라 테스트가 직접 봅니다. 화면은 components/ForestMinigame.tsx.
 */
import { RHYTHM_CHARTS } from "./forest-rhythm";

export type AcornLevel = { kind: "acorn"; seconds: number; fallSec: number; spawnSec: number; bad: number; bonus: number };
export type StarLevel = { kind: "stars"; seconds: number; points: number; reverse: boolean };
export type LanternLevel = { kind: "lantern"; grid: 2 | 3; onMs: number; gapMs: number; targets: [number, number, number] };
export type Minigame = {
  mori: string;
  level: string;
  title: string;
  invite: string;
  react: [string, string, string, string];
  rule: string;
  play: AcornLevel | StarLevel | LanternLevel;
};

export const MINIGAMES: Minigame[] = [
  // 도토리 마을 (SJ) — 도토리 받기
  {
    mori: "ISFJ", level: "느긋", title: "도토리 받기",
    invite: "밥은 먹었어? 부탁 전에 도토리 좀 같이 주워 줄래? 천천히 떨어지니까 걱정 마.",
    rule: "손가락으로 바구니를 움직여 🌰 를 받아요. 🐛 는 피하고요.",
    play: { kind: "acorn", seconds: 22, fallSec: 2.6, spawnSec: 0.75, bad: 0.12, bonus: 0 },
    react: ["괜찮아, 다친 데 없지? 다음엔 같이 천천히 해 보자.", "고마워, 덕분에 겨울 걱정 덜었어.", "와, 바구니가 가득 찼어! 코코아 타 줄게.", "이렇게 많이? 마을 모두 따뜻하게 지내겠다!"],
  },
  {
    mori: "ISTJ", level: "꼼꼼", title: "도토리 받기",
    invite: "약속은 약속이야. 썩은 도토리는 빼고, 좋은 것만 바구니에 담기로 하자.",
    rule: "좋은 🌰 만 받고, 🐛 가 든 건 피해요. 잘못 받으면 점수가 깎여요.",
    play: { kind: "acorn", seconds: 22, fallSec: 2.2, spawnSec: 0.6, bad: 0.32, bonus: 0 },
    react: ["괜찮아. 규칙은 다음에 다시 지키면 돼.", "거의 맞았어. 체크리스트에 적어 둘게.", "정확해. 약속대로 좋은 것만 담았네.", "완벽해. 우체국 창고도 너한테 맡기고 싶다."],
  },
  {
    mori: "ESTJ", level: "빠름", title: "도토리 받기",
    invite: "순서대로 하자. 첫째, 창고 채우기! 빠르게 떨어지니까 집중!",
    rule: "빠르게 떨어지는 🌰 를 받아요. 🐛 는 피하고요.",
    play: { kind: "acorn", seconds: 22, fallSec: 1.6, spawnSec: 0.45, bad: 0.18, bonus: 0 },
    react: ["괜찮아, 다음 순서에 만회하면 돼.", "좋아, 일정대로 가고 있어.", "훌륭해! 창고 정리가 반나절 당겨졌어.", "기록 갱신! 스톱워치가 놀랐어."],
  },
  {
    mori: "ESFJ", level: "보너스", title: "도토리 받기",
    invite: "다 같이 모이자! 잔치에 쓸 도토리랑 컵케이크를 같이 받아 줘!",
    rule: "🌰 는 1점, 🧁 는 2점! 🐛 는 피해요.",
    play: { kind: "acorn", seconds: 22, fallSec: 2.1, spawnSec: 0.6, bad: 0.12, bonus: 0.18 },
    react: ["괜찮아, 잔치는 같이 있는 게 제일 중요해!", "좋아, 이 정도면 모두 한 입씩!", "와, 잔치상이 꽉 찼어! 꼭 와야 해!", "최고의 잔치가 되겠어! 네 자리 제일 좋은 데로 비워 둘게!"],
  },
  // 별빛 언덕 (NT) — 별자리 잇기
  {
    mori: "INTP", level: "기본", title: "별자리 잇기",
    invite: "근데 그건 왜 그래? 별이 왜 그렇게 놓였는지 궁금해. 부탁 전에 별자리부터 이어 보자.",
    rule: "1번 별부터 순서대로 눌러 별자리 3개를 이어요. 틀리면 2초가 줄어요.",
    play: { kind: "stars", seconds: 30, points: 5, reverse: false },
    react: ["별은 안 도망가. 다음에 다시 이어 보자.", "흥미로운데? 규칙이 보이기 시작했지?", "완벽한 관측이야! 연구 노트에 적어 둘게.", "이론상 최고 기록이야. 근데 그건 어떻게 한 거야?"],
  },
  {
    mori: "INTJ", level: "별 많음", title: "별자리 잇기",
    invite: "B안까지 이미 있어. 별이 많은 별자리야. 순서를 미리 보고 길을 그려 봐.",
    rule: "별 7개짜리 별자리 3개! 1번부터 순서대로 눌러요. 틀리면 2초가 줄어요.",
    play: { kind: "stars", seconds: 34, points: 7, reverse: false },
    react: ["계획은 고치라고 있는 거야. 다음 판엔 길이 보일 거야.", "괜찮은 경로였어. 조금만 다듬자.", "정확한 설계야. 숲 길 지도에 넣고 싶어.", "흠잡을 데가 없어. 10년 뒤 지도까지 맡기고 싶다."],
  },
  {
    mori: "ENTJ", level: "시간 짧음", title: "별자리 잇기",
    invite: "좋아, 지금 바로 시작! 22초 안에 별자리 셋을 다 잇는 거야!",
    rule: "22초 안에 1번부터 순서대로 눌러 별자리 3개! 틀리면 2초가 줄어요.",
    play: { kind: "stars", seconds: 22, points: 5, reverse: false },
    react: ["좋아, 다시 간다! 포기만 안 하면 돼!", "속도 좋아! 다음엔 목표 달성이다!", "훌륭해! 축제 팀에 바로 넣고 싶어!", "완벽한 지휘였어! 오늘 깃발은 네가 들어!"],
  },
  {
    mori: "ENTP", level: "거꾸로", title: "별자리 잇기",
    invite: "반대로 생각해 보면? 이번엔 큰 숫자부터 거꾸로 이어 봐! 재밌을걸?",
    rule: "제일 큰 번호부터 1번까지 거꾸로 눌러요! 틀리면 2초가 줄어요.",
    play: { kind: "stars", seconds: 30, points: 5, reverse: true },
    react: ["거꾸로가 원래 헷갈리지! 그게 재밌는 거야.", "오, 머리가 뒤집히는 느낌 왔지?", "대단한데? 거꾸로도 술술이네!", "완전 반대로 생각하는 천재 발견! 확성기로 알려야겠다!"],
  },
  // 달빛 호수 (NF) — 등불 기억
  {
    mori: "INFP", level: "느긋", title: "등불 기억",
    invite: "이건 나만의 이야기야. 부탁 전에, 등불이 켜지는 순서를 같이 기억해 줄래?",
    rule: "등불이 켜지는 순서를 보고 똑같이 눌러요. 맞히면 하나씩 길어져요.",
    play: { kind: "lantern", grid: 2, onMs: 650, gapMs: 260, targets: [3, 4, 5] },
    react: ["괜찮아, 이야기는 천천히 기억해도 돼.", "좋아, 첫 장을 같이 읽은 기분이야.", "와, 등불이 다 네 이야기를 기억하나 봐.", "이 장면, 내 책에 꼭 쓸게. 마지막 등불까지 완벽했어."],
  },
  {
    mori: "INFJ", level: "기본", title: "등불 기억",
    invite: "괜찮아, 다 알아. 등불이 켜진 순서를 마음으로 따라와 봐.",
    rule: "아홉 등불 중 켜지는 순서를 보고 똑같이 눌러요.",
    play: { kind: "lantern", grid: 3, onMs: 520, gapMs: 220, targets: [3, 5, 6] },
    react: ["괜찮아. 길은 잃어도 다시 찾으면 돼.", "마음이 닿고 있어. 조금만 더.", "등불이 너를 따라 켜지는 것 같았어.", "길 잃은 모리도 너라면 금방 찾겠다."],
  },
  {
    mori: "ENFJ", level: "빠름", title: "등불 기억",
    invite: "넌 할 수 있어! 등불이 빨리 켜져도 끝까지 따라와 봐!",
    rule: "등불이 빠르게 켜져요! 순서를 보고 똑같이 눌러요.",
    play: { kind: "lantern", grid: 3, onMs: 360, gapMs: 160, targets: [4, 5, 7] },
    react: ["넌 할 수 있어! 진짜야, 한 번만 더!", "봐, 해냈잖아! 점점 빨라지고 있어!", "대단해! 마을 모두에게 자랑할 거야!", "역시 믿었어! 오늘 무대 주인공은 너야!"],
  },
  {
    mori: "ENFP", level: "길게", title: "등불 기억",
    invite: "우와, 이거 재밌겠다! 색색 등불이 켜지는 순서, 어디까지 기억할 수 있어?",
    rule: "색색 등불 순서를 보고 똑같이 눌러요. 7개까지 가 보자!",
    play: { kind: "lantern", grid: 3, onMs: 480, gapMs: 200, targets: [3, 5, 7] },
    react: ["괜찮아! 틀린 것도 재밌었잖아!", "오오, 점점 길어진다! 신난다!", "우와, 대박! 등불 축제 열어야겠어!", "말도 안 돼! 이건 새 놀이로 발명해야 해!"],
  },
];

export const minigameOf = (mori: string) => MINIGAMES.find((g) => g.mori === mori);

/** 이 주민이 청하는 놀이의 초대 대사(바람 들판 리듬 탭 포함). 놀이가 없는 주민이면 undefined */
export function inviteOf(mori: string): string | undefined {
  return minigameOf(mori)?.invite ?? RHYTHM_CHARTS.find((c) => c.mori === mori)?.invite;
}

/** 별 0~3 공통 기준(비율) */
export const starsFromRatio = (r: number): 0 | 1 | 2 | 3 => (r >= 0.8 ? 3 : r >= 0.55 ? 2 : r >= 0.3 ? 1 : 0);

/** 도토리: 🌰 1점, 🧁 2점, 🐛 받으면 -1. 떨어진 좋은 것 전부를 받았을 때를 만점으로 */
export function acornStars(got: { good: number; bonus: number; bad: number }, fell: { good: number; bonus: number }): 0 | 1 | 2 | 3 {
  const max = fell.good + fell.bonus * 2;
  if (!max) return 0;
  return starsFromRatio(Math.max(0, got.good + got.bonus * 2 - got.bad) / max);
}

/** 별자리: 다 이은 별자리 수(0~3)가 곧 별 */
export const starStars = (done: number): 0 | 1 | 2 | 3 => Math.max(0, Math.min(3, done)) as 0 | 1 | 2 | 3;

/** 등불: 맞힌 가장 긴 순서가 목표 셋 중 몇 개를 넘었나 */
export const lanternStars = (best: number, targets: [number, number, number]): 0 | 1 | 2 | 3 =>
  targets.filter((t) => best >= t).length as 0 | 1 | 2 | 3;

/** 별자리 모양(%, 0~100). 그림 속 글자 없이 점만 — 이름은 화면에 따로 씁니다 */
export const CONSTELLATIONS: { name: string; pts: [number, number][] }[] = [
  { name: "카시오페이아", pts: [[12, 38], [30, 66], [48, 42], [66, 68], [86, 36]] },
  { name: "작은 집", pts: [[30, 76], [28, 46], [50, 22], [72, 46], [70, 76]] },
  { name: "번개", pts: [[60, 14], [36, 44], [58, 50], [34, 84], [70, 46]] },
  { name: "큰 국자", pts: [[10, 34], [26, 28], [42, 36], [55, 46], [58, 70], [82, 74], [88, 50]] },
  { name: "백조", pts: [[50, 12], [50, 34], [50, 56], [50, 82], [20, 40], [80, 40], [34, 64]] },
  { name: "왕관", pts: [[12, 60], [24, 40], [38, 30], [50, 26], [62, 30], [76, 40], [88, 60]] },
];

/** 이번 판 별자리 셋(점 개수에 맞는 모양만). 순서를 섞으려면 rand 를 넘깁니다 */
export function pickConstellations(points: number, rand: () => number = Math.random) {
  const pool = CONSTELLATIONS.filter((c) => c.pts.length === points);
  return [...pool].sort(() => rand() - 0.5).slice(0, 3);
}
