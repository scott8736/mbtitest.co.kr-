/**
 * 사주·운세 계산 엔진.
 *
 * 모든 함수는 순수 함수입니다. 같은 입력이면 서버 빌드에서든 브라우저에서든
 * 같은 결과가 나와야 정적 페이지와 도구 화면이 어긋나지 않습니다.
 * 난수는 쓰지 않고, 생년월일·날짜에서 만든 해시로 문구를 고릅니다.
 */

// ── 천간·지지 ──────────────────────────────────────────────

export const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const heavenlyStemsKo = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const earthlyBranchesKo = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

/** 천간이 속한 오행. 0=목 1=화 2=토 3=금 4=수 */
export const stemElement = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4] as const;
/** 지지가 속한 오행. 자축인묘진사오미신유술해 순서 */
export const branchElement = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4] as const;
/** 천간의 음양. 0=양 1=음 */
export const stemYinYang = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1] as const;

export const elementNames = ["목", "화", "토", "금", "수"] as const;
export const elementLabels = ["목(木)", "화(火)", "토(土)", "금(金)", "수(水)"] as const;
export const elementSymbols = ["🌳", "🔥", "🏔️", "⚡", "💧"] as const;
export const elementSummaries = [
  "뻗어나가는 성장의 기운",
  "퍼져나가는 열정의 기운",
  "가운데를 잡아주는 안정의 기운",
  "끊고 맺는 결단의 기운",
  "흘러가며 스며드는 지혜의 기운",
] as const;

export const elementColors = ["청록색·초록색", "빨간색·주황색", "노란색·갈색", "흰색·아이보리", "검은색·남색"] as const;
export const elementDirections = ["동쪽", "남쪽", "중앙", "서쪽", "북쪽"] as const;
export const elementNumbers = ["3, 8", "2, 7", "5, 10", "4, 9", "1, 6"] as const;

export type Pillar = { stemIdx: number; branchIdx: number };

// ── 기둥 계산 ──────────────────────────────────────────────

export function calcYearPillar(year: number): Pillar {
  return { stemIdx: (((year - 4) % 10) + 10) % 10, branchIdx: (((year - 4) % 12) + 12) % 12 };
}

export function calcMonthPillar(yearStemIdx: number, month: number): Pillar {
  const branchIdx = (month + 1) % 12;
  const base = [2, 4, 6, 8, 0][yearStemIdx % 5];
  return { stemIdx: (base + (month - 1)) % 10, branchIdx };
}

/** 율리우스 적일로 일주를 구합니다. 60갑자가 끊기지 않는 유일한 방법입니다. */
export function calcDayPillar(year: number, month: number, day: number): Pillar {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const ganzhi = (jdn + 49) % 60;
  return { stemIdx: ganzhi % 10, branchIdx: ganzhi % 12 };
}

/** timeSlotIndex 0 은 "태어난 시간 모름" 입니다. 이때 시주는 세우지 않습니다. */
export function calcTimePillar(dayStemIdx: number, timeSlotIndex: number): Pillar | null {
  if (timeSlotIndex <= 0) return null;
  const branchIdx = (timeSlotIndex - 1) % 12;
  const base = [0, 2, 4, 6, 8][dayStemIdx % 5];
  return { stemIdx: (base + branchIdx) % 10, branchIdx };
}

export const birthTimeSlots = [
  "모름",
  "자시 (23:00~01:00)",
  "축시 (01:00~03:00)",
  "인시 (03:00~05:00)",
  "묘시 (05:00~07:00)",
  "진시 (07:00~09:00)",
  "사시 (09:00~11:00)",
  "오시 (11:00~13:00)",
  "미시 (13:00~15:00)",
  "신시 (15:00~17:00)",
  "유시 (17:00~19:00)",
  "술시 (19:00~21:00)",
  "해시 (21:00~23:00)",
] as const;

export function pillarLabel(pillar: Pillar | null): string {
  if (!pillar) return "—";
  return `${heavenlyStemsKo[pillar.stemIdx]}${earthlyBranchesKo[pillar.branchIdx]}(${heavenlyStems[pillar.stemIdx]}${earthlyBranches[pillar.branchIdx]})`;
}

/** 4기둥의 천간·지지를 모두 세어 오행 분포 [목,화,토,금,수] 를 만듭니다. */
export function countElements(pillars: Array<Pillar | null>): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const pillar of pillars) {
    if (!pillar) continue;
    counts[stemElement[pillar.stemIdx]] += 1;
    counts[branchElement[pillar.branchIdx]] += 1;
  }
  return counts;
}

export type TenGod = "비견" | "식상" | "재성" | "관성" | "인성";

export const tenGodReadings: Record<TenGod, { title: string; desc: string }> = {
  비견: {
    title: "비견 — 나를 지키는 힘",
    desc: "내 기운과 같은 성분이 많아 자기 주관이 뚜렷합니다. 남에게 휘둘리지 않는 대신, 협업에서 한 발 물러서는 연습이 도움이 됩니다.",
  },
  식상: {
    title: "식상 — 표현하고 만들어내는 힘",
    desc: "생각을 밖으로 꺼내는 기운이 강합니다. 말·글·기획·창작에서 힘을 내지만, 벌여놓은 일을 정리하는 습관이 필요합니다.",
  },
  재성: {
    title: "재성 — 현실을 다루는 힘",
    desc: "숫자와 자원을 다루는 감각이 살아 있습니다. 실리를 챙기는 데 강하지만, 사람 관계까지 손익으로 재지 않도록 주의하세요.",
  },
  관성: {
    title: "관성 — 규칙과 책임의 힘",
    desc: "맡은 자리를 지키고 체계를 세우는 기운입니다. 신뢰를 얻기 쉬운 대신, 스스로에게 지나친 기준을 들이대기 쉽습니다.",
  },
  인성: {
    title: "인성 — 받아들이고 배우는 힘",
    desc: "배움과 사유로 자신을 채우는 기운입니다. 깊이가 생기지만, 준비만 하다 시작이 늦어지지 않도록 마감을 정해두세요.",
  },
};

/** 일간을 기준으로 나머지 천간과의 관계를 세어 가장 강한 십신을 고릅니다. */
export function getDominantTenGod(dayStemIdx: number, otherStemIdxs: number[]): TenGod {
  const dayElement = stemElement[dayStemIdx];
  const counts: Record<TenGod, number> = { 비견: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };

  for (const stem of otherStemIdxs) {
    const element = stemElement[stem];
    if (element === dayElement) counts.비견 += 1;
    else if ((dayElement + 1) % 5 === element) counts.식상 += 1;
    else if ((dayElement + 2) % 5 === element) counts.재성 += 1;
    else if ((dayElement + 3) % 5 === element) counts.관성 += 1;
    else counts.인성 += 1;
  }

  let dominant: TenGod = "비견";
  let best = -1;
  for (const key of Object.keys(counts) as TenGod[]) {
    if (counts[key] > best) {
      best = counts[key];
      dominant = key;
    }
  }
  return dominant;
}

// ── 띠 ─────────────────────────────────────────────────────

export const zodiacSlugs = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
] as const;

export type ZodiacSlug = (typeof zodiacSlugs)[number];

/** 지지 순서(자축인묘…)와 같은 순서의 띠 이름입니다. */
export const zodiacNames = [
  "쥐띠",
  "소띠",
  "호랑이띠",
  "토끼띠",
  "용띠",
  "뱀띠",
  "말띠",
  "양띠",
  "원숭이띠",
  "닭띠",
  "개띠",
  "돼지띠",
] as const;

/**
 * 태어난 해로 띠를 구합니다.
 *
 * 입춘(2월 4일경) 이전 출생은 사주에서 전 해로 보는 관습이 있어,
 * 월·일을 넘기면 그 기준을 적용합니다.
 */
export function zodiacIndexFromYear(year: number, month?: number, day?: number): number {
  let effectiveYear = year;
  if (month !== undefined && (month < 2 || (month === 2 && (day ?? 4) < 4))) {
    effectiveYear -= 1;
  }
  return (((effectiveYear - 4) % 12) + 12) % 12;
}

export function zodiacSlugFromYear(year: number, month?: number, day?: number): ZodiacSlug {
  return zodiacSlugs[zodiacIndexFromYear(year, month, day)];
}

// ── 별자리 ─────────────────────────────────────────────────

export const starSignSlugs = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type StarSignSlug = (typeof starSignSlugs)[number];

/** [시작 월, 시작 일] — 해당 날짜부터 그 별자리가 시작됩니다. */
const starSignStarts: Array<[number, number]> = [
  [3, 21],
  [4, 20],
  [5, 21],
  [6, 22],
  [7, 23],
  [8, 23],
  [9, 23],
  [10, 23],
  [11, 22],
  [12, 22],
  [1, 20],
  [2, 19],
];

/**
 * 시작일을 날짜 순으로 정렬해 둔 표.
 *
 * starSignStarts 는 별자리 순서(양자리부터)라서 날짜 순이 아닙니다.
 * 날짜로 찾으려면 반드시 정렬한 뒤에 훑어야 합니다.
 */
const startsByDate = starSignStarts
  .map(([month, day], index) => ({ index, month, day }))
  .sort((a, b) => a.month - b.month || a.day - b.day);

export function starSignIndexFromDate(month: number, day: number): number {
  // 1월 1일~19일은 전해 12월 22일에 시작한 염소자리에 속하므로 마지막 항목이 기본값입니다.
  let picked = startsByDate[startsByDate.length - 1].index;
  for (const entry of startsByDate) {
    if (month > entry.month || (month === entry.month && day >= entry.day)) picked = entry.index;
  }
  return picked;
}

export function starSignSlugFromDate(month: number, day: number): StarSignSlug {
  return starSignSlugs[starSignIndexFromDate(month, day)];
}

// ── 결정적 선택 ────────────────────────────────────────────

/**
 * 문자열을 32비트 정수로 접습니다(FNV-1a).
 * 같은 사람·같은 날이면 언제 새로고침해도 같은 운세가 나오게 하는 근거입니다.
 */
export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickBy<T>(items: readonly T[], seed: number, salt = 0): T {
  return items[(seed + salt * 2654435761) % items.length];
}

/** 0~100 사이 점수. 같은 씨앗이면 항상 같은 값입니다. */
export function scoreBy(seed: number, salt: number, min = 45, max = 98): number {
  const span = max - min + 1;
  return min + ((seed >>> (salt % 12)) % span);
}

/** YYYY-MM-DD. 서버·클라이언트 모두 한국 시간대를 기준으로 맞춥니다. */
export function seoulDateKey(now: Date = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return seoul.toISOString().slice(0, 10);
}

export type BirthInput = { year: number; month: number; day: number; timeSlot?: number };

export type SajuChart = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  time: Pillar | null;
  /** 일간 — 사주에서 "나 자신"에 해당하는 글자입니다. */
  dayStemIdx: number;
  dayElement: number;
  elementCounts: number[];
  strongestElement: number;
  weakestElement: number;
  tenGod: TenGod;
  zodiacIndex: number;
  starSignIndex: number;
  seed: number;
};

export function buildChart({ year, month, day, timeSlot = 0 }: BirthInput): SajuChart {
  const yearPillar = calcYearPillar(year);
  const monthPillar = calcMonthPillar(yearPillar.stemIdx, month);
  const dayPillar = calcDayPillar(year, month, day);
  const timePillar = calcTimePillar(dayPillar.stemIdx, timeSlot);

  const elementCounts = countElements([yearPillar, monthPillar, dayPillar, timePillar]);
  const otherStems = [yearPillar.stemIdx, monthPillar.stemIdx];
  if (timePillar) otherStems.push(timePillar.stemIdx);

  let strongest = 0;
  let weakest = 0;
  elementCounts.forEach((count, index) => {
    if (count > elementCounts[strongest]) strongest = index;
    if (count < elementCounts[weakest]) weakest = index;
  });

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    time: timePillar,
    dayStemIdx: dayPillar.stemIdx,
    dayElement: stemElement[dayPillar.stemIdx],
    elementCounts,
    strongestElement: strongest,
    weakestElement: weakest,
    tenGod: getDominantTenGod(dayPillar.stemIdx, otherStems),
    zodiacIndex: zodiacIndexFromYear(year, month, day),
    starSignIndex: starSignIndexFromDate(month, day),
    seed: hashSeed(`${year}-${month}-${day}-${timeSlot}`),
  };
}
