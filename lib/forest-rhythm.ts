/**
 * 바람 들판 「축제 무대 리듬 탭」 (2026-10-07, 사용자 "마음숲 지도·바람 들판 재미없어" → 마을 미니게임 1번).
 *
 * 배경곡 public/audio/forest/sp.m4a 는 16마디(64박) 루프이고 0초가 첫 박입니다(game-forest/loop_cut.py).
 * 한 박 길이는 곡 파일 길이 ÷ 64 로 잽니다 — BPM 숫자(92.44)를 박아 두면 재인코딩 때 어긋납니다.
 * 첫 마디는 준비(3·2·1·시작), 둘째 마디부터 8마디가 악보입니다. 한 판 약 24초.
 *
 * 악보는 마디마다 8칸(8분음표) 문자열: L = 왼쪽 북, R = 오른쪽 탬버린, . = 쉼.
 * 판정과 별점은 순수 함수라 tests/mori-forest.test.mjs 가 직접 봅니다.
 */

export const RHYTHM_BARS = 8;
export const COUNT_IN_BEATS = 4;
export const LOOP_BEATS = 64;
/** 판정 창(초). 휴대폰 터치 지연을 감안해 넉넉하게 둡니다 */
export const PERFECT_SEC = 0.085;
export const GOOD_SEC = 0.16;

export type RhythmChart = { mori: string; level: string; bars: string[]; invite: string; react: [string, string, string, string] };

/** 주민마다 한 판. invite 는 말버릇으로 시작합니다(테스트가 대조). react 는 별 0·1·2·3개일 때 */
export const RHYTHM_CHARTS: RhythmChart[] = [
  {
    mori: "ESFP", level: "기본",
    invite: "파티 타임! 부탁은 무대부터 하고! 내 노래에 맞춰 북 좀 쳐 줄래?",
    bars: ["L...R...", "L...R...", "L.L.R...", "L...R.R.", "L.R.L.R.", "L.R.L.R.", "L.L.R.R.", "L.R.L...R"],
    react: ["괜찮아, 무대는 원래 떨려! 다음엔 같이 맞춰 보자.", "오, 박자 감 좋은데? 한 번만 더 하면 완벽하겠다!", "와, 관객들 들썩였어! 너 무대 체질이구나!", "앙코르! 앙코르! 오늘의 주인공은 너야!"],
  },
  {
    mori: "ISFP", level: "느긋",
    invite: "오늘 하늘 예쁘다. 부탁 전에, 바람 소리에 맞춰 천천히 같이 쳐 볼래?",
    bars: ["L.......", "R.......", "L...R...", "L...R...", "L.......", "R...R...", "L...R...", "L.......R"],
    react: ["서두르지 않아도 돼. 바람은 기다려 줘.", "좋아, 숨 쉬듯이. 거의 다 왔어.", "바람이랑 같은 속도였어. 예쁜 소리다.", "방금 그 소리, 그림으로 그려 두고 싶어."],
  },
  {
    mori: "ISTP", level: "엇박",
    invite: "…고쳤어. 무대 북 말이야. 부탁은 그다음. 소리 제대로 나는지 엇박으로 쳐 봐.",
    bars: ["L...R...", ".L...R..", "L..R..L.", ".R..L...", "L..R.R..", ".L.L.R..", "L..R..R.", ".L...R..R"],
    react: ["…북은 멀쩡해. 손이 아직 박자를 몰라서 그래.", "…나쁘지 않네. 엇박이 원래 어려워.", "…잘 치네. 북이 좋은 소리 낸다.", "…완벽해. 고친 보람 있다."],
  },
  {
    mori: "ESTP", level: "빠름",
    invite: "일단 해 보고! 부탁은 끝나고 말해 줄게. 나 빠르게 간다, 따라와!",
    bars: ["L.R.L.R.", "LLR.LLR.", "L.R.L.RR", "LRLR....", "L.RRL.RR", "LRL.RLR.", "LLRRLLRR", "LRLRLRL.R"],
    react: ["넘어져도 괜찮아! 일단 해 봤잖아!", "오, 따라오는데? 한 판 더 하면 날 이기겠다!", "빠르다 빠르다! 너 숲 구조대 들어올래?", "졌다! 내가 졌어! 이런 손은 처음 봐!"],
  },
];

export const chartOf = (mori: string) => RHYTHM_CHARTS.find((c) => c.mori === mori);

export type RhythmNote = { beat: number; lane: 0 | 1 };

/**
 * 악보 → 음표(박 단위, 준비 마디 뒤부터). 마지막 마디 끝의 9번째 글자는 다음 마디 첫 박(마무리 한 방)입니다.
 */
export function notesOf(chart: RhythmChart): RhythmNote[] {
  const notes: RhythmNote[] = [];
  chart.bars.forEach((bar, b) => {
    [...bar].forEach((ch, i) => {
      if (ch === "L" || ch === "R") notes.push({ beat: COUNT_IN_BEATS + b * 4 + i / 2, lane: ch === "L" ? 0 : 1 });
    });
  });
  return notes;
}

export type Judge = "perfect" | "good" | "miss";

/** 누른 시각과 음표 시각의 차이(초) → 판정 */
export function judgeOf(diffSec: number): Judge {
  const d = Math.abs(diffSec);
  if (d <= PERFECT_SEC) return "perfect";
  if (d <= GOOD_SEC) return "good";
  return "miss";
}

/** 점수 비율(퍼펙트 1, 굿 0.6) → 별 0~3 */
export function starsOf(perfect: number, good: number, total: number): 0 | 1 | 2 | 3 {
  if (!total) return 0;
  const r = (perfect + good * 0.6) / total;
  return r >= 0.85 ? 3 : r >= 0.6 ? 2 : r >= 0.3 ? 1 : 0;
}
