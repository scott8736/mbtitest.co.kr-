import { earthlyBranches, earthlyBranchesKo, elementLabels, branchElement, zodiacSlugs, type ZodiacSlug } from "./fortune-engine";

/**
 * 띠별 운세 데이터.
 *
 * 순서는 지지(자축인묘진사오미신유술해)와 같습니다. fortune-engine 의
 * zodiacIndexFromYear 가 돌려주는 번호를 그대로 색인으로 쓸 수 있습니다.
 */

export type ZodiacFortune = {
  slug: ZodiacSlug;
  /** "쥐띠" */
  name: string;
  /** "쥐" — 문장 안에서 조사를 붙일 때 씁니다. */
  animal: string;
  emoji: string;
  /** 한 줄 성격 요약. 목록 카드와 메타 설명에 함께 씁니다. */
  tagline: string;
  keywords: string[];
  personality: string;
  strengths: string[];
  cautions: string[];
  /** 2027 정미년 총운 */
  yearOverview: string;
  yearLove: string;
  yearMoney: string;
  yearWork: string;
  yearHealth: string;
  /** 그 해에 조심할 달과 좋은 달 */
  goodMonths: string;
  carefulMonths: string;
  bestMatches: ZodiacSlug[];
  hardMatches: ZodiacSlug[];
  luckyColor: string;
  luckyNumber: string;
  luckyDirection: string;
};

/** 태어난 해 목록을 12년 주기로 만들어 줍니다. */
export function birthYears(index: number, from = 1948, to = 2032): number[] {
  const years: number[] = [];
  for (let year = from; year <= to; year += 1) {
    if ((((year - 4) % 12) + 12) % 12 === index) years.push(year);
  }
  return years;
}

/** 2027 정미년(未年)은 해묘미생 — 돼지·토끼·양띠의 날삼재 해입니다. */
export const samjaeSlugs: ZodiacSlug[] = ["pig", "rabbit", "goat"];

export const zodiacFortunes: ZodiacFortune[] = [
  {
    slug: "rat",
    name: "쥐띠",
    animal: "쥐",
    emoji: "🐭",
    tagline: "먼저 알아채고 먼저 움직이는 정보형",
    keywords: ["쥐띠 운세", "쥐띠 성격", "2027 쥐띠 운세", "쥐띠 궁합"],
    personality:
      "쥐띠는 상황이 바뀌는 낌새를 가장 먼저 알아챕니다. 사람들의 말투나 분위기에서 신호를 읽고 미리 대비하는 편이라, 같은 조건에서도 손해를 덜 봅니다. 모으고 아끼는 감각도 뛰어나 작은 자원을 오래 굴려 큰 것을 만듭니다.",
    strengths: ["변화의 조짐을 빨리 감지합니다", "적은 자원으로 실속을 챙깁니다", "사람과 정보를 폭넓게 연결합니다"],
    cautions: ["걱정이 앞서 결정을 미루기 쉽습니다", "너무 많은 선택지를 붙들다 지칩니다"],
    yearOverview:
      "2027 정미년은 쥐띠에게 '넓히기보다 고르는' 해입니다. 미토(未土)의 기운이 쥐띠의 수(水) 기운을 눌러 속도가 줄어드는 대신, 그동안 벌여둔 일 가운데 무엇을 남길지 판단이 또렷해집니다. 새 판을 벌이는 것보다 하나를 끝까지 끌고 가는 쪽이 훨씬 큰 결과로 돌아옵니다.",
    yearLove:
      "오래 알고 지낸 사람에게서 관계가 발전합니다. 새로 만나는 자리보다 이미 연결된 관계를 다시 들여다볼 때 답이 나옵니다. 연인이 있다면 미뤄둔 대화를 꺼내기 좋은 해입니다.",
    yearMoney:
      "큰 수익보다 새는 돈을 막는 데서 이득이 납니다. 자동이체·구독·이자처럼 눈에 안 띄는 지출을 한 번 정리하면 그 자체가 수익입니다. 지인의 보증이나 급전 요청은 정중히 거절하세요.",
    yearWork:
      "실무 능력을 인정받는 흐름입니다. 다만 자리를 옮기는 결정은 하반기로 미루는 편이 낫습니다. 상반기에 조건을 확인하고 하반기에 움직이면 손해가 적습니다.",
    yearHealth: "위장과 수면이 약한 고리입니다. 늦은 시간 식사를 줄이고 잠드는 시각을 일정하게 잡아두세요.",
    goodMonths: "음력 3월, 8월, 11월",
    carefulMonths: "음력 6월, 12월",
    bestMatches: ["dragon", "monkey", "ox"],
    hardMatches: ["horse", "rooster"],
    luckyColor: "검은색·남색",
    luckyNumber: "1, 6",
    luckyDirection: "북쪽",
  },
  {
    slug: "ox",
    name: "소띠",
    animal: "소",
    emoji: "🐮",
    tagline: "느려도 끝을 보는 축적형",
    keywords: ["소띠 운세", "소띠 성격", "2027 소띠 운세", "소띠 궁합"],
    personality:
      "소띠는 한 번 시작한 일을 끝까지 밀고 갑니다. 화려한 출발보다 흔들리지 않는 지속에서 힘이 나오고, 그래서 시간이 지날수록 평가가 좋아집니다. 약속을 지키는 사람이라는 신뢰가 가장 큰 자산입니다.",
    strengths: ["오래 걸리는 일을 끝냅니다", "말보다 결과로 증명합니다", "위기에도 자리를 지킵니다"],
    cautions: ["방향이 틀려도 방식을 바꾸지 않습니다", "감정 표현이 늦어 오해를 삽니다"],
    yearOverview:
      "2027년은 소띠가 쌓아온 것이 형태를 갖추는 해입니다. 미토와 축토가 만나 땅의 기운이 두터워지는 만큼, 몇 해 준비한 일에서 결과가 나옵니다. 다만 축미충(丑未沖)이라 이동·이사·부서 변경 같은 자리 이동수가 함께 붙습니다. 변화를 거부하기보다 내가 고를 수 있는 쪽으로 방향을 잡으세요.",
    yearLove:
      "미루던 관계에 결론이 납니다. 결혼이나 동거처럼 형태를 정하는 이야기가 나오기 쉽고, 반대로 오래 애매했던 관계는 정리됩니다. 어느 쪽이든 소띠에게는 홀가분해지는 방향입니다.",
    yearMoney:
      "부동산·계약처럼 땅과 문서에 관련된 돈이 움직입니다. 서명 전에 조건을 한 줄씩 확인하면 큰 이득이고, 대충 넘기면 그만큼 손해로 돌아옵니다.",
    yearWork:
      "책임이 늘어나는 해입니다. 승진이나 팀 이동으로 역할이 커질 수 있는데, 혼자 다 떠안지 말고 나눌 일을 정해두세요. 소띠가 무너지는 자리는 대부분 과로입니다.",
    yearHealth: "허리와 관절, 소화기를 조심하세요. 같은 자세로 오래 앉아 있는 습관이 가장 큰 원인입니다.",
    goodMonths: "음력 1월, 5월, 9월",
    carefulMonths: "음력 4월, 7월",
    bestMatches: ["snake", "rooster", "rat"],
    hardMatches: ["goat", "horse"],
    luckyColor: "노란색·갈색",
    luckyNumber: "5, 10",
    luckyDirection: "북동쪽",
  },
  {
    slug: "tiger",
    name: "호랑이띠",
    animal: "호랑이",
    emoji: "🐯",
    tagline: "먼저 뛰어들어 판을 만드는 돌파형",
    keywords: ["호랑이띠 운세", "범띠 운세", "2027 호랑이띠 운세", "호랑이띠 궁합"],
    personality:
      "호랑이띠는 남이 망설이는 지점에서 먼저 움직입니다. 앞장서는 데 부담을 느끼지 않고, 위기 상황에서 오히려 또렷해집니다. 주변 사람들이 기대는 자리에 자연스럽게 서게 되는 유형입니다.",
    strengths: ["결정을 빠르게 내립니다", "책임지는 자리를 피하지 않습니다", "정체된 상황을 깨뜨립니다"],
    cautions: ["속도가 붙으면 주변 속도를 못 봅니다", "한 번 아니라고 판단하면 되돌리기 어렵습니다"],
    yearOverview:
      "2027년은 호랑이띠에게 '힘을 쓰기보다 방향을 정하는' 해입니다. 인목(寅木)이 미토를 만나 기운이 새어나가기 쉬운 구조라, 벌이는 만큼 소모도 큽니다. 새 일을 세 개 시작하기보다 지금 하는 하나의 완성도를 올릴 때 성과가 남습니다.",
    yearLove:
      "먼저 다가가는 쪽이 유리합니다. 다만 속도를 상대에게 맞추지 않으면 좋은 인연도 부담을 느낍니다. 확인받고 싶은 마음을 말로 바꿔 표현하면 관계가 안정됩니다.",
    yearMoney:
      "들어오는 돈도 나가는 돈도 커집니다. 투자를 한다면 원금 손실을 감당할 수 있는 범위만 쓰세요. 빠른 수익을 약속하는 제안은 이 해에 특히 조심해야 합니다.",
    yearWork:
      "새 프로젝트나 창업 제안이 들어옵니다. 조건이 좋아 보여도 사람과 자금을 먼저 확인하세요. 호랑이띠는 시작할 힘이 충분하니, 부족한 건 늘 마무리를 받쳐줄 사람입니다.",
    yearHealth: "간과 눈, 그리고 수면 부족을 조심하세요. 술자리가 늘어나는 시기와 겹치면 회복이 늦어집니다.",
    goodMonths: "음력 2월, 6월, 10월",
    carefulMonths: "음력 8월, 9월",
    bestMatches: ["horse", "dog", "pig"],
    hardMatches: ["monkey", "snake"],
    luckyColor: "초록색·청록색",
    luckyNumber: "3, 8",
    luckyDirection: "동쪽",
  },
  {
    slug: "rabbit",
    name: "토끼띠",
    animal: "토끼",
    emoji: "🐰",
    tagline: "부딪치지 않고 원하는 곳에 닿는 조율형",
    keywords: ["토끼띠 운세", "토끼띠 성격", "2027 토끼띠 운세", "토끼띠 삼재"],
    personality:
      "토끼띠는 갈등을 정면으로 만들지 않고도 원하는 결과에 닿습니다. 분위기를 읽는 감각이 섬세해 사람들 사이를 매끄럽게 잇고, 거친 자리에서도 자기 몫을 잃지 않습니다.",
    strengths: ["사람 사이의 온도를 맞춥니다", "무리하지 않고 오래 갑니다", "미감과 취향이 뚜렷합니다"],
    cautions: ["거절을 미루다 일을 키웁니다", "속마음을 늦게 꺼내 오해를 삽니다"],
    yearOverview:
      "2027 정미년은 토끼띠의 삼재가 끝나는 날삼재 해입니다. 2025년에 시작된 부담이 이 해에 정리되는 흐름이라, 상반기는 마무리와 정산의 시기, 하반기부터 새 출발의 기운이 돕니다. 묘미(卯未)가 반합을 이뤄 사람의 도움을 받기도 좋은 해입니다. 크게 벌이지 말고, 끝내야 할 것을 끝내세요.",
    yearLove:
      "정리와 시작이 함께 옵니다. 오래 마음만 쓰던 관계는 결론이 나고, 하반기에는 새로운 인연이 들어옵니다. 지난 관계의 기준을 그대로 들고 가지 않는 것이 중요합니다.",
    yearMoney:
      "삼재의 마지막 해라 큰 투자나 보증은 피하는 편이 좋습니다. 대신 밀린 정산·환급·미수금처럼 '받을 돈'을 챙기면 실속이 있습니다.",
    yearWork:
      "부서 이동이나 이직 이야기가 나옵니다. 상반기 제안은 조건을 꼼꼼히 보고, 하반기 제안이 더 유리한 경우가 많습니다. 급하게 답하지 않아도 기회는 남습니다.",
    yearHealth: "신경성 위장 장애와 불면을 조심하세요. 참는 습관이 몸으로 먼저 나타나는 유형입니다.",
    goodMonths: "음력 7월, 10월, 11월",
    carefulMonths: "음력 2월, 5월",
    bestMatches: ["goat", "pig", "dog"],
    hardMatches: ["rooster", "dragon"],
    luckyColor: "연두색·베이지",
    luckyNumber: "3, 8",
    luckyDirection: "동쪽",
  },
  {
    slug: "dragon",
    name: "용띠",
    animal: "용",
    emoji: "🐲",
    tagline: "크게 그리고 크게 움직이는 확장형",
    keywords: ["용띠 운세", "용띠 성격", "2027 용띠 운세", "용띠 궁합"],
    personality:
      "용띠는 스케일이 큽니다. 작게 시작하는 일도 결국 큰 그림으로 키우고, 그 그림에 사람을 끌어들이는 힘이 있습니다. 자존심이 강한 만큼 자기 기준에 맞는 결과를 내려고 끝까지 밀어붙입니다.",
    strengths: ["큰 목표를 설득력 있게 그립니다", "사람을 모읍니다", "위기에 흔들리지 않습니다"],
    cautions: ["작은 조율을 건너뜁니다", "인정받지 못하면 급격히 식습니다"],
    yearOverview:
      "2027년은 용띠에게 속도를 조절하는 해입니다. 진토와 미토가 겹쳐 땅의 기운은 두터워지지만 움직임은 무거워집니다. 확장보다 내실을 다지는 선택이 유리하고, 이 해에 정리한 기반이 다음 해의 도약을 만듭니다.",
    yearLove:
      "주도권을 조금 내려놓을 때 관계가 편해집니다. 상대의 속도를 기다려주는 한 번의 선택이 이 해 관계운 전체를 바꿉니다.",
    yearMoney:
      "재물운은 나쁘지 않지만 지출도 함께 커집니다. 체면 때문에 쓰는 돈을 한 번 점검하면 남는 게 확 늘어납니다. 부동산·계약 관련 문서운은 좋습니다.",
    yearWork:
      "책임 범위가 넓어집니다. 다만 혼자 판단하고 통보하는 방식은 이 해에 특히 반발을 삽니다. 결정 전에 한 번 묻는 절차를 넣으세요.",
    yearHealth: "혈압과 위장을 살피세요. 스트레스를 먹는 것으로 푸는 습관이 문제를 키웁니다.",
    goodMonths: "음력 1월, 4월, 9월",
    carefulMonths: "음력 3월, 7월",
    bestMatches: ["rat", "monkey", "rooster"],
    hardMatches: ["dog", "rabbit"],
    luckyColor: "노란색·금색",
    luckyNumber: "5, 10",
    luckyDirection: "동남쪽",
  },
  {
    slug: "snake",
    name: "뱀띠",
    animal: "뱀",
    emoji: "🐍",
    tagline: "말을 아끼고 결정적일 때 움직이는 전략형",
    keywords: ["뱀띠 운세", "뱀띠 성격", "2027 뱀띠 운세", "뱀띠 궁합"],
    personality:
      "뱀띠는 관찰이 깊습니다. 다 알고도 말하지 않고 기다리다가, 필요한 순간에 정확히 한 번 움직입니다. 겉으로는 조용해 보여도 판단의 기준이 매우 분명한 유형입니다.",
    strengths: ["핵심을 정확히 짚습니다", "감정에 휘둘리지 않습니다", "위기 관리에 강합니다"],
    cautions: ["속을 보이지 않아 거리감을 줍니다", "혼자 결론 내고 통보하듯 말합니다"],
    yearOverview:
      "2027년은 뱀띠에게 흐름이 풀리는 해입니다. 사화(巳火)가 미토를 생하며 그동안 눌려 있던 기운이 밖으로 나옵니다. 준비만 해두고 꺼내지 못했던 계획을 실행하기 좋고, 특히 전문성으로 승부하는 일에서 성과가 납니다.",
    yearLove:
      "먼저 표현하면 됩니다. 뱀띠의 관계운이 막히는 이유는 인연이 없어서가 아니라 표현이 늦기 때문입니다. 이 해에는 한 번의 솔직한 말이 관계를 크게 진전시킵니다.",
    yearMoney:
      "전문성·자격·기술에서 돈이 나옵니다. 부업이나 강의, 자문처럼 아는 것을 파는 형태가 특히 잘 맞습니다. 반대로 잘 모르는 분야의 투자는 손실로 이어지기 쉽습니다.",
    yearWork: "인정받는 해입니다. 그동안의 결과가 뒤늦게 평가되므로, 성과를 기록으로 남겨두면 그대로 근거가 됩니다.",
    yearHealth: "심장과 눈, 그리고 과로를 조심하세요. 몰입하면 몸의 신호를 늦게 알아채는 편입니다.",
    goodMonths: "음력 1월, 5월, 8월",
    carefulMonths: "음력 10월, 11월",
    bestMatches: ["ox", "rooster", "monkey"],
    hardMatches: ["pig", "tiger"],
    luckyColor: "빨간색·자주색",
    luckyNumber: "2, 7",
    luckyDirection: "남동쪽",
  },
  {
    slug: "horse",
    name: "말띠",
    animal: "말",
    emoji: "🐴",
    tagline: "달리면서 길을 찾는 추진형",
    keywords: ["말띠 운세", "말띠 성격", "2027 말띠 운세", "말띠 궁합"],
    personality:
      "말띠는 멈춰서 고민하기보다 일단 움직이며 답을 찾습니다. 에너지가 밖으로 향해 있어 사람을 끌어당기고, 분위기를 살리는 자리에 자연스럽게 놓입니다.",
    strengths: ["실행이 빠릅니다", "분위기를 밝게 만듭니다", "새 환경에 금방 적응합니다"],
    cautions: ["시작한 일을 다 끝내지 못합니다", "지루해지면 급격히 흥미를 잃습니다"],
    yearOverview:
      "2027년은 말띠에게 결실의 해입니다. 오미(午未)가 합을 이뤄 흐름이 순해지고, 지난 몇 해 흩어져 있던 일들이 하나로 모입니다. 새로 벌이기보다 이미 하던 것을 정리해 형태로 만들면 그대로 성과가 됩니다.",
    yearLove:
      "관계운이 가장 좋은 편입니다. 소개나 모임에서 인연이 생기기 쉽고, 연인이 있다면 관계가 한 단계 진전됩니다. 다만 여러 관계를 동시에 열어두지 않는 것이 중요합니다.",
    yearMoney: "수입이 늘지만 씀씀이도 함께 커집니다. 들어온 돈의 일정 비율을 먼저 떼어두는 방식이 이 해에 가장 잘 맞습니다.",
    yearWork: "협업에서 기회가 옵니다. 혼자 하는 일보다 팀으로 묶이는 일에서 평가가 좋습니다.",
    yearHealth: "심장과 혈압, 그리고 과음을 조심하세요. 활동량이 늘어나는 만큼 회복 시간도 확보해야 합니다.",
    goodMonths: "음력 4월, 6월, 10월",
    carefulMonths: "음력 11월, 12월",
    bestMatches: ["tiger", "dog", "goat"],
    hardMatches: ["rat", "ox"],
    luckyColor: "빨간색·주황색",
    luckyNumber: "2, 7",
    luckyDirection: "남쪽",
  },
  {
    slug: "goat",
    name: "양띠",
    animal: "양",
    emoji: "🐑",
    tagline: "마음을 읽고 품는 공감형",
    keywords: ["양띠 운세", "양띠 성격", "2027 양띠 운세", "양띠 본명년", "양띠 삼재"],
    personality:
      "양띠는 남의 감정을 잘 알아챕니다. 배려가 몸에 배어 있어 사람들이 편하게 기대고, 그래서 관계가 오래갑니다. 겉은 부드럽지만 자기 기준은 조용히 지키는 편입니다.",
    strengths: ["사람의 마음을 세심하게 읽습니다", "갈등을 부드럽게 풉니다", "미적 감각이 뛰어납니다"],
    cautions: ["남을 챙기다 자기 몫을 놓칩니다", "거절을 못해 부담을 안고 갑니다"],
    yearOverview:
      "2027 정미년은 양띠의 본명년(本命年)이자 삼재가 끝나는 날삼재 해입니다. 자기 띠의 해는 기운이 강해지는 만큼 변화도 큽니다. 이사·이직·관계 정리처럼 자리를 바꾸는 일이 몰리기 쉬우니, 스스로 고른 변화로 만드는 것이 핵심입니다. 삼재의 마지막 해라 상반기는 정리, 하반기는 회복의 흐름입니다.",
    yearLove:
      "관계에 결론이 나는 해입니다. 오래 끌던 이야기가 매듭지어지고, 정리된 자리에 새 인연이 들어옵니다. 상대에게 맞추기만 하는 방식은 이 해에 특히 손해입니다.",
    yearMoney:
      "본명년에는 크게 벌리지 않는 것이 정석입니다. 투자·보증·확장은 다음 해로 미루고, 이 해에는 지출 구조를 정리하는 데 집중하세요.",
    yearWork: "역할이 바뀝니다. 원치 않는 변화처럼 보여도 결과적으로 더 맞는 자리로 이어지는 경우가 많습니다.",
    yearHealth: "위장과 신경계를 조심하세요. 본명년에는 무리한 다이어트나 급격한 생활 변화가 특히 부담이 됩니다.",
    goodMonths: "음력 6월, 9월, 10월",
    carefulMonths: "음력 1월, 4월",
    bestMatches: ["rabbit", "pig", "horse"],
    hardMatches: ["ox", "dog"],
    luckyColor: "노란색·연분홍",
    luckyNumber: "5, 10",
    luckyDirection: "남서쪽",
  },
  {
    slug: "monkey",
    name: "원숭이띠",
    animal: "원숭이",
    emoji: "🐵",
    tagline: "방법을 바꿔 답을 찾는 응용형",
    keywords: ["원숭이띠 운세", "원숭이띠 성격", "2027 원숭이띠 운세", "원숭이띠 궁합"],
    personality:
      "원숭이띠는 막히면 다른 길을 찾습니다. 정해진 방식을 그대로 따르기보다 더 빠른 방법을 만들어내고, 새로운 도구나 기술을 익히는 속도가 빠릅니다.",
    strengths: ["문제를 우회하는 방법을 찾습니다", "학습 속도가 빠릅니다", "분위기를 유연하게 바꿉니다"],
    cautions: ["관심이 자주 옮겨갑니다", "잔재주로 넘기려다 신뢰를 잃습니다"],
    yearOverview:
      "2027년은 원숭이띠에게 배움과 준비의 해입니다. 신금(申金)이 미토의 생을 받아 기반이 단단해지지만, 큰 결과보다 다음을 위한 축적에 어울립니다. 자격·기술·언어처럼 남는 것에 시간을 쓰면 다음 해에 그대로 기회로 바뀝니다.",
    yearLove: "가볍게 시작한 관계가 진지해집니다. 재미있는 사람으로만 남지 말고, 약속을 지키는 모습을 보여주세요.",
    yearMoney: "부수입 경로가 열립니다. 여러 개를 동시에 벌이기보다 하나를 궤도에 올리는 편이 수익이 큽니다.",
    yearWork: "새로운 도구나 방식을 도입하는 역할이 맡겨집니다. 이 해의 성과는 대부분 '남들이 안 하던 방법'에서 나옵니다.",
    yearHealth: "어깨·목과 눈의 피로를 조심하세요. 화면을 보는 시간이 길어지는 시기입니다.",
    goodMonths: "음력 3월, 5월, 8월",
    carefulMonths: "음력 1월, 2월",
    bestMatches: ["rat", "dragon", "snake"],
    hardMatches: ["tiger", "pig"],
    luckyColor: "흰색·은색",
    luckyNumber: "4, 9",
    luckyDirection: "남서쪽",
  },
  {
    slug: "rooster",
    name: "닭띠",
    animal: "닭",
    emoji: "🐔",
    tagline: "기준을 세우고 끝까지 지키는 완성형",
    keywords: ["닭띠 운세", "닭띠 성격", "2027 닭띠 운세", "닭띠 궁합"],
    personality:
      "닭띠는 기준이 분명합니다. 대충 넘어가는 법이 없고, 그래서 결과물의 완성도가 높습니다. 시간 약속과 정리 정돈에서 신뢰를 얻는 유형입니다.",
    strengths: ["디테일을 놓치지 않습니다", "계획대로 실행합니다", "책임 범위를 분명히 합니다"],
    cautions: ["자기 기준을 남에게도 적용합니다", "지적이 앞서 관계가 굳습니다"],
    yearOverview:
      "2027년은 닭띠에게 인정받는 해입니다. 유금(酉金)이 미토의 생을 받아 그동안의 꼼꼼함이 결과로 드러납니다. 다만 사람 관계에서는 말의 온도를 한 번 낮추는 것이 이 해의 과제입니다. 실력은 이미 충분하니, 전달 방식만 바꿔도 평가가 달라집니다.",
    yearLove: "조건보다 대화의 방식이 관계를 결정합니다. 옳은 말을 부드럽게 하는 연습이 그대로 관계운이 됩니다.",
    yearMoney: "계획적인 저축과 정리에서 이득이 납니다. 금융 상품을 갈아타거나 조건을 재협상하기 좋은 해입니다.",
    yearWork: "품질·검수·관리 영역에서 성과가 납니다. 맡은 범위를 문서로 정리해두면 평가에서 유리합니다.",
    yearHealth: "폐와 기관지, 피부를 조심하세요. 건조한 계절에 특히 관리가 필요합니다.",
    goodMonths: "음력 2월, 5월, 8월",
    carefulMonths: "음력 3월, 9월",
    bestMatches: ["ox", "snake", "dragon"],
    hardMatches: ["rabbit", "rat"],
    luckyColor: "흰색·금색",
    luckyNumber: "4, 9",
    luckyDirection: "서쪽",
  },
  {
    slug: "dog",
    name: "개띠",
    animal: "개",
    emoji: "🐶",
    tagline: "내 사람을 끝까지 지키는 신의형",
    keywords: ["개띠 운세", "개띠 성격", "2027 개띠 운세", "개띠 궁합"],
    personality:
      "개띠는 신의를 가장 중요하게 여깁니다. 한 번 마음을 준 사람에게는 조건 없이 편이 되어주고, 옳고 그름에 대한 감각이 뚜렷합니다. 손해를 보더라도 원칙을 지키는 쪽을 고릅니다.",
    strengths: ["믿을 수 있는 사람입니다", "부당한 일에 목소리를 냅니다", "위기에 곁을 지킵니다"],
    cautions: ["의심이 생기면 마음을 닫습니다", "걱정을 미리 끌어와 지칩니다"],
    yearOverview:
      "2027년은 개띠에게 관계를 정리하는 해입니다. 술토와 미토가 만나 형(刑)의 기운이 있어 사람 문제로 마음 쓸 일이 생깁니다. 모든 관계를 끌고 가려 하지 말고, 남길 사람을 고르는 해로 삼으면 오히려 홀가분해집니다.",
    yearLove: "오해를 오래 두지 마세요. 개띠의 관계 문제는 대부분 사건이 아니라 침묵에서 커집니다.",
    yearMoney: "빌려주는 돈과 보증을 특히 조심해야 하는 해입니다. 정이 앞서면 그대로 손실이 됩니다.",
    yearWork: "책임감으로 남의 일까지 떠안기 쉽습니다. 맡을 일과 넘길 일을 문장으로 구분해두세요.",
    yearHealth: "위장과 관절, 그리고 마음의 소진을 살피세요. 혼자 견디는 습관이 가장 큰 부담입니다.",
    goodMonths: "음력 2월, 6월, 10월",
    carefulMonths: "음력 4월, 7월",
    bestMatches: ["tiger", "horse", "rabbit"],
    hardMatches: ["dragon", "goat"],
    luckyColor: "노란색·카키",
    luckyNumber: "5, 10",
    luckyDirection: "서북쪽",
  },
  {
    slug: "pig",
    name: "돼지띠",
    animal: "돼지",
    emoji: "🐷",
    tagline: "베풀고 넉넉하게 돌려받는 복덕형",
    keywords: ["돼지띠 운세", "돼지띠 성격", "2027 돼지띠 운세", "돼지띠 삼재"],
    personality:
      "돼지띠는 계산 없이 베풉니다. 사람을 의심하지 않고 먼저 내주는 편이라 주변에 사람이 모이고, 결과적으로 필요한 순간 도움을 받습니다. 욕심을 부리지 않는 태도가 오히려 복을 부릅니다.",
    strengths: ["사람에게 편안함을 줍니다", "베푼 만큼 돌려받습니다", "큰 흐름을 낙관적으로 봅니다"],
    cautions: ["거절을 못해 이용당하기 쉽습니다", "낙관이 준비 부족으로 이어집니다"],
    yearOverview:
      "2027 정미년은 돼지띠의 삼재가 끝나는 날삼재 해입니다. 해묘미 반합의 도움을 함께 받아, 마무리가 순조롭습니다. 지난 두 해가 버티는 시기였다면 이 해는 정리하고 회복하는 시기입니다. 상반기에 남은 문제를 털고, 하반기에 새 계획을 세우세요.",
    yearLove: "인연운이 살아납니다. 소개나 오래된 인연이 다시 연결되는 형태가 많고, 관계가 안정으로 향합니다.",
    yearMoney: "삼재 마지막 해라 새 투자보다 회수가 우선입니다. 못 받은 돈, 미뤄둔 정산부터 챙기세요.",
    yearWork: "부담이 줄어드는 흐름입니다. 무리해서 자리를 옮기기보다 지금 자리에서 회복하는 편이 유리합니다.",
    yearHealth: "체중과 혈당, 간을 살피세요. 긴장이 풀리는 시기에 관리가 느슨해지기 쉽습니다.",
    goodMonths: "음력 3월, 7월, 10월",
    carefulMonths: "음력 5월, 6월",
    bestMatches: ["rabbit", "goat", "tiger"],
    hardMatches: ["snake", "monkey"],
    luckyColor: "검은색·감청색",
    luckyNumber: "1, 6",
    luckyDirection: "북서쪽",
  },
];

const bySlug = new Map(zodiacFortunes.map((item) => [item.slug, item]));

export function getZodiac(slug: string): ZodiacFortune | undefined {
  return bySlug.get(slug as ZodiacSlug);
}

export function zodiacIndex(slug: ZodiacSlug): number {
  return zodiacSlugs.indexOf(slug);
}

export function zodiacBranch(slug: ZodiacSlug): { ko: string; hanja: string; element: string } {
  const index = zodiacIndex(slug);
  return {
    ko: earthlyBranchesKo[index],
    hanja: earthlyBranches[index],
    element: elementLabels[branchElement[index]],
  };
}

export function zodiacName(slug: ZodiacSlug): string {
  return bySlug.get(slug)?.name ?? slug;
}
