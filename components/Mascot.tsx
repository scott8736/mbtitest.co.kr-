/**
 * 사이트 마스코트 "모리".
 *
 * 검사 화면·CTA·결과 카드에 쓰는 캐릭터 스티커입니다. 이미지 파일이 아니라
 * SVG 를 코드로 그립니다. 이유가 셋 있습니다.
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

type Face = {
  /** 왼쪽·오른쪽 눈 */
  eyes: React.ReactNode;
  mouth: React.ReactNode;
  /** 팔 두 개 */
  arms: React.ReactNode;
  /** 캐릭터 옆에 붙는 작은 장식 */
  prop?: React.ReactNode;
  /** 몸통을 살짝 기울입니다 */
  tilt?: number;
};

const openEyes = (
  <>
    <circle cx="50" cy="52" r="4" />
    <circle cx="70" cy="52" r="4" />
  </>
);

const wideEyes = (
  <>
    <circle cx="50" cy="52" r="6" />
    <circle cx="70" cy="52" r="6" />
  </>
);

const closedEyes = (
  <g fill="none" strokeWidth="2.6" strokeLinecap="round">
    <path d="M45 53q5 -4 10 0" />
    <path d="M65 53q5 -4 10 0" />
  </g>
);

const sleepyEyes = (
  <g fill="none" strokeWidth="2.6" strokeLinecap="round">
    <path d="M45 52q5 4 10 0" />
    <path d="M65 52q5 4 10 0" />
  </g>
);

function faceFor(mood: MascotMood): Face {
  switch (mood) {
    case "hello":
      return {
        eyes: openEyes,
        mouth: <path d="M54 63q6 6 12 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 62 L22 52" />
            <path d="M87 62 L95 68" />
          </g>
        ),
      };
    case "think":
      return {
        tilt: -7,
        eyes: (
          <>
            <circle cx="50" cy="52" r="4" />
            <circle cx="70" cy="52" r="4" />
          </>
        ),
        mouth: <path d="M55 64h9" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 64 L26 74" />
            <path d="M84 66 L74 64" />
          </g>
        ),
        prop: (
          <g fill="none" strokeWidth="2.4" strokeLinecap="round" opacity="0.7">
            <circle cx="97" cy="30" r="3" fill="currentColor" stroke="none" />
            <circle cx="103" cy="20" r="4.5" fill="currentColor" stroke="none" />
          </g>
        ),
      };
    case "confused":
      return {
        tilt: 6,
        eyes: (
          <>
            <circle cx="50" cy="52" r="4" />
            <circle cx="70" cy="53" r="3" />
          </>
        ),
        mouth: <path d="M54 65q6 -4 12 1" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 60 L23 54" />
            <path d="M87 60 L97 54" />
          </g>
        ),
        prop: (
          <g strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
            <path d="M94 26q0 -6 5 -6t5 5q0 4 -5 6v3" />
            <circle cx="99" cy="41" r="1.6" fill="currentColor" stroke="none" />
          </g>
        ),
      };
    case "surprise":
      return {
        eyes: wideEyes,
        mouth: <ellipse cx="60" cy="65" rx="4.5" ry="5.5" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M32 58 L20 50" />
            <path d="M88 58 L100 50" />
          </g>
        ),
        prop: (
          <g strokeWidth="3.4" strokeLinecap="round" opacity="0.8">
            <path d="M98 18 L98 32" />
            <circle cx="98" cy="40" r="2" stroke="none" fill="currentColor" />
          </g>
        ),
      };
    case "happy":
      return {
        eyes: closedEyes,
        mouth: <path d="M52 62q8 9 16 0" fill="none" strokeWidth="2.8" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 58 L23 47" />
            <path d="M87 58 L97 47" />
          </g>
        ),
      };
    case "shy":
      return {
        tilt: 5,
        eyes: closedEyes,
        mouth: <path d="M56 64q4 3 8 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M36 64 L46 70" />
            <path d="M84 64 L74 70" />
          </g>
        ),
        prop: (
          <g opacity="0.5" stroke="none" fill="currentColor">
            <ellipse cx="40" cy="60" rx="5" ry="3.2" />
            <ellipse cx="80" cy="60" rx="5" ry="3.2" />
          </g>
        ),
      };
    case "tired":
      return {
        tilt: -5,
        eyes: sleepyEyes,
        mouth: <path d="M55 65q5 -3 9 1" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M32 64 L26 76" />
            <path d="M88 64 L94 76" />
          </g>
        ),
        prop: (
          <g fill="currentColor" stroke="none" opacity="0.7">
            <text x="92" y="30" fontSize="14" fontWeight="700">z</text>
            <text x="102" y="20" fontSize="10" fontWeight="700">z</text>
          </g>
        ),
      };
    case "calm":
      return {
        eyes: closedEyes,
        mouth: <path d="M56 64h8" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 66 L24 70" />
            <path d="M87 66 L96 70" />
          </g>
        ),
      };
    case "worried":
      return {
        eyes: (
          <>
            <circle cx="50" cy="53" r="4" />
            <circle cx="70" cy="53" r="4" />
            <g fill="none" strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
              <path d="M44 44q5 -3 10 -1" />
              <path d="M76 44q-5 -3 -10 -1" />
            </g>
          </>
        ),
        mouth: <path d="M54 66q6 -5 12 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M36 63 L48 69" />
            <path d="M84 63 L72 69" />
          </g>
        ),
      };
    case "excited":
      return {
        eyes: (
          <>
            <circle cx="50" cy="52" r="5" />
            <circle cx="70" cy="52" r="5" />
            <g fill="#fff" stroke="none">
              <circle cx="52" cy="50" r="1.7" />
              <circle cx="72" cy="50" r="1.7" />
            </g>
          </>
        ),
        mouth: <path d="M53 62q7 8 14 0" fill="none" strokeWidth="2.8" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M32 57 L21 45" />
            <path d="M88 57 L99 45" />
          </g>
        ),
        prop: (
          <g stroke="none" fill="currentColor" opacity="0.8">
            <path d="M100 22 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2z" />
            <path d="M16 30 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z" />
          </g>
        ),
      };
    case "celebrate":
      return {
        eyes: closedEyes,
        mouth: <path d="M52 61q8 10 16 0" fill="none" strokeWidth="2.8" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M32 55 L19 42" />
            <path d="M88 55 L101 42" />
          </g>
        ),
        prop: (
          <g stroke="none" fill="currentColor" opacity="0.75">
            <rect x="22" y="20" width="5" height="7" rx="1.5" transform="rotate(-20 24 23)" />
            <rect x="58" y="12" width="5" height="7" rx="1.5" transform="rotate(12 60 15)" />
            <rect x="94" y="22" width="5" height="7" rx="1.5" transform="rotate(28 96 25)" />
            <circle cx="40" cy="16" r="2.4" />
            <circle cx="78" cy="20" r="2.4" />
          </g>
        ),
      };
    case "heart":
      return {
        eyes: closedEyes,
        mouth: <path d="M55 63q5 5 10 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M36 62 L47 66" />
            <path d="M84 62 L73 66" />
          </g>
        ),
        prop: (
          <path
            d="M60 14c-3.4 -4.6 -11 -3.4 -11 3 0 5.4 7.2 9.6 11 12.4 3.8 -2.8 11 -7 11 -12.4 0 -6.4 -7.6 -7.6 -11 -3z"
            stroke="none"
            fill="currentColor"
            opacity="0.85"
          />
        ),
      };
    default:
      return {
        eyes: openEyes,
        mouth: <path d="M55 63q5 4 10 0" fill="none" strokeWidth="2.6" strokeLinecap="round" />,
        arms: (
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M33 62 L24 68" />
            <path d="M87 62 L96 68" />
          </g>
        ),
      };
  }
}

export default function Mascot({
  mood = "hello",
  size = 128,
  accent,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  /** 없으면 부모의 --test-accent 를 씁니다. 테스트마다 색이 달라집니다 */
  accent?: string;
  className?: string;
}) {
  const face = faceFor(mood);
  const fill = accent || "var(--test-accent, #738b6d)";

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* 장식은 몸통 기울기를 따라가지 않게 바깥에 둡니다 */}
      <g stroke="#15372f" color="#15372f">
        {face.prop}
      </g>

      <g transform={face.tilt ? `rotate(${face.tilt} 60 60)` : undefined}>
        {/* 다리 */}
        <g stroke="#15372f" strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M51 82 L49 97" />
          <path d="M69 82 L71 97" />
        </g>

        {/* 몸통 — 로고의 뇌 모양 */}
        <path
          d="M60 20c-15 0 -28 10 -28 25 0 6 2 11 5 15 -1 3 0 7 3 9 5 4 12 6 20 6s15 -2 20 -6c3 -2 4 -6 3 -9 3 -4 5 -9 5 -15 0 -15 -13 -25 -28 -25z"
          fill={fill}
          stroke="#15372f"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />

        {/* 뇌 주름 */}
        <g fill="none" stroke="#15372f" strokeWidth="2.2" strokeLinecap="round" opacity="0.45">
          <path d="M60 22v10" />
          <path d="M44 30q6 4 4 10" />
          <path d="M76 30q-6 4 -4 10" />
        </g>

        {/* 팔 */}
        <g stroke="#15372f">{face.arms}</g>

        {/* 얼굴 */}
        <g fill="#15372f" stroke="#15372f">
          {face.eyes}
        </g>
        <g stroke="#15372f" fill="#15372f">
          {face.mouth}
        </g>
      </g>
    </svg>
  );
}
