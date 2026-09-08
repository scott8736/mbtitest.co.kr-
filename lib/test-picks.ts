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
    words: { label: "손편지지 세트", reason: "인정하는 말이 사랑으로 느껴지는 유형이라, 마음을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    time: { label: "2인용 보드게임", reason: "온전한 집중과 함께하는 시간이 중요한 유형이라, 같이 몰입할 수 있는 놀이 하나가 관계를 채워줍니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    gift: { label: "미니 포장지 세트", reason: "마음을 담은 상징을 오래 간직하는 유형이라, 작은 선물도 정성껏 포장해줄 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/8716181/pexels-photo-8716181.jpeg?auto=compress&cs=tinysrgb&h=350" },
    service: { label: "주방 정리용품", reason: "실제 도움이 되는 행동에서 사랑을 느끼는 유형이라, 상대를 위해 뭔가 해줄 수 있는 살림 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/31557569/pexels-photo-31557569.jpeg?auto=compress&cs=tinysrgb&h=350" },
    touch: { label: "극세사 담요", reason: "따뜻한 접촉에서 안정감을 얻는 유형이라, 포근한 촉감을 주는 담요 하나가 정서적 위안이 됩니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "self-esteem": {
    stable: { label: "감사 일기장", reason: "가치와 결과를 잘 구분하는 유형이라, 매일의 작은 안정을 기록해두면 그 중심이 더 단단해집니다.", image: "https://images.pexels.com/photos/18322084/pexels-photo-18322084.jpeg?auto=compress&cs=tinysrgb&h=350" },
    growth: { label: "필사 노트", reason: "부족함을 배움으로 바꾸는 유형이라, 오늘 배운 것을 적어두는 노트가 성장의 기록이 됩니다.", image: "https://images.pexels.com/photos/29737184/pexels-photo-29737184.jpeg?auto=compress&cs=tinysrgb&h=350" },
    sensitive: { label: "무드등", reason: "타인의 반응에 마음이 크게 움직이는 시기라, 혼자 있는 공간을 편안하게 만들어줄 조명이 도움이 됩니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  burnout: {
    green: { label: "폼롤러", reason: "회복 리듬이 아직 살아 있는 상태라, 가벼운 스트레칭으로 몸을 관리해두면 좋습니다.", image: "https://images.pexels.com/photos/16543351/pexels-photo-16543351.jpeg?auto=compress&cs=tinysrgb&h=350" },
    yellow: { label: "수면 안대", reason: "몸과 마음이 속도를 줄여달라는 신호를 보내는 시기라, 질 좋은 잠을 도와줄 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350" },
    red: { label: "반신욕기", reason: "버티기보다 회복이 먼저 필요한 상태라, 몸을 쉬게 하는 데 집중할 도구를 추천합니다.", image: "https://images.pexels.com/photos/7019997/pexels-photo-7019997.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "work-style": {
    driver: { label: "화이트보드", reason: "목표를 빠르게 행동으로 옮기는 유형이라, 할 일과 담당자를 한눈에 정리할 보드가 잘 맞습니다.", image: "https://images.pexels.com/photos/8617769/pexels-photo-8617769.jpeg?auto=compress&cs=tinysrgb&h=350" },
    planner: { label: "만년 다이어리", reason: "근거와 구조로 완성도를 높이는 유형이라, 계획을 꼼꼼히 기록할 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350" },
    connector: { label: "텀블러 선물세트", reason: "사람을 연결하는 데 강한 유형이라, 함께 나눌 수 있는 작은 선물이 관계를 부드럽게 합니다.", image: "https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&h=350" },
    creator: { label: "포스트잇", reason: "고정관념을 넘어 아이디어를 떠올리는 유형이라, 생각을 바로바로 붙여둘 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "love-tendency": {
    warm: { label: "손편지지 세트", reason: "다정한 말과 행동으로 사랑을 표현하는 유형이라, 마음을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    steady: { label: "커플 다이어리", reason: "일관된 행동으로 신뢰를 쌓는 유형이라, 함께한 약속과 계획을 기록해둘 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    spark: { label: "즉석카메라 필름", reason: "새로운 경험으로 관계에 설렘을 더하는 유형이라, 그 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350" },
    space: { label: "1인용 텐트", reason: "가까움과 독립을 함께 지키는 유형이라, 온전히 혼자인 시간을 위한 작은 공간이 도움이 됩니다.", image: "https://images.pexels.com/photos/31861359/pexels-photo-31861359.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "spending-style": {
    planner: { label: "가계부", reason: "예산 안에서 계획적으로 소비하는 유형이라, 흐름을 눈으로 확인할 가계부가 잘 맞습니다.", image: "https://images.pexels.com/photos/9167736/pexels-photo-9167736.jpeg?auto=compress&cs=tinysrgb&h=350" },
    value: { label: "가죽 손질 세트", reason: "오래 쓸 좋은 것에 과감히 투자하는 유형이라, 아끼는 물건을 오래 관리할 도구가 도움이 됩니다.", image: "https://images.pexels.com/photos/4452379/pexels-photo-4452379.jpeg?auto=compress&cs=tinysrgb&h=350" },
    experience: { label: "여행용 파우치", reason: "물건보다 경험에 돈을 쓰는 유형이라, 다음 여행을 가볍게 준비할 파우치가 잘 맞습니다.", image: "https://images.pexels.com/photos/19271566/pexels-photo-19271566.jpeg?auto=compress&cs=tinysrgb&h=350" },
    mood: { label: "미니 디퓨저", reason: "작은 소비로 기분을 돌보는 유형이라, 향으로 바로 분위기를 바꿔줄 디퓨저가 잘 맞습니다.", image: "https://images.pexels.com/photos/4266160/pexels-photo-4266160.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "lazy-mbti": {
    battery: { label: "구스 목베개", reason: "에너지가 먼저 바닥나 시작이 어려운 유형이라, 짧은 시간에도 제대로 쉴 수 있는 목베개가 도움이 됩니다.", image: "https://images.pexels.com/photos/18979223/pexels-photo-18979223.jpeg?auto=compress&cs=tinysrgb&h=350" },
    perfect: { label: "타임타이머", reason: "기준을 계속 높이다 시작이 늦어지는 유형이라, 눈에 보이는 시간 제한이 첫걸음을 도와줍니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350" },
    deadline: { label: "탁상용 화이트보드", reason: "마감이 가까워야 집중력이 오르는 유형이라, 남은 일을 눈에 보이게 적어두면 속도를 앞당길 수 있습니다.", image: "https://images.pexels.com/photos/15585620/pexels-photo-15585620.png?auto=compress&cs=tinysrgb&h=350" },
    wander: { label: "포스트잇", reason: "새롭고 재미있는 것에 관심이 빠르게 옮겨가는 유형이라, 떠오른 아이디어를 놓치지 않게 적어둘 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "dating-style": {
    contact: { label: "커플 폰케이스", reason: "일상을 자주 나눌수록 가까워지는 유형이라, 손에 늘 닿아있는 소품 하나가 연결감을 더합니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    date: { label: "즉석카메라 필름", reason: "만나는 순간에 온전히 집중하는 유형이라, 함께한 시간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350" },
    dialogue: { label: "손편지지 세트", reason: "감정과 해결 방법을 말로 확인하는 유형이라, 하고 싶은 말을 정리해서 전할 편지지가 도움이 됩니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    independent: { label: "1인용 캠핑의자", reason: "각자의 생활을 지키며 함께 성장하는 유형이라, 혼자만의 시간을 편안하게 채워줄 의자가 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "mbti-love-compatibility": {
    nf: { label: "감성 캔들", reason: "감정과 가능성을 깊이 나누는 궁합이라, 대화가 깊어지는 밤을 은은하게 채워줄 캔들이 잘 맞습니다.", image: "https://images.pexels.com/photos/9277080/pexels-photo-9277080.jpeg?auto=compress&cs=tinysrgb&h=350" },
    nt: { label: "2인용 보드게임", reason: "지적 자극을 나누는 궁합이라, 함께 머리를 쓰며 즐길 보드게임이 좋은 데이트가 됩니다.", image: "https://images.pexels.com/photos/792051/pexels-photo-792051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    sj: { label: "커플 다이어리", reason: "꾸준한 약속과 생활의 호흡이 맞는 궁합이라, 함께 계획을 적어나갈 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    sp: { label: "즉석카메라 필름", reason: "지금 이 순간을 함께 즐기는 궁합이라, 즉흥적인 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "vegetable-village-character": {
    onion: { label: "감성 캔들", reason: "가까워질수록 깊은 이야기가 드러나는 캐릭터라, 편안한 분위기를 만들어줄 캔들이 잘 맞습니다.", image: "https://images.pexels.com/photos/9277080/pexels-photo-9277080.jpeg?auto=compress&cs=tinysrgb&h=350" },
    pepper: { label: "홈트레이닝 밴드", reason: "하고 싶은 일에 먼저 움직이는 캐릭터라, 에너지를 발산할 운동 도구가 잘 맞습니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    cabbage: { label: "텀블러 선물세트", reason: "주변을 세심하게 챙기는 캐릭터라, 함께 나눌 수 있는 선물이 잘 어울립니다.", image: "https://images.pexels.com/photos/5741238/pexels-photo-5741238.jpeg?auto=compress&cs=tinysrgb&h=350" },
    carrot: { label: "여행용 파우치", reason: "새로운 길을 발견하면 눈이 반짝이는 캐릭터라, 다음 탐험을 가볍게 준비할 파우치가 잘 맞습니다.", image: "https://images.pexels.com/photos/19271566/pexels-photo-19271566.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "friendship-symbol": {
    compass: { label: "만년 다이어리", reason: "방향을 정리해주는 길잡이 캐릭터라, 생각을 기록할 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350" },
    blanket: { label: "극세사 담요", reason: "말없이도 마음을 편안하게 하는 캐릭터라, 포근한 담요 하나가 그 느낌을 닮았습니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350" },
    firework: { label: "블루투스 스피커", reason: "분위기를 빠르게 밝히는 캐릭터라, 어디서든 즐거움을 더할 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
    anchor: { label: "가죽 다이어리 커버", reason: "시간이 지나도 같은 자리를 지키는 캐릭터라, 오래 곁에 둘 수 있는 물건이 잘 어울립니다.", image: "https://images.pexels.com/photos/4452374/pexels-photo-4452374.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "dont-get-hurt": {
    absorb: { label: "감정 기록 노트", reason: "주변의 감정과 평가가 오래 남는 유형이라, 마음을 적어보며 정리하는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    hide: { label: "수면 안대", reason: "괜찮은 척 넘기고 혼자 감정을 정리하는 유형이라, 온전히 쉴 수 있는 시간을 위한 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350" },
    wall: { label: "1인용 캠핑의자", reason: "상처 가능성이 느껴지면 거리를 두는 유형이라, 안전하게 혼자 있을 공간이 도움이 됩니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350" },
    talk: { label: "손편지지 세트", reason: "이유를 확인하고 경계를 말하며 회복하는 유형이라, 하고 싶은 말을 정리해 전할 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "animal-keeper": {
    panda: { label: "무드등", reason: "편안한 환경과 안정감을 만드는 유형이라, 은은한 조명이 그 분위기를 완성합니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
    dolphin: { label: "블루투스 스피커", reason: "반응을 주고받는 데서 에너지를 얻는 유형이라, 함께 즐길 음악을 위한 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
    tiger: { label: "홈트레이닝 밴드", reason: "빠른 판단과 결단력이 강점인 유형이라, 에너지를 쏟을 운동 도구가 잘 어울립니다.", image: "https://images.pexels.com/photos/7072051/pexels-photo-7072051.jpeg?auto=compress&cs=tinysrgb&h=350" },
    owl: { label: "만년 다이어리", reason: "작은 변화도 기록하고 분석하는 유형이라, 관찰한 내용을 정리할 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/2689331/pexels-photo-2689331.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "family-letter-personality": {
    instant: { label: "포스트잇", reason: "받은 일을 바로 끝내는 실행가 유형이라, 할 일을 붙여두고 바로 지워나갈 메모지가 잘 맞습니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350" },
    bag: { label: "탁상용 타이머", reason: "마감 직전 집중력이 폭발하는 유형이라, 눈에 보이는 시간 제한이 도움이 됩니다.", image: "https://images.pexels.com/photos/15930083/pexels-photo-15930083.jpeg?auto=compress&cs=tinysrgb&h=350" },
    decorate: { label: "형광펜 세트", reason: "보기 좋게 정리해야 이해가 되는 유형이라, 중요한 부분을 표시할 필기구가 잘 맞습니다.", image: "https://images.pexels.com/photos/3373722/pexels-photo-3373722.jpeg?auto=compress&cs=tinysrgb&h=350" },
    delegate: { label: "커플 다이어리", reason: "함께 확인하고 움직일 때 힘이 나는 유형이라, 같이 기록할 수 있는 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "christmas-cookie-personality": {
    ginger: { label: "즉석카메라 필름", reason: "새로운 곳에서 추억을 만드는 유형이라, 그 순간을 바로 남길 필름이 잘 맞습니다.", image: "https://images.pexels.com/photos/11175468/pexels-photo-11175468.jpeg?auto=compress&cs=tinysrgb&h=350" },
    snowball: { label: "극세사 담요", reason: "편안한 공간에서 온기를 나누는 유형이라, 포근한 담요 하나가 그 시간을 완성합니다.", image: "https://images.pexels.com/photos/27471030/pexels-photo-27471030.jpeg?auto=compress&cs=tinysrgb&h=350" },
    star: { label: "무드등", reason: "분위기와 장식으로 설렘을 만드는 유형이라, 공간을 반짝이게 할 조명이 잘 맞습니다.", image: "https://images.pexels.com/photos/18889489/pexels-photo-18889489.jpeg?auto=compress&cs=tinysrgb&h=350" },
    choco: { label: "홈베이킹 재료", reason: "맛있는 것을 나누며 즐거움을 주는 유형이라, 직접 만들어 나눌 베이킹 재료가 잘 맞습니다.", image: "https://images.pexels.com/photos/8961863/pexels-photo-8961863.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "personality-guide": {
    words: { label: "손편지지 세트", reason: "말로 확인해야 마음이 선명해지는 유형이라, 하고 싶은 말을 눌러 담을 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    action: { label: "커플 다이어리", reason: "반복되는 행동에서 진심을 읽는 유형이라, 함께한 약속을 기록해둘 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    context: { label: "감정 기록 노트", reason: "상황과 감정의 배경까지 함께 읽는 유형이라, 그날의 맥락을 적어두는 노트가 잘 맞습니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    space: { label: "아로마 디퓨저", reason: "감정이 클 때 잠시 시간을 두는 유형이라, 마음을 가라앉힐 공간을 만들어줄 디퓨저가 도움이 됩니다.", image: "https://images.pexels.com/photos/6281179/pexels-photo-6281179.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "couple-character": {
    puppy: { label: "커플 폰케이스", reason: "표현할수록 사랑이 커지는 캐릭터라, 늘 함께하는 소품 하나가 애정을 더합니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    cat: { label: "1인용 캠핑의자", reason: "자유롭지만 마음을 열면 깊은 캐릭터라, 혼자만의 시간을 편안하게 채워줄 의자가 잘 맞습니다.", image: "https://images.pexels.com/photos/34986621/pexels-photo-34986621.jpeg?auto=compress&cs=tinysrgb&h=350" },
    bear: { label: "커플 다이어리", reason: "말보다 행동으로 곁을 지키는 캐릭터라, 함께 계획을 적어나갈 다이어리가 도움이 됩니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
    fox: { label: "블루투스 스피커", reason: "설렘을 만드는 센스 있는 캐릭터라, 분위기를 바꿔줄 스피커가 데이트에 잘 어울립니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "f-flirting-simulation": {
    empathy: { label: "감정 기록 노트", reason: "마음을 먼저 알아주는 유형이라, 상대의 이야기를 정리해보는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    direct: { label: "손편지지 세트", reason: "애매함보다 솔직함으로 다가가는 유형이라, 마음을 분명하게 전할 편지지가 잘 맞습니다.", image: "https://images.pexels.com/photos/7784602/pexels-photo-7784602.jpeg?auto=compress&cs=tinysrgb&h=350" },
    detail: { label: "포스트잇", reason: "사소한 취향을 기억하는 유형이라, 떠오른 정보를 바로 적어둘 메모지가 도움이 됩니다.", image: "https://images.pexels.com/photos/17210072/pexels-photo-17210072.jpeg?auto=compress&cs=tinysrgb&h=350" },
    steady: { label: "커플 다이어리", reason: "꾸준한 연락과 약속으로 신뢰를 쌓는 유형이라, 함께 기록할 다이어리가 잘 맞습니다.", image: "https://images.pexels.com/photos/30518407/pexels-photo-30518407.jpeg?auto=compress&cs=tinysrgb&h=350" },
  },
  "healing-sprite": {
    leaf: { label: "디퓨저", reason: "조용한 자연 속에서 에너지를 채우는 요정이라, 은은한 향이 그 시간을 완성합니다.", image: "https://images.pexels.com/photos/28912723/pexels-photo-28912723.jpeg?auto=compress&cs=tinysrgb&h=350" },
    drop: { label: "감정 기록 노트", reason: "감정을 흘려보내며 회복하는 요정이라, 마음을 적어보는 노트가 도움이 됩니다.", image: "https://images.pexels.com/photos/26834974/pexels-photo-26834974.jpeg?auto=compress&cs=tinysrgb&h=350" },
    spark: { label: "블루투스 스피커", reason: "작은 재미로 다시 움직이는 요정이라, 좋아하는 음악을 바로 틀어줄 스피커가 잘 맞습니다.", image: "https://images.pexels.com/photos/29581125/pexels-photo-29581125.jpeg?auto=compress&cs=tinysrgb&h=350" },
    moon: { label: "수면 안대", reason: "충분한 쉼과 수면으로 균형을 되찾는 요정이라, 질 좋은 잠을 도와줄 도구가 필요합니다.", image: "https://images.pexels.com/photos/18021294/pexels-photo-18021294.jpeg?auto=compress&cs=tinysrgb&h=350" },
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
};
