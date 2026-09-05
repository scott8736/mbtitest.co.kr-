import { starSignSlugs, type StarSignSlug } from "./fortune-engine";

/**
 * 별자리 운세 데이터.
 *
 * 순서는 fortune-engine 의 starSignSlugs(양자리부터)와 같습니다.
 * 날짜 경계는 해마다 하루씩 흔들리므로 본문에서 "경계일 안내"를 함께 보여줍니다.
 */

export type StarSignElement = "불" | "흙" | "공기" | "물";

export type StarSign = {
  slug: StarSignSlug;
  name: string;
  symbol: string;
  /** "3월 21일 ~ 4월 19일" */
  period: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  element: StarSignElement;
  ruler: string;
  tagline: string;
  keywords: string[];
  personality: string;
  strengths: string[];
  cautions: string[];
  love: string;
  work: string;
  money: string;
  /** 2027년 전반 흐름 */
  yearOutlook: string;
  bestMatches: StarSignSlug[];
  luckyColor: string;
  luckyItem: string;
};

export const starSignElementNotes: Record<StarSignElement, string> = {
  불: "불 원소는 먼저 움직이고 나중에 정리합니다. 추진력이 강한 대신 속도 조절이 과제입니다.",
  흙: "흙 원소는 손에 잡히는 결과를 중요하게 봅니다. 안정적이지만 변화에 시간이 걸립니다.",
  공기: "공기 원소는 생각과 언어로 움직입니다. 연결과 학습에 강하고 감정 정리에는 서툽니다.",
  물: "물 원소는 감정의 결을 읽습니다. 공감이 깊은 대신 경계를 지키는 연습이 필요합니다.",
};

export const starSigns: StarSign[] = [
  {
    slug: "aries",
    name: "양자리",
    symbol: "♈",
    period: "3월 21일 ~ 4월 19일",
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    element: "불",
    ruler: "화성",
    tagline: "생각보다 몸이 먼저 나가는 개척자",
    keywords: ["양자리 운세", "양자리 성격", "양자리 궁합"],
    personality:
      "양자리는 시작하는 힘이 강합니다. 재보지 않고 뛰어드는 편이라 남들이 망설이는 자리에서 기회를 잡습니다. 감정도 숨기지 않아 함께 있으면 관계가 단순하고 편합니다.",
    strengths: ["결단이 빠릅니다", "솔직해서 오해가 적습니다", "경쟁 상황에서 힘이 납니다"],
    cautions: ["금방 뜨거워지고 금방 식습니다", "말이 앞서 상처를 줍니다"],
    love: "직진형입니다. 좋으면 바로 표현하고 식으면 티가 납니다. 상대에게 생각할 시간을 주는 것이 관계를 오래 가게 합니다.",
    work: "새 프로젝트의 초반에 가장 강합니다. 마무리를 함께할 사람과 팀을 이루면 결과가 크게 달라집니다.",
    money: "충동 지출이 가장 큰 변수입니다. 결제 전 하루 미루는 규칙 하나만으로 지출이 눈에 띄게 줄어듭니다.",
    yearOutlook:
      "2027년은 양자리에게 방향을 다시 잡는 해입니다. 벌여둔 일 가운데 무엇을 남길지 고르면 하반기부터 속도가 붙습니다.",
    bestMatches: ["leo", "sagittarius", "gemini"],
    luckyColor: "빨간색",
    luckyItem: "운동화",
  },
  {
    slug: "taurus",
    name: "황소자리",
    symbol: "♉",
    period: "4월 20일 ~ 5월 20일",
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    element: "흙",
    ruler: "금성",
    tagline: "천천히 쌓아 오래 지키는 축적가",
    keywords: ["황소자리 운세", "황소자리 성격", "황소자리 궁합"],
    personality:
      "황소자리는 서두르지 않습니다. 확실한 것에만 손을 대고, 한 번 잡으면 오래 지킵니다. 감각이 예민해 좋은 것과 아닌 것을 몸으로 먼저 알아봅니다.",
    strengths: ["끝까지 지킵니다", "현실 감각이 정확합니다", "취향과 안목이 뚜렷합니다"],
    cautions: ["변화를 미룹니다", "한 번 고집이 서면 설득이 어렵습니다"],
    love: "천천히 시작해 오래 갑니다. 표현이 화려하지 않을 뿐 마음의 온도는 일정합니다. 급하게 확인받으려는 상대와는 속도 차이가 생깁니다.",
    work: "반복과 축적이 필요한 일에서 최고의 결과를 냅니다. 잦은 방향 전환이 있는 환경은 잘 맞지 않습니다.",
    money: "저축과 실물 자산에 강합니다. 다만 '좋은 것'에 쓰는 지출은 계획에 미리 넣어두어야 합니다.",
    yearOutlook: "2027년은 황소자리가 쌓은 것이 형태를 갖추는 해입니다. 문서·계약과 관련된 일에서 특히 성과가 납니다.",
    bestMatches: ["virgo", "capricorn", "cancer"],
    luckyColor: "초록색",
    luckyItem: "가죽 지갑",
  },
  {
    slug: "gemini",
    name: "쌍둥이자리",
    symbol: "♊",
    period: "5월 21일 ~ 6월 21일",
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 21,
    element: "공기",
    ruler: "수성",
    tagline: "말로 세상을 연결하는 전달자",
    keywords: ["쌍둥이자리 운세", "쌍둥이자리 성격", "쌍둥이자리 궁합"],
    personality:
      "쌍둥이자리는 정보와 사람을 잇습니다. 새로운 것을 빨리 익히고 쉽게 설명하는 능력이 뛰어나, 어디서든 대화의 중심에 놓입니다.",
    strengths: ["학습과 적응이 빠릅니다", "어려운 것을 쉽게 설명합니다", "다양한 사람과 잘 지냅니다"],
    cautions: ["관심이 자주 옮겨갑니다", "가벼워 보여 신뢰를 덜 얻습니다"],
    love: "대화가 통해야 마음이 열립니다. 지루해지는 순간 관계가 식으므로, 함께 새로운 것을 배우는 관계가 오래갑니다.",
    work: "기획·글·영업·교육처럼 말과 글을 쓰는 일에서 강합니다. 하나를 끝까지 붙드는 파트너가 있으면 완성도가 올라갑니다.",
    money: "수입 경로가 여러 개가 되기 쉽습니다. 관리 도구를 하나로 합치지 않으면 새는 돈을 못 봅니다.",
    yearOutlook: "2027년은 쌍둥이자리에게 배움을 수익으로 바꾸는 해입니다. 알고 있던 것을 콘텐츠나 강의로 정리하면 기회가 옵니다.",
    bestMatches: ["libra", "aquarius", "aries"],
    luckyColor: "노란색",
    luckyItem: "메모 노트",
  },
  {
    slug: "cancer",
    name: "게자리",
    symbol: "♋",
    period: "6월 22일 ~ 7월 22일",
    startMonth: 6,
    startDay: 22,
    endMonth: 7,
    endDay: 22,
    element: "물",
    ruler: "달",
    tagline: "내 사람의 자리를 지키는 보호자",
    keywords: ["게자리 운세", "게자리 성격", "게자리 궁합"],
    personality:
      "게자리는 가까운 사람을 먼저 챙깁니다. 감정의 흐름을 세밀하게 읽고, 안전하다고 느끼는 관계 안에서 가장 큰 힘을 냅니다.",
    strengths: ["사람을 오래 기억합니다", "돌보는 일에 진심입니다", "분위기의 변화를 빨리 알아챕니다"],
    cautions: ["마음을 안으로 눌러 담습니다", "거절당했다고 느끼면 오래 갑니다"],
    love: "안정감이 전부입니다. 말보다 꾸준함으로 신뢰를 확인하고, 그 신뢰가 생기면 관계에 깊이 들어갑니다.",
    work: "팀의 정서를 지탱하는 자리에서 빛납니다. 다만 감정 노동이 쌓이지 않도록 경계를 정해두어야 합니다.",
    money: "가족·주거와 관련된 지출이 큽니다. 목적별로 통장을 나누면 불안이 줄어듭니다.",
    yearOutlook: "2027년은 게자리에게 주거와 가족 문제에 결론이 나는 해입니다. 미뤄둔 이야기를 꺼내기 좋은 시기입니다.",
    bestMatches: ["scorpio", "pisces", "taurus"],
    luckyColor: "은색·흰색",
    luckyItem: "머그컵",
  },
  {
    slug: "leo",
    name: "사자자리",
    symbol: "♌",
    period: "7월 23일 ~ 8월 22일",
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    element: "불",
    ruler: "태양",
    tagline: "중심에 서서 빛을 나눠주는 주인공",
    keywords: ["사자자리 운세", "사자자리 성격", "사자자리 궁합"],
    personality:
      "사자자리는 존재감이 큽니다. 앞에 서는 것을 두려워하지 않고, 자기가 받은 관심을 주변에 나눠주는 관대함이 있습니다.",
    strengths: ["사람을 이끕니다", "베푸는 데 인색하지 않습니다", "자신감이 분위기를 바꿉니다"],
    cautions: ["인정받지 못하면 크게 흔들립니다", "자존심 때문에 도움을 못 청합니다"],
    love: "표현이 크고 분명합니다. 상대가 자신을 특별하게 대해주길 바라며, 그만큼 돌려주는 유형입니다.",
    work: "무대가 있는 일, 대표로 나서는 일에서 성과가 납니다. 뒤에서 조율하는 역할은 에너지가 빨리 소모됩니다.",
    money: "체면 지출을 관리하면 재물운이 크게 좋아집니다. 남에게 쓰는 돈의 상한을 정해두세요.",
    yearOutlook: "2027년은 사자자리에게 평가가 뒤따라오는 해입니다. 지난 성과가 늦게 인정되므로 기록을 남겨두면 유리합니다.",
    bestMatches: ["aries", "sagittarius", "libra"],
    luckyColor: "금색",
    luckyItem: "손목시계",
  },
  {
    slug: "virgo",
    name: "처녀자리",
    symbol: "♍",
    period: "8월 23일 ~ 9월 22일",
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    element: "흙",
    ruler: "수성",
    tagline: "빈틈을 찾아 메우는 완성자",
    keywords: ["처녀자리 운세", "처녀자리 성격", "처녀자리 궁합"],
    personality:
      "처녀자리는 남들이 지나치는 빈틈을 봅니다. 정리하고 다듬는 능력이 뛰어나, 어떤 결과물이든 처녀자리를 거치면 완성도가 올라갑니다.",
    strengths: ["세부를 놓치지 않습니다", "꾸준히 개선합니다", "실용적인 해법을 찾습니다"],
    cautions: ["자기 자신에게 가장 엄격합니다", "지적이 앞서 관계가 굳습니다"],
    love: "조용히 챙깁니다. 표현이 크지 않아 마음이 전해지지 않을 때가 있으니, 한 번은 말로 해주는 것이 좋습니다.",
    work: "품질·분석·관리 영역에서 대체 불가한 사람이 됩니다. 완벽을 목표로 두면 마감이 늦어지므로 기준선을 정해두세요.",
    money: "관리 능력이 뛰어납니다. 이미 잘하고 있으니, 아끼는 것보다 늘리는 쪽으로 한 걸음 나가볼 만한 해입니다.",
    yearOutlook: "2027년은 처녀자리에게 건강과 일상 루틴을 재정비하는 해입니다. 몸을 챙기면 나머지가 따라옵니다.",
    bestMatches: ["taurus", "capricorn", "cancer"],
    luckyColor: "베이지·아이보리",
    luckyItem: "다이어리",
  },
  {
    slug: "libra",
    name: "천칭자리",
    symbol: "♎",
    period: "9월 23일 ~ 10월 22일",
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    element: "공기",
    ruler: "금성",
    tagline: "양쪽을 재서 가운데를 찾는 조정자",
    keywords: ["천칭자리 운세", "천칭자리 성격", "천칭자리 궁합"],
    personality:
      "천칭자리는 균형을 봅니다. 한쪽으로 기울지 않으려는 감각이 강해 중재에 능하고, 미적인 판단이 정확합니다.",
    strengths: ["갈등을 조정합니다", "공정하게 판단합니다", "분위기와 미감을 만듭니다"],
    cautions: ["결정을 미룹니다", "미움받는 것을 지나치게 피합니다"],
    love: "관계 자체를 소중히 다룹니다. 다만 상대에게 맞추기만 하면 나중에 한 번에 무너지므로, 원하는 것을 말하는 연습이 필요합니다.",
    work: "협상·기획·디자인처럼 여러 입장을 조율하는 일에서 강합니다. 최종 결정을 내리는 훈련이 성장 포인트입니다.",
    money: "취향에 쓰는 지출이 큽니다. 예산 안에서 고르는 방식으로 바꾸면 만족도는 유지하면서 지출이 줄어듭니다.",
    yearOutlook: "2027년은 천칭자리에게 관계의 기준을 다시 세우는 해입니다. 남길 관계와 정리할 관계가 나뉩니다.",
    bestMatches: ["gemini", "aquarius", "leo"],
    luckyColor: "파스텔 핑크",
    luckyItem: "향수",
  },
  {
    slug: "scorpio",
    name: "전갈자리",
    symbol: "♏",
    period: "10월 23일 ~ 11월 21일",
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    element: "물",
    ruler: "명왕성·화성",
    tagline: "끝까지 파고들어 본질을 보는 탐구자",
    keywords: ["전갈자리 운세", "전갈자리 성격", "전갈자리 궁합"],
    personality:
      "전갈자리는 표면에서 멈추지 않습니다. 사람이든 일이든 끝까지 파고들어 본질을 확인해야 마음이 놓입니다. 집중력의 밀도가 가장 높은 별자리입니다.",
    strengths: ["한 가지에 깊이 몰입합니다", "위기에서 강해집니다", "신뢰를 주면 끝까지 지킵니다"],
    cautions: ["의심이 관계를 조입니다", "감정을 오래 담아둡니다"],
    love: "깊이 들어가거나 아예 들어가지 않거나입니다. 신뢰가 생기면 헌신적이지만, 한 번 금이 가면 회복이 어렵습니다.",
    work: "연구·분석·수사처럼 파고드는 일에서 독보적입니다. 여러 일을 얕게 벌이는 환경은 맞지 않습니다.",
    money: "한 번에 크게 움직이는 편입니다. 정보가 충분할 때만 들어가는 원칙을 지키면 성과가 큽니다.",
    yearOutlook: "2027년은 전갈자리에게 오래 준비한 것을 꺼내는 해입니다. 전문성으로 승부하는 선택이 유리합니다.",
    bestMatches: ["cancer", "pisces", "virgo"],
    luckyColor: "버건디",
    luckyItem: "만년필",
  },
  {
    slug: "sagittarius",
    name: "사수자리",
    symbol: "♐",
    period: "11월 22일 ~ 12월 21일",
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    element: "불",
    ruler: "목성",
    tagline: "더 넓은 곳을 향해 쏘는 탐험가",
    keywords: ["사수자리 운세", "사수자리 성격", "사수자리 궁합"],
    personality:
      "사수자리는 넓은 세계를 봅니다. 새로운 경험과 배움에서 힘을 얻고, 솔직한 말투로 분위기를 시원하게 만듭니다.",
    strengths: ["시야가 넓습니다", "낙관적으로 밀고 갑니다", "솔직해서 신뢰가 갑니다"],
    cautions: ["세부를 건너뜁니다", "직설이 상처가 됩니다"],
    love: "자유를 존중해주는 관계에서 오래갑니다. 구속으로 느껴지는 순간 마음이 밖으로 향합니다.",
    work: "해외·교육·여행·콘텐츠처럼 확장이 있는 분야가 맞습니다. 반복적인 관리 업무는 빠르게 지칩니다.",
    money: "경험에 쓰는 지출이 큽니다. 그 자체는 나쁘지 않으니, 고정비만 낮춰두면 균형이 맞습니다.",
    yearOutlook: "2027년은 사수자리에게 배움이 기회로 바뀌는 해입니다. 자격이나 언어에 투자한 시간이 결과로 돌아옵니다.",
    bestMatches: ["aries", "leo", "aquarius"],
    luckyColor: "보라색",
    luckyItem: "여행 가방",
  },
  {
    slug: "capricorn",
    name: "염소자리",
    symbol: "♑",
    period: "12월 22일 ~ 1월 19일",
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    element: "흙",
    ruler: "토성",
    tagline: "정상까지의 계단을 계산하는 등반가",
    keywords: ["염소자리 운세", "염소자리 성격", "염소자리 궁합"],
    personality:
      "염소자리는 목표를 단계로 쪼갭니다. 시간이 걸려도 흔들리지 않고 올라가며, 책임을 맡으면 끝까지 완수합니다.",
    strengths: ["장기 목표를 끝까지 갑니다", "책임을 회피하지 않습니다", "현실적인 계획을 세웁니다"],
    cautions: ["쉬는 것에 죄책감을 느낍니다", "감정 표현이 인색합니다"],
    love: "말보다 행동으로 보여줍니다. 관계에도 책임의 언어를 쓰기 때문에, 상대가 그 방식을 알면 매우 든든한 사람입니다.",
    work: "조직에서 자리를 쌓아가는 데 가장 강합니다. 성과가 늦게 인정되더라도 결국 평가가 뒤따릅니다.",
    money: "장기 계획에 강합니다. 다만 자신에게 쓰는 예산을 아예 빼놓지 않는 편이 오래 갑니다.",
    yearOutlook: "2027년은 염소자리에게 책임이 커지는 해입니다. 나눌 일과 맡을 일을 구분하면 소모가 줄어듭니다.",
    bestMatches: ["taurus", "virgo", "scorpio"],
    luckyColor: "짙은 회색·검정",
    luckyItem: "가죽 수첩",
  },
  {
    slug: "aquarius",
    name: "물병자리",
    symbol: "♒",
    period: "1월 20일 ~ 2월 18일",
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    element: "공기",
    ruler: "천왕성·토성",
    tagline: "당연한 것을 다시 묻는 발명가",
    keywords: ["물병자리 운세", "물병자리 성격", "물병자리 궁합"],
    personality:
      "물병자리는 '원래 그런 것'을 그대로 받아들이지 않습니다. 남들과 다른 각도에서 보고, 그 시선으로 새로운 방법을 만들어냅니다.",
    strengths: ["독창적인 관점을 냅니다", "편견 없이 사람을 대합니다", "미래를 먼저 봅니다"],
    cautions: ["감정 표현이 서툽니다", "거리를 두는 태도가 차갑게 보입니다"],
    love: "친구 같은 관계에서 시작합니다. 자기 시간과 생각을 존중받아야 오래가고, 소유하려는 태도에는 거리를 둡니다.",
    work: "기술·기획·비영리처럼 새로운 구조를 만드는 일에서 힘을 냅니다. 위계가 강한 조직은 잘 맞지 않습니다.",
    money: "관심이 없어서 관리가 느슨해지기 쉽습니다. 자동화해두면 그대로 해결됩니다.",
    yearOutlook: "2027년은 물병자리에게 사람과 연결이 기회를 만드는 해입니다. 혼자 하던 일을 함께 해보세요.",
    bestMatches: ["gemini", "libra", "sagittarius"],
    luckyColor: "하늘색",
    luckyItem: "이어폰",
  },
  {
    slug: "pisces",
    name: "물고기자리",
    symbol: "♓",
    period: "2월 19일 ~ 3월 20일",
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    element: "물",
    ruler: "해왕성·목성",
    tagline: "경계 없이 스며드는 공감가",
    keywords: ["물고기자리 운세", "물고기자리 성격", "물고기자리 궁합"],
    personality:
      "물고기자리는 남의 감정을 자기 것처럼 느낍니다. 상상력과 공감이 깊어 창작과 돌봄에 강하고, 사람들이 마음을 놓고 이야기하게 만듭니다.",
    strengths: ["깊이 공감합니다", "상상력이 풍부합니다", "사람을 편하게 만듭니다"],
    cautions: ["경계가 흐려 쉽게 지칩니다", "현실 문제를 미룹니다"],
    love: "헌신적입니다. 다만 상대의 감정까지 책임지려 하면 관계가 무거워지므로, 내 몫과 상대 몫을 나누는 연습이 필요합니다.",
    work: "예술·상담·기획처럼 감각과 공감을 쓰는 일에서 강합니다. 숫자와 마감은 도구로 보완하세요.",
    money: "정에 이끌린 지출을 조심해야 합니다. 빌려주는 돈은 돌려받지 못해도 괜찮은 금액만 쓰세요.",
    yearOutlook: "2027년은 물고기자리에게 경계를 세우는 해입니다. 거절 한 번이 한 해 전체를 편하게 만듭니다.",
    bestMatches: ["cancer", "scorpio", "capricorn"],
    luckyColor: "청록색",
    luckyItem: "노트북 스티커",
  },
];

const bySlug = new Map(starSigns.map((sign) => [sign.slug, sign]));

export function getStarSign(slug: string): StarSign | undefined {
  return bySlug.get(slug as StarSignSlug);
}

export function starSignName(slug: StarSignSlug): string {
  return bySlug.get(slug)?.name ?? slug;
}

export function starSignIndex(slug: StarSignSlug): number {
  return starSignSlugs.indexOf(slug);
}
