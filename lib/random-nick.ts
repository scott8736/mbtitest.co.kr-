/**
 * 랜덤 별명 (2026-10-14 사용자 요청: "별명·표지 이름은 입력 귀찮으니 랜덤으로 미리 박아 둬").
 *
 * 입력칸에 미리 채워 두고 마음에 안 들면 고치게 합니다. 실명이 섞일 일이 없는 흔한 낱말만 씁니다.
 * 정적 렌더와 어긋나지 않게 반드시 마운트 뒤(useEffect)에 부릅니다.
 */
const FIRST = ["달빛", "새벽", "구름", "햇살", "노을", "별빛", "솔바람", "봄비", "은하", "이슬", "민트", "라떼", "복숭아", "도토리", "여우", "고래"];
const SECOND = ["", "", "", "하늘", "여행", "산책", "친구", "마음"];

/** maxLength 글자 안으로 줄여 돌려줍니다. */
export function randomNick(maxLength = 8): string {
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const nick = pick(FIRST) + pick(SECOND);
  return nick.slice(0, maxLength);
}
