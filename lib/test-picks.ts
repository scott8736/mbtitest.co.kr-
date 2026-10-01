/**
 * MBTI 외 나머지 테스트들의 결과 화면에 다는 추천 카드. lib/mbti-picks.ts 와 같은
 * 방식이지만 이 테스트들은 4글자 코드가 아니라 테스트마다 다른 결과 키를 쓰므로
 * (lib/generic-tests.ts, lib/new-tests.ts, lib/hsp-test.ts 의 results 객체 키)
 * 테스트 slug 로 한 번 더 감쌌습니다.
 *
 * 각 항목은 해당 결과의 summary·relationship·dailyLife·growth·cautions 문구에서
 * 실제로 도움이 될 만한 물건 하나를 골랐습니다. 개별 상품이 아니라 쿠팡 검색
 * 결과로 링크를 겁니다 — 품절·단종으로 링크가 죽지 않습니다.
 *
 * coupangUrl 은 scripts/test-coupang-links.mjs, image 는
 * scripts/test-pexels-images.mjs 가 채웁니다. 둘 다 처음에는 비어 있고,
 * 링크가 없는 결과는 TestResultPick 이 그냥 숨깁니다.
 */
export type TestPick = { label: string; reason: string; coupangUrl?: string; image?: string };

export const testPicks: Record<string, Record<string, TestPick>> = {
  "egen-teto": {
    egen: { label: "감성 캔들", reason: "상대의 반응을 살피느라 정작 나를 돌보는 시간을 뒤로 미루기 쉬운 유형이라, 혼자만의 시간을 채워줄 캔들 하나가 도움이 됩니다.", image: "https://images.pexels.com/photos/9277080/pexels-photo-9277080.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVJFjn0S" },
    teto: { label: "무선 이어폰", reason: "마음이 생기면 말보다 행동으로 먼저 움직이는 유형이라, 에너지를 쏟을 운동이나 몰입 시간에 쓸 이어폰이 잘 맞습니다.", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVLYndzo" },
    balance: { label: "탁상용 타이머", reason: "상황에 따라 다른 얼굴을 오가느라 에너지 소모를 놓치기 쉬운 유형이라, 하루 리듬을 점검해줄 타이머가 도움이 됩니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVOdMf2y" },
  },
  "adult-attachment": {
    secure: { label: "커플 다이어리", reason: "가까움과 독립을 편안히 오가는 유형이라, 관계의 좋은 순간을 기록해두면 익숙함 속에서도 감사를 놓치지 않습니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVQmkVMG" },
    anxious: { label: "감정 기록 노트", reason: "상대의 반응을 민감하게 확인하는 유형이라, 확인 대신 마음을 적어보는 노트가 추측과 사실을 구분하는 데 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVSFkiiq" },
    avoidant: { label: "1인용 캠핑의자", reason: "혼자 정리할 시간이 있어야 편안해지는 유형이라, 온전히 나만의 공간을 만들어줄 물건이 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVUOc2BU" },
    fearful: { label: "아로마 롤온", reason: "가까워지고 싶은 마음과 두려움이 동시에 오는 유형이라, 불안한 순간 스스로를 진정시킬 작은 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/16125095/pexels-photo-16125095.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVXn3crI" },
  },
  "mental-age": {
    teen: { label: "폴라로이드 카메라", reason: "새로운 경험에 나이를 잊고 뛰어드는 유형이라, 그 순간을 바로바로 남길 수 있는 카메라가 잘 맞습니다.", image: "https://images.pexels.com/photos/5472323/pexels-photo-5472323.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqVZPhKSq" },
    twenties: { label: "휴대용 블루투스 스피커", reason: "가능성을 따라 움직이는 도전가 유형이라, 어디서든 분위기를 바꿔줄 스피커 하나가 에너지를 더합니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqV2bbzJA" },
    thirties: { label: "위클리 플래너", reason: "즐거움과 책임을 함께 챙기는 균형가 유형이라, 여러 역할을 한눈에 정리해줄 플래너가 도움이 됩니다.", image: "https://images.pexels.com/photos/5946167/pexels-photo-5946167.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqV4ozqGO" },
    forties: { label: "반신욕기", reason: "주변을 챙기느라 자신의 피로는 늦게 알아차리는 유형이라, 의식적으로 몸을 쉬게 해줄 도구가 필요합니다.", image: "https://images.pexels.com/photos/7019997/pexels-photo-7019997.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqV6AOS7M" },
    wise: { label: "차 티세트", reason: "눈앞의 자극보다 오래 남는 가치를 보는 유형이라, 천천히 흘러가는 시간을 즐길 티타임이 잘 맞습니다.", image: "https://images.pexels.com/photos/18273392/pexels-photo-18273392.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/gSqV8IApno" },
  },
  "love-language": {
    words: { label: "손편지지 세트", reason: "인정하는 말이 사랑으로 느껴지는 유형이라, 마음을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsLqMFMG" },
    time: { label: "2인용 보드게임", reason: "온전한 집중과 함께하는 시간이 중요한 유형이라, 같이 몰입할 수 있는 놀이 하나가 관계를 채워줍니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsOhHkbY" },
    gift: { label: "미니 포장지 세트", reason: "마음을 담은 상징을 오래 간직하는 유형이라, 작은 선물도 정성껏 포장해줄 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/8716181/pexels-photo-8716181.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsQX5XvE" },
    service: { label: "주방 정리용품", reason: "실제 도움이 되는 행동에서 사랑을 느끼는 유형이라, 상대를 위해 뭔가 해줄 수 있는 살림 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/31557569/pexels-photo-31557569.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsTctXwa" },
    touch: { label: "극세사 담요", reason: "따뜻한 접촉에서 안정감을 얻는 유형이라, 포근한 촉감을 주는 담요 하나가 정서적 위안이 됩니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsVsHNL2" },
  },
  "self-esteem": {
    stable: { label: "감사 일기장", reason: "가치와 결과를 잘 구분하는 유형이라, 매일의 작은 안정을 기록해두면 그 중심이 더 단단해집니다.", image: "https://images.pexels.com/photos/18322084/pexels-photo-18322084.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsXzt6vQ" },
    growth: { label: "필사 노트", reason: "부족함을 배움으로 바꾸는 유형이라, 오늘 배운 것을 적어두는 노트가 성장의 기록이 됩니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRsZIfNWS" },
    sensitive: { label: "무드등", reason: "타인의 반응에 마음이 크게 움직이는 시기라, 혼자 있는 공간을 편안하게 만들어줄 조명이 도움이 됩니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRs1YloJM" },
  },
  burnout: {
    green: { label: "폼롤러", reason: "회복 리듬이 아직 살아 있는 상태라, 가벼운 스트레칭으로 몸을 관리해두면 좋습니다.", image: "https://images.pexels.com/photos/16543351/pexels-photo-16543351.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRs32c8JM" },
    yellow: { label: "수면 안대", reason: "몸과 마음이 속도를 줄여달라는 신호를 보내는 시기라, 질 좋은 잠을 도와줄 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRs6aDy0W" },
    red: { label: "반신욕기", reason: "버티기보다 회복이 먼저 필요한 상태라, 몸을 쉬게 하는 데 집중할 도구를 추천합니다.", image: "https://images.pexels.com/photos/7019997/pexels-photo-7019997.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRs8mr4EK" },
  },
  "work-style": {
    driver: { label: "화이트보드", reason: "목표를 빠르게 행동으로 옮기는 유형이라, 할 일과 담당자를 한눈에 정리할 보드가 잘 맞습니다.", image: "https://images.pexels.com/photos/8617769/pexels-photo-8617769.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRtaswVFs" },
    planner: { label: "만년 다이어리", reason: "근거와 구조로 완성도를 높이는 유형이라, 계획을 꼼꼼히 기록할 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRtczFBLg" },
    connector: { label: "텀블러 선물세트", reason: "사람을 연결하는 데 강한 유형이라, 함께 나눌 수 있는 작은 선물이 관계를 부드럽게 합니다.", image: "https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRteG1jxY" },
    creator: { label: "포스트잇", reason: "고정관념을 넘어 아이디어를 떠올리는 유형이라, 생각을 바로바로 붙여둘 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htRtgU2Wcu" },
  },
  "love-tendency": {
    warm: { label: "손편지지 세트", reason: "다정한 말과 행동으로 사랑을 표현하는 유형이라, 마음을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUfNbtK0" },
    steady: { label: "커플 다이어리", reason: "일관된 행동으로 신뢰를 쌓는 유형이라, 함께한 약속과 계획을 기록해둘 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUhZzcI0" },
    spark: { label: "즉석카메라 필름", reason: "새로운 경험으로 관계에 설렘을 더하는 유형이라, 그 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUkr88aG" },
    space: { label: "1인용 텐트", reason: "가까움과 독립을 함께 지키는 유형이라, 온전히 혼자인 시간을 위한 작은 공간이 도움이 됩니다.", image: "https://images.pexels.com/photos/31861359/pexels-photo-31861359.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUmSmC4G" },
  },
  "spending-style": {
    planner: { label: "가계부", reason: "예산 안에서 계획적으로 소비하는 유형이라, 흐름을 눈으로 확인할 가계부가 잘 맞습니다.", image: "https://images.pexels.com/photos/9167736/pexels-photo-9167736.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUpia8ES" },
    value: { label: "가죽 손질 세트", reason: "오래 쓸 좋은 것에 과감히 투자하는 유형이라, 아끼는 물건을 오래 관리할 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/4452379/pexels-photo-4452379.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUrE8NFc" },
    experience: { label: "여행용 파우치", reason: "물건보다 경험에 돈을 쓰는 유형이라, 다음 여행을 가볍게 준비할 파우치가 잘 맞습니다.", image: "https://images.pexels.com/photos/19271566/pexels-photo-19271566.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUt0bO8a" },
    mood: { label: "미니 디퓨저", reason: "작은 소비로 기분을 돌보는 유형이라, 향으로 바로 분위기를 바꿔줄 디퓨저가 잘 맞습니다.", image: "https://images.pexels.com/photos/4266160/pexels-photo-4266160.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUwxV1d6" },
  },
  "lazy-mbti": {
    battery: { label: "구스 목베개", reason: "에너지가 먼저 바닥나 시작이 어려운 유형이라, 짧은 시간에도 제대로 쉴 수 있는 목베개가 도움이 됩니다.", image: "https://images.pexels.com/photos/18979223/pexels-photo-18979223.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUyQRAfA" },
    perfect: { label: "타임타이머", reason: "기준을 계속 높이다 시작이 늦어지는 유형이라, 눈에 보이는 시간 제한이 첫걸음을 도와줍니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUA5I7W0" },
    deadline: { label: "탁상용 화이트보드", reason: "마감이 가까워야 집중력이 오르는 유형이라, 남은 일을 눈에 보이게 적어두면 속도를 앞당길 수 있습니다.", image: "https://images.pexels.com/photos/15585620/pexels-photo-15585620.png?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUDP61qS" },
    wander: { label: "포스트잇", reason: "새롭고 재미있는 것에 관심이 빠르게 옮겨가는 유형이라, 떠오른 아이디어를 놓치지 않게 적어둘 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUF6He2K" },
  },
  "dating-style": {
    contact: { label: "커플 폰케이스", reason: "일상을 자주 나눌수록 가까워지는 유형이라, 손에 늘 닿아있는 소품 하나가 연결감을 더합니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUIx7GP6" },
    date: { label: "즉석카메라 필름", reason: "만나는 순간에 온전히 집중하는 유형이라, 함께한 시간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUK6iPJc" },
    dialogue: { label: "손편지지 세트", reason: "감정과 해결 방법을 말로 확인하는 유형이라, 하고 싶은 말을 정리해서 전할 편지지가 도움이 됩니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/htVUNCZpwO" },
    independent: { label: "1인용 캠핑의자", reason: "각자의 생활을 지키며 함께 성장하는 유형이라, 혼자만의 시간을 편안하게 채워줄 의자가 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lL7UccC" },
  },
  "mbti-love-compatibility": {
    nf: { label: "감성 캔들", reason: "감정과 가능성을 깊이 나누는 궁합이라, 대화가 깊어지는 밤을 은은하게 채워줄 캔들이 잘 맞습니다.", image: "https://images.pexels.com/photos/9277080/pexels-photo-9277080.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lOrpjRA" },
    nt: { label: "2인용 보드게임", reason: "지적 자극을 나누는 궁합이라, 함께 머리를 쓰며 즐길 보드게임이 좋은 데이트가 됩니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lQCwnMi" },
    sj: { label: "커플 다이어리", reason: "꾸준한 약속과 생활의 호흡이 맞는 궁합이라, 함께 계획을 적어나갈 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lSMzBxQ" },
    sp: { label: "즉석카메라 필름", reason: "지금 이 순간을 함께 즐기는 궁합이라, 즉흥적인 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lUVKPkG" },
  },
  "vegetable-village-character": {
    onion: { label: "감성 캔들", reason: "가까워질수록 깊은 이야기가 드러나는 캐릭터라, 편안한 분위기를 만들어줄 캔들이 잘 맞습니다.", image: "https://images.pexels.com/photos/9277080/pexels-photo-9277080.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lXfB6uO" },
    pepper: { label: "홈트레이닝 밴드", reason: "하고 싶은 일에 먼저 움직이는 캐릭터라, 에너지를 발산할 운동 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0lZupW6m" },
    cabbage: { label: "텀블러 선물세트", reason: "주변을 세심하게 챙기는 캐릭터라, 함께 나눌 수 있는 선물이 잘 어울립니다.", image: "https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0l1JZ2I0" },
    carrot: { label: "여행용 파우치", reason: "새로운 길을 발견하면 눈이 반짝이는 캐릭터라, 다음 탐험을 가볍게 준비할 파우치가 잘 맞습니다.", image: "https://images.pexels.com/photos/19271566/pexels-photo-19271566.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0l4cyxJk" },
  },
  "friendship-symbol": {
    compass: { label: "만년 다이어리", reason: "방향을 정리해주는 길잡이 캐릭터라, 생각을 기록할 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0l6lX0RE" },
    blanket: { label: "극세사 담요", reason: "말없이도 마음을 편안하게 하는 캐릭터라, 포근한 담요 하나가 그 느낌을 닮았습니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0l8wNtEi" },
    firework: { label: "블루투스 스피커", reason: "분위기를 빠르게 밝히는 캐릭터라, 어디서든 즐거움을 더할 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0maTx5TE" },
    anchor: { label: "가죽 다이어리 커버", reason: "시간이 지나도 같은 자리를 지키는 캐릭터라, 오래 곁에 둘 수 있는 물건이 잘 어울립니다.", image: "https://images.pexels.com/photos/4452374/pexels-photo-4452374.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0mdbtwVU" },
  },
  "dont-get-hurt": {
    absorb: { label: "감정 기록 노트", reason: "주변의 감정과 평가가 오래 남는 유형이라, 마음을 적어보며 정리하는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0mfvPrY4" },
    hide: { label: "수면 안대", reason: "괜찮은 척 넘기고 혼자 감정을 정리하는 유형이라, 온전히 쉴 수 있는 시간을 위한 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht0mhDkhz2" },
    wall: { label: "1인용 캠핑의자", reason: "상처 가능성이 느껴지면 거리를 두는 유형이라, 안전하게 혼자 있을 공간이 도움이 됩니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4Ngq6Rm8" },
    talk: { label: "손편지지 세트", reason: "이유를 확인하고 경계를 말하며 회복하는 유형이라, 하고 싶은 말을 정리해 전할 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NiS7WV2" },
  },
  "animal-keeper": {
    panda: { label: "무드등", reason: "편안한 환경과 안정감을 만드는 유형이라, 은은한 조명이 그 분위기를 완성합니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NleR4OO" },
    dolphin: { label: "블루투스 스피커", reason: "반응을 주고받는 데서 에너지를 얻는 유형이라, 함께 즐길 음악을 위한 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NnyvrWK" },
    tiger: { label: "홈트레이닝 밴드", reason: "빠른 판단과 결단력이 강점인 유형이라, 에너지를 쏟을 운동 도구가 잘 어울립니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NpKHdhQ" },
    owl: { label: "만년 다이어리", reason: "작은 변화도 기록하고 분석하는 유형이라, 관찰한 내용을 정리할 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4Nr4Fb08" },
  },
  "family-letter-personality": {
    instant: { label: "포스트잇", reason: "받은 일을 바로 끝내는 실행가 유형이라, 할 일을 붙여두고 바로 지워나갈 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4Nug8TNA" },
    bag: { label: "탁상용 타이머", reason: "마감 직전 집중력이 폭발하는 유형이라, 눈에 보이는 시간 제한이 도움이 됩니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4Nwuivpk" },
    decorate: { label: "형광펜 세트", reason: "보기 좋게 정리해야 이해가 되는 유형이라, 중요한 부분을 표시할 필기구가 잘 맞습니다.", image: "https://images.pexels.com/photos/3373722/pexels-photo-3373722.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NyIfyCG" },
    delegate: { label: "커플 다이어리", reason: "함께 확인하고 움직일 때 힘이 나는 유형이라, 같이 기록할 수 있는 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NATARSS" },
  },
  "christmas-cookie-personality": {
    ginger: { label: "즉석카메라 필름", reason: "새로운 곳에서 추억을 만드는 유형이라, 그 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NDdvuPA" },
    snowball: { label: "극세사 담요", reason: "편안한 공간에서 온기를 나누는 유형이라, 포근한 담요 하나가 그 시간을 완성합니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NFEzM7M" },
    star: { label: "무드등", reason: "분위기와 장식으로 설렘을 만드는 유형이라, 공간을 반짝이게 할 조명이 잘 맞습니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NH1Lmai" },
    choco: { label: "홈베이킹 재료", reason: "맛있는 것을 나누며 즐거움을 주는 유형이라, 직접 만들어 나눌 베이킹 재료가 잘 맞습니다.", image: "https://images.pexels.com/photos/8961863/pexels-photo-8961863.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NKgG6Vw" },
  },
  "personality-guide": {
    words: { label: "손편지지 세트", reason: "말로 확인해야 마음이 선명해지는 유형이라, 하고 싶은 말을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht4NMCfYR2" },
    action: { label: "커플 다이어리", reason: "반복되는 행동에서 진심을 읽는 유형이라, 함께한 약속을 기록해둘 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9eVCKMUe" },
    context: { label: "감정 기록 노트", reason: "상황과 감정의 배경까지 함께 읽는 유형이라, 그날의 맥락을 적어두는 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9eXPd9no" },
    space: { label: "아로마 디퓨저", reason: "감정이 클 때 잠시 시간을 두는 유형이라, 마음을 가라앉힐 공간을 만들어줄 디퓨저가 도움이 됩니다.", image: "https://images.pexels.com/photos/6281179/pexels-photo-6281179.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9e0xb70u" },
  },
  "couple-character": {
    puppy: { label: "커플 폰케이스", reason: "표현할수록 사랑이 커지는 캐릭터라, 늘 함께하는 소품 하나가 애정을 더합니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9e2NZawu" },
    cat: { label: "1인용 캠핑의자", reason: "자유롭지만 마음을 열면 깊은 캐릭터라, 혼자만의 시간을 편안하게 채워줄 의자가 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9e5sG4k0" },
    bear: { label: "커플 다이어리", reason: "말보다 행동으로 곁을 지키는 캐릭터라, 함께 계획을 적어나갈 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9e7BbbH2" },
    fox: { label: "블루투스 스피커", reason: "설렘을 만드는 센스 있는 캐릭터라, 분위기를 바꿔줄 스피커가 데이트에 잘 어울립니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9e9Mqu5I" },
  },
  "f-flirting-simulation": {
    empathy: { label: "감정 기록 노트", reason: "마음을 먼저 알아주는 유형이라, 상대의 이야기를 정리해보는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fbV7zl6" },
    direct: { label: "손편지지 세트", reason: "애매함보다 솔직함으로 다가가는 유형이라, 마음을 분명하게 전할 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fea9jZQ" },
    detail: { label: "포스트잇", reason: "사소한 취향을 기억하는 유형이라, 떠오른 정보를 바로 적어둘 메모지가 도움이 됩니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fgh353s" },
    steady: { label: "커플 다이어리", reason: "꾸준한 연락과 약속으로 신뢰를 쌓는 유형이라, 함께 기록할 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fimexnE" },
  },
  "healing-sprite": {
    leaf: { label: "디퓨저", reason: "조용한 자연 속에서 에너지를 채우는 요정이라, 은은한 향이 그 시간을 완성합니다.", image: "https://images.pexels.com/photos/28912723/pexels-photo-28912723.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fktrLQy" },
    drop: { label: "감정 기록 노트", reason: "감정을 흘려보내며 회복하는 요정이라, 마음을 적어보는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fmIKgk8" },
    spark: { label: "블루투스 스피커", reason: "작은 재미로 다시 움직이는 요정이라, 좋아하는 음악을 바로 틀어줄 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9foTZepw" },
    moon: { label: "수면 안대", reason: "충분한 쉼과 수면으로 균형을 되찾는 요정이라, 질 좋은 잠을 도와줄 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350", coupangUrl: "https://link.coupang.com/a/ht9fq1zcBM" },
  },
  "self-reflection": {
    journal: { label: "필사 노트", reason: "쓰면서 마음의 패턴을 발견하는 유형이라, 생각을 옮겨 적을 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    dialogue: { label: "손편지지 세트", reason: "대화하며 진짜 마음을 찾는 유형이라, 나누고 싶은 이야기를 정리할 편지지가 도움이 됩니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    action: { label: "홈트레이닝 밴드", reason: "직접 부딪치며 배우는 유형이라, 바로 시작할 수 있는 운동 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    quiet: { label: "아로마 디퓨저", reason: "잠시 멈춰 내면의 목소리를 듣는 유형이라, 고요한 공간을 만들어줄 디퓨저가 도움이 됩니다.", image: "https://images.pexels.com/photos/6281179/pexels-photo-6281179.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "first-impression": {
    sun: { label: "블루투스 스피커", reason: "먼저 웃으며 분위기를 여는 인상이라, 밝은 에너지를 더해줄 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
    calm: { label: "차 티세트", reason: "말을 서두르지 않는 차분한 인상이라, 여유로운 티타임이 잘 어울립니다.", image: "https://images.pexels.com/photos/18273392/pexels-photo-18273392.jpeg?auto=compress&cs=tinysrgb&h=350" },
    sharp: { label: "만년필", reason: "분명한 태도로 존재감을 남기는 인상이라, 품격 있는 필기구가 잘 맞습니다.", image: "https://images.pexels.com/photos/13583358/pexels-photo-13583358.jpeg?auto=compress&cs=tinysrgb&h=350" },
    mystery: { label: "무드등", reason: "알아갈수록 새로운 면이 보이는 인상이라, 은은한 조명이 그 분위기를 닮았습니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "future-person": {
    inventor: { label: "미니 공구세트", reason: "새로운 기술을 직접 조합해보는 유형이라, 손으로 만들고 고칠 수 있는 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/9607005/pexels-photo-9607005.jpeg?auto=compress&cs=tinysrgb&h=350" },
    navigator: { label: "만년 다이어리", reason: "빠른 변화 속에서 길을 찾는 유형이라, 정보를 정리할 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350" },
    guardian: { label: "텀블러", reason: "사람과 환경을 먼저 생각하는 유형이라, 다회용으로 오래 쓸 수 있는 텀블러가 잘 맞습니다.", image: "https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&h=350" },
    pioneer: { label: "여행용 파우치", reason: "불확실해도 먼저 도전하는 유형이라, 다음 모험을 가볍게 준비할 파우치가 잘 맞습니다.", image: "https://images.pexels.com/photos/19271566/pexels-photo-19271566.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "love-ability": {
    empathy: { label: "감정 기록 노트", reason: "감정을 알아차리고 안전하게 받아주는 유형이라, 상대의 마음을 정리해보는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    expression: { label: "손편지지 세트", reason: "애정을 구체적인 말로 전하는 유형이라, 마음을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    repair: { label: "커플 다이어리", reason: "다툰 뒤 대화로 다시 연결하는 유형이라, 함께 정리해나갈 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    balance: { label: "1인용 캠핑의자", reason: "사랑과 나의 생활을 함께 지키는 유형이라, 온전히 혼자인 시간을 위한 의자가 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  hsp: {
    depth: { label: "필사 노트", reason: "받아들인 것을 오래 곱씹는 유형이라, 생각을 정리해 적어볼 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    overload: { label: "노이즈캔슬링 이어폰", reason: "자극이 남들보다 빨리 차오르는 유형이라, 소음을 줄여줄 이어폰 하나가 회복 속도를 크게 바꿉니다.", image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    empathy: { label: "아로마 롤온", reason: "남의 감정이 내 안에서 함께 울리는 유형이라, 옮겨온 감정을 내려놓는 나만의 루틴에 향이 도움이 됩니다.", image: "https://images.pexels.com/photos/16125095/pexels-photo-16125095.jpeg?auto=compress&cs=tinysrgb&h=350" },
    subtle: { label: "간접조명", reason: "작은 차이를 먼저 알아채는 유형이라, 조명 하나만 바꿔도 하루의 피로가 눈에 띄게 줄어듭니다.", image: "https://images.pexels.com/photos/7756457/pexels-photo-7756457.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  neujoh: {
    air: { label: "룸 스프레이", reason: "있기만 해도 자리가 편해지는 유형이라, 머무는 공간의 공기부터 바꿔줄 은은한 향이 잘 어울립니다.", image: "https://images.pexels.com/photos/17494339/pexels-photo-17494339.jpeg?auto=compress&cs=tinysrgb&h=350" },
    talk: { label: "메시지 카드 세트", reason: "건넨 한마디가 오래 남는 유형이라, 그 말을 손글씨로 남겨둘 작은 카드가 잘 맞습니다.", image: "https://images.pexels.com/photos/18322084/pexels-photo-18322084.jpeg?auto=compress&cs=tinysrgb&h=350" },
    style: { label: "향수 공병 세트", reason: "고른 것마다 이유가 있는 유형이라, 좋아하는 향을 나눠 담아 다닐 공병이 취향을 더 선명하게 해줍니다.", image: "https://images.pexels.com/photos/975656/pexels-photo-975656.jpeg?auto=compress&cs=tinysrgb&h=350" },
    focus: { label: "노이즈캔슬링 헤드폰", reason: "몰입한 모습이 매력인 유형이라, 주변 소리를 줄여 그 시간을 지켜줄 헤드폰이 잘 맞습니다.", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  hyeonta: {
    empty: { label: "성취 기록 다이어리", reason: "열심히 했는데 남은 게 없다고 느끼기 쉬운 유형이라, 한 일을 하루 한 줄씩 적어두면 쌓인 것이 눈에 보입니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    compare: { label: "스마트폰 타임락 박스", reason: "남의 소식을 보고 마음이 내려앉기 쉬운 유형이라, 휴대폰을 잠시 넣어둘 상자가 비교에서 거리를 만들어줍니다.", image: "https://images.pexels.com/photos/14979013/pexels-photo-14979013.jpeg?auto=compress&cs=tinysrgb&h=350" },
    relation: { label: "1인용 리클라이너", reason: "사람을 만나는 일이 소모처럼 느껴지는 시기라, 온전히 혼자 쉴 자리 하나가 회복을 돕습니다.", image: "https://images.pexels.com/photos/39134163/pexels-photo-39134163.jpeg?auto=compress&cs=tinysrgb&h=350" },
    direction: { label: "진로 고민 책", reason: "지금 가는 길이 맞는지 확신이 서지 않는 유형이라, 다른 사람들의 선택 과정을 읽어보면 생각을 정리하는 데 도움이 됩니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "dopamine-addiction": {
    scroll: { label: "스마트폰 타임락 박스", reason: "잠깐만 본다고 켰다가 한참이 지나는 유형이라, 정해둔 시간 동안 휴대폰을 넣어둘 상자가 가장 확실합니다.", image: "https://images.pexels.com/photos/14979013/pexels-photo-14979013.jpeg?auto=compress&cs=tinysrgb&h=350" },
    alert: { label: "아날로그 손목시계", reason: "알림을 확인해야 마음이 놓이는 유형이라, 시간 확인만큼은 휴대폰 대신 시계로 하면 여는 횟수가 줄어듭니다.", image: "https://images.pexels.com/photos/28977357/pexels-photo-28977357.jpeg?auto=compress&cs=tinysrgb&h=350" },
    newthing: { label: "퍼즐 1000피스", reason: "지루함을 가장 못 견디는 유형이라, 화면 대신 손으로 몰입할 거리 하나가 새로운 자극을 대신해줍니다.", image: "https://images.pexels.com/photos/12360275/pexels-photo-12360275.jpeg?auto=compress&cs=tinysrgb&h=350" },
    steady: { label: "종이책 독서대", reason: "심심한 시간을 견딜 수 있는 유형이라, 그 빈 시간을 오래 붙잡아둘 독서 환경이 잘 맞습니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "autumn-bti": {
    leaf: { label: "쿠션 워킹화", reason: "걸으며 생각을 정리하는 유형이라, 오래 걸어도 편한 신발 하나가 가을 산책을 늘려줍니다.", image: "https://images.pexels.com/photos/27256414/pexels-photo-27256414.jpeg?auto=compress&cs=tinysrgb&h=350" },
    blanket: { label: "극세사 담요", reason: "쌀쌀해질수록 집이 좋아지는 유형이라, 창밖을 보며 덮을 포근한 담요가 가을의 전부가 됩니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350" },
    trip: { label: "여행용 백팩", reason: "계절을 보러 떠나는 유형이라, 짐을 가볍게 챙겨 바로 나설 수 있는 가방이 잘 맞습니다.", image: "https://images.pexels.com/photos/2416871/pexels-photo-2416871.jpeg?auto=compress&cs=tinysrgb&h=350" },
    harvest: { label: "2027 다이어리", reason: "가을에 한 해를 점검하는 유형이라, 남은 계획을 옮겨 적고 새해를 미리 준비할 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "chuseok-food": {
    songpyeon: { label: "전통 다과 선물세트", reason: "정성이 들어간 것을 알아보는 유형이라, 손이 많이 간 전통 다과가 잘 어울립니다.", image: "https://images.pexels.com/photos/9508199/pexels-photo-9508199.jpeg?auto=compress&cs=tinysrgb&h=350" },
    jeon: { label: "대형 전기그릴", reason: "곁에 사람이 있어야 제맛인 유형이라, 여럿이 둘러앉아 함께 구워 먹을 그릴이 잘 맞습니다.", image: "https://images.pexels.com/photos/18646031/pexels-photo-18646031.jpeg?auto=compress&cs=tinysrgb&h=350" },
    galbi: { label: "무쇠 주물 냄비", reason: "기다렸다 제대로 먹는 유형이라, 오래 끓여야 맛이 나는 요리에 맞는 냄비가 잘 어울립니다.", image: "https://images.pexels.com/photos/36552082/pexels-photo-36552082.png?auto=compress&cs=tinysrgb&h=350" },
    sikhye: { label: "밀폐용기 세트", reason: "끝을 정리해주는 유형이라, 남은 음식을 깔끔하게 나눠 담을 용기가 손에 잘 맞습니다.", image: "https://images.pexels.com/photos/13968302/pexels-photo-13968302.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "holiday-stress": {
    question: { label: "노이즈캔슬링 이어폰", reason: "말이 제일 힘든 유형이라, 오가는 길에서만큼은 조용히 쉴 수 있게 해줄 이어폰이 도움이 됩니다.", image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    labor: { label: "마사지건", reason: "몸이 먼저 지치는 유형이라, 끝나고 뭉친 곳을 풀어줄 도구가 며칠의 회복을 줄여줍니다.", image: "https://images.pexels.com/photos/36593691/pexels-photo-36593691.jpeg?auto=compress&cs=tinysrgb&h=350" },
    crowd: { label: "수면 안대", reason: "사람이 많으면 방전되는 유형이라, 잠깐이라도 눈을 감고 혼자가 될 수 있는 안대가 도움이 됩니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350" },
    cost: { label: "가계부", reason: "명절 전부터 지출을 계산하는 유형이라, 쓰는 돈을 한눈에 정리할 가계부가 불안을 줄여줍니다.", image: "https://images.pexels.com/photos/9167736/pexels-photo-9167736.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  aura: {
    violet: { label: "무드등", reason: "쉽게 읽히지 않는 분위기의 유형이라, 공간의 빛을 바꿔줄 은은한 조명이 잘 어울립니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
    gold: { label: "홈파티 식기 세트", reason: "들어가면 자리가 밝아지는 유형이라, 사람을 불러 모을 식탁을 꾸밀 식기가 잘 맞습니다.", image: "https://images.pexels.com/photos/18273369/pexels-photo-18273369.jpeg?auto=compress&cs=tinysrgb&h=350" },
    aqua: { label: "가습기", reason: "맑고 잔잔한 분위기의 유형이라, 방 안의 공기를 부드럽게 유지해줄 가습기가 잘 어울립니다.", image: "https://images.pexels.com/photos/13509190/pexels-photo-13509190.jpeg?auto=compress&cs=tinysrgb&h=350" },
    crimson: { label: "러닝화", reason: "하고 싶은 것이 생기면 바로 움직이는 유형이라, 그 에너지를 쏟을 운동화가 잘 맞습니다.", image: "https://images.pexels.com/photos/9033627/pexels-photo-9033627.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "my-color": {
    ivory: { label: "린넨 침구 세트", reason: "어디에도 자연스럽게 스며드는 유형이라, 편안한 색감의 침구가 일상에 잘 어울립니다.", image: "https://images.pexels.com/photos/36507130/pexels-photo-36507130.jpeg?auto=compress&cs=tinysrgb&h=350" },
    navy: { label: "가죽 다이어리", reason: "맡은 일은 확실히 끝내는 유형이라, 오래 쓰는 단단한 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/4452374/pexels-photo-4452374.jpeg?auto=compress&cs=tinysrgb&h=350" },
    coral: { label: "립밤 세트", reason: "좋으면 표정에 바로 드러나는 유형이라, 생기 있는 얼굴을 지켜줄 작은 소지품이 잘 어울립니다.", image: "https://images.pexels.com/photos/5911995/pexels-photo-5911995.jpeg?auto=compress&cs=tinysrgb&h=350" },
    moss: { label: "반려식물 화분", reason: "자기 속도로 천천히 가는 유형이라, 매일 조금씩 자라는 식물 하나가 잘 어울립니다.", image: "https://images.pexels.com/photos/16799768/pexels-photo-16799768.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "destiny-animal": {
    wolf: { label: "캠핑 랜턴", reason: "믿는 사람들을 이끌면서 혼자만의 시간도 필요한 유형이라, 밤을 밝혀줄 랜턴이 잘 어울립니다.", image: "https://images.pexels.com/photos/4811794/pexels-photo-4811794.jpeg?auto=compress&cs=tinysrgb&h=350" },
    cat: { label: "빈백 소파", reason: "내 리듬을 지키는 유형이라, 몸을 맡기고 늘어질 수 있는 빈백이 잘 맞습니다.", image: "https://images.pexels.com/photos/39196722/pexels-photo-39196722.jpeg?auto=compress&cs=tinysrgb&h=350" },
    dolphin: { label: "보드게임", reason: "처음 만난 사람과도 금방 친해지는 유형이라, 여럿이 함께 웃을 거리가 되는 보드게임이 잘 맞습니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    deer: { label: "아로마 디퓨저", reason: "조용한 곳에서 마음이 놓이는 유형이라, 공간을 차분하게 만들어줄 향이 잘 어울립니다.", image: "https://images.pexels.com/photos/6281179/pexels-photo-6281179.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "four-cut": {
    director: { label: "셀카 삼각대", reason: "구도부터 잡고 시작하는 유형이라, 원하는 각도로 직접 찍을 수 있는 삼각대가 잘 맞습니다.", image: "https://images.pexels.com/photos/12953565/pexels-photo-12953565.jpeg?auto=compress&cs=tinysrgb&h=350" },
    reaction: { label: "포토부스 소품 세트", reason: "표정으로 컷을 살리는 유형이라, 재미를 더해줄 사진 소품이 잘 어울립니다.", image: "https://images.pexels.com/photos/32496122/pexels-photo-32496122.jpeg?auto=compress&cs=tinysrgb&h=350" },
    keeper: { label: "포토앨범", reason: "찍은 사진을 바로 정리하는 유형이라, 네 컷 사진을 모아둘 앨범이 잘 맞습니다.", image: "https://images.pexels.com/photos/32496122/pexels-photo-32496122.jpeg?auto=compress&cs=tinysrgb&h=350" },
    natural: { label: "인스탁스 카메라", reason: "즉흥적인 컷이 가장 잘 나오는 유형이라, 바로 찍고 바로 나오는 즉석카메라가 잘 어울립니다.", image: "https://images.pexels.com/photos/16045136/pexels-photo-16045136.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  halloween: {
    ghost: { label: "무드등", reason: "조용히 있다가 결정적인 순간에 나타나는 유형이라, 어둠 속에서 은은하게 빛나는 조명이 잘 어울립니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
    pumpkin: { label: "핼러윈 파티 소품", reason: "자리의 불을 켜는 유형이라, 모임 분위기를 한 번에 바꿔줄 파티 소품이 잘 맞습니다.", image: "https://images.pexels.com/photos/10670326/pexels-photo-10670326.jpeg?auto=compress&cs=tinysrgb&h=350" },
    vampire: { label: "LED 스탠드", reason: "밤이 되면 집중이 붙는 유형이라, 늦은 시간 눈을 덜 피로하게 해줄 스탠드가 잘 맞습니다.", image: "https://images.pexels.com/photos/37954552/pexels-photo-37954552.jpeg?auto=compress&cs=tinysrgb&h=350" },
    witch: { label: "베이킹 도구 세트", reason: "재료만 있으면 뭐든 만들어내는 유형이라, 조합하는 즐거움을 살릴 베이킹 도구가 잘 어울립니다.", image: "https://images.pexels.com/photos/8961973/pexels-photo-8961973.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "suneung-mental": {
    steady: { label: "공부 타이머", reason: "매일 같은 속도로 가는 유형이라, 공부 시간을 일정하게 지켜줄 타이머가 잘 맞습니다.", image: "https://images.pexels.com/photos/29765808/pexels-photo-29765808.jpeg?auto=compress&cs=tinysrgb&h=350" },
    burst: { label: "독서실 칸막이 책상", reason: "마감이 가까워지면 집중이 폭발하는 유형이라, 그 순간을 흐트러짐 없이 받쳐줄 공간이 도움이 됩니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
    anxious: { label: "수면 안대", reason: "최악을 먼저 그려보는 유형이라, 시험 전날 생각을 끄고 잠드는 데 도움이 될 안대가 잘 맞습니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350" },
    chill: { label: "블루투스 이어폰", reason: "남의 진도에 흔들리지 않는 유형이라, 쉬는 시간에 내 리듬대로 음악을 들을 이어폰이 잘 어울립니다.", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  pepero: {
    classic: { label: "빼빼로 선물세트", reason: "기본이 제일이라는 유형이라, 원래 먹던 그 맛 그대로의 선물세트가 가장 잘 맞습니다.", image: "https://images.pexels.com/photos/19608064/pexels-photo-19608064.jpeg?auto=compress&cs=tinysrgb&h=350" },
    almond: { label: "아몬드 초콜릿", reason: "같은 것도 한 끗 다른 쪽을 고르는 유형이라, 고소함이 더해진 초콜릿이 잘 어울립니다.", image: "https://images.pexels.com/photos/18435586/pexels-photo-18435586.jpeg?auto=compress&cs=tinysrgb&h=350" },
    handmade: { label: "DIY 초콜릿 만들기 세트", reason: "선물은 직접 만들어야 의미가 있다고 보는 유형이라, 손으로 만드는 키트가 잘 맞습니다.", image: "https://images.pexels.com/photos/30101199/pexels-photo-30101199.jpeg?auto=compress&cs=tinysrgb&h=350" },
    share: { label: "대용량 과자 선물세트", reason: "빠지는 사람 없이 돌리는 유형이라, 여럿에게 나눠주기 좋은 대용량 세트가 잘 맞습니다.", image: "https://images.pexels.com/photos/23025154/pexels-photo-23025154.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "first-snow": {
    text: { label: "커플 머그컵", reason: "기념할 날을 놓치지 않는 유형이라, 첫눈 오는 날 함께 쓸 머그컵이 잘 어울립니다.", image: "https://images.pexels.com/photos/6030460/pexels-photo-6030460.jpeg?auto=compress&cs=tinysrgb&h=350" },
    walk: { label: "커플 장갑", reason: "특별한 곳보다 옆자리가 중요한 유형이라, 함께 걸을 때 손을 따뜻하게 해줄 장갑이 잘 맞습니다.", image: "https://images.pexels.com/photos/30025376/pexels-photo-30025376.jpeg?auto=compress&cs=tinysrgb&h=350" },
    window: { label: "캔들 워머", reason: "안에서 더 깊이 느끼는 유형이라, 창밖을 보며 켜둘 은은한 불빛이 잘 어울립니다.", image: "https://images.pexels.com/photos/20195111/pexels-photo-20195111.jpeg?auto=compress&cs=tinysrgb&h=350" },
    plan: { label: "파티 풍선 세트", reason: "놀라는 얼굴을 보고 싶은 유형이라, 이벤트를 준비할 장식 세트가 잘 맞습니다.", image: "https://images.pexels.com/photos/574282/pexels-photo-574282.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "christmas-santa": {
    gift: { label: "선물 포장지 세트", reason: "받을 사람을 오래 생각하는 유형이라, 준비한 선물을 정성껏 감쌀 포장 재료가 잘 맞습니다.", image: "https://images.pexels.com/photos/8716181/pexels-photo-8716181.jpeg?auto=compress&cs=tinysrgb&h=350" },
    deco: { label: "크리스마스 트리", reason: "분위기를 손으로 만드는 유형이라, 공간을 한 번에 바꿔줄 트리가 잘 어울립니다.", image: "https://images.pexels.com/photos/5675560/pexels-photo-5675560.jpeg?auto=compress&cs=tinysrgb&h=350" },
    feast: { label: "홈파티 식기 세트", reason: "모이면 먹을 것부터 챙기는 유형이라, 여럿이 둘러앉을 식탁을 채울 식기가 잘 맞습니다.", image: "https://images.pexels.com/photos/18273369/pexels-photo-18273369.jpeg?auto=compress&cs=tinysrgb&h=350" },
    cozy: { label: "극세사 담요", reason: "조용한 연말이 좋은 유형이라, 집에서 포근하게 보낼 담요가 잘 어울립니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "christmas-love": {
    together: { label: "커플 잠옷", reason: "그날은 둘만의 시간이어야 하는 유형이라, 함께 편하게 보낼 커플 잠옷이 잘 어울립니다.", image: "https://images.pexels.com/photos/39298993/pexels-photo-39298993.jpeg?auto=compress&cs=tinysrgb&h=350" },
    family: { label: "가족 보드게임", reason: "결국 집으로 향하는 유형이라, 가족이 둘러앉아 함께할 보드게임이 잘 맞습니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    alone: { label: "캔들 워머", reason: "조용히 한 해를 닫는 유형이라, 혼자만의 시간을 따뜻하게 채워줄 불빛이 잘 어울립니다.", image: "https://images.pexels.com/photos/20195111/pexels-photo-20195111.jpeg?auto=compress&cs=tinysrgb&h=350" },
    friends: { label: "파티 게임", reason: "모여야 연말 같은 유형이라, 모임을 한층 즐겁게 만들 게임 하나가 잘 맞습니다.", image: "https://images.pexels.com/photos/9068970/pexels-photo-9068970.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "year-end-party": {
    host: { label: "계산기", reason: "날짜부터 정산까지 맡는 유형이라, 모임 비용을 빠르게 나눌 계산기가 손에 잘 맞습니다.", image: "https://images.pexels.com/photos/34590/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=350" },
    mood: { label: "블루투스 스피커", reason: "자리의 온도를 올리는 유형이라, 분위기를 바로 바꿔줄 스피커가 잘 어울립니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
    listener: { label: "머그컵 세트", reason: "말수는 적어도 다 듣고 있는 유형이라, 마주 앉아 이야기를 나눌 머그컵이 잘 어울립니다.", image: "https://images.pexels.com/photos/18273369/pexels-photo-18273369.jpeg?auto=compress&cs=tinysrgb&h=350" },
    early: { label: "숙취해소제", reason: "적당할 때 일어서는 유형이라, 다음 날 리듬을 지키는 데 도움이 될 것을 챙겨두면 좋습니다.", image: "https://images.pexels.com/photos/13779104/pexels-photo-13779104.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "new-year-resolution": {
    list: { label: "2027 플래너", reason: "먼저 다 적어놓고 시작하는 유형이라, 목표를 나눠 일정에 넣을 플래너가 잘 맞습니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    onething: { label: "습관 체크 달력", reason: "딱 하나만 제대로 하는 유형이라, 그 한 가지를 매일 표시해둘 달력이 잘 맞습니다.", image: "https://images.pexels.com/photos/37082240/pexels-photo-37082240.jpeg?auto=compress&cs=tinysrgb&h=350" },
    habit: { label: "요가매트", reason: "목표보다 매일을 바꾸는 유형이라, 아침 15분을 바꿔줄 요가매트가 잘 어울립니다.", image: "https://images.pexels.com/photos/8436544/pexels-photo-8436544.jpeg?auto=compress&cs=tinysrgb&h=350" },
    flow: { label: "불렛저널", reason: "계획보다 상황을 따라가는 유형이라, 정해진 칸 없이 그때그때 적을 수 있는 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  bungeoppang: {
    redbean: { label: "붕어빵 팬", reason: "변하지 않는 쪽을 고르는 유형이라, 집에서 늘 먹던 그 맛을 직접 구울 팬이 잘 어울립니다.", image: "https://images.pexels.com/photos/32266798/pexels-photo-32266798.jpeg?auto=compress&cs=tinysrgb&h=350" },
    custard: { label: "와플메이커", reason: "겉과 속이 다른 반전이 있는 유형이라, 속을 마음대로 채워 구울 수 있는 와플메이커가 잘 맞습니다.", image: "https://images.pexels.com/photos/9592625/pexels-photo-9592625.jpeg?auto=compress&cs=tinysrgb&h=350" },
    pizza: { label: "에어프라이어", reason: "새로 나오면 일단 먹어보는 유형이라, 이것저것 시도해보기 좋은 에어프라이어가 잘 맞습니다.", image: "https://images.pexels.com/photos/28246107/pexels-photo-28246107.jpeg?auto=compress&cs=tinysrgb&h=350" },
    injeolmi: { label: "콩가루", reason: "자기 취향이 확실한 유형이라, 좋아하는 맛을 어디에든 더할 수 있는 재료가 잘 어울립니다.", image: "https://images.pexels.com/photos/4775247/pexels-photo-4775247.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  godsaeng: {
    routine: { label: "모닝 루틴 플래너", reason: "정해둔 흐름으로 하루를 굴리는 유형이라, 아침 순서를 적어둘 플래너가 잘 맞습니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
    sprint: { label: "뽀모도로 타이머", reason: "한 번 붙으면 끝을 보는 유형이라, 몰아치는 시간을 끊어서 관리해줄 타이머가 도움이 됩니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350" },
    record: { label: "해빗 트래커 노트", reason: "남긴 흔적에서 힘을 얻는 유형이라, 해낸 일을 칸마다 채워갈 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    gentle: { label: "스트레칭 밴드", reason: "무리하지 않아서 오래 가는 유형이라, 쉬는 시간에 몸을 풀어줄 밴드가 잘 어울립니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  jjinchin: {
    instant: { label: "보드게임", reason: "금방 말 트고 가까워지는 유형이라, 처음 만난 자리도 금방 풀어줄 게임이 잘 맞습니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    slowburn: { label: "우정 반지", reason: "시간이 쌓여야 진짜가 되는 유형이라, 오래 간직할 수 있는 우정의 표시가 잘 어울립니다.", image: "https://images.pexels.com/photos/30013220/pexels-photo-30013220.jpeg?auto=compress&cs=tinysrgb&h=350" },
    keeper: { label: "기념일 선물세트", reason: "친구의 기념일을 잘 기억하는 유형이라, 챙겨주기 좋은 선물세트가 잘 맞습니다.", image: "https://images.pexels.com/photos/11719203/pexels-photo-11719203.jpeg?auto=compress&cs=tinysrgb&h=350" },
    space: { label: "엽서 세트", reason: "자주 안 봐도 변하지 않는 유형이라, 몇 달 만에 안부를 전할 엽서가 잘 어울립니다.", image: "https://images.pexels.com/photos/36170709/pexels-photo-36170709.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  gwanjong: {
    stage: { label: "블루투스 마이크", reason: "시선이 모일 때 살아나는 유형이라, 어디서든 판을 살려줄 마이크가 잘 맞습니다.", image: "https://images.pexels.com/photos/8852636/pexels-photo-8852636.jpeg?auto=compress&cs=tinysrgb&h=350" },
    feed: { label: "스마트폰 짐벌", reason: "좋은 순간을 남기고 나누는 유형이라, 흔들림 없이 찍어줄 짐벌이 잘 어울립니다.", image: "https://images.pexels.com/photos/9150145/pexels-photo-9150145.jpeg?auto=compress&cs=tinysrgb&h=350" },
    inner: { label: "손편지지 세트", reason: "가까운 사람의 한마디가 큰 유형이라, 그 사람에게만 전할 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    quiet: { label: "데스크 정리함", reason: "알아주지 않아도 할 일을 하는 유형이라, 내 자리를 조용히 정돈해줄 정리함이 잘 어울립니다.", image: "https://images.pexels.com/photos/5552789/pexels-photo-5552789.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  sonjeol: {
    clean: { label: "미니멀 정리함", reason: "선이 넘어가면 바로 정리하는 유형이라, 공간도 깔끔하게 비워둘 정리함이 잘 맞습니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
    slowfade: { label: "1인용 캠핑의자", reason: "말없이 거리를 넓히는 유형이라, 온전히 혼자인 시간을 만들어줄 자리가 잘 어울립니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350" },
    talker: { label: "감정 기록 노트", reason: "정리하기 전에 말부터 해보는 유형이라, 할 말을 미리 적어두면 대화가 한결 차분해집니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    hold: { label: "아로마 롤온", reason: "정리하고도 오래 마음에 두는 유형이라, 흔들리는 순간 스스로를 진정시킬 작은 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/16125095/pexels-photo-16125095.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "egen-teto-male": {
    teto: { label: "무선 이어폰", reason: "마음이 생기면 바로 움직이는 유형이라, 운동이나 몰입 시간에 쓸 이어폰이 잘 맞습니다.", image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&h=350" },
    egen: { label: "향수", reason: "말과 표정으로 마음을 전하는 유형이라, 분위기를 완성해줄 향 하나가 잘 어울립니다.", image: "https://images.pexels.com/photos/16125095/pexels-photo-16125095.jpeg?auto=compress&cs=tinysrgb&h=350" },
    softteto: { label: "손편지지 세트", reason: "속으로 다 챙기지만 말로는 잘 못 하는 유형이라, 하지 못한 말을 적어 전할 편지지가 도움이 됩니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    coolegen: { label: "가죽 다이어리", reason: "부드럽게 말하지만 정한 것은 끝까지 가는 유형이라, 기준을 적어둘 단단한 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/4452374/pexels-photo-4452374.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  enneagram: {
    type1: { label: "체크리스트 노트", reason: "더 나은 쪽이 보이면 넘기지 못하는 유형이라, 할 일을 끝낸 뒤 지워가는 노트가 기준을 가볍게 해줍니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type2: { label: "반신욕기", reason: "남을 먼저 챙기느라 나를 뒤로 미루는 유형이라, 의식적으로 나를 쉬게 할 시간이 필요합니다.", image: "https://images.pexels.com/photos/7019997/pexels-photo-7019997.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type3: { label: "스마트워치", reason: "해내는 것으로 증명하는 유형이라, 쉬는 시간까지 챙겨주는 기록 도구가 균형을 잡아줍니다.", image: "https://images.pexels.com/photos/11677077/pexels-photo-11677077.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type4: { label: "필사 노트", reason: "감정의 결을 세밀하게 느끼는 유형이라, 그 감정을 문장으로 남겨둘 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type5: { label: "독서대", reason: "한 주제를 끝까지 파고드는 유형이라, 오래 읽어도 편한 독서대가 잘 맞습니다.", image: "https://images.pexels.com/photos/9167771/pexels-photo-9167771.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type6: { label: "비상용품 세트", reason: "일이 잘못될 가능성을 미리 대비하는 유형이라, 챙겨두면 마음이 놓이는 비상용품이 잘 맞습니다.", image: "https://images.pexels.com/photos/6608038/pexels-photo-6608038.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type7: { label: "여행용 캐리어", reason: "새로운 것을 시작하는 순간에 살아나는 유형이라, 언제든 떠날 수 있게 해줄 캐리어가 잘 어울립니다.", image: "https://images.pexels.com/photos/9479774/pexels-photo-9479774.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type8: { label: "폼롤러", reason: "혼자 다 떠안기 쉬운 유형이라, 쌓인 긴장을 풀어줄 도구 하나가 도움이 됩니다.", image: "https://images.pexels.com/photos/16543351/pexels-photo-16543351.jpeg?auto=compress&cs=tinysrgb&h=350" },
    type9: { label: "빈백 소파", reason: "갈등 없는 편안함을 좋아하는 유형이라, 몸을 편하게 맡길 수 있는 자리가 잘 어울립니다.", image: "https://images.pexels.com/photos/39196722/pexels-photo-39196722.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  career: {
    realistic: { label: "공구 세트", reason: "손으로 만들고 고치는 일에 끌리는 유형이라, 집에서 바로 쓸 수 있는 공구 세트가 잘 맞습니다.", image: "https://images.pexels.com/photos/9607005/pexels-photo-9607005.jpeg?auto=compress&cs=tinysrgb&h=350" },
    investigative: { label: "코딩 입문서", reason: "원리를 파고들어 답을 찾는 유형이라, 문제를 논리로 푸는 코딩 입문서가 잘 어울립니다.", image: "https://images.pexels.com/photos/19270981/pexels-photo-19270981.jpeg?auto=compress&cs=tinysrgb&h=350" },
    artistic: { label: "드로잉 태블릿", reason: "나만의 방식으로 표현하는 유형이라, 작업물을 바로 만들어볼 드로잉 태블릿이 잘 맞습니다.", image: "https://images.pexels.com/photos/33125886/pexels-photo-33125886.jpeg?auto=compress&cs=tinysrgb&h=350" },
    social: { label: "상담 심리학 책", reason: "사람을 돕고 가르치는 데서 보람을 찾는 유형이라, 사람의 마음을 더 깊이 이해할 책이 잘 맞습니다.", image: "https://images.pexels.com/photos/17050931/pexels-photo-17050931.jpeg?auto=compress&cs=tinysrgb&h=350" },
    enterprising: { label: "스피치 책", reason: "사람을 이끌고 설득하는 유형이라, 말의 힘을 키워줄 스피치 책이 잘 어울립니다.", image: "https://images.pexels.com/photos/17050931/pexels-photo-17050931.jpeg?auto=compress&cs=tinysrgb&h=350" },
    conventional: { label: "라벨기", reason: "정확하게 정리하는 유형이라, 흩어진 것을 한눈에 구분해줄 라벨기가 손에 잘 맞습니다.", image: "https://images.pexels.com/photos/14029289/pexels-photo-14029289.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
};
