/**
 * MBTI 결과 화면에 다는 추천 카드. 유형마다 하나씩, lib/mbti-data.ts 의
 * stress·growth 문구에서 실제로 도움이 될 만한 물건 하나를 골랐습니다.
 *
 * 개별 상품이 아니라 쿠팡 검색 결과로 링크를 겁니다. 품절·단종으로 링크가
 * 죽지 않고, "이런 종류가 도움이 되는 유형이다"라는 만큼의 주장만 하게 됩니다.
 * coupangUrl 은 scripts/coupang-links.mjs 가 채웁니다 — 처음에는 비어 있고,
 * 링크가 없는 유형은 MbtiResultPick 이 그냥 숨깁니다.
 *
 * image 는 scripts/pexels-images.mjs 가 검색어로 찾은 예시 사진입니다. 쿠팡
 * 상품 사진이 아니라 Pexels 스톡 사진이라 — 상품 검색 API 를 안 불러 한도를
 * 아끼고, 품절되어도 사진이 안 죽습니다. 없으면 카드는 사진 없이 나갑니다.
 */
export type MbtiPick = { label: string; reason: string; coupangUrl?: string; image?: string };

export const mbtiPicks: Record<string, MbtiPick> = {
  ISTJ: {
    label: "위클리 플래너",
    reason: "예측 가능한 하루를 눈으로 확인할 때 마음이 편해지는 유형이라, 일정을 손으로 정리하는 플래너가 잘 맞습니다.", coupangUrl: "https://link.coupang.com/a/gSmOeKKcfI", image: "https://images.pexels.com/photos/5946167/pexels-photo-5946167.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ISFJ: {
    label: "핸드크림 선물세트",
    reason: "남을 챙기느라 정작 자신은 뒤로 미루기 쉬운 유형이라, 가끔은 스스로에게 주는 작은 선물이 필요합니다.", coupangUrl: "https://link.coupang.com/a/gSmOgX17AG", image: "https://images.pexels.com/photos/38821127/pexels-photo-38821127.jpeg?auto=compress&cs=tinysrgb&h=350" },
  INFJ: {
    label: "화이트노이즈 스피커",
    reason: "감정적인 소음이 많으면 쉽게 지치는 유형이라, 혼자만의 조용한 시간을 만들어 주는 물건이 도움이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOjlcgbQ", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
  INTJ: {
    label: "시스템 다이어리",
    reason: "쉬는 시간도 계획에 넣어야 마음이 편한 유형이라, 하루를 구조화할 수 있는 다이어리가 잘 맞습니다.", coupangUrl: "https://link.coupang.com/a/gSmOlt2w32", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ISTP: {
    label: "멀티툴",
    reason: "직접 손으로 문제를 해결할 때 만족감을 느끼는 유형이라, 실용적인 도구 하나가 든든한 취미가 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOnGvWJo", image: "https://images.pexels.com/photos/35841357/pexels-photo-35841357.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ISFP: {
    label: "디퓨저",
    reason: "감각과 분위기에 예민한 유형이라, 공간의 느낌을 편안하게 바꿔주는 작은 소품이 힐링이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOpNZRQW", image: "https://images.pexels.com/photos/28912723/pexels-photo-28912723.jpeg?auto=compress&cs=tinysrgb&h=350" },
  INFP: {
    label: "필사 노트",
    reason: "머릿속 생각을 글로 옮길 때 정리가 되는 유형이라, 마음을 적어 내려갈 노트 한 권이 힘이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOsshYgD", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
  INTP: {
    label: "타임타이머",
    reason: "생각에 몰입하면 시간 감각을 놓치는 유형이라, 눈에 보이는 타이머 하나가 생활 리듬을 잡아줍니다.", coupangUrl: "https://link.coupang.com/a/gSmOuFY4D6", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ESTP: {
    label: "홈트레이닝 세트",
    reason: "몸을 움직여야 스트레스가 풀리는 유형이라, 언제든 바로 시작할 수 있는 운동 도구가 잘 맞습니다.", coupangUrl: "https://link.coupang.com/a/gSmOw5Rhka", image: "https://images.pexels.com/photos/8436471/pexels-photo-8436471.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ESFP: {
    label: "블루투스 스피커",
    reason: "분위기와 즐거움으로 에너지를 얻는 유형이라, 좋아하는 음악을 크게 틀어줄 스피커 하나가 기분 전환에 좋습니다.", coupangUrl: "https://link.coupang.com/a/gSmOzoW6ua", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ENFP: {
    label: "포스트잇",
    reason: "새로운 시작은 잘하지만 마무리가 쌓이면 부담스러운 유형이라, 눈에 보이게 하나씩 지워나갈 수 있는 포스트잇이 도움이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOBCc2dE", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ENTP: {
    label: "화이트보드",
    reason: "머릿속 아이디어를 눈에 보이게 정리할 때 완성도가 높아지는 유형이라, 화이트보드 하나가 좋은 도구가 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOD7zxZc", image: "https://images.pexels.com/photos/8617769/pexels-photo-8617769.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ESTJ: {
    label: "마사지건",
    reason: "목표를 향해 쉬지 않고 달리는 유형이라, 의식적으로 몸의 피로를 풀어줄 도구를 일정에 넣어두면 좋습니다.", coupangUrl: "https://link.coupang.com/a/gSmOGt4yHY", image: "https://images.pexels.com/photos/36593691/pexels-photo-36593691.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ESFJ: {
    label: "홈카페 세트",
    reason: "남을 챙기느라 바빴다면, 집에서 나만을 위한 여유로운 시간을 만들어 줄 홈카페 세트는 어떨까요.", coupangUrl: "https://link.coupang.com/a/gSmOIAAoDY", image: "https://images.pexels.com/photos/18056912/pexels-photo-18056912.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ENFJ: {
    label: "감정일기장",
    reason: "남의 감정을 먼저 살피는 유형이라, 내 마음을 들여다보는 시간을 위한 기록장이 도움이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOKIDv1E", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
  ENTJ: {
    label: "스탠딩 데스크",
    reason: "쉬는 시간도 성과처럼 여기는 유형이라, 일하는 방식 자체를 편하게 바꿔줄 도구가 실질적인 도움이 됩니다.", coupangUrl: "https://link.coupang.com/a/gSmOMQhKtU", image: "https://images.pexels.com/photos/5552789/pexels-photo-5552789.jpeg?auto=compress&cs=tinysrgb&h=350" },
};
