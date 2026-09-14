import { hashSeed, seoulDateKey } from "./fortune-engine";
import {
  todayHeadlines,
  todayDetails,
  todayAdvice,
  todayCautions,
  luckyColors,
  luckyDirections,
  luckyItems,
} from "./fortune-readings";

/**
 * 날짜만으로 뽑는 오늘의 운세.
 *
 * 생년월일이 없어도 읽을 것이 있어야 합니다. '오늘의 운세'는 이 사이트에서
 * 가장 큰 검색어인데(MBTI 의 43배), 그 주소를 열면 빈 입력 폼이 떴습니다.
 * 지금 바로 뭔가 읽으러 온 사람에게 서식을 내미는 구조였습니다.
 *
 * 왜 클라이언트에서 계산하나
 *   이 사이트는 정적 배포라 서버 렌더 시점이 곧 '빌드한 날'입니다. 거기서
 *   오늘을 박으면 다음 배포 전까지 어제 운세가 그대로 걸립니다. 그래서 날짜는
 *   브라우저에서 정하고, HTML 에는 날짜를 적지 않은 기본 읽을거리를 둡니다.
 *
 * 왜 무작위가 아니라 시드인가
 *   새로고침할 때마다 바뀌면 운세가 아니라 뽑기가 됩니다. 날짜(그리고 띠)를
 *   시드로 써서 같은 날 같은 사람에게는 늘 같은 내용이 나오게 합니다.
 */

export type DailyReading = {
  dateKey: string;
  headline: string;
  detail: string;
  advice: string;
  caution: string;
  luckyColor: string;
  luckyDirection: string;
  luckyItem: string;
  /** 0~100. 총운을 막대로 보여줄 때 씁니다 */
  score: number;
};

const pick = <T,>(list: readonly T[], seed: number, salt: number): T =>
  list[Math.abs(hashSeed(`${seed}:${salt}`)) % list.length];

/**
 * @param dateKey  "2026-09-14" 형식. 없으면 서울 기준 오늘.
 * @param extra    띠나 별자리처럼 사람마다 갈리는 값. 없으면 전체 공통 운세.
 */
export function buildDailyReading(dateKey?: string, extra = ""): DailyReading {
  const key = dateKey || seoulDateKey();
  const seed = hashSeed(`${key}|${extra}`);

  return {
    dateKey: key,
    headline: pick(todayHeadlines, seed, 1),
    detail: pick(todayDetails, seed, 2),
    advice: pick(todayAdvice, seed, 3),
    caution: pick(todayCautions, seed, 4),
    luckyColor: pick(luckyColors, seed, 5),
    luckyDirection: pick(luckyDirections, seed, 6),
    luckyItem: pick(luckyItems, seed, 7),
    // 55~95 사이. 0 점이나 100 점은 내보내지 않습니다. 오늘 하루를 숫자로
    // 낙인찍는 화면이 되면 운세가 아니라 평가가 됩니다.
    score: 55 + (Math.abs(hashSeed(`${seed}:score`)) % 41),
  };
}

/** "2026-09-14" -> "2026년 9월 14일 (월)" */
export function formatKoreanDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}
