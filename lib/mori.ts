/**
 * 모리 캐릭터 카드 (2026-10-04 제작).
 *
 * 사이트 마스코트 「모리」를 16유형으로 입힌 그림입니다. 에보링크 nano-banana-2 로 만들었고
 * (A 화풍 = 둥근 3D, INFP 견본을 기준 이미지로 넣어 그림체를 맞춤, 장당 $0.036), 원본에서
 * scripts/make_mori_assets.py 가 public/characters/·public/images/og/mori/ 를 만듭니다.
 *
 * 몸 색(color)은 사이트 결과 색(typeData.color)과 다릅니다. 결과 색은 차분한 초록·청회색이라
 * 16마리가 닮아 보여서, 캐릭터는 유형끼리 확실히 구분되는 색을 따로 씁니다.
 * scripts/make_mori_assets.py 의 TYPES 와 값이 같아야 합니다(tests/mori.test.mjs).
 */
export const MORI: Record<string, { color: string; prop: string }> = {
  ISTJ: { color: "#a9c4ec", prop: "체크리스트와 나비넥타이" },
  ISFJ: { color: "#f6b48f", prop: "따뜻한 코코아" },
  INFJ: { color: "#8fd8c8", prop: "작은 등불" },
  INTJ: { color: "#5b63c9", prop: "체스 나이트" },
  ISTP: { color: "#6f7d96", prop: "스패너와 고글" },
  ISFP: { color: "#8fae8a", prop: "팔레트와 베레모" },
  INFP: { color: "#b9a3e3", prop: "하트 노트와 별" },
  INTP: { color: "#9cc9ef", prop: "반짝이는 전구" },
  ESTP: { color: "#f99a3d", prop: "스케이트보드" },
  ESFP: { color: "#f26b6b", prop: "마이크와 꽃가루" },
  ENFP: { color: "#f2d23c", prop: "풍선 다발" },
  ENTP: { color: "#a6d83c", prop: "확성기" },
  ESTJ: { color: "#b98a5e", prop: "빨간 넥타이와 스톱워치" },
  ESFJ: { color: "#f5a9bd", prop: "컵케이크 쟁반" },
  ENFJ: { color: "#c85bd6", prop: "작은 깃발" },
  ENTJ: { color: "#b5303f", prop: "왕관과 망토" },
};

/**
 * 카드의 「찰떡궁합」. lib/mbti-content.ts 의 profiles[유형].matches[0] 과 같습니다(tests/mori.test.mjs).
 * 그 파일은 41KB 라 결과 화면 묶음에 싣지 않으려고 여기 한 줄로 둡니다.
 */
export const MORI_BEST: Record<string, string> = {
  INTJ: "ENFP", INTP: "ENTJ", ENTJ: "INTP", ENTP: "INFJ", INFJ: "ENTP", INFP: "ENFJ", ENFJ: "INFP", ENFP: "INTJ",
  ISTJ: "ESFP", ISFJ: "ESTP", ESTJ: "ISFP", ESFJ: "ISTP", ISTP: "ESFJ", ISFP: "ENFJ", ESTP: "ISFJ", ESFP: "ISTJ",
};

export const moriImage =(code: string) => `/characters/mori-${code.toLowerCase()}.webp`;
export const moriOgImage = (code: string) => `/images/og/mori/${code.toLowerCase()}.jpg`;
/** 공유 링크가 여는 주소. 결과 화면(/mbti-result/)은 검사한 사람 탭에만 결과가 있어 남에게 보낼 수 없습니다. */
export const moriSharePath = (code: string) => `/s/${code.toLowerCase()}/`;

/**
 * 공유 수단. 관리자 표에 찍힐 이름입니다. 이벤트 share_click 의 slug 자리에 이 키를 넣습니다.
 * 카카오 전용 버튼은 쓰지 않습니다(앱 키 없음, 2026-10-04 사용자 결정) — 카톡은 휴대폰 공유창으로 갑니다.
 */
export const SHARE_CHANNELS = {
  "mori-image": "카드 이미지 (인스타 스토리·저장)",
  "mori-link": "링크 공유 (카톡·문자 등 공유창)",
  "mori-threads": "스레드 글쓰기",
  "mori-copy": "링크 복사",
} as const;

export type ShareChannel = keyof typeof SHARE_CHANNELS;
export const SHARE_CHANNEL_KEYS = Object.keys(SHARE_CHANNELS) as ShareChannel[];

export function shareText(code: string, name: string): string {
  return `나는 ${code} ${name} 모리! 너는 어떤 모리야? 👀`;
}
