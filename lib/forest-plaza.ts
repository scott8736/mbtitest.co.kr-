/**
 * 마음나무 광장 (2026-10-07): 하루 한 번 열매 · 짝꿍 카드 뒤집기 · 말버릇 퀴즈.
 * 지도 한가운데 하트 나무를 누르면 오는 곳입니다. 마음나무는 부탁을 들어줄수록 자랍니다(그림 4단계).
 * 순수 함수만 둡니다 — 화면은 components/ForestPlaza.tsx, 검사는 tests/mori-forest.test.mjs.
 */
import { MORI_PAIRS, MORI_WORLD } from "./mori-world";

/** 한국 날짜(YYYY-MM-DD). 열매는 한국 자정에 다시 열립니다 */
export const dayKST = (now = Date.now()) => new Date(now + 9 * 3600_000).toISOString().slice(0, 10);

/** 마음나무 단계 1~4: 끝낸 부탁 0~3 → 1, 4~7 → 2, 8~11 → 3, 12+ → 4 */
export const treeStage = (done: number): 1 | 2 | 3 | 4 => (Math.min(4, 1 + Math.floor(done / 4)) as 1 | 2 | 3 | 4);

/** 연속 출석: 어제 주웠으면 +1, 아니면 1부터 */
export function nextStreak(lastDay: string | undefined, streak: number, today: string): number {
  if (!lastDay) return 1;
  const y = new Date(Date.parse(today + "T00:00:00Z") - 86400_000).toISOString().slice(0, 10);
  return lastDay === y ? streak + 1 : lastDay === today ? streak : 1;
}

/* ---------- 짝꿍 카드 뒤집기 ---------- */

/** 짝꿍 8쌍(16모리가 한 번씩). lib/mori-world.ts 정본 그대로 */
export const MATES = MORI_PAIRS.filter((p) => p.kind === "짝꿍");
export const mateOf = (code: string) => {
  const p = MATES.find((m) => m.a === code || m.b === code);
  return p ? (p.a === code ? p.b : p.a) : undefined;
};

/** 뒤집은 횟수(두 장 한 번 = 1) → 별. 8쌍이라 완벽하면 8번 */
export const pairsStars = (moves: number): 0 | 1 | 2 | 3 => (moves <= 14 ? 3 : moves <= 20 ? 2 : moves <= 28 ? 1 : 0);

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 말버릇 퀴즈 ---------- */

export type QuizQ = { kind: "says" | "role"; answer: string; choices: string[]; prompt: string };
export const QUIZ_LEN = 8;

/** 문제 8개: 말버릇 → 누구 / 맡은 일 → 누구. 보기 넷(정답 + 다른 모리 셋) */
export function makeQuiz(rand: () => number = Math.random): QuizQ[] {
  const codes = Object.keys(MORI_WORLD);
  return shuffle(codes, rand).slice(0, QUIZ_LEN).map((answer, i) => {
    const kind: QuizQ["kind"] = i % 2 === 0 ? "says" : "role";
    const others = shuffle(codes.filter((c) => c !== answer), rand).slice(0, 3);
    const w = MORI_WORLD[answer];
    return {
      kind,
      answer,
      choices: shuffle([answer, ...others], rand),
      prompt: kind === "says" ? `“${w.says}” 누구의 말버릇일까?` : `마음숲에서 「${w.role}」${eul(w.role)} 맡은 모리는?`,
    };
  });
}

/** 받침 있으면 「을」, 없으면 「를」 */
export const eul = (word: string) => {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? "을" : "를";
};

export const quizStars = (right: number): 0 | 1 | 2 | 3 => (right >= 8 ? 3 : right >= 6 ? 2 : right >= 4 ? 1 : 0);
