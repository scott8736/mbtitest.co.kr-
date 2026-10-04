/**
 * MBTI 결과 화면에 다는 쿠팡 추천 카드. 유형마다 하나씩.
 *
 * 2026-10-04 에 상품을 바꿨습니다. 예전에는 stress·growth 문구에서 "도움이 될 물건"
 * (플래너·멀티툴·스탠딩 데스크·마사지건 …)을 골랐는데, 30일간 MBTI 완주 9,456명 중
 * 클릭이 4건(0.04%)이었습니다. 방금 내 유형을 알게 된 사람에게는 쓸모보다 **내 유형이
 * 적힌 물건**이 끌린다고 보고 「{유형} 키링」으로 바꿨습니다. 쿠팡 검색 API 로 「INFP 키링」
 * 「ESTJ 굿즈」 「MBTI 키링」을 확인해 유형 키링·스티커·딸깍이 키링이 3천~1만 원대로 실제로
 * 나오는 것을 보고 정했습니다. 효과는 관리자 「쿠팡 클릭」 열로 봅니다.
 *
 * 개별 상품이 아니라 쿠팡 검색 결과로 링크를 겁니다. 품절·단종으로 링크가
 * 죽지 않고, "이런 종류가 있다"는 만큼의 주장만 하게 됩니다.
 * label 이 곧 쿠팡 검색어입니다. coupangUrl 은 scripts/coupang-links.mjs 가 채웁니다 —
 * 링크가 없는 유형은 MbtiResultPick 이 그냥 숨깁니다.
 *
 * image 는 Pexels 스톡 사진(키링)입니다. 쿠팡 상품 사진이 아니라 예시 사진이라 상품 검색
 * API 한도를 아끼고, 품절되어도 사진이 안 죽습니다. 없으면 카드는 사진 없이 나갑니다.
 */
export type MbtiPick = { label: string; reason: string; coupangUrl?: string; image?: string };

export const mbtiPicks: Record<string, MbtiPick> = {
  ISTJ: {
    label: "ISTJ 키링",
    reason: "말보다 행동으로 보여 주는 ISTJ, 가방에 단 네 글자가 나를 대신 소개해 줘요.", coupangUrl: "https://link.coupang.com/a/hzl3KndQKO" },
  ISFJ: {
    label: "ISFJ 키링",
    reason: "늘 남을 먼저 챙기는 ISFJ, 이번엔 나를 위한 작은 키링 하나 어때요?", coupangUrl: "https://link.coupang.com/a/hzl3MIgSdM" },
  INFJ: {
    label: "INFJ 키링",
    reason: "속마음을 쉽게 꺼내지 않는 INFJ, 키링 하나로 은근히 나를 알려 보세요.", coupangUrl: "https://link.coupang.com/a/hzl3O2bvau" },
  INTJ: {
    label: "INTJ 키링",
    reason: "계획은 철저하게, 취향은 확실하게. 내 유형을 조용히 표시해 두세요.", coupangUrl: "https://link.coupang.com/a/hzl3Rbu6WO" },
  ISTP: {
    label: "ISTP 키링",
    reason: "군더더기 없는 걸 좋아하는 ISTP, 심플한 유형 키링이면 충분해요.", coupangUrl: "https://link.coupang.com/a/hzl3TjuAqO" },
  ISFP: {
    label: "ISFP 키링",
    reason: "예쁜 것에 약한 ISFP, 내 유형이 새겨진 키링으로 가방을 꾸며 보세요.", coupangUrl: "https://link.coupang.com/a/hzl3VvPUdN" },
  INFP: {
    label: "INFP 키링",
    reason: "상상 속 세계가 넓은 INFP, 네 글자를 달고 다니면 같은 유형이 먼저 알아봐요.", coupangUrl: "https://link.coupang.com/a/hzl3XDPnHM" },
  INTP: {
    label: "INTP 키링",
    reason: "생각이 꼬리를 무는 INTP, 손에 쥐고 만지작거릴 유형 키링 하나 어때요?", coupangUrl: "https://link.coupang.com/a/hzl3ZP4P8K" },
  ESTP: {
    label: "ESTP 키링",
    reason: "어디서든 눈에 띄는 ESTP, 내 유형을 대놓고 드러내는 키링이 잘 어울려요.", coupangUrl: "https://link.coupang.com/a/hzl3162gfI" },
  ESFP: {
    label: "ESFP 키링",
    reason: "분위기 메이커 ESFP, 친구들과 유형별로 맞춰 달면 더 재밌어요.", coupangUrl: "https://link.coupang.com/a/hzl34kfJBY" },
  ENFP: {
    label: "ENFP 키링",
    reason: "새로운 사람과 금방 친해지는 ENFP, 키링 하나가 대화의 시작이 돼요.", coupangUrl: "https://link.coupang.com/a/hzl36AmmkK" },
  ENTP: {
    label: "ENTP 키링",
    reason: "말로는 지지 않는 ENTP, 네 글자 키링으로 정체를 먼저 밝혀 두세요.", coupangUrl: "https://link.coupang.com/a/hzl38PQCJw" },
  ESTJ: {
    label: "ESTJ 키링",
    reason: "일 처리 확실한 ESTJ, 가방에 단 네 글자가 '믿고 맡기세요'를 대신 말해 줘요.", coupangUrl: "https://link.coupang.com/a/hzl4aZaevQ" },
  ESFJ: {
    label: "ESFJ 키링",
    reason: "모두를 챙기는 ESFJ, 친구 유형까지 맞춰 선물하기 좋아요.", coupangUrl: "https://link.coupang.com/a/hzl4db4KyW" },
  ENFJ: {
    label: "ENFJ 키링",
    reason: "사람들의 중심에 있는 ENFJ, 모임 친구들과 유형 키링을 나눠 달아 보세요.", coupangUrl: "https://link.coupang.com/a/hzl4fpCY68" },
  ENTJ: {
    label: "ENTJ 키링",
    reason: "목표가 분명한 ENTJ, 내 유형을 당당하게 드러내는 키링 하나면 충분해요.", coupangUrl: "https://link.coupang.com/a/hzl4hIGOFE" },
};
