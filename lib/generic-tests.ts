export type ScoreMap = Record<string, number>;
import { newGenericTests } from "./new-tests";

export type GenericQuestion = {
  a: string;
  b: string;
  aScores: ScoreMap;
  bScores: ScoreMap;
};

export type GenericResult = {
  key: string;
  name: string;
  tagline: string;
  summary: string;
  color: string;
  traits: string[];
  strengths: string[];
  cautions: string[];
  relationship: string;
  dailyLife: string;
  growth: string[];
  shareText: string;
};

export type GenericTest = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  duration: string;
  disclaimer: string;
  dimensions: Array<{ key: string; label: string }>;
  questions: GenericQuestion[];
  results: Record<string, GenericResult>;
  evaluation: "egen-teto" | "attachment" | "mental-age" | "max-score";
  related: string[];
};

const binary = (a: string, b: string, positive: string, negative: string): GenericQuestion => ({
  a,
  b,
  aScores: { [positive]: 1 },
  bScores: { [negative]: 1 },
});

const egenTetoQuestions: GenericQuestion[] = [
  binary("상대의 감정 변화를 빠르게 알아차린다", "상대가 직접 말해야 상황을 파악하는 편이다", "egen", "teto"),
  binary("갈등이 생기면 관계가 상하지 않도록 먼저 달랜다", "갈등이 생기면 해결할 문제부터 정리한다", "egen", "teto"),
  binary("좋아하는 사람의 말투와 표정을 오래 기억한다", "좋아하는 사람에게 행동으로 마음을 보여준다", "egen", "teto"),
  binary("분위기와 감정의 흐름을 중요하게 본다", "목표와 결과가 분명한 상황이 편하다", "egen", "teto"),
  binary("선물을 고를 때 의미와 취향을 오래 고민한다", "필요하고 실용적인 것을 빠르게 고른다", "egen", "teto"),
  binary("친구 고민을 들으면 감정에 깊이 공감한다", "친구 고민을 들으면 해결책부터 떠올린다", "egen", "teto"),
  binary("새로운 관계에서는 상대의 반응을 살피며 다가간다", "마음에 들면 먼저 말을 걸고 약속을 잡는다", "egen", "teto"),
  binary("칭찬과 다정한 표현을 자주 하는 편이다", "말보다 책임감 있는 행동이 더 중요하다", "egen", "teto"),
  binary("경쟁보다는 모두가 편한 분위기를 선호한다", "건강한 경쟁은 나를 더 움직이게 만든다", "egen", "teto"),
  binary("결정 전에 주변 사람의 마음을 생각한다", "필요한 결정이라면 반대가 있어도 추진한다", "egen", "teto"),
  binary("연락의 빈도와 말투에 의미를 많이 둔다", "연락보다 실제 만남과 행동을 중요하게 본다", "egen", "teto"),
  binary("감성적인 영화나 음악의 여운이 오래간다", "속도감 있고 통쾌한 이야기에 더 끌린다", "egen", "teto"),
  binary("상대가 서운하지 않게 표현을 고르는 편이다", "오해가 없도록 분명하게 말하는 편이다", "egen", "teto"),
  binary("계획보다 함께하는 사람의 기분에 맞춘다", "사람이 많아도 내가 정한 계획대로 움직인다", "egen", "teto"),
  binary("관계가 어색해지면 내 행동을 되짚어본다", "관계가 어색해지면 직접 이유를 확인한다", "egen", "teto"),
  binary("부드럽고 섬세한 이미지가 나와 잘 맞는다", "당당하고 선명한 이미지가 나와 잘 맞는다", "egen", "teto"),
  binary("마음을 표현할 때 긴 대화가 필요하다", "마음을 표현할 때 짧아도 확실한 행동을 한다", "egen", "teto"),
  binary("다른 사람을 챙기다 내 필요를 미룰 때가 있다", "내 목표를 위해 관계의 거리를 조절할 수 있다", "egen", "teto"),
  binary("상대와 정서적으로 연결되어야 안정된다", "각자의 생활이 존중되어야 관계가 편하다", "egen", "teto"),
  binary("나의 매력은 따뜻함과 공감에 가깝다", "나의 매력은 추진력과 자신감에 가깝다", "egen", "teto"),
];

const attachmentQuestions: GenericQuestion[] = [
  binary("답장이 늦으면 관계가 멀어진 건 아닐지 걱정된다", "답장이 늦어도 각자의 사정이 있다고 생각한다", "anxiety", "secure"),
  binary("가까운 사람이 나를 떠날까 봐 불안할 때가 많다", "관계가 안정적이라면 잠시 떨어져 있어도 괜찮다", "anxiety", "secure"),
  binary("상대의 애정을 자주 확인받고 싶다", "애정을 반복해서 확인하지 않아도 신뢰할 수 있다", "anxiety", "secure"),
  binary("사소한 말투 변화도 나에 대한 마음과 연결한다", "말투보다 관계 전체의 흐름을 본다", "anxiety", "secure"),
  binary("갈등이 생기면 빨리 붙잡고 해결해야 마음이 놓인다", "갈등이 있어도 진정할 시간을 가질 수 있다", "anxiety", "secure"),
  binary("상대가 혼자 있고 싶다고 하면 거절당한 느낌이 든다", "상대의 혼자 있는 시간을 존중할 수 있다", "anxiety", "secure"),
  binary("친밀해질수록 내 약점을 보여주기 불편하다", "가까운 사람에게 도움을 요청할 수 있다", "avoidance", "secure"),
  binary("상대가 지나치게 가까워지면 거리를 두고 싶다", "친밀한 관계에서도 나답게 있을 수 있다", "avoidance", "secure"),
  binary("힘든 일이 있어도 혼자 해결하는 편이 낫다", "힘들 때 믿는 사람에게 기대도 괜찮다", "avoidance", "secure"),
  binary("감정적인 대화를 오래 하면 피곤해진다", "감정적인 대화도 관계에 필요한 과정이라고 본다", "avoidance", "secure"),
  binary("누군가에게 의지하면 약해지는 느낌이 든다", "서로 의지하는 것은 자연스러운 일이다", "avoidance", "secure"),
  binary("관계에서 구속받는 느낌이 들면 금방 멀어진다", "경계와 약속을 대화로 조정할 수 있다", "avoidance", "secure"),
  binary("좋아할수록 상대의 반응에 하루 기분이 좌우된다", "좋아해도 내 일상과 감정을 유지할 수 있다", "anxiety", "secure"),
  binary("상대가 나 없이 즐거워 보이면 서운하다", "상대의 독립적인 즐거움도 응원할 수 있다", "anxiety", "secure"),
  binary("관계가 끝날 것 같은 신호를 자주 찾는다", "문제가 생기면 추측보다 대화를 선택한다", "anxiety", "secure"),
  binary("마음을 들키기 전에 먼저 차갑게 행동할 때가 있다", "마음을 솔직하되 부담 없이 표현할 수 있다", "avoidance", "secure"),
  binary("상처받을 바에는 깊이 좋아하지 않는 편이 낫다", "상처의 가능성이 있어도 친밀함을 선택할 수 있다", "avoidance", "secure"),
  binary("상대가 기대면 책임이 너무 커지는 것 같다", "서로 감당할 수 있는 범위를 이야기할 수 있다", "avoidance", "secure"),
  binary("다툰 뒤 상대가 먼저 연락해야 사랑받는 느낌이 든다", "다툰 뒤 필요하면 내가 먼저 대화를 제안할 수 있다", "anxiety", "secure"),
  binary("관계가 불안할 때 시험하거나 떠보는 행동을 한다", "불안한 이유를 직접 설명하려고 한다", "anxiety", "secure"),
  binary("상대에게 기대면서도 동시에 밀어내고 싶을 때가 있다", "가까움과 독립 사이에서 비교적 편안하다", "fear", "secure"),
  binary("친해지고 싶지만 믿는 순간이 두렵다", "신뢰는 천천히 쌓을 수 있다고 생각한다", "fear", "secure"),
  binary("강하게 끌렸다가 갑자기 관계를 끝내고 싶을 때가 있다", "감정이 변해도 충동적으로 관계를 끊지 않는다", "fear", "secure"),
  binary("상대의 사랑을 원하면서도 의심이 멈추지 않는다", "불안해도 상대의 일관된 행동을 볼 수 있다", "fear", "secure"),
];

const mentalAgeQuestions: GenericQuestion[] = [
  binary("처음 보는 놀이도 일단 해보고 싶다", "재미있어도 시간과 체력을 먼저 계산한다", "young", "mature"),
  binary("계획이 틀어지면 새로운 일이 생긴 것 같아 흥미롭다", "계획이 틀어지면 다시 정리해야 마음이 놓인다", "young", "mature"),
  binary("궁금한 것이 생기면 밤늦게까지 찾아본다", "필요한 만큼 확인하고 다음 일로 넘어간다", "young", "mature"),
  binary("친구가 부르면 갑작스러운 약속도 나가는 편이다", "다음 날 일정을 보고 약속을 결정한다", "young", "mature"),
  binary("새 유행을 보면 직접 경험해 보고 싶다", "유행보다 오래 쓸 수 있는지를 본다", "young", "mature"),
  binary("실수해도 재미있는 경험이었다고 넘기는 편이다", "같은 실수를 반복하지 않도록 원인을 기록한다", "young", "mature"),
  binary("선택할 때 설렘이 큰 쪽으로 간다", "선택할 때 장기적인 영향을 먼저 본다", "young", "mature"),
  binary("기분이 좋으면 표정과 행동에 바로 드러난다", "기분이 좋아도 상황에 맞게 표현을 조절한다", "young", "mature"),
  binary("새로운 사람과 금방 친구가 될 수 있다", "시간을 두고 믿을 만한 관계를 만든다", "young", "mature"),
  binary("휴일에는 하고 싶은 일부터 한다", "휴일에도 해야 할 일을 먼저 정리한다", "young", "mature"),
  binary("갖고 싶은 물건은 만족감도 중요하다", "가격과 활용도를 꼼꼼히 비교한다", "young", "mature"),
  binary("다툰 뒤 먼저 풀고 다시 즐겁게 지내고 싶다", "다툰 원인과 다음 기준을 정리하고 싶다", "young", "mature"),
  binary("가끔은 아무 이유 없이 엉뚱한 일을 해보고 싶다", "예측 가능한 일상이 마음을 편하게 한다", "young", "mature"),
  binary("사람은 언제든 크게 달라질 수 있다고 믿는다", "사람의 변화에는 충분한 시간과 행동이 필요하다", "young", "mature"),
  binary("나이는 숫자일 뿐, 재미있으면 충분하다", "나이에 맞는 책임과 균형도 중요하다", "young", "mature"),
];

export const genericTests: Record<string, GenericTest> = {
  "egen-teto": {
    slug: "egen-teto",
    title: "에겐녀·테토녀 성향 테스트",
    eyebrow: "EGEN · TETO",
    description: "공감과 관계 중심의 에겐 성향, 추진력과 행동 중심의 테토 성향 중 지금의 나는 어느 쪽에 가까운지 확인해 보세요.",
    duration: "약 2~3분",
    disclaimer: "실제 호르몬 수치를 측정하는 의학적 검사가 아니라, 대중문화 속 에겐·테토 이미지를 활용한 재미형 성향 테스트입니다.",
    dimensions: [{ key: "egen", label: "에겐 성향" }, { key: "teto", label: "테토 성향" }],
    questions: egenTetoQuestions,
    evaluation: "egen-teto",
    related: ["adult-attachment", "mental-age", "mbti"],
    results: {
      egen: { key:"egen", name:"다정한 에겐형", tagline:"마음을 읽고 관계의 온도를 맞추는 공감가", summary:"말투와 표정의 작은 변화도 알아차리며, 사람 사이의 정서적 연결을 소중히 여깁니다.", color:"#9b72d2", traits:["섬세한 공감","따뜻한 표현","관계 중심"], strengths:["상대의 마음을 빠르게 알아챔","갈등을 부드럽게 조율함","감성적인 표현이 풍부함"], cautions:["상대 반응을 지나치게 해석할 수 있음","내 필요를 뒤로 미룰 수 있음"], relationship:"연애에서는 정서적 교감과 꾸준한 연락을 중요하게 봅니다. 표현이 줄어들면 관계의 온도가 낮아졌다고 느낄 수 있습니다.", dailyLife:"분위기와 사람을 고려하는 능력이 뛰어나 팀과 모임에서 정서적 연결자 역할을 합니다.", growth:["원하는 것을 직접 말하기","상대의 침묵을 거절로 단정하지 않기","나를 돌보는 시간을 일정에 넣기"], shareText:"나는 마음의 온도를 맞추는 다정한 에겐형!" },
      teto: { key:"teto", name:"당당한 테토형", tagline:"생각을 행동으로 바꾸고 관계를 앞으로 움직이는 추진가", summary:"목표와 의사가 분명하며 마음이 생기면 행동으로 보여주는 편입니다.", color:"#ff806f", traits:["빠른 추진력","솔직한 표현","독립적인 태도"], strengths:["결정과 실행이 빠름","위기에서 중심을 잡음","관계를 답답하게 끌지 않음"], cautions:["직설적인 말이 차갑게 들릴 수 있음","상대의 감정 속도를 놓칠 수 있음"], relationship:"연애에서는 말보다 행동과 책임을 중요하게 봅니다. 좋아하면 먼저 약속을 잡고 관계의 방향을 분명히 하려 합니다.", dailyLife:"현실적인 판단과 실행력이 강해 목표가 선명한 업무와 도전적인 상황에서 에너지가 살아납니다.", growth:["해결책 전에 감정을 한 번 확인하기","상대의 느린 속도도 존중하기","결과뿐 아니라 과정도 표현하기"], shareText:"나는 마음이 생기면 바로 움직이는 당당한 테토형!" },
      balance: { key:"balance", name:"에겐·테토 균형형", tagline:"공감과 추진력을 상황에 맞게 사용하는 조율가", summary:"사람의 마음을 살피면서도 필요한 순간에는 분명하게 결정하고 행동합니다.", color:"#6f71cc", traits:["유연한 균형","상황 판단","공감형 실행"], strengths:["관계와 목표를 함께 고려함","다양한 사람과 협업함","부드럽지만 분명하게 말함"], cautions:["상황마다 다른 모습 때문에 스스로 헷갈릴 수 있음","양쪽 요구를 모두 맞추려 지칠 수 있음"], relationship:"연애에서는 다정한 표현과 독립적인 생활을 모두 중요하게 봅니다. 상대에 따라 표현 방식이 달라질 수 있습니다.", dailyLife:"조율과 실행이 동시에 필요한 역할에 강하며, 분위기를 보면서도 결정을 미루지 않습니다.", growth:["내가 정말 원하는 기준 정하기","모든 사람을 만족시키려 하지 않기","상황별 에너지 소모 점검하기"], shareText:"나는 공감과 추진력을 모두 가진 에겐·테토 균형형!" },
    },
  },
  "adult-attachment": {
    slug:"adult-attachment", title:"성인 애착유형 테스트", eyebrow:"ADULT ATTACHMENT", description:"관계 불안과 친밀감 회피의 두 축으로 연애와 가까운 관계에서 반복되는 나의 애착 패턴을 살펴봅니다.", duration:"약 3분", disclaimer:"자기이해를 위한 간이 테스트이며 전문적인 심리 평가나 상담을 대신하지 않습니다.",
    dimensions:[{key:"anxiety",label:"관계 불안"},{key:"avoidance",label:"친밀감 회피"},{key:"secure",label:"안정 반응"}],
    questions:attachmentQuestions, related:["egen-teto","mental-age","mbti"],
    evaluation:"attachment",
    results:{
      secure:{key:"secure",name:"안정형 애착",tagline:"가까움과 독립을 편안하게 오가는 신뢰형",summary:"관계에서 솔직하게 소통하고, 갈등이 생겨도 관계 전체가 무너진다고 느끼지 않습니다.",color:"#5f8e82",traits:["신뢰","경계 존중","솔직한 소통"],strengths:["도움을 주고받는 데 편안함","갈등 뒤 회복력이 좋음","상대의 독립성을 존중함"],cautions:["불안형·회피형 상대의 반응을 이해하기 어려울 수 있음"],relationship:"애정과 독립 사이의 균형을 비교적 잘 유지합니다. 문제를 추측하기보다 대화로 조정하려 합니다.",dailyLife:"가족·친구·동료 관계에서도 경계를 존중하며 안정적인 연결을 만듭니다.",growth:["상대의 불안 신호를 가볍게 넘기지 않기","익숙한 관계에도 감사를 표현하기","필요한 경계를 계속 말하기"],shareText:"나의 성인 애착유형은 안정형!"},
      anxious:{key:"anxious",name:"불안형 애착",tagline:"사랑의 신호를 민감하게 확인하는 연결 추구형",summary:"관계를 소중히 여기며 상대의 반응과 거리 변화에 빠르게 민감해집니다.",color:"#d47b91",traits:["강한 연결 욕구","민감한 관찰","풍부한 애정"],strengths:["관계에 적극적으로 노력함","상대의 변화를 빨리 알아챔","감정을 풍부하게 표현함"],cautions:["답장과 말투를 과하게 해석할 수 있음","확인을 위해 상대를 시험할 수 있음"],relationship:"가까움을 강하게 원하며 표현이 줄면 버림받을 가능성을 먼저 떠올릴 수 있습니다.",dailyLife:"관계에서 받은 감정이 일상 집중력에도 영향을 줄 수 있어 자기 진정 루틴이 중요합니다.",growth:["사실과 추측을 구분해 적기","확인 대신 원하는 것을 직접 말하기","관계 밖의 안정적인 일상 만들기"],shareText:"나의 성인 애착유형은 불안형!"},
      avoidant:{key:"avoidant",name:"회피형 애착",tagline:"자율성과 거리를 통해 마음을 지키는 독립형",summary:"감정에 휩쓸리지 않으려 하며 혼자 해결할 수 있을 때 가장 편안함을 느낍니다.",color:"#647fa7",traits:["독립성","감정 절제","경계 중시"],strengths:["혼자서도 안정적으로 생활함","위기에서 냉정함을 유지함","상대에게 과도하게 의존하지 않음"],cautions:["필요한 감정 표현까지 줄일 수 있음","상대의 친밀감 요구를 부담으로 느낄 수 있음"],relationship:"가까워질수록 자유가 줄어드는 느낌을 받을 수 있으며, 갈등 때 혼자 정리할 시간이 필요합니다.",dailyLife:"업무와 개인 영역을 분리하는 데 강하지만 도움을 요청하는 시점이 늦어질 수 있습니다.",growth:["거리 두기 전에 필요한 시간을 설명하기","작은 도움부터 요청하기","감정을 해결할 문제로만 보지 않기"],shareText:"나의 성인 애착유형은 회피형!"},
      fearful:{key:"fearful",name:"공포·혼란형 애착",tagline:"가까워지고 싶지만 상처도 두려운 양가형",summary:"친밀함을 원하면서도 믿는 순간 다칠까 걱정되어 다가감과 밀어냄이 반복될 수 있습니다.",color:"#826c9d",traits:["강한 친밀감 욕구","높은 경계심","복합적인 감정"],strengths:["관계의 위험 신호를 민감하게 봄","깊은 감정을 이해함","안전한 관계에서는 큰 헌신을 보임"],cautions:["감정이 커지면 관계를 갑자기 끊을 수 있음","상대의 일관성도 의심할 수 있음"],relationship:"사랑받고 싶은 마음과 거절당할 두려움이 동시에 작동해 관계가 가까워질수록 혼란스러울 수 있습니다.",dailyLife:"안전하다고 느끼는 환경에서는 따뜻하지만 불확실성이 커지면 방어 반응이 빠르게 올라옵니다.",growth:["천천히 일관성을 확인하기","감정이 큰 날에는 결정 미루기","신뢰할 수 있는 상담·지지 관계 활용하기"],shareText:"나의 성인 애착유형은 공포·혼란형!"},
    }
  },
  "mental-age": {
    slug:"mental-age",title:"정신연령 테스트",eyebrow:"MENTAL AGE",description:"호기심, 책임감, 변화 적응과 감정 표현을 통해 지금 내 마음의 나이를 재미있게 확인해 보세요.",duration:"약 2분",disclaimer:"실제 지능이나 정신 상태를 측정하는 검사가 아닌 재미형 자기이해 테스트입니다.",
    dimensions:[{key:"young",label:"호기심 에너지"},{key:"mature",label:"안정·책임감"}],questions:mentalAgeQuestions,related:["mbti","egen-teto","adult-attachment"],
    evaluation:"mental-age",
    results:{
      teen:{key:"teen",name:"마음 나이 18세",tagline:"세상을 새롭게 보는 호기심 탐험가",summary:"재미있는 일 앞에서는 나이를 잊고 뛰어들며 새로운 사람과 경험에서 에너지를 얻습니다.",color:"#ff8e7a",traits:["강한 호기심","즉흥성","밝은 표현"],strengths:["새로운 시작을 두려워하지 않음","분위기를 빠르게 밝힘","실패에서 금방 회복함"],cautions:["마무리와 장기 계획을 놓칠 수 있음"],relationship:"함께 웃고 새로운 경험을 나누는 관계에서 가장 생기가 납니다.",dailyLife:"반복보다 변화가 있는 일에서 집중력이 올라가며 재미가 동기의 핵심입니다.",growth:["재미있는 일에도 마감 정하기","충동적인 결정은 하루 기다리기","기초 생활 리듬 지키기"],shareText:"내 마음 나이는 호기심 가득한 18세!"},
      twenties:{key:"twenties",name:"마음 나이 25세",tagline:"설렘과 가능성을 따라 움직이는 도전가",summary:"현실을 알지만 아직 가능성을 더 크게 보며 하고 싶은 일에는 과감하게 에너지를 씁니다.",color:"#9a71dc",traits:["도전","자유","빠른 적응"],strengths:["새로운 환경 적응","관계 확장","실행 에너지"],cautions:["관심이 자주 바뀔 수 있음"],relationship:"서로의 성장을 응원하고 각자의 생활을 존중하는 관계를 선호합니다.",dailyLife:"목표가 매력적일 때 놀라운 속도를 내지만 의미 없는 반복에는 쉽게 지칩니다.",growth:["선택한 일 하나는 끝까지 해보기","회복 시간을 계획에 포함하기","비교보다 나의 속도 보기"],shareText:"내 마음 나이는 가능성을 좇는 25세!"},
      thirties:{key:"thirties",name:"마음 나이 34세",tagline:"감성과 현실을 함께 챙기는 균형가",summary:"즐거움을 놓치지 않으면서도 선택의 결과와 책임을 자연스럽게 생각합니다.",color:"#637fd2",traits:["균형 감각","현실성","유연함"],strengths:["계획과 즉흥의 조화","감정 조절","현실적인 판단"],cautions:["여러 역할을 모두 잘하려 지칠 수 있음"],relationship:"설렘뿐 아니라 신뢰와 생활의 호흡을 중요하게 봅니다.",dailyLife:"필요할 때 책임을 지고 쉴 때는 즐길 줄 아는 편이지만 일정이 겹치면 피로가 쌓입니다.",growth:["모든 역할을 완벽히 하지 않기","즐거움을 보상으로만 미루지 않기","도움을 요청하기"],shareText:"내 마음 나이는 감성과 현실의 균형 34세!"},
      forties:{key:"forties",name:"마음 나이 46세",tagline:"경험으로 중심을 잡는 든든한 조율자",summary:"감정에 바로 휩쓸리기보다 상황 전체를 보고 안정적인 방향을 선택합니다.",color:"#577f88",traits:["책임감","안정성","통찰"],strengths:["장기적인 판단","위기 대처","신뢰를 주는 태도"],cautions:["새로운 재미를 뒤로 미룰 수 있음"],relationship:"약속과 일관성을 중요하게 보며 말보다 꾸준한 행동을 신뢰합니다.",dailyLife:"주변에서 의지하는 사람이 많지만 자신의 피로는 늦게 알아차릴 수 있습니다.",growth:["목적 없는 취미 즐기기","가끔은 효율보다 호기심 선택하기","책임을 나눠 갖기"],shareText:"내 마음 나이는 든든한 조율자 46세!"},
      wise:{key:"wise",name:"마음 나이 58세+",tagline:"서두르지 않고 본질을 보는 여유로운 통찰가",summary:"눈앞의 자극보다 오래 남는 가치와 평온을 중요하게 생각합니다.",color:"#6b7187",traits:["깊은 통찰","신중함","정서적 여유"],strengths:["감정에 흔들리지 않는 중심","사람을 오래 봄","우선순위가 분명함"],cautions:["변화를 피하거나 재미를 과소평가할 수 있음"],relationship:"많은 관계보다 편안하고 진실한 몇 사람과 깊이 연결되기를 원합니다.",dailyLife:"차분하게 자신의 속도를 지키지만 빠르게 변하는 환경에서는 에너지가 많이 들 수 있습니다.",growth:["익숙하지 않은 경험 하나 시도하기","젊은 감각을 판단 전에 관찰하기","나를 위한 작은 설렘 만들기"],shareText:"내 마음 나이는 본질을 보는 여유로운 58세!"},
    }
  }
};

const multi = (a:string,b:string,aKey:string,bKey:string):GenericQuestion => binary(a,b,aKey,bKey);
const result = (key:string,name:string,tagline:string,color:string,traits:string[],summary:string):GenericResult => ({
  key,name,tagline,color,traits,summary,
  strengths:[`${traits[0]}을 자연스럽게 표현합니다`,`${traits[1]}을 통해 관계와 일상을 풍성하게 만듭니다`,`${traits[2]}이 필요한 순간에 강점을 보입니다`],
  cautions:["한 가지 방식만 고집하면 상대와 엇갈릴 수 있습니다","지칠 때는 평소 강점이 부담으로 바뀔 수 있습니다"],
  relationship:`관계에서는 ${traits.join("·")}을 중요하게 여기며, 서로의 차이를 말로 확인할 때 더 편안해집니다.`,
  dailyLife:`일상에서도 ${traits[0]}을 중심으로 선택하는 편입니다. 강점을 살리되 다른 방식도 함께 연습하면 균형이 좋아집니다.`,
  growth:["내가 원하는 방식을 구체적으로 말하기","상대의 다른 표현을 틀렸다고 단정하지 않기","일주일에 한 번 내 에너지를 점검하기"],
  shareText:`나의 결과는 ${name}!`,
});

genericTests["love-language"] = {
  slug:"love-language",title:"5가지 사랑의 언어 테스트",eyebrow:"LOVE LANGUAGE",description:"사랑을 주고받을 때 가장 크게 마음에 닿는 표현 방식을 확인해 보세요.",duration:"약 3분",disclaimer:"관계의 소통을 돕는 재미형 자기이해 테스트이며 전문 상담을 대신하지 않습니다.",evaluation:"max-score",related:["adult-attachment","egen-teto","mbti"],
  dimensions:[{key:"words",label:"인정하는 말"},{key:"time",label:"함께하는 시간"},{key:"gift",label:"선물"},{key:"service",label:"봉사"},{key:"touch",label:"스킨십"}],
  questions:[
    multi("다정한 칭찬을 들을 때 사랑받는 느낌이 든다","둘만의 시간을 온전히 보낼 때 사랑받는 느낌이 든다","words","time"),multi("작은 선물에도 나를 생각한 마음이 느껴진다","말없이 일을 도와줄 때 고마움이 크다","gift","service"),multi("손을 잡거나 안아줄 때 마음이 놓인다","진심 어린 응원이 오래 기억에 남는다","touch","words"),multi("휴대폰 없이 대화하는 시간이 중요하다","필요한 것을 미리 챙겨주는 행동이 중요하다","time","service"),multi("기념일의 작은 선물이 설렌다","자연스러운 포옹이 더 설렌다","gift","touch"),multi("힘들 때 잘하고 있다는 말을 듣고 싶다","힘들 때 곁에 오래 있어주길 바란다","words","time"),multi("내 취향을 기억한 선물에 감동한다","바쁜 일을 대신 처리해주면 감동한다","gift","service"),multi("애정 표현을 말로 자주 듣고 싶다","가까이 앉아 온기를 느끼고 싶다","words","touch"),multi("함께 새로운 경험을 하는 것이 좋다","특별하지 않아도 선물을 주고받는 것이 좋다","time","gift"),multi("약속을 행동으로 지켜주는 사람이 좋다","스킨십으로 마음을 표현하는 사람이 좋다","service","touch"),multi("고맙다는 말을 구체적으로 듣고 싶다","내 일에 시간을 내어 함께해주길 바란다","words","time"),multi("필요한 순간 실제 도움을 받으면 든든하다","가볍게 어깨를 토닥여주면 든든하다","service","touch"),multi("여행에서 기념품을 고르는 일이 즐겁다","여행 계획을 함께 짜는 시간이 즐겁다","gift","time"),multi("내 장점을 말해주는 표현이 좋다","나를 위해 수고를 감수하는 행동이 좋다","words","service"),multi("오래 간직할 물건이 사랑의 증표처럼 느껴진다","따뜻한 포옹이 사랑의 증표처럼 느껴진다","gift","touch")],
  results:{
    words:result("words","인정하는 말","진심이 담긴 한마디가 마음을 채우는 언어형","#9a72d5",["칭찬","격려","진솔한 표현"],"구체적인 칭찬과 애정 표현을 통해 사랑을 가장 선명하게 느낍니다."),
    time:result("time","함께하는 시간","온전한 관심과 추억을 소중히 여기는 동행형","#5f86ca",["집중","대화","공유 경험"],"무엇을 하느냐보다 서로에게 온전히 집중하는 시간이 중요합니다."),
    gift:result("gift","선물","마음을 담은 상징을 오래 간직하는 기억형","#d28a67",["기억","상징","취향 관찰"],"가격보다 나를 떠올리고 골랐다는 의미에서 깊은 애정을 느낍니다."),
    service:result("service","봉사","말보다 실제 행동에서 신뢰를 느끼는 실천형","#588e7a",["도움","책임","배려 행동"],"필요한 순간 곁에서 실제로 도와주는 행동을 사랑의 증거로 느낍니다."),
    touch:result("touch","스킨십","따뜻한 접촉에서 안정감을 얻는 온기형","#cf7189",["포옹","친밀감","정서 안정"],"손잡기와 포옹처럼 자연스러운 접촉을 통해 연결감과 안정감을 느낍니다.")
  }
};

genericTests["self-esteem"] = {
  slug:"self-esteem",title:"자존감 패턴 테스트",eyebrow:"SELF ESTEEM",description:"실수·비교·관계 속에서 나를 대하는 현재의 태도와 회복 패턴을 살펴봅니다.",duration:"약 3분",disclaimer:"현재의 자기인식 경향을 살펴보는 간이 테스트이며 심리 진단을 대신하지 않습니다.",evaluation:"max-score",related:["burnout","work-style","mbti"],dimensions:[{key:"stable",label:"안정형"},{key:"growth",label:"성장형"},{key:"sensitive",label:"평가민감형"}],
  questions:[multi("실수해도 나의 가치까지 낮아진 것은 아니라고 생각한다","실수하면 내가 부족한 사람처럼 느껴진다","stable","sensitive"),multi("부족한 점은 연습으로 달라질 수 있다","잘하지 못할 것 같으면 시작을 미룬다","growth","sensitive"),multi("다른 사람의 성공을 자극으로 활용한다","다른 사람의 성공을 보면 내가 초라해진다","growth","sensitive"),multi("거절당해도 서로의 조건이 달랐다고 생각한다","거절당하면 오래 자책한다","stable","sensitive"),multi("칭찬이 없어도 내가 한 노력을 안다","칭찬이 없으면 잘한 것인지 불안하다","stable","sensitive"),multi("모르는 것을 편하게 질문할 수 있다","모르는 모습을 보이는 것이 창피하다","growth","sensitive"),multi("내 장점과 약점을 함께 인정한다","단점 하나가 보이면 장점도 의미 없어 보인다","stable","sensitive"),multi("작은 진전도 성장으로 기록한다","완벽한 결과가 아니면 실패처럼 느낀다","growth","sensitive"),multi("불편한 부탁은 거절할 수 있다","싫어도 관계가 걱정돼 받아준다","stable","sensitive"),multi("비판에서 필요한 부분만 골라 듣는다","비판을 들으면 하루 종일 마음에 남는다","growth","sensitive"),multi("내 감정을 존중하며 쉬어갈 수 있다","쉬면 뒤처지는 것 같아 불안하다","stable","sensitive"),multi("과거보다 달라진 점을 확인한다","항상 부족한 점부터 찾는다","growth","sensitive"),multi("나와 다른 의견도 나를 부정하는 것은 아니다","의견이 거절되면 나까지 거절된 느낌이다","stable","sensitive"),multi("도전의 결과보다 배운 점을 본다","성공 가능성이 높을 때만 도전한다","growth","sensitive"),multi("나는 존재만으로도 존중받을 가치가 있다","쓸모를 증명해야 인정받을 수 있다고 느낀다","stable","sensitive")],
  results:{stable:result("stable","안정 자존감형","나의 가치와 결과를 구분하는 단단한 중심형","#568d7e",["자기 존중","건강한 경계","감정 회복"],"성과가 흔들려도 자신의 기본적인 가치를 비교적 안정적으로 지킵니다."),growth:result("growth","성장 자존감형","부족함을 가능성으로 바꾸는 발전형","#6681cf",["학습 태도","도전","회복 탄력성"],"완벽하지 않아도 배우고 달라질 수 있다는 믿음으로 자신을 키워갑니다."),sensitive:result("sensitive","평가 민감형","인정의 신호에 마음이 크게 움직이는 섬세형","#bb728e",["높은 기준","관계 감수성","인정 욕구"],"타인의 반응과 결과가 자기평가에 큰 영향을 주는 시기입니다. 이는 고정된 성격이 아니라 돌볼 수 있는 패턴입니다.")}
};

genericTests["burnout"] = {
  slug:"burnout",title:"번아웃·스트레스 테스트",eyebrow:"BURNOUT CHECK",description:"업무 피로, 감정 소진, 회복 여력을 통해 현재의 번아웃 신호를 점검합니다.",duration:"약 2분",disclaimer:"의학적 진단이 아닙니다. 심한 무기력·불면·우울이 지속되면 전문가와 상담하세요.",evaluation:"max-score",related:["self-esteem","work-style","mbti"],dimensions:[{key:"green",label:"회복 가능"},{key:"yellow",label:"주의"},{key:"red",label:"소진"}],
  questions:[multi("퇴근 후 비교적 잘 회복된다","퇴근 후에도 아무것도 할 힘이 없다","green","red"),multi("일의 우선순위를 조절할 수 있다","모든 일이 급하고 통제할 수 없게 느껴진다","green","red"),multi("주말에 쉬면 에너지가 돌아온다","쉬어도 피로가 거의 줄지 않는다","green","red"),multi("업무에서 보람을 느끼는 순간이 있다","일의 의미가 전혀 느껴지지 않는다","green","red"),multi("동료와 대화할 여유가 있다","사람을 상대하는 것 자체가 버겁다","green","red"),multi("실수 후 다시 집중할 수 있다","작은 실수에도 무너지고 자책한다","green","red"),multi("잠드는 데 큰 어려움이 없다","업무 생각 때문에 잠들기 어렵다","green","red"),multi("식사와 생활 리듬이 비교적 일정하다","식사나 수면 리듬이 크게 무너졌다","green","red"),multi("도움을 요청하거나 일을 나눌 수 있다","도움을 요청할 여유조차 없다고 느낀다","green","red"),multi("휴식할 때 죄책감이 크지 않다","쉬는 동안에도 불안과 죄책감이 든다","green","yellow"),multi("출근 생각이 들어도 감당할 수 있다","출근을 생각하면 몸과 마음이 강하게 거부한다","green","red"),multi("예민해져도 이유를 알고 조절한다","사소한 일에도 화가 나거나 무감각해진다","green","yellow"),multi("최근 웃거나 즐거운 순간이 있었다","최근 즐거움을 거의 느끼지 못했다","green","red"),multi("일과 나 자신을 구분할 수 있다","성과가 곧 나의 가치처럼 느껴진다","green","yellow"),multi("앞으로 나아질 방법이 떠오른다","아무리 해도 달라질 것 같지 않다","green","red")],
  results:{green:result("green","회복 가능 단계","피로가 있어도 회복 리듬이 살아 있는 상태","#4f9278",["회복력","생활 균형","자기 조절"],"현재 스트레스가 있더라도 휴식과 조절을 통해 에너지를 되찾을 여력이 있습니다."),yellow:result("yellow","번아웃 주의 단계","몸과 마음이 속도를 줄여달라고 보내는 신호","#d09a4e",["누적 피로","예민함","회복 필요"],"피로와 긴장이 쌓이기 시작했습니다. 업무량과 회복 시간을 의식적으로 조정할 필요가 있습니다."),red:result("red","소진 위험 단계","버티기보다 보호와 지원이 먼저 필요한 상태","#c65f68",["정서 소진","무기력","지원 필요"],"현재 소진 신호가 여러 영역에서 나타납니다. 혼자 견디기보다 업무 조정과 주변의 도움을 우선하세요.")}
};

genericTests["work-style"] = {
  slug:"work-style",title:"직장인 업무성향 테스트",eyebrow:"WORK STYLE",description:"협업·실행·분석·아이디어 방식에서 나의 대표 업무 스타일을 확인합니다.",duration:"약 3분",disclaimer:"직무 적합성을 단정하는 평가가 아닌 협업 방식 이해를 위한 참고 테스트입니다.",evaluation:"max-score",related:["burnout","self-esteem","mbti"],dimensions:[{key:"driver",label:"추진형"},{key:"planner",label:"분석형"},{key:"connector",label:"협업형"},{key:"creator",label:"창의형"}],
  questions:[multi("회의에서는 결론과 담당자를 빠르게 정하고 싶다","충분한 자료를 확인한 뒤 결정하고 싶다","driver","planner"),multi("사람들의 의견을 연결하는 역할이 편하다","새로운 관점을 제안하는 역할이 편하다","connector","creator"),multi("일단 실행하며 수정하는 편이다","계획과 위험을 먼저 정리하는 편이다","driver","planner"),multi("갈등에서는 모두가 말할 기회를 만드는 편이다","갈등에서는 기존과 다른 해법을 찾는 편이다","connector","creator"),multi("마감과 성과가 분명할 때 집중이 잘된다","정확한 기준과 데이터가 있을 때 집중이 잘된다","driver","planner"),multi("팀 분위기가 성과에 큰 영향을 준다","자율성과 실험 기회가 성과에 큰 영향을 준다","connector","creator"),multi("문제가 생기면 즉시 대응한다","원인을 분석해 재발을 막는다","driver","planner"),multi("동료의 강점을 살려 역할을 나눈다","익숙한 역할을 바꿔 새 방식을 시도한다","connector","creator"),multi("짧고 분명한 보고를 선호한다","근거가 자세한 보고를 선호한다","driver","planner"),multi("피드백은 관계를 고려해 전달한다","피드백에서 새로운 가능성을 함께 제안한다","connector","creator"),multi("목표를 도전적으로 잡는 편이다","목표를 현실적으로 계산하는 편이다","driver","planner"),multi("협업 과정의 신뢰가 중요하다","결과물의 독창성이 중요하다","connector","creator"),multi("업무가 밀리면 우선순위를 과감히 정한다","업무가 밀리면 일정과 자원을 다시 계산한다","driver","planner"),multi("새 팀에서는 먼저 관계를 만든다","새 팀에서는 개선할 부분부터 관찰한다","connector","creator"),multi("성과를 눈에 보이게 만드는 일이 즐겁다","복잡한 구조를 정확하게 정리하는 일이 즐겁다","driver","planner"),multi("함께 목표를 이루는 순간이 가장 보람 있다","없던 아이디어가 실제가 되는 순간이 가장 보람 있다","connector","creator")],
  results:{driver:result("driver","실행 추진형","목표를 빠르게 행동으로 바꾸는 드라이버","#d1775d",["결단력","속도","성과 집중"],"명확한 목표 앞에서 빠르게 결정하고 사람과 자원을 움직이는 실행가입니다."),planner:result("planner","분석 설계형","근거와 구조로 완성도를 높이는 플래너","#5c7ea5",["분석력","정확성","위험 관리"],"복잡한 정보를 정리하고 실수를 줄이는 계획을 세우는 데 강합니다."),connector:result("connector","협업 조율형","사람을 연결해 팀의 힘을 키우는 커넥터","#558d78",["소통","조율","신뢰 형성"],"구성원의 의견과 강점을 연결해 함께 성과를 만드는 데 강합니다."),creator:result("creator","아이디어 창조형","고정관념을 넘어 새 가능성을 여는 크리에이터","#8a6bc1",["창의성","실험","변화 감지"],"익숙한 방식에서 벗어나 새로운 관점과 해결책을 제안하는 데 강합니다.")}
};

Object.assign(genericTests, newGenericTests);
