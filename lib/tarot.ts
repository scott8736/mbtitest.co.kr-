/**
 * 오늘의 타로.
 *
 * 이 파일 하나가 타로 화면 일곱 개를 먹여 살립니다. 카드 해석을 운세 종류별로
 * 한 벌 써두면 종합·연애·금전·건강·직장·학업 여섯 화면이 같은 데이터를 각자
 * 다른 필드로 읽고, 원카드 화면은 여섯 개를 한 번에 보여줍니다.
 *
 * 메이저 아르카나 22장만 씁니다. 78장을 채우면 장당 해석이 얇아지고, 실제로
 * 사람들이 이름을 아는 카드는 여기 있는 22장입니다.
 *
 * 정방향만 씁니다. 매일 보는 운세에 역방향까지 넣으면 절반이 나쁜 결과가 되고,
 * 그러면 내일 다시 오지 않습니다.
 *
 * 건강운에 주의가 필요합니다. 죽음·탑·악마처럼 이름이 무거운 카드가 건강 쪽에서
 * 불길한 예언으로 읽히면 안 됩니다. 그래서 건강운 문장은 전부 예언이 아니라
 * 행동 권유(쉬기·검진·수분)로 씁니다. 오락이 불안을 만들면 안 됩니다.
 */

export type TarotType = "total" | "love" | "money" | "health" | "work" | "study";

export type TarotCard = {
  no: number;
  ko: string;
  en: string;
  keyword: string;
  /** 카드 그림 대신 쓰는 상징. 이미지 파일 없이 화면을 채웁니다 */
  symbol: string;
  color: string;
  luckyColor: string;
  luckyItem: string;
  luckyNumber: number;
  readings: Record<TarotType, string>;
  advice: string;
};

export const tarotCards: TarotCard[] = [
  { no: 0, ko: "바보", en: "The Fool", keyword: "시작 · 모험 · 가벼움", symbol: "☼", color: "#e0a13f",
    luckyColor: "노랑", luckyItem: "새로 산 물건", luckyNumber: 1,
    readings: {
      total: "계획이 다 서지 않아도 괜찮은 날입니다. 오늘은 완성도보다 첫걸음이 더 많은 것을 가져다줍니다.",
      love: "재고 따지는 마음을 잠시 내려놓으면 뜻밖의 인연이 열립니다. 먼저 가볍게 말을 거는 쪽이 유리합니다.",
      money: "큰돈을 움직이기보다 작게 시험해 보기 좋은 날입니다. 처음 해보는 소액 지출이 의외의 만족을 줍니다.",
      health: "몸이 가벼운 날입니다. 평소 안 하던 가벼운 산책이나 스트레칭을 하나만 시작해 보세요.",
      work: "새 업무나 낯선 방식에 손대기 좋습니다. 완벽한 준비를 기다리면 오늘의 기회는 지나갑니다.",
      study: "어려운 부분을 붙들기보다 새 단원을 훑어보세요. 오늘은 넓게 보는 쪽이 머리에 잘 들어옵니다.",
    },
    advice: "모르는 길이라도 한 걸음은 내디딜 수 있습니다." },

  { no: 1, ko: "마법사", en: "The Magician", keyword: "실행 · 재능 · 집중", symbol: "✦", color: "#c4574f",
    luckyColor: "빨강", luckyItem: "펜", luckyNumber: 8,
    readings: {
      total: "가진 것으로 충분한 날입니다. 새로 구하려 하지 말고 이미 있는 것을 꺼내 쓰면 일이 풀립니다.",
      love: "표현하면 통하는 날입니다. 마음에 둔 사람에게 오늘 건네는 한마디가 생각보다 크게 작용합니다.",
      money: "수입으로 이어질 만한 실마리가 보입니다. 미뤄둔 정산이나 문의를 오늘 처리하면 결과가 따라옵니다.",
      health: "집중력이 좋은 날이라 몸을 혹사하기 쉽습니다. 한 시간에 한 번은 일어나 움직여 주세요.",
      work: "손에 잡히는 대로 성과가 나는 날입니다. 가장 어려운 일을 오전에 배치하세요.",
      study: "이해가 빠른 날입니다. 미뤄뒀던 어려운 개념을 오늘 정면으로 붙어보세요.",
    },
    advice: "필요한 재료는 이미 손안에 있습니다." },

  { no: 2, ko: "여사제", en: "The High Priestess", keyword: "직관 · 침묵 · 관찰", symbol: "☾", color: "#6f7fb5",
    luckyColor: "남색", luckyItem: "책", luckyNumber: 2,
    readings: {
      total: "말보다 듣는 쪽이 이득인 날입니다. 결론을 내리기 전에 하루만 더 지켜보세요.",
      love: "상대가 말하지 않은 부분이 중요합니다. 캐묻기보다 곁에 있어 주는 쪽이 관계를 깊게 합니다.",
      money: "확실하지 않은 정보로 움직이지 마세요. 오늘은 알아보는 데까지만 하는 것이 이득입니다.",
      health: "몸이 보내는 작은 신호를 무시하지 마세요. 미뤄둔 검진이 있다면 예약만이라도 잡아두세요.",
      work: "드러내지 않고 준비하기 좋은 날입니다. 아직 완성되지 않은 계획은 오늘 공개하지 마세요.",
      study: "혼자 조용히 보는 시간이 가장 효율이 높습니다. 소음이 적은 곳을 찾으세요.",
    },
    advice: "지금 답이 없다는 것도 하나의 답입니다." },

  { no: 3, ko: "여황제", en: "The Empress", keyword: "풍요 · 돌봄 · 결실", symbol: "❀", color: "#cf7f95",
    luckyColor: "연분홍", luckyItem: "꽃", luckyNumber: 3,
    readings: {
      total: "그동안 들인 정성이 눈에 보이기 시작하는 날입니다. 주변에서 먼저 알아봐 주는 일이 생깁니다.",
      love: "따뜻하게 챙기는 마음이 그대로 전해집니다. 작은 선물이나 손으로 만든 것이 특히 좋습니다.",
      money: "들어오는 흐름이 나쁘지 않습니다. 다만 기분이 좋아 지출이 늘기 쉬우니 한 번만 더 생각하세요.",
      health: "잘 먹는 것이 오늘의 보약입니다. 끼니를 거르지 말고 따뜻한 음식을 챙기세요.",
      work: "협업이 잘 풀립니다. 혼자 떠안기보다 나눠서 맡기면 결과가 더 좋습니다.",
      study: "꾸준히 해온 과목에서 성과가 보입니다. 새것보다 복습에 시간을 더 주세요.",
    },
    advice: "잘 돌본 것은 반드시 자랍니다." },

  { no: 4, ko: "황제", en: "The Emperor", keyword: "질서 · 결정 · 책임", symbol: "▣", color: "#a45a4a",
    luckyColor: "갈색", luckyItem: "지갑", luckyNumber: 4,
    readings: {
      total: "흐지부지되던 일에 선을 그을 때입니다. 오늘 정한 기준이 한동안 유지됩니다.",
      love: "관계의 방향을 분명히 하기 좋은 날입니다. 애매하게 두면 상대가 먼저 지칩니다.",
      money: "예산을 다시 세우기 좋습니다. 고정 지출을 한 번 점검하면 새는 곳이 보입니다.",
      health: "규칙이 약입니다. 자는 시간과 일어나는 시간을 오늘부터 고정해 보세요.",
      work: "책임을 맡게 되거나 결정을 요구받습니다. 미루지 말고 근거를 들어 정하세요.",
      study: "계획표를 다시 짜세요. 오늘 만든 시간표가 이번 주를 결정합니다.",
    },
    advice: "정해야 움직입니다." },

  { no: 5, ko: "교황", en: "The Hierophant", keyword: "조언 · 배움 · 원칙", symbol: "✚", color: "#8f7a4f",
    luckyColor: "베이지", luckyItem: "메모지", luckyNumber: 5,
    readings: {
      total: "혼자 고민하던 문제에 답을 줄 사람이 가까이 있습니다. 오늘은 물어보는 것이 빠릅니다.",
      love: "주변의 조언이 도움이 됩니다. 다만 결정은 결국 본인이 해야 한다는 것도 잊지 마세요.",
      money: "검증된 방법을 따르는 것이 유리합니다. 처음 듣는 고수익 이야기는 오늘 특히 거르세요.",
      health: "전문가 말을 따를 때입니다. 자가 판단으로 약을 조절하지 마세요.",
      work: "선배나 경험자의 방식에서 배울 것이 있습니다. 자존심 때문에 묻지 않으면 손해입니다.",
      study: "기본서로 돌아가세요. 응용 문제가 안 풀리는 이유는 대개 기초에 있습니다.",
    },
    advice: "먼저 간 사람의 길을 빌려도 됩니다." },

  { no: 6, ko: "연인", en: "The Lovers", keyword: "선택 · 끌림 · 결합", symbol: "♡", color: "#d4657f",
    luckyColor: "분홍", luckyItem: "커플 아이템", luckyNumber: 6,
    readings: {
      total: "둘 중 하나를 골라야 하는 날입니다. 손해를 덜 보는 쪽이 아니라 마음이 가는 쪽을 보세요.",
      love: "관계가 한 단계 움직이는 날입니다. 솔직한 대화 한 번이 오래 끌던 문제를 정리합니다.",
      money: "함께하는 지출이나 공동 결정에 좋은 날입니다. 혼자 결정하면 나중에 말이 나옵니다.",
      health: "마음이 편하면 몸이 따라옵니다. 좋아하는 사람과 보내는 시간을 일정에 넣으세요.",
      work: "파트너십이나 협업 제안이 들어올 수 있습니다. 조건을 명확히 하면 좋은 결과가 납니다.",
      study: "함께 공부하면 효율이 오릅니다. 모르는 것을 서로 설명해 보세요.",
    },
    advice: "고르지 않는 것도 하나의 선택입니다." },

  { no: 7, ko: "전차", en: "The Chariot", keyword: "전진 · 의지 · 돌파", symbol: "➤", color: "#4f7fa8",
    luckyColor: "파랑", luckyItem: "운동화", luckyNumber: 7,
    readings: {
      total: "밀어붙이면 되는 날입니다. 망설이던 일이 있다면 오늘이 그날입니다.",
      love: "먼저 다가가는 쪽이 이깁니다. 기다리기만 하면 흐름이 식습니다.",
      money: "적극적으로 움직인 만큼 결과가 납니다. 협상이나 요청을 미루지 마세요.",
      health: "에너지가 넘치는 날이라 무리하기 쉽습니다. 운동은 좋지만 강도를 한 단계만 낮추세요.",
      work: "속도가 붙습니다. 막혀 있던 결재나 연락을 오늘 다시 시도해 보세요.",
      study: "진도를 빼기 좋은 날입니다. 오늘 정한 분량은 끝까지 밀고 가세요.",
    },
    advice: "방향만 맞으면 속도는 문제가 아닙니다." },

  { no: 8, ko: "힘", en: "Strength", keyword: "인내 · 용기 · 다스림", symbol: "∞", color: "#d18f4f",
    luckyColor: "주황", luckyItem: "따뜻한 음료", luckyNumber: 8,
    readings: {
      total: "힘으로 누르기보다 부드럽게 다루는 쪽이 통하는 날입니다. 한 박자 늦추면 이깁니다.",
      love: "상대의 예민한 부분을 건드리지 마세요. 오늘은 참아주는 쪽이 관계를 지킵니다.",
      money: "충동적인 지출이 생기기 쉬운 날입니다. 장바구니에 담고 하루만 두세요.",
      health: "몸보다 마음이 지친 상태일 수 있습니다. 자신을 몰아붙이지 말고 쉬어 주세요.",
      work: "까다로운 사람과 부딪힐 수 있습니다. 맞서기보다 요구사항을 정리해 되물으세요.",
      study: "집중이 안 되는 날입니다. 25분만 하고 쉬는 방식으로 나눠 보세요.",
    },
    advice: "누르는 힘보다 견디는 힘이 셉니다." },

  { no: 9, ko: "은둔자", en: "The Hermit", keyword: "성찰 · 거리두기 · 탐구", symbol: "✧", color: "#6f7a7f",
    luckyColor: "회색", luckyItem: "이어폰", luckyNumber: 9,
    readings: {
      total: "사람을 만나는 것보다 혼자 정리하는 시간이 필요한 날입니다. 약속을 줄여도 괜찮습니다.",
      love: "거리를 두는 것이 멀어지는 것은 아닙니다. 각자의 시간을 존중하면 관계가 단단해집니다.",
      money: "남의 말보다 내 기준을 확인할 때입니다. 가계부나 계좌를 조용히 들여다보세요.",
      health: "잠이 보약입니다. 오늘은 일찍 불을 끄는 것만으로 내일이 달라집니다.",
      work: "회의보다 혼자 하는 작업의 효율이 높습니다. 방해받지 않는 시간을 확보하세요.",
      study: "많이 보는 것보다 깊이 보는 것이 좋습니다. 한 단원을 끝까지 파세요.",
    },
    advice: "물러서는 것과 포기하는 것은 다릅니다." },

  { no: 10, ko: "운명의 수레바퀴", en: "Wheel of Fortune", keyword: "전환점 · 기회 · 흐름", symbol: "◎", color: "#5f9f8f",
    luckyColor: "청록", luckyItem: "동전", luckyNumber: 10,
    readings: {
      total: "흐름이 바뀌는 날입니다. 예상하지 못한 소식이 방향을 정해줍니다.",
      love: "우연한 만남이나 오랜만의 연락이 있습니다. 흘려보내지 말고 한 번 응답해 보세요.",
      money: "뜻밖의 수입이나 지출이 생깁니다. 어느 쪽이든 크게 흔들리지 않는 것이 중요합니다.",
      health: "컨디션의 기복이 있는 날입니다. 무리한 약속은 하나 줄이세요.",
      work: "상황이 갑자기 바뀔 수 있습니다. 계획을 붙들기보다 조정하는 쪽이 유리합니다.",
      study: "안 되던 부분이 갑자기 풀리는 날입니다. 포기했던 문제를 한 번 다시 보세요.",
    },
    advice: "바퀴는 멈춰 있을 때가 없습니다." },

  { no: 11, ko: "정의", en: "Justice", keyword: "균형 · 판단 · 정산", symbol: "⚖", color: "#5f7f9f",
    luckyColor: "흰색", luckyItem: "서류 파일", luckyNumber: 11,
    readings: {
      total: "공평하게 따져야 할 일이 생깁니다. 감정보다 사실을 기준으로 삼으면 유리합니다.",
      love: "한쪽만 애쓰는 관계가 드러납니다. 서운한 점을 차분하게 정리해 말해 보세요.",
      money: "계약서와 조건을 다시 확인할 때입니다. 대충 넘긴 항목에서 문제가 나옵니다.",
      health: "치우친 생활을 바로잡을 때입니다. 앉아 있는 시간과 움직이는 시간의 균형을 보세요.",
      work: "평가나 정산과 관련된 일이 있습니다. 근거 자료를 미리 챙겨두면 유리합니다.",
      study: "잘하는 과목에만 시간을 쓰고 있지 않은지 보세요. 오늘은 약한 쪽에 시간을 주세요.",
    },
    advice: "기울어진 것은 결국 제자리를 찾습니다." },

  { no: 12, ko: "매달린 사람", en: "The Hanged Man", keyword: "멈춤 · 관점 전환 · 기다림", symbol: "⌇", color: "#7f8f9f",
    luckyColor: "하늘색", luckyItem: "담요", luckyNumber: 12,
    readings: {
      total: "밀어붙여도 안 되는 날입니다. 방법이 아니라 보는 각도를 바꿔야 풀립니다.",
      love: "상대 입장에서 한 번 생각해 보세요. 내가 맞다는 확신이 관계를 막고 있을 수 있습니다.",
      money: "기다려야 할 때입니다. 오늘 서둘러 정리하면 손해를 봅니다.",
      health: "쉬는 것이 오늘의 할 일입니다. 아무것도 하지 않는 시간을 죄책감 없이 쓰세요.",
      work: "일이 정체됩니다. 붙들고 있기보다 다른 업무로 옮겼다가 내일 다시 보세요.",
      study: "안 외워지는 것을 반복하지 마세요. 방식 자체를 바꿔 보면 뚫립니다.",
    },
    advice: "멈춘 것처럼 보이는 시간에도 자라는 것이 있습니다." },

  { no: 13, ko: "죽음", en: "Death", keyword: "마무리 · 정리 · 새 국면", symbol: "◐", color: "#5f6470",
    luckyColor: "검정", luckyItem: "정리함", luckyNumber: 13,
    readings: {
      total: "끝내야 할 것을 끝낼 때입니다. 이름은 무섭지만 실제로는 정리와 새 시작을 뜻하는 카드입니다.",
      love: "지지부진한 관계에 답이 나옵니다. 끝이 아니라 다음 단계로 넘어가는 경우도 많습니다.",
      money: "안 쓰는 구독이나 묵은 지출을 정리하기 좋은 날입니다.",
      health: "오래 미룬 습관을 하나 끊기 좋은 날입니다. 무리한 계획 말고 하나만 정하세요.",
      work: "붙들고 있던 일을 놓아야 새 일이 들어옵니다. 인수인계나 마무리에 좋습니다.",
      study: "맞지 않는 교재나 방법을 바꿀 때입니다. 아까워하지 말고 정리하세요.",
    },
    advice: "비워야 들어옵니다." },

  { no: 14, ko: "절제", en: "Temperance", keyword: "조화 · 회복 · 중용", symbol: "◈", color: "#5f9f9f",
    luckyColor: "민트", luckyItem: "물병", luckyNumber: 14,
    readings: {
      total: "지나친 쪽을 줄이면 하루가 편해집니다. 오늘은 더하기보다 빼기가 잘 듣습니다.",
      love: "다툼이 있었다면 화해하기 좋은 날입니다. 한쪽이 조금만 물러서면 금방 풀립니다.",
      money: "지출과 저축의 비율을 조정하기 좋습니다. 극단적인 절약은 오래가지 못합니다.",
      health: "회복에 좋은 날입니다. 물을 충분히 마시고 카페인을 한 잔만 줄여 보세요.",
      work: "속도보다 지속이 중요합니다. 무리한 일정은 오늘 미리 조정하세요.",
      study: "몰아서 하지 말고 나눠서 하세요. 오늘은 꾸준함이 성과로 이어집니다.",
    },
    advice: "알맞게가 가장 어렵고 가장 오래갑니다." },

  { no: 15, ko: "악마", en: "The Devil", keyword: "집착 · 유혹 · 매듭", symbol: "◆", color: "#7f5f6f",
    luckyColor: "자주", luckyItem: "알람 시계", luckyNumber: 15,
    readings: {
      total: "끊어야 하는 줄 알면서 못 놓는 것이 있습니다. 오늘은 그것이 무엇인지 알아보는 날입니다.",
      love: "끌리지만 나를 소모시키는 관계인지 살펴보세요. 좋아하는 마음과 매여 있는 마음은 다릅니다.",
      money: "충동 결제와 할부를 조심하세요. 오늘 지르면 내일 후회할 확률이 높습니다.",
      health: "습관적으로 하는 것(야식·과음·밤샘 화면)을 하루만 쉬어 보세요.",
      work: "관성으로 하던 방식을 의심해 보세요. 익숙한 것이 발목을 잡고 있을 수 있습니다.",
      study: "휴대폰을 손에 두면 오늘은 집중이 어렵습니다. 다른 방에 두세요.",
    },
    advice: "묶인 줄을 보는 것이 푸는 것의 시작입니다." },

  { no: 16, ko: "탑", en: "The Tower", keyword: "흔들림 · 재정비 · 전환", symbol: "▲", color: "#a4544f",
    luckyColor: "회청색", luckyItem: "보조 배터리", luckyNumber: 16,
    readings: {
      total: "예상치 못한 변화가 있을 수 있습니다. 놀랄 일이지만, 무너지는 것은 대개 이미 금이 가 있던 것입니다.",
      love: "감춰졌던 이야기가 나올 수 있습니다. 감정적으로 받기보다 사실부터 확인하세요.",
      money: "갑작스러운 지출에 대비하세요. 오늘은 큰 결정을 미루는 것이 좋습니다.",
      health: "무리가 쌓인 곳에서 신호가 옵니다. 아픈 곳이 있다면 참지 말고 진료를 받으세요.",
      work: "계획이 엎어질 수 있습니다. 백업을 만들어 두고 대안을 하나 준비하세요.",
      study: "성적이나 결과가 기대와 다를 수 있습니다. 원인을 찾는 데 쓰면 오히려 기회가 됩니다.",
    },
    advice: "무너진 자리는 다시 지을 수 있는 자리입니다." },

  { no: 17, ko: "별", en: "The Star", keyword: "희망 · 치유 · 방향", symbol: "★", color: "#5f8fc4",
    luckyColor: "은색", luckyItem: "향초", luckyNumber: 17,
    readings: {
      total: "힘들었던 시기가 지나가고 있습니다. 작지만 분명한 좋은 소식이 있습니다.",
      love: "마음이 회복되는 날입니다. 상처가 있었다면 오늘 조금 가벼워집니다.",
      money: "급하지 않지만 꾸준한 흐름이 만들어집니다. 장기적인 계획을 세우기 좋습니다.",
      health: "회복 속도가 붙습니다. 오늘 시작한 건강 습관은 꽤 오래갑니다.",
      work: "방향이 잡히는 날입니다. 오래 고민한 진로나 계획에 답이 보입니다.",
      study: "동기가 살아납니다. 왜 공부하는지 한 줄로 적어두면 이번 주 내내 힘이 됩니다.",
    },
    advice: "어두울수록 별이 잘 보입니다." },

  { no: 18, ko: "달", en: "The Moon", keyword: "불확실 · 불안 · 직감", symbol: "☽", color: "#6f6f9f",
    luckyColor: "보라", luckyItem: "일기장", luckyNumber: 18,
    readings: {
      total: "명확하지 않은 것이 많은 날입니다. 오늘 내린 결론은 내일 달라질 수 있으니 남겨두세요.",
      love: "오해가 생기기 쉽습니다. 추측하지 말고 직접 물어보는 것이 가장 빠릅니다.",
      money: "정보가 불확실합니다. 확인되지 않은 이야기로 움직이지 마세요.",
      health: "잠이 얕아지기 쉬운 날입니다. 자기 전 화면 보는 시간을 줄여 보세요.",
      work: "말이 잘못 전달될 수 있습니다. 중요한 내용은 구두 대신 글로 남기세요.",
      study: "집중이 흐트러집니다. 새 내용보다 이미 아는 것을 정리하는 편이 낫습니다.",
    },
    advice: "안 보인다고 없는 것은 아닙니다." },

  { no: 19, ko: "태양", en: "The Sun", keyword: "성취 · 활력 · 인정", symbol: "☀", color: "#e0a93f",
    luckyColor: "금색", luckyItem: "선글라스", luckyNumber: 19,
    readings: {
      total: "하는 일이 잘 풀리는 날입니다. 숨기지 말고 드러내면 더 좋은 결과가 옵니다.",
      love: "관계가 밝아집니다. 솔직하게 표현할수록 상대도 마음을 엽니다.",
      money: "좋은 흐름입니다. 미뤄뒀던 정당한 요구를 오늘 해보세요.",
      health: "컨디션이 좋습니다. 바깥 공기를 쐬고 햇빛을 보면 더 좋아집니다.",
      work: "성과를 인정받을 수 있습니다. 한 일을 정리해 알리는 것을 주저하지 마세요.",
      study: "머리가 맑은 날입니다. 가장 중요한 과목을 오늘 배치하세요.",
    },
    advice: "잘한 것은 잘했다고 말해도 됩니다." },

  { no: 20, ko: "심판", en: "Judgement", keyword: "결산 · 재평가 · 부름", symbol: "✧", color: "#7f8fa8",
    luckyColor: "연회색", luckyItem: "오래된 사진", luckyNumber: 20,
    readings: {
      total: "지난 일을 정리하고 결론을 낼 때입니다. 미뤄둔 답장이나 결정이 있다면 오늘 하세요.",
      love: "과거의 인연이나 묵은 감정이 떠오릅니다. 되돌아가기보다 매듭짓는 쪽이 좋습니다.",
      money: "그동안의 수입과 지출을 결산해 보세요. 숫자를 마주하는 것만으로 방향이 보입니다.",
      health: "미뤄둔 검진이나 치료를 시작하기 좋은 날입니다.",
      work: "평가와 피드백이 있습니다. 방어하지 말고 받아서 다음에 쓰면 이득입니다.",
      study: "모의고사나 그동안의 오답을 점검하세요. 새 문제보다 이쪽이 점수를 올립니다.",
    },
    advice: "정리하지 않은 과거는 계속 현재로 돌아옵니다." },

  { no: 21, ko: "세계", en: "The World", keyword: "완성 · 도달 · 확장", symbol: "◉", color: "#4f8f7f",
    luckyColor: "초록", luckyItem: "여권 또는 지도", luckyNumber: 21,
    readings: {
      total: "한 단계를 마무리하는 날입니다. 끝냈다는 감각이 다음 일을 여는 힘이 됩니다.",
      love: "관계가 안정되는 시기입니다. 함께 다음 계획을 세워보기 좋습니다.",
      money: "목표했던 금액이나 계획에 도달합니다. 다음 목표를 정해두면 흐름이 이어집니다.",
      health: "꾸준히 해온 것이 몸으로 느껴집니다. 지금 방식을 유지하세요.",
      work: "프로젝트가 마무리됩니다. 정리한 내용을 기록으로 남기면 다음에 크게 쓰입니다.",
      study: "한 과정을 끝낼 수 있습니다. 마친 부분을 표시해 두면 동기가 이어집니다.",
    },
    advice: "끝은 다음 시작의 다른 이름입니다." },
];

export type TarotFortune = {
  slug: string;
  type: TarotType;
  title: string;
  heading: string;
  eyebrow: string;
  description: string;
  icon: string;
  color: string;
  keywords: string[];
  intro: string[];
};

export const tarotFortunes: TarotFortune[] = [
  {
    slug: "today-total", type: "total",
    title: "오늘의 타로 운세 — 종합운",
    heading: "오늘의 타로 운세 · 종합운",
    eyebrow: "DAILY TAROT · TOTAL",
    description: "카드 한 장으로 오늘 하루의 전체 흐름을 봅니다.",
    icon: "☀", color: "#c98a3f",
    keywords: ["오늘의 타로", "오늘의 운세", "타로 운세", "무료 타로", "종합운"],
    intro: [
      "오늘의 종합운은 하루 전체의 흐름을 봅니다. 일과 관계, 돈과 건강 중 어디에 힘을 실어야 할지 방향을 잡는 데 쓰세요.",
      "카드는 하루에 한 번만 뽑습니다. 새로고침해도 같은 카드가 나오는 이유입니다. 자정이 지나면 다시 뽑을 수 있습니다.",
    ],
  },
  {
    slug: "today-love", type: "love",
    title: "오늘의 타로 운세 — 연애운",
    heading: "오늘의 타로 운세 · 연애운",
    eyebrow: "DAILY TAROT · LOVE",
    description: "카드 한 장으로 오늘의 연애와 관계 흐름을 봅니다.",
    icon: "♡", color: "#d4657f",
    keywords: ["오늘의 연애운", "타로 연애운", "연애 타로", "무료 연애운", "짝사랑 타로"],
    intro: [
      "오늘의 연애운은 지금 관계에서 무엇을 하면 좋고 무엇을 미루면 좋은지를 봅니다. 연인이 있든 없든, 짝사랑 중이든 같은 카드로 읽을 수 있습니다.",
      "카드는 하루에 한 번만 뽑습니다. 오늘의 결과는 자정까지 유지됩니다.",
    ],
  },
  {
    slug: "today-money", type: "money",
    title: "오늘의 타로 운세 — 금전운",
    heading: "오늘의 타로 운세 · 금전운",
    eyebrow: "DAILY TAROT · MONEY",
    description: "카드 한 장으로 오늘의 돈 흐름과 지출 판단을 봅니다.",
    icon: "₩", color: "#8f9f4f",
    keywords: ["오늘의 금전운", "타로 금전운", "재물운 타로", "무료 금전운", "돈 운세"],
    intro: [
      "오늘의 금전운은 수입과 지출, 결정의 타이밍을 봅니다. 큰 결제를 앞두고 있다면 참고 삼아 한 번 보세요.",
      "카드는 하루에 한 번만 뽑습니다. 투자나 계약의 근거로 삼을 내용은 아니라는 점만 기억해 주세요.",
    ],
  },
  {
    slug: "today-health", type: "health",
    title: "오늘의 타로 운세 — 건강운",
    heading: "오늘의 타로 운세 · 건강운",
    eyebrow: "DAILY TAROT · HEALTH",
    description: "카드 한 장으로 오늘 몸을 어떻게 쓰면 좋을지 봅니다.",
    icon: "✚", color: "#5f9f8f",
    keywords: ["오늘의 건강운", "타로 건강운", "건강 운세", "무료 건강운"],
    intro: [
      "오늘의 건강운은 병을 점치는 것이 아닙니다. 오늘 몸을 어떻게 쓰면 좋을지, 무엇을 챙기면 좋을지를 한 줄로 제안합니다.",
      "몸에 실제로 이상이 느껴진다면 카드가 아니라 진료를 먼저 보세요. 이 운세는 어떤 경우에도 의학적 판단을 대신하지 않습니다.",
    ],
  },
  {
    slug: "today-work", type: "work",
    title: "오늘의 타로 운세 — 직장운",
    heading: "오늘의 타로 운세 · 직장운",
    eyebrow: "DAILY TAROT · WORK",
    description: "카드 한 장으로 오늘의 업무 흐름과 대인관계를 봅니다.",
    icon: "▣", color: "#5f7fa8",
    keywords: ["오늘의 직장운", "타로 직장운", "취업운 타로", "무료 직장운", "사업운"],
    intro: [
      "오늘의 직장운은 일의 속도와 사람 관계를 함께 봅니다. 중요한 보고나 면담을 앞두고 있다면 타이밍을 잡는 데 참고하세요.",
      "카드는 하루에 한 번만 뽑습니다.",
    ],
  },
  {
    slug: "today-study", type: "study",
    title: "오늘의 타로 운세 — 학업운",
    heading: "오늘의 타로 운세 · 학업운",
    eyebrow: "DAILY TAROT · STUDY",
    description: "카드 한 장으로 오늘의 집중력과 공부 방향을 봅니다.",
    icon: "✎", color: "#7f6fb5",
    keywords: ["오늘의 학업운", "타로 학업운", "시험운 타로", "공부 운세", "수능 운세"],
    intro: [
      "오늘의 학업운은 오늘 어떤 방식으로 공부하면 잘 들어올지를 봅니다. 새 진도를 뺄 날인지 복습할 날인지 정하는 데 쓰세요.",
      "카드는 하루에 한 번만 뽑습니다.",
    ],
  },
];

export const tarotSlugs = tarotFortunes.map((f) => f.slug);

const byFortuneSlug = new Map(tarotFortunes.map((f) => [f.slug, f]));

export function tarotFortuneBySlug(slug: string): TarotFortune | undefined {
  return byFortuneSlug.get(slug);
}

export const tarotTypeLabels: Record<TarotType, string> = {
  total: "종합운",
  love: "연애운",
  money: "금전운",
  health: "건강운",
  work: "직장운",
  study: "학업운",
};

/**
 * 문자열에서 32비트 정수 하나를 만듭니다.
 * 같은 입력이면 어느 기기에서나 같은 값이 나와야 하므로 Math.random 은 쓰지 않습니다.
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 오늘 날짜를 한국 기준 YYYY-MM-DD 로. 자정 기준을 KST 로 못박습니다. */
export function todayKst(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + 9 * 3600000);
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, "0")}-${String(kst.getDate()).padStart(2, "0")}`;
}

/**
 * 오늘 이 사람에게 보여줄 후보 카드를 뽑습니다.
 *
 * 날짜·방문자·운세 종류를 모두 시드에 넣기 때문에, 같은 날 새로고침해도 후보가
 * 같고 운세 종류가 다르면 다른 카드가 나옵니다. 매일 바뀌는 것은 날짜뿐입니다.
 */
export function dailyCandidates(dateKey: string, visitorId: string, type: TarotType, count = 5): TarotCard[] {
  const rand = mulberry32(hashSeed(`${dateKey}|${visitorId}|${type}`));
  const pool = [...tarotCards];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function tarotCardByNo(no: number): TarotCard | undefined {
  return tarotCards.find((card) => card.no === no);
}
