import type { GenericResult, GenericTest } from "./generic-tests";
import type { TestCatalogItem, TestCategory } from "./test-catalog";

type ResultSeed = {
  key: string;
  name: string;
  tagline: string;
  summary: string;
  color: string;
  traits: [string, string, string];
  signals: [string, string, string];
};

type TestSeed = {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  category: TestCategory;
  icon: string;
  color: string;
  keywords: string[];
  results: [ResultSeed, ResultSeed, ResultSeed, ResultSeed];
};

const makeResult = (seed: ResultSeed): GenericResult => ({
  key: seed.key,
  name: seed.name,
  tagline: seed.tagline,
  summary: seed.summary,
  color: seed.color,
  traits: seed.traits,
  strengths: [
    `${seed.traits[0]}을 자연스럽게 발휘합니다.`,
    `${seed.traits[1]}이 필요한 상황에서 강점을 보입니다.`,
    `${seed.traits[2]}을 통해 사람들과 자신만의 흐름을 만듭니다.`,
  ],
  cautions: [
    "익숙한 방식만 고집하면 다른 성향과 엇갈릴 수 있습니다.",
    "에너지가 떨어질 때는 장점이 부담이나 예민함으로 바뀔 수 있습니다.",
  ],
  relationship: `${seed.traits.join("·")}을 중요하게 여기는 편입니다. 상대와 표현 방식이 다를 때는 마음을 추측하기보다 원하는 것을 구체적으로 말하면 관계가 편안해집니다.`,
  dailyLife: `${seed.traits[0]}을 중심으로 선택하고 행동합니다. 강점을 살리면서 반대 성향의 방식도 작은 것부터 시도하면 일상의 균형이 좋아집니다.`,
  growth: [
    "내가 원하는 방식을 한 문장으로 설명하기",
    "다른 사람의 속도를 틀렸다고 단정하지 않기",
    "일주일에 한 번 감정과 에너지 상태를 기록하기",
  ],
  shareText: `나의 결과는 ${seed.name}!`,
});

const makeTest = (seed: TestSeed): GenericTest => {
  const questions = seed.results.flatMap((result, resultIndex) =>
    result.signals.map((signal, signalIndex) => {
      const other = seed.results[(resultIndex + signalIndex + 1) % seed.results.length];
      const otherSignal = other.signals[(signalIndex + resultIndex) % other.signals.length];
      return {
        a: signal,
        b: otherSignal,
        aScores: { [result.key]: 1 },
        bScores: { [other.key]: 1 },
      };
    }),
  );

  const relatedByCategory: Record<TestCategory, string[]> = {
    연애: ["love-tendency", "dating-style", "love-ability", "couple-character"],
    성격: ["first-impression", "lazy-mbti", "self-reflection", "mbti"],
    마음건강: ["self-reflection", "dont-get-hurt", "healing-sprite", "self-esteem"],
    직장: ["work-style", "burnout", "mbti"],
  };

  return {
    slug: seed.slug,
    title: seed.title,
    eyebrow: seed.eyebrow,
    description: seed.description,
    duration: "약 2분",
    disclaimer:
      "재미와 자기이해를 위한 간이 성향 테스트입니다. 결과는 사람의 능력이나 관계의 성공 여부를 단정하지 않습니다.",
    dimensions: seed.results.map((result) => ({ key: result.key, label: result.name })),
    questions,
    results: Object.fromEntries(seed.results.map((result) => [result.key, makeResult(result)])),
    evaluation: "max-score",
    related: relatedByCategory[seed.category].filter((slug) => slug !== seed.slug).slice(0, 3),
  };
};

const seeds: TestSeed[] = [
  {
    slug: "love-tendency", title: "연애 성향 테스트", shortTitle: "연애 성향", eyebrow: "LOVE TENDENCY",
    description: "애정 표현과 관계에서 중요하게 생각하는 기준으로 나의 연애 성향을 확인합니다.", category: "연애", icon: "♡", color: "#d56f8c",
    keywords: ["연애 성향 테스트", "연애 심리테스트", "나의 연애 성향"],
    results: [
      { key:"warm",name:"다정한 온기형",tagline:"표현과 공감으로 사랑을 키우는 사람",summary:"사소한 감정 변화도 살피며 다정한 말과 행동으로 애정을 전합니다.",color:"#db7891",traits:["공감","표현","세심함"],signals:["좋아하면 다정한 말을 자주 건넨다","상대의 표정 변화가 빠르게 보인다","기념일보다 평소의 작은 표현이 중요하다"] },
      { key:"steady",name:"든든한 안정형",tagline:"일관된 행동으로 신뢰를 만드는 사람",summary:"화려한 표현보다 약속과 꾸준한 행동에서 사랑의 진심을 보여줍니다.",color:"#5d8b83",traits:["신뢰","책임","꾸준함"],signals:["약속을 지키는 것이 가장 큰 애정 표현이다","갈등이 생겨도 관계를 쉽게 포기하지 않는다","함께할 현실적인 계획을 세운다"] },
      { key:"spark",name:"설렘 추구형",tagline:"새로운 경험으로 관계를 생기 있게 만드는 사람",summary:"함께 웃고 도전하며 반복되는 일상에도 새로운 설렘을 만들고 싶어 합니다.",color:"#ef8b68",traits:["열정","호기심","즉흥성"],signals:["새로운 데이트 장소를 먼저 찾는다","마음이 생기면 빠르게 표현한다","함께 특별한 추억을 만드는 일이 중요하다"] },
      { key:"space",name:"자유 존중형",tagline:"가까움과 독립을 함께 지키는 사람",summary:"사랑해도 각자의 시간과 취향을 존중할 때 관계가 오래간다고 생각합니다.",color:"#687fc4",traits:["독립","존중","균형"],signals:["연애 중에도 혼자만의 시간이 필요하다","연락 횟수보다 만났을 때의 집중이 중요하다","서로 다른 취미를 존중하는 관계가 좋다"] },
    ],
  },
  {
    slug:"spending-style",title:"소비 성향 테스트",shortTitle:"소비 성향",eyebrow:"SPENDING STYLE",description:"돈을 쓰는 순간의 기준과 만족 방식으로 나의 소비 패턴을 알아봅니다.",category:"성격",icon:"₩",color:"#b58a4f",keywords:["소비 성향 테스트","소비 유형","나의 소비 습관"],
    results:[
      {key:"planner",name:"계획 소비형",tagline:"예산 안에서 만족을 설계하는 현실파",summary:"필요와 가격을 비교하고 계획한 범위 안에서 소비할 때 마음이 편합니다.",color:"#557c88",traits:["계획","비교","절제"],signals:["구매 전에 가격과 후기를 비교한다","월별 소비 예산을 생각하는 편이다","필요한 물건을 목록에 적어둔다"]},
      {key:"value",name:"가치 투자형",tagline:"오래 쓸 좋은 것에 과감한 선택을 하는 사람",summary:"무조건 저렴한 것보다 의미와 품질이 분명한 대상에 돈을 쓰고 싶어 합니다.",color:"#7769ba",traits:["품질","안목","선택 집중"],signals:["오래 쓸 수 있다면 가격이 높아도 괜찮다","취미와 배움에는 아끼지 않는 편이다","브랜드보다 나에게 맞는 가치를 본다"]},
      {key:"experience",name:"경험 수집형",tagline:"물건보다 기억에 남는 순간을 사는 사람",summary:"여행과 공연, 맛있는 음식처럼 이야기가 남는 경험에서 큰 만족을 느낍니다.",color:"#d17f62",traits:["경험","추억","호기심"],signals:["물건보다 여행에 돈을 쓰고 싶다","새로운 맛집과 공연을 즐겨 찾는다","함께한 추억이 남는 소비가 좋다"]},
      {key:"mood",name:"기분 전환형",tagline:"작은 소비로 오늘의 감정을 돌보는 사람",summary:"예쁜 물건이나 소소한 간식처럼 지금 기분을 바꿔주는 소비에 끌립니다.",color:"#cf718e",traits:["감성","즉각 만족","자기보상"],signals:["기분이 가라앉으면 작은 쇼핑이 도움이 된다","예쁘면 용도가 비슷해도 사고 싶다","고생한 날에는 나에게 보상을 준다"]},
    ],
  },
  {
    slug:"lazy-mbti",title:"게으름 MBTI 테스트",shortTitle:"게으름 MBTI",eyebrow:"LAZY MBTI",description:"일을 미루는 이유와 에너지를 회복하는 방식으로 나의 게으름 유형을 확인합니다.",category:"성격",icon:"z",color:"#7868b4",keywords:["게으름 MBTI 테스트","게으름 유형","미루기 테스트"],
    results:[
      {key:"battery",name:"배터리 방전형",tagline:"게으른 것이 아니라 충전이 필요한 사람",summary:"해야 할 마음은 있지만 에너지가 먼저 바닥나 시작이 어려운 편입니다.",color:"#6678b7",traits:["회복 필요","과부하","집중 소모"],signals:["일정을 마치면 아무것도 하기 싫다","쉬어도 머릿속에서는 할 일을 생각한다","체력이 떨어지면 작은 일도 크게 느껴진다"]},
      {key:"perfect",name:"완벽 대기형",tagline:"잘하고 싶어서 시작이 늦어지는 사람",summary:"충분히 준비되지 않았다고 느끼면 첫걸음을 미루고 기준을 계속 높입니다.",color:"#8a6bb6",traits:["높은 기준","준비","신중함"],signals:["제대로 할 시간이 없으면 시작하지 않는다","계획을 세우는 데 시간이 오래 걸린다","결과가 부족할까 걱정되어 미룬다"]},
      {key:"deadline",name:"마감 질주형",tagline:"압박이 생기면 놀라운 속도를 내는 사람",summary:"시간이 넉넉할 때는 느긋하지만 마감이 가까워지면 집중력이 폭발합니다.",color:"#db765f",traits:["순간 집중","속도","압박 동기"],signals:["마감 직전에 가장 집중이 잘된다","시간이 많으면 다른 일부터 하게 된다","급해지면 생각보다 빠르게 끝낸다"]},
      {key:"wander",name:"흥미 유목형",tagline:"재미있는 자극을 따라 움직이는 사람",summary:"반복적인 일보다 새롭고 재미있는 대상에 빠르게 관심이 이동합니다.",color:"#4f9685",traits:["호기심","변화","즉흥성"],signals:["하던 일보다 새 아이디어가 더 끌린다","반복되는 작업은 금방 지루해진다","재미가 생기면 밤새 몰입할 수 있다"]},
    ],
  },
  {
    slug:"dating-style",title:"연애 스타일 테스트",shortTitle:"연애 스타일",eyebrow:"DATING STYLE",description:"연락, 데이트, 갈등 해결 방식에서 나타나는 나의 연애 스타일을 알아봅니다.",category:"연애",icon:"♥",color:"#c86486",keywords:["연애 스타일 테스트","연애 유형 테스트","연애 연락 스타일"],
    results:[
      {key:"contact",name:"연락 밀착형",tagline:"일상을 자주 나눌수록 가까워지는 사람",summary:"짧은 메시지라도 자주 주고받을 때 연결감과 안정감을 느낍니다.",color:"#d87391",traits:["연락","일상 공유","확인"],signals:["하루 중 있었던 일을 자주 나누고 싶다","답장이 늦으면 이유가 궁금하다","아침과 자기 전 연락이 중요하다"]},
      {key:"date",name:"데이트 몰입형",tagline:"만나는 순간에 온전히 집중하는 사람",summary:"연락 횟수보다 직접 만나 좋은 시간을 보내는 것을 중요하게 생각합니다.",color:"#dc8660",traits:["경험","집중","추억"],signals:["연락보다 직접 만나는 것이 좋다","데이트할 때 휴대폰을 거의 보지 않는다","함께 새로운 활동을 하는 것이 즐겁다"]},
      {key:"dialogue",name:"대화 해결형",tagline:"솔직한 대화로 관계를 조율하는 사람",summary:"문제가 생기면 피하기보다 감정과 해결 방법을 말로 확인하려 합니다.",color:"#5b8b82",traits:["대화","조율","솔직함"],signals:["서운한 일은 쌓기 전에 말한다","갈등 후에는 해결 방법을 함께 정한다","상대의 이유를 직접 듣고 싶다"]},
      {key:"independent",name:"독립 동행형",tagline:"각자의 생활을 지키며 함께 성장하는 사람",summary:"연애와 개인 생활이 균형을 이룰 때 서로에게 더 좋은 사람이 된다고 봅니다.",color:"#657cc0",traits:["독립","신뢰","성장"],signals:["매일 만나지 않아도 관계는 안정적일 수 있다","각자의 친구와 취미가 필요하다","서로의 목표를 응원하는 연애가 좋다"]},
    ],
  },
  {
    slug:"mbti-love-compatibility",title:"MBTI 연애 궁합 테스트",shortTitle:"MBTI 연애 궁합",eyebrow:"MBTI LOVE MATCH",description:"관계에서 원하는 소통과 생활 방식을 바탕으로 나와 잘 맞는 MBTI 궁합 스타일을 찾습니다.",category:"연애",icon:"∞",color:"#7865c4",keywords:["MBTI 연애 궁합 테스트","MBTI 궁합","MBTI 커플 궁합"],
    results:[
      {key:"nf",name:"NF 공감 궁합",tagline:"감정과 가능성을 함께 나누는 깊은 연결",summary:"진솔한 대화와 서로의 성장을 응원하는 관계에서 편안함을 느낍니다.",color:"#9b6dcc",traits:["공감","의미","성장"],signals:["감정과 생각을 깊이 나누는 대화가 좋다","서로의 꿈을 응원하는 관계가 중요하다","말 속에 담긴 진심을 중요하게 본다"]},
      {key:"nt",name:"NT 아이디어 궁합",tagline:"지적 자극과 독립성을 나누는 파트너십",summary:"새로운 관점으로 대화하고 각자의 전문성과 자유를 존중하는 관계를 선호합니다.",color:"#596fc0",traits:["논리","아이디어","독립"],signals:["새로운 주제로 토론하는 데이트가 좋다","각자의 시간을 존중해야 오래간다","감정보다 문제의 원인을 함께 찾고 싶다"]},
      {key:"sj",name:"SJ 안정 궁합",tagline:"꾸준한 약속과 생활의 호흡이 맞는 관계",summary:"책임감과 일관된 행동을 통해 신뢰를 쌓는 현실적인 관계가 잘 맞습니다.",color:"#568676",traits:["신뢰","계획","책임"],signals:["약속 시간과 연락 패턴이 일정하면 좋다","함께 현실적인 미래 계획을 세우고 싶다","말보다 꾸준한 행동을 믿는다"]},
      {key:"sp",name:"SP 설렘 궁합",tagline:"지금 이 순간을 함께 즐기는 활기찬 관계",summary:"즉흥적인 경험과 솔직한 행동으로 관계에 생기를 더하는 궁합을 선호합니다.",color:"#dc7b5f",traits:["행동","재미","유연함"],signals:["즉흥 여행이나 새로운 체험이 좋다","복잡한 계획보다 지금의 즐거움이 중요하다","마음이 생기면 행동으로 보여준다"]},
    ],
  },
  {
    slug:"vegetable-village-character",title:"채소마을 캐릭터 테스트",shortTitle:"채소마을 캐릭터",eyebrow:"VEGGIE VILLAGE",description:"일상 속 반응으로 나와 닮은 독창적인 채소마을 캐릭터를 찾아보세요.",category:"성격",icon:"♧",color:"#5c9568",keywords:["채소 캐릭터 테스트","캐릭터 성격 테스트","재미있는 테스트"],
    results:[
      {key:"onion",name:"포근한 양파 몽글이",tagline:"겹겹이 진심을 품은 따뜻한 친구",summary:"처음에는 조용하지만 가까워질수록 다정함과 깊은 이야기가 드러납니다.",color:"#ad78bd",traits:["진심","공감","깊이"],signals:["낯선 곳에서는 먼저 분위기를 살핀다","가까운 사람에게는 속마음을 깊이 나눈다","친구의 고민을 오래 기억한다"]},
      {key:"pepper",name:"용감한 고추 불끈이",tagline:"작지만 선명한 에너지로 앞장서는 친구",summary:"하고 싶은 일이 생기면 빠르게 움직이고 주저하는 사람에게 용기를 줍니다.",color:"#df695c",traits:["용기","직진","활력"],signals:["새로운 일에 먼저 손을 든다","해야 할 말은 분명히 하는 편이다","친구가 망설이면 함께 시작해준다"]},
      {key:"cabbage",name:"든든한 양배추 포개미",tagline:"사람들을 포근하게 감싸는 마을 지킴이",summary:"주변을 세심하게 챙기며 모두가 편안한 분위기를 만드는 데 강합니다.",color:"#62a678",traits:["배려","안정","협력"],signals:["모임에서 빠진 사람이 없는지 살핀다","필요한 것을 미리 준비하는 편이다","갈등이 생기면 중간에서 조율한다"]},
      {key:"carrot",name:"호기심 당근 통통이",tagline:"새로운 길을 발견하면 눈이 반짝이는 탐험가",summary:"재미있는 아이디어를 발견하면 주변 사람과 나누고 직접 경험해보고 싶어 합니다.",color:"#e88952",traits:["호기심","낙천성","탐험"],signals:["처음 보는 장소를 발견하면 들어가 보고 싶다","재미있는 이야기를 친구에게 바로 공유한다","계획에 없던 경험도 즐기는 편이다"]},
    ],
  },
  {
    slug:"friendship-symbol",title:"우리의 우정 징표 테스트",shortTitle:"우정 징표",eyebrow:"FRIENDSHIP SIGN",description:"친구 사이에서 내가 맡는 역할과 우리 우정을 상징하는 징표를 확인합니다.",category:"성격",icon:"☆",color:"#5f8bb2",keywords:["우정 테스트","친구 관계 테스트","우리의 우정 징표 테스트"],
    results:[
      {key:"compass",name:"길잡이 나침반",tagline:"방향을 잃을 때 현실적인 길을 보여주는 친구",summary:"친구가 고민할 때 상황을 정리하고 다음 행동을 함께 찾아줍니다.",color:"#5f7fc0",traits:["조언","현실감","방향"],signals:["친구 고민을 들으면 해결 방법이 떠오른다","약속과 계획을 정리하는 역할을 맡는다","중요한 결정에서 솔직한 의견을 말한다"]},
      {key:"blanket",name:"포근한 담요",tagline:"말없이도 마음을 편안하게 하는 친구",summary:"판단보다 공감을 먼저 건네며 친구가 자기답게 쉴 수 있는 공간을 만듭니다.",color:"#bd7894",traits:["공감","안심","경청"],signals:["친구가 힘들면 해결책보다 이야기를 들어준다","오래 연락하지 않아도 편안하게 기다린다","친구의 작은 감정 변화를 알아차린다"]},
      {key:"firework",name:"반짝이는 불꽃",tagline:"평범한 하루를 추억으로 바꾸는 친구",summary:"새로운 놀이와 약속을 제안하며 친구들의 분위기를 빠르게 밝힙니다.",color:"#df7b5a",traits:["재미","활력","추억"],signals:["친구들과 할 새로운 일을 먼저 제안한다","어색한 분위기에서 농담으로 웃게 한다","기념할 순간을 사진으로 남긴다"]},
      {key:"anchor",name:"든든한 닻",tagline:"시간이 지나도 같은 자리를 지키는 친구",summary:"자주 표현하지 않아도 약속과 행동으로 오래가는 신뢰를 보여줍니다.",color:"#508879",traits:["신뢰","의리","꾸준함"],signals:["친구가 정말 필요할 때 반드시 곁에 간다","비밀과 약속을 중요하게 지킨다","오래된 관계를 꾸준히 이어간다"]},
    ],
  },
  {
    slug:"dont-get-hurt",title:"상처받지 마 테스트",shortTitle:"상처받지 마",eyebrow:"HEART SHIELD",description:"상처를 받는 순간의 반응과 나에게 필요한 마음 보호 방법을 알아봅니다.",category:"마음건강",icon:"◇",color:"#7b75b3",keywords:["상처받지 마 테스트","감정 방어 테스트","마음 보호 테스트"],
    results:[
      {key:"absorb",name:"감정 흡수형",tagline:"상대의 말과 분위기를 깊이 받아들이는 마음",summary:"공감 능력이 높은 만큼 주변의 감정과 평가가 오래 마음에 남을 수 있습니다.",color:"#9a73bd",traits:["공감","민감성","깊은 감정"],signals:["상대의 무심한 말이 오래 기억난다","주변 분위기가 나쁘면 내 기분도 가라앉는다","갈등 후 내 행동을 계속 되짚어본다"]},
      {key:"hide",name:"괜찮은 척형",tagline:"웃으며 넘기지만 혼자 마음을 정리하는 사람",summary:"갈등을 크게 만들지 않으려 감정을 숨기지만 혼자 있는 시간에 서운함이 올라옵니다.",color:"#647fb0",traits:["절제","배려","내면 정리"],signals:["서운해도 그 자리에서는 웃고 넘긴다","힘든 일을 혼자 해결하려 한다","감정을 말하면 상대가 부담스러울까 걱정한다"]},
      {key:"wall",name:"단단한 벽형",tagline:"거리를 두며 마음의 안전을 지키는 사람",summary:"상처 가능성이 느껴지면 빠르게 경계를 세우고 관계의 거리를 조절합니다.",color:"#68737f",traits:["경계","독립","자기보호"],signals:["실망하면 먼저 마음의 거리를 둔다","반복해서 상처 주는 사람은 빠르게 정리한다","약점을 쉽게 보여주지 않는다"]},
      {key:"talk",name:"대화 회복형",tagline:"감정을 확인하고 관계를 다시 연결하는 사람",summary:"상처를 피하기보다 이유를 확인하고 필요한 경계를 말하며 회복하려 합니다.",color:"#548b7b",traits:["표현","회복","경계 조율"],signals:["서운한 이유를 차분히 설명하려 한다","상대의 의도를 직접 확인한다","사과와 변화가 있다면 다시 신뢰할 수 있다"]},
    ],
  },
  {
    slug:"animal-keeper",title:"동물 사육사 테스트",shortTitle:"동물 사육사",eyebrow:"ANIMAL KEEPER",description:"돌봄과 문제 해결 방식으로 나에게 어울리는 동물 사육사 유형을 찾습니다.",category:"성격",icon:"♢",color:"#638b73",keywords:["동물 사육사 테스트","동물 성격 테스트","직업 성향 테스트"],
    results:[
      {key:"panda",name:"판다 휴식 사육사",tagline:"편안한 환경과 안정감을 만드는 돌봄가",summary:"서두르기보다 일정한 리듬과 편안한 공간을 만들어 상대의 긴장을 낮춥니다.",color:"#647b72",traits:["안정","관찰","인내"],signals:["낯선 환경에서는 천천히 적응할 시간을 준다","규칙적인 생활 리듬을 중요하게 본다","조용히 관찰하며 필요한 것을 찾는다"]},
      {key:"dolphin",name:"돌고래 교감 사육사",tagline:"놀이와 소통으로 신뢰를 만드는 교감가",summary:"반응을 주고받는 과정에서 에너지를 얻으며 즐거운 방식으로 관계를 만듭니다.",color:"#4f8fc1",traits:["소통","놀이","친화력"],signals:["함께 놀며 가까워지는 방식이 좋다","반응이 오면 더 적극적으로 표현한다","새로운 훈련을 재미있게 바꾸는 편이다"]},
      {key:"tiger",name:"호랑이 책임 사육사",tagline:"분명한 기준으로 안전을 지키는 리더",summary:"위험을 빠르게 판단하고 원칙과 책임감으로 모두의 안전을 지킵니다.",color:"#c8794f",traits:["책임","결단","안전"],signals:["문제가 생기면 빠르게 상황을 통제한다","안전을 위한 규칙은 반드시 지킨다","필요한 순간에는 단호하게 행동한다"]},
      {key:"owl",name:"부엉이 연구 사육사",tagline:"세밀한 기록으로 최적의 방법을 찾는 전문가",summary:"작은 변화도 기록하고 분석해 가장 건강하고 효율적인 돌봄 방식을 찾습니다.",color:"#756a9a",traits:["분석","기록","전문성"],signals:["작은 변화도 기록해 원인을 찾는다","충분히 공부한 뒤 새로운 방법을 적용한다","감보다 자료를 바탕으로 판단한다"]},
    ],
  },
  {
    slug:"family-letter-personality",title:"가정통신문 성격 테스트",shortTitle:"가정통신문 성격",eyebrow:"SCHOOL LETTER",description:"학창 시절 가정통신문을 대하는 모습으로 알아보는 재미형 성격 테스트입니다.",category:"성격",icon:"□",color:"#7686ad",keywords:["가정통신문 성격 테스트","학창시절 성격 테스트","재미있는 심리테스트"],
    results:[
      {key:"instant",name:"현관문 즉시 제출형",tagline:"받은 일은 바로 끝내는 깔끔한 실행가",summary:"미뤄둘수록 신경 쓰이기 때문에 작은 일은 빠르게 처리하고 마음을 비웁니다.",color:"#54897c",traits:["실행","책임","정리"],signals:["알림장을 받으면 바로 보여드렸다","준비물은 전날 챙겨두는 편이었다","숙제를 끝내야 마음 편히 놀 수 있었다"]},
      {key:"bag",name:"가방 속 숙성형",tagline:"잊은 듯하다가 결정적 순간에 떠올리는 사람",summary:"당장 급하지 않은 일은 뒤로 밀리지만 마감 직전에는 놀라운 집중력을 냅니다.",color:"#ca785c",traits:["마감 집중","느긋함","순간 대응"],signals:["종이가 가방 밑에서 발견되곤 했다","준비물은 당일 아침에 떠올랐다","마감 전날 집중력이 가장 좋았다"]},
      {key:"decorate",name:"밑줄 정리형",tagline:"보기 좋게 정리해야 이해가 되는 계획가",summary:"내용을 분류하고 표시하며 스스로 관리할 수 있는 구조를 만드는 데 익숙합니다.",color:"#6b79bd",traits:["계획","정돈","시각화"],signals:["중요한 날짜에 밑줄을 그었다","준비물을 목록으로 정리했다","일정표를 보기 좋게 꾸미는 편이었다"]},
      {key:"delegate",name:"친구에게 확인형",tagline:"함께 확인하고 움직일 때 힘이 나는 협력가",summary:"혼자 기억하기보다 친구와 정보를 나누고 서로 챙기며 실수를 줄입니다.",color:"#a970b5",traits:["협력","소통","관계"],signals:["친구에게 준비물을 다시 물어봤다","모르는 내용은 주변에 바로 확인했다","친구와 함께 숙제할 때 더 잘됐다"]},
    ],
  },
  {
    slug:"christmas-cookie-personality",title:"크리스마스 쿠키 성격 테스트",shortTitle:"쿠키 성격",eyebrow:"CHRISTMAS COOKIE",description:"연말을 보내는 취향으로 나와 닮은 크리스마스 쿠키 캐릭터를 찾아보세요.",category:"성격",icon:"✦",color:"#b4675b",keywords:["크리스마스 쿠키 성격 테스트","연말 심리테스트","쿠키 캐릭터 테스트"],
    results:[
      {key:"ginger",name:"진저브레드 모험가",tagline:"익숙한 겨울에도 새로운 이야기를 만드는 쿠키",summary:"연말이면 새로운 장소와 활동을 찾아 사람들과 신나는 추억을 만들고 싶어 합니다.",color:"#b9744f",traits:["모험","활력","추억"],signals:["연말에는 새로운 곳으로 떠나고 싶다","사람들과 할 이벤트를 먼저 제안한다","사진과 기록으로 순간을 남긴다"]},
      {key:"snowball",name:"스노볼 포근이",tagline:"조용한 온기로 겨울을 채우는 쿠키",summary:"화려한 행사보다 편안한 공간에서 가까운 사람과 보내는 시간을 좋아합니다.",color:"#8293b5",traits:["온기","평온","친밀감"],signals:["집에서 영화와 따뜻한 음료를 즐기고 싶다","많은 사람보다 가까운 몇 명이 편하다","작은 선물을 정성스럽게 준비한다"]},
      {key:"star",name:"별사탕 반짝이",tagline:"분위기와 장식으로 설렘을 만드는 쿠키",summary:"예쁜 조명과 음악, 선물 포장처럼 연말의 감각적인 분위기를 즐깁니다.",color:"#cf7596",traits:["감성","표현","분위기"],signals:["트리와 조명을 예쁘게 꾸미고 싶다","선물 포장에도 마음을 쓴다","연말 플레이리스트를 따로 만든다"]},
      {key:"choco",name:"초코칩 나눔이",tagline:"맛있는 것과 웃음을 함께 나누는 쿠키",summary:"직접 준비한 음식과 작은 배려로 주변 사람에게 편안한 즐거움을 선물합니다.",color:"#6d7d61",traits:["나눔","배려","유쾌함"],signals:["먹을 것을 넉넉히 준비해 나누는 편이다","혼자보다 함께 먹을 때 더 즐겁다","어색한 분위기를 웃음으로 풀어준다"]},
    ],
  },
  {
    slug:"personality-guide",title:"남녀 성격 풀이법 테스트",shortTitle:"성격 풀이법",eyebrow:"PERSONALITY GUIDE",description:"성별을 단정하지 않고 말과 행동을 해석하는 방식으로 나의 소통 성격을 확인합니다.",category:"성격",icon:"↔",color:"#657fa4",keywords:["남자 성격 풀이법","여자 성격 풀이법","성격 해석 테스트"],
    results:[
      {key:"words",name:"말로 확인형",tagline:"직접 듣고 표현해야 마음이 선명해지는 사람",summary:"말의 내용과 표현을 중요하게 보고 애매함보다 솔직한 확인을 선호합니다.",color:"#7b6eb5",traits:["대화","명확성","표현"],signals:["마음은 말로 표현해야 알 수 있다고 생각한다","애매한 행동보다 직접 묻는 편이다","고마움과 서운함을 말로 전한다"]},
      {key:"action",name:"행동 해석형",tagline:"말보다 반복되는 행동에서 진심을 읽는 사람",summary:"작은 약속과 꾸준한 행동을 관찰하며 상대의 진짜 마음을 판단합니다.",color:"#56877b",traits:["관찰","신뢰","행동"],signals:["말보다 약속을 지키는지를 본다","사소하게 챙겨주는 행동이 오래 기억난다","반복되는 태도가 진심을 보여준다고 생각한다"]},
      {key:"context",name:"맥락 공감형",tagline:"상황과 감정의 배경까지 함께 읽는 사람",summary:"표면적인 말보다 그날의 상황과 감정이 행동에 미친 영향을 함께 고려합니다.",color:"#c2708e",traits:["공감","맥락","배려"],signals:["차가운 말에도 힘든 사정이 있었을지 생각한다","표정과 분위기를 함께 살핀다","상대의 입장에서 이유를 상상해본다"]},
      {key:"space",name:"시간 존중형",tagline:"답을 재촉하지 않고 정리할 시간을 주는 사람",summary:"감정이 큰 순간에는 바로 결론 내리기보다 각자가 생각할 시간을 갖는 편이 낫다고 봅니다.",color:"#5e7fb2",traits:["거리","신중함","존중"],signals:["감정이 클 때는 잠시 시간을 두는 것이 좋다","답장이 늦어도 바로 의미를 단정하지 않는다","혼자 생각한 뒤 대화하는 편이다"]},
    ],
  },
  {
    slug:"couple-character",title:"커플 캐릭터 테스트",shortTitle:"커플 캐릭터",eyebrow:"COUPLE CHARACTER",description:"연애할 때 나타나는 행동으로 나의 커플 캐릭터와 관계 속 역할을 확인합니다.",category:"연애",icon:"♧",color:"#cf6f8b",keywords:["커플 캐릭터 테스트","연애 캐릭터 테스트","커플 성격 테스트"],
    results:[
      {key:"puppy",name:"애교 강아지형",tagline:"표현할수록 사랑이 커지는 다정한 캐릭터",summary:"좋아하는 마음을 숨기지 않고 연락과 애정 표현으로 관계에 온기를 더합니다.",color:"#d87895",traits:["애교","표현","친밀감"],signals:["좋아하면 자주 보고 싶다고 말한다","귀여운 별명과 표현을 즐긴다","상대의 반응에 기분이 쉽게 좋아진다"]},
      {key:"cat",name:"도도 고양이형",tagline:"자유롭지만 마음을 열면 깊은 캐릭터",summary:"각자의 시간을 중요하게 여기지만 신뢰하는 사람에게는 조용하고 깊은 애정을 보입니다.",color:"#766da6",traits:["독립","선택적 표현","깊이"],signals:["연애 중에도 혼자 있는 시간이 필요하다","애정 표현은 많지 않아도 진심은 깊다","부담 없는 편안한 관계가 좋다"]},
      {key:"bear",name:"든든 곰형",tagline:"말보다 행동으로 곁을 지키는 캐릭터",summary:"필요한 순간에 실제로 도와주고 약속을 지키며 안정적인 관계를 만듭니다.",color:"#638273",traits:["책임","안정","보호"],signals:["상대가 힘들면 실제로 도울 일을 찾는다","한 번 한 약속은 지키려고 한다","미래 계획을 함께 세우는 편이다"]},
      {key:"fox",name:"센스 여우형",tagline:"상대의 취향을 읽고 설렘을 만드는 캐릭터",summary:"분위기와 타이밍을 빠르게 파악해 관계에 재미와 새로운 자극을 더합니다.",color:"#dd7c59",traits:["센스","설렘","관찰"],signals:["상대가 좋아할 데이트를 빠르게 찾는다","분위기에 맞는 표현을 잘 고른다","관계를 재미있게 만드는 이벤트를 즐긴다"]},
    ],
  },
  {
    slug:"f-flirting-simulation",title:"F썸녀·F썸남 꼬시기 시뮬레이션",shortTitle:"F썸 시뮬레이션",eyebrow:"F FLIRTING SIMULATION",description:"공감형 썸 상대와의 상황 선택을 통해 나의 호감 표현 방식을 확인합니다.",category:"연애",icon:"F",color:"#bd6f9c",keywords:["F썸녀 꼬시기","F썸남 꼬시기","썸 시뮬레이션","연애 시뮬레이션"],
    results:[
      {key:"empathy",name:"공감 만렙형",tagline:"마음을 먼저 알아주는 대화의 고수",summary:"해결책보다 감정을 확인하고 상대가 충분히 이야기할 수 있도록 기다립니다.",color:"#c8719a",traits:["공감","경청","감정 확인"],signals:["힘들다는 말에 먼저 어떤 마음인지 묻는다","조언 전에 충분히 이야기를 듣는다","작은 감정 변화도 알아차린다"]},
      {key:"direct",name:"진심 직진형",tagline:"애매함보다 솔직함으로 다가가는 사람",summary:"마음을 숨기기보다 부담 없는 말과 행동으로 호감을 분명하게 보여줍니다.",color:"#da725e",traits:["솔직함","용기","행동"],signals:["좋아하면 둘이 만나자고 먼저 제안한다","고마움과 호감을 직접 표현한다","애매한 밀당보다 진심을 선택한다"]},
      {key:"detail",name:"취향 기억형",tagline:"사소한 말을 기억해 설렘을 만드는 사람",summary:"상대가 무심코 말한 취향과 일정을 기억하고 자연스러운 배려로 연결합니다.",color:"#7f6eba",traits:["관찰","기억","센스"],signals:["상대가 좋아하는 메뉴를 기억한다","중요한 일정이 끝난 날 먼저 연락한다","대화 중 나온 작은 취향을 챙긴다"]},
      {key:"steady",name:"안정 신뢰형",tagline:"꾸준한 연락과 약속으로 마음을 여는 사람",summary:"과한 이벤트보다 일관된 태도와 편안한 관심으로 서서히 신뢰를 쌓습니다.",color:"#56877e",traits:["꾸준함","신뢰","편안함"],signals:["갑자기 뜨거워지기보다 꾸준히 연락한다","약속 시간을 잘 지킨다","상대가 부담스럽지 않은 속도를 맞춘다"]},
    ],
  },
  {
    slug:"healing-sprite",title:"힐링 요정 성격 테스트",shortTitle:"힐링 요정",eyebrow:"HEALING SPRITE",description:"지친 일상을 회복하는 방식으로 나와 닮은 독창적인 힐링 요정 캐릭터를 찾습니다.",category:"마음건강",icon:"✧",color:"#689b83",keywords:["힐링 캐릭터 테스트","힐링 요정 테스트","마음 회복 테스트"],
    results:[
      {key:"leaf",name:"초록잎 숨숨이",tagline:"조용한 자연 속에서 에너지를 채우는 요정",summary:"사람과 정보에서 잠시 떨어져 산책과 고요한 시간으로 마음을 회복합니다.",color:"#5c9b74",traits:["자연","고요","호흡"],signals:["지치면 조용한 곳을 걷고 싶다","식물이나 자연을 보면 마음이 편해진다","혼자 생각을 정리할 시간이 필요하다"]},
      {key:"drop",name:"물방울 토닥이",tagline:"감정을 흘려보내며 마음을 씻는 요정",summary:"참기보다 울거나 이야기하며 감정을 충분히 표현할 때 다시 가벼워집니다.",color:"#568fc0",traits:["감정 표현","공감","정화"],signals:["힘들 때 믿는 사람과 이야기하고 싶다","울고 나면 마음이 한결 가벼워진다","감정을 말로 정리하면 회복된다"]},
      {key:"spark",name:"불씨 반짝이",tagline:"작은 재미로 다시 움직이는 에너지 요정",summary:"맛있는 음식과 음악, 새로운 활동처럼 즉각적인 즐거움에서 회복의 불씨를 찾습니다.",color:"#dc7d5d",traits:["재미","활력","전환"],signals:["기분이 가라앉으면 좋아하는 음악을 듣는다","새로운 장소에 가면 에너지가 생긴다","작은 보상을 계획하면 다시 움직일 수 있다"]},
      {key:"moon",name:"달빛 포근이",tagline:"충분한 쉼과 수면으로 균형을 되찾는 요정",summary:"무언가 더 하기보다 일정과 자극을 줄이고 푹 쉬는 것이 가장 확실한 회복법입니다.",color:"#7773b6",traits:["휴식","수면","보호"],signals:["지치면 약속을 줄이고 푹 쉬고 싶다","충분히 자야 생각이 정리된다","편안한 공간에 있을 때 긴장이 풀린다"]},
    ],
  },
  {
    slug:"self-reflection",title:"자아 성찰 성격 테스트",shortTitle:"자아 성찰",eyebrow:"SELF REFLECTION",description:"생각과 감정을 돌아보는 방식으로 나의 자아 성찰 유형을 확인합니다.",category:"마음건강",icon:"○",color:"#6e75aa",keywords:["자아 성찰 성격 테스트","자기 성찰 테스트","나를 알아보는 테스트"],
    results:[
      {key:"journal",name:"기록 탐색형",tagline:"쓰면서 마음의 패턴을 발견하는 사람",summary:"생각을 글로 옮길 때 감정과 사건의 연결이 보이고 다음 선택이 분명해집니다.",color:"#6d75ae",traits:["기록","분석","패턴"],signals:["복잡한 생각은 글로 적으면 정리된다","지난 기록을 보며 달라진 점을 찾는다","감정이 생긴 이유를 문장으로 설명해본다"]},
      {key:"dialogue",name:"대화 발견형",tagline:"사람과 이야기하며 진짜 마음을 찾는 사람",summary:"신뢰하는 사람과 생각을 나누는 과정에서 몰랐던 감정과 욕구를 발견합니다.",color:"#b87298",traits:["대화","공감","관계"],signals:["이야기하다 보면 내 진짜 마음을 알게 된다","믿는 사람의 질문이 생각을 넓혀준다","감정을 혼자 묻어두기보다 나누고 싶다"]},
      {key:"action",name:"경험 학습형",tagline:"직접 부딪치고 돌아보며 성장하는 사람",summary:"오래 고민하기보다 일단 경험하고 결과에서 배운 점을 빠르게 찾아냅니다.",color:"#d1785e",traits:["행동","도전","학습"],signals:["고민만 하기보다 한번 해보는 편이다","실수에서 다음 방법을 빠르게 찾는다","새로운 환경에서 나를 더 잘 알게 된다"]},
      {key:"quiet",name:"고요 관찰형",tagline:"잠시 멈춰 내면의 목소리를 듣는 사람",summary:"혼자 조용히 시간을 보내며 감정이 가라앉은 뒤 본질적인 욕구를 살펴봅니다.",color:"#558679",traits:["고요","관찰","통찰"],signals:["결정 전에 혼자 생각할 시간이 필요하다","감정이 잦아든 뒤 상황을 다시 본다","산책이나 명상 중에 답이 떠오른다"]},
    ],
  },
  {
    slug:"first-impression",title:"첫인상 테스트",shortTitle:"첫인상",eyebrow:"FIRST IMPRESSION",description:"처음 만난 자리에서 드러나는 말투와 행동으로 사람들이 느끼는 나의 첫인상을 확인합니다.",category:"성격",icon:"◎",color:"#6b83b2",keywords:["첫인상 테스트","나의 첫인상","첫인상 성격 테스트"],
    results:[
      {key:"sun",name:"햇살 친근형",tagline:"먼저 웃으며 어색함을 녹이는 첫인상",summary:"밝은 표정과 편안한 반응으로 처음 만난 사람도 쉽게 말을 걸게 만듭니다.",color:"#db8c55",traits:["친근함","활기","개방성"],signals:["처음 만난 사람에게 먼저 인사한다","어색하면 가벼운 질문으로 대화를 연다","표정에 감정이 잘 드러나는 편이다"]},
      {key:"calm",name:"차분 신뢰형",tagline:"조용하지만 안정감을 주는 첫인상",summary:"말을 서두르지 않고 상대의 이야기를 집중해서 들으며 믿음직한 인상을 줍니다.",color:"#56837c",traits:["차분함","경청","신뢰"],signals:["처음에는 상대의 이야기를 많이 듣는다","말을 하기 전에 한 번 생각한다","약속과 예의를 중요하게 지킨다"]},
      {key:"sharp",name:"선명한 카리스마형",tagline:"분명한 태도로 존재감을 남기는 첫인상",summary:"의견과 행동이 명확해 자신감 있고 주도적인 사람으로 기억되기 쉽습니다.",color:"#6374ad",traits:["자신감","명확함","주도성"],signals:["모임에서 필요한 일을 먼저 정한다","내 의견을 분명하게 말하는 편이다","낯선 상황에서도 자세가 크게 달라지지 않는다"]},
      {key:"mystery",name:"은은한 신비형",tagline:"알아갈수록 새로운 면이 보이는 첫인상",summary:"처음에는 조용하고 신중하지만 가까워지면 독특한 취향과 깊은 이야기가 드러납니다.",color:"#9a6fb2",traits:["신중함","깊이","독창성"],signals:["낯선 자리에서는 먼저 관찰한다","개인적인 이야기는 천천히 꺼낸다","가까운 사람은 첫인상과 다르다고 말한다"]},
    ],
  },
  {
    slug:"future-person",title:"미래인 테스트",shortTitle:"미래인",eyebrow:"FUTURE PERSON",description:"변화와 기술, 새로운 가능성을 대하는 태도로 나의 미래인 유형을 알아봅니다.",category:"성격",icon:"△",color:"#587fa5",keywords:["미래인 테스트","미래 성향 테스트","미래의 나 테스트"],
    results:[
      {key:"inventor",name:"내일의 발명가",tagline:"없는 것을 상상해 현실로 만드는 미래인",summary:"새로운 기술과 아이디어를 발견하면 직접 조합하고 실험해보고 싶어 합니다.",color:"#6172bd",traits:["창의","실험","기술"],signals:["새로운 도구를 보면 직접 써보고 싶다","불편한 점을 보면 개선 아이디어가 떠오른다","아직 없는 서비스에 관심이 많다"]},
      {key:"navigator",name:"변화의 항해사",tagline:"빠른 변화 속에서 길을 찾는 미래인",summary:"상황을 빠르게 읽고 필요한 기술과 관계를 연결해 현실적인 다음 단계를 만듭니다.",color:"#4f8b82",traits:["적응","판단","연결"],signals:["환경이 바뀌면 새로운 규칙을 빨리 익힌다","정보를 비교해 현실적인 선택을 한다","사람과 자원을 연결하는 데 강하다"]},
      {key:"guardian",name:"가치의 수호자",tagline:"기술보다 사람을 먼저 생각하는 미래인",summary:"새로운 변화가 편리함뿐 아니라 사람과 환경에 미칠 영향까지 함께 살펴봅니다.",color:"#a16fa8",traits:["가치","윤리","공감"],signals:["새 기술이 사람에게 미칠 영향을 생각한다","편리함과 개인정보 보호를 함께 본다","모두가 변화의 혜택을 받아야 한다고 생각한다"]},
      {key:"pioneer",name:"우주 개척자",tagline:"불확실해도 먼저 도전하는 미래인",summary:"실패 가능성보다 새로운 세계를 경험할 기회에 더 큰 에너지를 느낍니다.",color:"#d1745d",traits:["도전","용기","개척"],signals:["아무도 해보지 않은 일에 끌린다","성공이 확실하지 않아도 시도할 수 있다","먼 미래의 삶을 상상하는 일이 즐겁다"]},
    ],
  },
  {
    slug:"love-ability",title:"연애 능력 테스트",shortTitle:"연애 능력",eyebrow:"LOVE ABILITY",description:"공감, 표현, 갈등 해결, 관계 유지에서 현재 나의 연애 강점을 확인합니다.",category:"연애",icon:"+",color:"#cb6d89",keywords:["연애 능력 테스트","연애 잘하는 법","연애 심리테스트"],
    results:[
      {key:"empathy",name:"마음 읽기 능력자",tagline:"감정을 알아차리고 안전하게 받아주는 사람",summary:"상대의 작은 변화도 세심하게 보고 감정을 충분히 이해하려 노력합니다.",color:"#c87094",traits:["공감","경청","감정 이해"],signals:["상대의 표정과 말투 변화를 빠르게 알아차린다","고민을 들을 때 먼저 공감한다","상대가 말할 때 결론을 재촉하지 않는다"]},
      {key:"expression",name:"설렘 표현 능력자",tagline:"마음을 숨기지 않고 관계에 온기를 주는 사람",summary:"애정과 고마움을 구체적인 말과 행동으로 전달해 관계의 확신을 높입니다.",color:"#dc765e",traits:["표현","애정","분명함"],signals:["좋아한다는 마음을 자주 표현한다","고마운 점을 구체적으로 말한다","마음이 생기면 먼저 데이트를 제안한다"]},
      {key:"repair",name:"갈등 회복 능력자",tagline:"다름을 대화로 조율하고 다시 연결하는 사람",summary:"문제를 피하거나 이기려 하기보다 서로 납득할 수 있는 방법을 찾습니다.",color:"#56877e",traits:["조율","사과","회복"],signals:["다툰 뒤 해결을 위한 대화를 제안한다","내 잘못이 보이면 먼저 사과할 수 있다","감정과 해결책을 구분해서 이야기한다"]},
      {key:"balance",name:"관계 균형 능력자",tagline:"사랑과 나의 생활을 건강하게 함께 지키는 사람",summary:"가까운 관계에서도 각자의 목표와 경계를 존중해 오래갈 수 있는 리듬을 만듭니다.",color:"#6678b5",traits:["경계","독립","신뢰"],signals:["연애 중에도 나의 생활을 유지한다","불편한 부탁은 부드럽게 거절할 수 있다","상대의 혼자 있는 시간을 존중한다"]},
    ],
  },
];

export const newGenericTests: Record<string, GenericTest> = Object.fromEntries(
  seeds.map((seed) => [seed.slug, makeTest(seed)]),
);

export const newTestCatalog: TestCatalogItem[] = seeds.map((seed) => ({
  slug: seed.slug,
  title: seed.title,
  shortTitle: seed.shortTitle,
  description: seed.description,
  category: seed.category,
  questionCount: 12,
  duration: "약 2분",
  icon: seed.icon,
  color: seed.color,
  href: `/tests/${seed.slug}/`,
  status: "published",
  keywords: seed.keywords,
}));

export const newTestSlugs = seeds.map((seed) => seed.slug);
