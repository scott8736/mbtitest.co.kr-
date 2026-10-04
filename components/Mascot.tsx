/**
 * 사이트 마스코트 "모리".
 *
 * 2026-10-05: 코드로 그리던 뇌 모양 캐릭터를 16모리 그림(public/characters)으로 바꿨습니다 —
 * 첫 화면·결과·유료 리포트가 모두 16모리라 마스코트만 다른 캐릭터였습니다. 표정(mood)마다
 * 성격이 맞는 모리를 고릅니다. 문항마다 다른 모리가 나와 "넘어갔다"는 감각은 그대로입니다.
 *
 * 아래는 처음 코드 그림을 고른 이유입니다(지금은 1·2번만 유효 — 그림이 장당 11~17KB 자체 파일).
 *
 * 1. 저작권이 우리 것입니다. GIPHY 는 약관상 상업적 이용과 자체 호스팅을
 *    금지하고(2026-09-13 확인), 무료 일러스트 사이트는 표기 조건이 제각각이라
 *    100개 테스트에 일관되게 깔기 어렵습니다.
 * 2. 외부 요청이 없습니다. GIF 을 문항마다 한 장씩 넣으면 모바일에서 수 MB 가
 *    되고 스크롤이 끊깁니다. 이 컴포넌트는 장당 1KB 도 되지 않습니다.
 * 3. 색이 테스트를 따라갑니다. accent 를 받아 칠하므로 테스트마다 다른 색으로
 *    나오면서도 그림체는 하나로 유지됩니다. 스티커를 20장 그려 넣으면 절대
 *    맞출 수 없는 부분입니다.
 *
 * 자가진단(/check)에는 쓰지 않습니다. 캐릭터가 들어가면 선별 검사의 신뢰가
 * 깎입니다. 성향 테스트와 타로에만 씁니다.
 *
 * 얼굴은 로고의 뇌 모양(.brain-mark)에서 가져왔습니다.
 */

export type MascotMood =
  | "hello"
  | "think"
  | "confused"
  | "surprise"
  | "happy"
  | "shy"
  | "tired"
  | "calm"
  | "worried"
  | "excited"
  | "celebrate"
  | "heart";

/**
 * 문항 번호로 표정을 고릅니다.
 *
 * 문항마다 표정이 바뀌어야 "안 넘어가는 것 같은" 착시가 사라집니다. 같은 그림이
 * 계속 나오면 진행 중이라는 감각이 없어져 중간에 나갑니다. 열 개를 순환시키면
 * 12문항 테스트에서 같은 표정이 두 번 나오는 일이 거의 없습니다.
 */
const CYCLE: MascotMood[] = [
  "think",
  "happy",
  "confused",
  "excited",
  "shy",
  "surprise",
  "calm",
  "worried",
  "hello",
  "tired",
];

export function moodForQuestion(index: number): MascotMood {
  return CYCLE[index % CYCLE.length];
}

/**
 * 슬러그·유형 코드처럼 고정된 문자열로 표정을 정합니다.
 *
 * 목록에서 카드마다 다른 얼굴이 나와야 하고, 다시 그려도 같은 얼굴이 나와야
 * 합니다. 무작위로 고르면 필터를 누를 때마다 얼굴이 바뀌어 목록이 흔들립니다.
 */
export function moodForKey(key: string): MascotMood {
  let sum = 0;
  for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
  return moodForQuestion(sum);
}

const MORI_FOR: Record<MascotMood, string> = {
  hello: "ENFJ", // 깃발 들고 맞이
  think: "INTP", // 전구
  confused: "ENTP", // 질문왕
  surprise: "ESTP",
  happy: "ENFP", // 풍선
  shy: "ISFP",
  tired: "ISTP",
  calm: "INFP",
  worried: "INFJ", // 등불
  excited: "ESFP", // 마이크·꽃가루
  celebrate: "ESFJ", // 컵케이크
  heart: "ISFJ", // 코코아
};

export default function Mascot({
  mood = "hello",
  size = 128,
  type,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  /** 모리를 직접 고를 때(예: 타로는 등불 든 INFJ). 없으면 mood 로 고릅니다 */
  type?: string;
  /** 예전 코드 그림의 몸통 색. 그림으로 바뀌어 쓰지 않지만 부르는 쪽을 그대로 두려고 받습니다 */
  accent?: string;
  className?: string;
}) {
  const code = (type ?? MORI_FOR[mood]).toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다
    <img
      className={`mori-mascot${className ? ` ${className}` : ""}`}
      src={`/characters/mori-${code}.webp`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  );
}
