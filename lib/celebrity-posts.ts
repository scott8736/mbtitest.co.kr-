import type { BlogPost } from "./blog-posts";

const publishedAt = "2026-08-31";
const septReputationAt = "2026-09-14";
const rankingSource = "https://www.mt.co.kr/entertainment/2026/08/25/2026082511217253408";
const fundexSource = "https://www.fundex.co.kr/fxmain.do?fm=nate&tab=performd";

const cta = {
  eyebrow: "40문항 · 약 4분",
  title: "나도 같은 MBTI일까요?",
  description: "연예인의 공개 결과는 참고로 보고, 내 성향은 직접 검사해 확인해 보세요.",
  href: "/",
  label: "무료 MBTI 검사 시작하기",
};

export const celebrityPosts: BlogPost[] = [
  {
    slug: "park-eun-bin-mbti",
    category: "트렌드",
    title: "박은빈 MBTI는? INFP·ISTP 결과 변화와 화제성 1위",
    description: "박은빈 MBTI 공개 발언과 검사 결과가 달라진 이유, 오싹한 연애 종영 주 FUNdex 화제성 1위를 사실과 추측으로 나눠 정리했습니다.",
    keywords: ["박은빈 MBTI", "박은빈 성격", "박은빈 INFP", "박은빈 ISTP", "오싹한 연애 박은빈"],
    readTime: "약 6분",
    publishedAt,
    updatedAt: publishedAt,
    intro: [
      "2026년 8월 25일 발표된 FUNdex 8월 3주차(8월 17~23일) TV·OTT 통합 드라마 출연자 화제성에서 박은빈이 1위를 차지했습니다. tvN ‘오싹한 연애’가 종영 주에 작품과 출연자 부문 정상에 오르며 인물명·작품명 검색 관심도 함께 커진 시점입니다.",
      "박은빈의 MBTI는 한 유형으로 영구 고정해 말하기 어렵습니다. 공개 인터뷰에서 INFP를 포함해 검사할 때 결과가 달라진다고 설명한 내용이 확인되므로, 이 글은 ‘현재도 반드시 INFP’라고 단정하지 않습니다.",
    ],
    sections: [
      { heading: "이번 주 화제성 1위인 이유", paragraphs: ["‘오싹한 연애’ 최종회는 8월 23일 방송됐고 자체 최고 시청률로 종영했습니다. FUNdex 집계에서도 박은빈이 전주 3위에서 1위로 올라, 종영 직후 작품·배우 관련 탐색 수요가 가장 크게 모인 인물로 판단했습니다."] },
      { heading: "확인된 MBTI 사실", paragraphs: ["박은빈은 공개 콘텐츠에서 검사 시점에 따라 INFP와 ISTP 등 다른 결과가 나왔다고 설명했습니다. 따라서 ‘박은빈 MBTI는 INFP다’보다 ‘INFP를 포함해 결과가 달라진 적이 있다’가 출처에 가까운 표현입니다."] },
      { heading: "온라인 추측과 실제 성격은 구분해야 합니다", paragraphs: ["배역의 섬세함이나 인터뷰 말투만 보고 특정 유형으로 추정하는 글이 많지만, 캐릭터는 대본과 연기의 결과입니다. 작품 속 천여리의 행동을 배우 본인의 성격 증거로 사용하지 않았습니다."] },
      { heading: "검사 결과가 달라질 수 있는 이유", paragraphs: ["E·I, S·N처럼 점수가 경계에 가깝거나 답변할 때 떠올린 역할과 최근 환경이 달라지면 한두 글자가 바뀔 수 있습니다. 네 글자보다 반복해서 나타나는 성향과 각 지표의 비율을 함께 보는 편이 좋습니다."] },
    ],
    cta,
    relatedSlugs: ["yang-se-jong-mbti", "gong-hyo-jin-mbti", "mbti-result-changes"],
    sources: [
      { label: "FUNdex 2026년 8월 3주차 출연자 화제성 보도", href: rankingSource },
      { label: "에스콰이어 코리아 박은빈 인터뷰·MBTI 정리", href: "https://www.esquirekorea.co.kr/article/81762" },
      { label: "FUNdex 공식 순위·조사 기준", href: fundexSource },
    ],
  },
  {
    slug: "yang-se-jong-mbti",
    category: "트렌드",
    title: "양세종 MBTI는? ISTP·ESTP 직접 답변과 화제성 2위",
    description: "양세종이 직접 밝힌 ISTP·ESTP 검사 결과와 오싹한 연애 FUNdex 화제성 2위 배경을 원출처 중심으로 정리했습니다.",
    keywords: ["양세종 MBTI", "양세종 ISTP", "양세종 ESTP", "양세종 성격", "오싹한 연애 양세종"],
    readTime: "약 6분",
    publishedAt,
    updatedAt: publishedAt,
    intro: [
      "양세종은 2026년 8월 3주차 FUNdex TV·OTT 통합 드라마 출연자 화제성 2위에 올랐습니다. ‘오싹한 연애’ 종영과 함께 전주 4위에서 두 계단 상승했습니다.",
      "MBTI는 본인이 마리끌레르 인터뷰에서 세 번 검사해 ISTP가 두 번, ESTP가 한 번 나왔다고 직접 답했습니다. 한 유형만 골라 확정하기보다 반복 결과와 변화 가능성을 함께 보는 것이 정확합니다.",
    ],
    sections: [
      { heading: "화제성 2위와 검색 관심", paragraphs: ["박은빈과 함께 종영 주 상위권을 차지하면서 ‘양세종 MBTI’, ‘양세종 성격’, ‘오싹한 연애 양세종’처럼 인물과 작품을 함께 찾는 검색 수요가 이어질 조건이 만들어졌습니다."] },
      { heading: "본인이 밝힌 ISTP·ESTP", paragraphs: ["마리끌레르 인터뷰에서 양세종은 세 번의 검사 중 ISTP가 두 번, ESTP가 한 번 나왔다고 말했습니다. 두 결과의 공통점은 S·T·P이며 E와 I가 검사 시점에 따라 달라졌다는 점입니다."] },
      { heading: "공통 성향을 어떻게 볼까", paragraphs: ["ISTP와 ESTP의 일반 설명에서는 현실적인 관찰, 문제 해결, 상황 대응을 공통적으로 이야기합니다. 다만 이런 특징이 양세종의 모든 행동을 설명하거나 배우의 실제 성격을 완전히 규정한다는 뜻은 아닙니다."] },
      { heading: "배역과 배우를 분리해서 보기", paragraphs: ["‘오싹한 연애’의 마강욱과 양세종 본인의 성격은 동일하지 않습니다. 작품 속 행동은 흥미로운 비교 소재일 뿐 MBTI 판정 근거로 사용해서는 안 됩니다."] },
    ],
    cta,
    relatedSlugs: ["park-eun-bin-mbti", "lee-dong-wook-mbti", "mbti-result-changes"],
    sources: [
      { label: "FUNdex 2026년 8월 3주차 출연자 화제성 보도", href: rankingSource },
      { label: "마리끌레르 코리아 양세종 인터뷰", href: "https://www.marieclairekorea.com/celebrity/2022/09/yangsejong/" },
      { label: "FUNdex 공식 순위·조사 기준", href: fundexSource },
    ],
  },
  {
    slug: "gong-hyo-jin-mbti",
    category: "트렌드",
    title: "공효진 MBTI는? 공개 인터뷰 확인과 화제성 3위",
    description: "공효진 MBTI 관련 공개 인터뷰에서 확인되는 범위와 온라인 ESTP 표기를 구분하고, 유부녀 킬러 화제성 3위 배경을 정리했습니다.",
    keywords: ["공효진 MBTI", "공효진 ESTP", "공효진 성격", "유부녀 킬러 공효진"],
    readTime: "약 6분",
    publishedAt,
    updatedAt: publishedAt,
    intro: [
      "공효진은 MBC ‘유부녀 킬러’로 2026년 8월 3주차 FUNdex TV·OTT 통합 드라마 출연자 화제성 3위를 기록했습니다. 전주 5위에서 두 계단 상승했습니다.",
      "온라인 프로필에는 ESTP가 널리 적혀 있지만, 확인 가능한 하퍼스 바자 인터뷰 본문에서는 MBTI를 공개했다는 맥락과 성향 이야기는 확인돼도 네 글자 전체가 선명하게 남아 있지 않습니다. 이 글은 ESTP를 최신 공식 결과라고 과장하지 않습니다.",
    ],
    sections: [
      { heading: "화제성 3위로 오른 배경", paragraphs: ["‘유부녀 킬러’가 TV·OTT 통합 드라마 화제성 2위에 오르면서 주연 공효진도 출연자 부문 3위로 상승했습니다. 방송 이슈와 작품 관심이 인물 검색으로 이어지는 구간입니다."] },
      { heading: "MBTI에서 확인된 것과 남은 것", paragraphs: ["하퍼스 바자 공개 인터뷰는 공효진이 MBTI와 자신의 성향을 이야기한 원출처로 활용할 수 있습니다. 다만 접근 가능한 기사 본문만으로 네 글자 유형을 최신 공식 결과로 확정하기에는 정보가 부족합니다."] },
      { heading: "ESTP 표기는 어떻게 읽어야 할까", paragraphs: ["여러 온라인 문서가 ESTP라고 소개하지만 재인용이 반복되면 최초 발언과 현재 결과가 흐려질 수 있습니다. 따라서 ‘온라인에서 ESTP로 알려짐’과 ‘현재 본인이 공식 확정함’은 별개로 표시해야 합니다."] },
      { heading: "연기 이미지로 성격을 단정하지 않기", paragraphs: ["대담하고 생활력 강한 배역이 많다는 이유만으로 실제 성격을 ESTP라고 판정할 수는 없습니다. 배우의 인터뷰와 검사 결과, 작품 속 캐릭터를 분리해 읽는 것이 안전합니다."] },
    ],
    cta,
    relatedSlugs: ["park-eun-bin-mbti", "ryu-jun-yeol-mbti", "mbti-test-guide"],
    sources: [
      { label: "FUNdex 2026년 8월 3주차 출연자 화제성 보도", href: rankingSource },
      { label: "하퍼스 바자 코리아 공효진 인터뷰", href: "https://www.harpersbazaar.co.kr/article/66915" },
      { label: "FUNdex 공식 순위·조사 기준", href: fundexSource },
    ],
  },
  {
    slug: "lee-dong-wook-mbti",
    category: "트렌드",
    title: "이동욱 MBTI는? 검사 안 했다는 직접 답변과 화제성 4위",
    description: "이동욱이 MBTI 검사를 하지 않았다고 밝힌 인터뷰를 기준으로 온라인 추측과 사실을 구분하고, 킬러들의 쇼핑몰2 화제성 4위를 정리했습니다.",
    keywords: ["이동욱 MBTI", "이동욱 성격", "이동욱 MBTI 없음", "킬러들의 쇼핑몰2 이동욱"],
    readTime: "약 6분",
    publishedAt,
    updatedAt: publishedAt,
    intro: [
      "이동욱은 디즈니+ ‘킬러들의 쇼핑몰 시즌2’로 2026년 8월 3주차 FUNdex TV·OTT 통합 드라마 출연자 화제성 4위를 기록했습니다. 전주 2위에서 내려왔지만 작품은 3주 연속 상위권 흐름을 이어갔습니다.",
      "이동욱의 MBTI는 특정 네 글자로 확정할 수 없습니다. 공개 인터뷰에서 본인이 검사를 하지 않았고 MBTI를 믿지 않는다는 취지로 답한 자료가 확인되기 때문입니다.",
    ],
    sections: [
      { heading: "이번 주 화제성 4위", paragraphs: ["‘킬러들의 쇼핑몰 시즌2’가 TV·OTT 통합 드라마 화제성 3위를 기록한 가운데 이동욱이 출연자 4위에 올랐습니다. 전주보다 순위는 낮아졌지만 여전히 상위 5명에 남아 글을 유지·갱신했습니다."] },
      { heading: "공식적으로 확정된 유형은 없음", paragraphs: ["인터뷰에서 이동욱은 MBTI 검사를 하지 않았다고 밝혔습니다. 그래서 온라인에 떠도는 ISFP, INFJ 등 여러 표기를 본인의 공식 결과처럼 제시하지 않습니다."] },
      { heading: "인터뷰 태도는 검사 결과가 아닙니다", paragraphs: ["솔직한 화법, 진행 능력, 혼자 보내는 시간을 언급한 장면만으로 E·I나 T·F를 판정할 수 없습니다. 관찰자가 느낀 인상은 흥미로운 해석일 뿐 검사 결과와는 다릅니다."] },
      { heading: "MBTI를 원하지 않는 선택도 존중해야 합니다", paragraphs: ["모든 연예인이 성격유형을 공개할 의무는 없습니다. 확인되지 않은 유형을 채우기보다 ‘공식 확정 없음’이라고 남기는 편이 독자와 인물 모두에게 더 정확한 정보입니다."] },
    ],
    cta,
    relatedSlugs: ["ryu-jun-yeol-mbti", "yang-se-jong-mbti", "mbti-test-guide"],
    sources: [
      { label: "FUNdex 2026년 8월 3주차 출연자 화제성 보도", href: rankingSource },
      { label: "이동욱 MBTI 직접 답변 인터뷰", href: "https://www.srtimes.kr/news/articleView.html?idxno=147146" },
      { label: "FUNdex 공식 순위·조사 기준", href: fundexSource },
    ],
  },
  {
    slug: "ryu-jun-yeol-mbti",
    category: "트렌드",
    title: "류준열 MBTI는 ESTJ? 직접 답변과 들쥐 화제성 5위",
    description: "류준열이 인터뷰에서 직접 밝힌 ESTJ와 T 성향 발언, 넷플릭스 들쥐 공개 직전 FUNdex 화제성 5위 배경을 확인했습니다.",
    keywords: ["류준열 MBTI", "류준열 ESTJ", "류준열 성격", "들쥐 류준열", "류준열 T"],
    readTime: "약 6분",
    publishedAt,
    updatedAt: publishedAt,
    intro: [
      "류준열은 넷플릭스 ‘들쥐’로 2026년 8월 3주차 FUNdex TV·OTT 통합 드라마 출연자 화제성 5위에 새로 진입했습니다. 작품 공개일인 8월 28일 직전 집계에서 상위권에 올라, 이후 인물명·작품명 검색 관심이 더 이어질 가능성이 큰 신규 교체 인물입니다.",
      "류준열은 2022년 영화 ‘올빼미’ 인터뷰에서 자신의 MBTI가 ESTJ라고 직접 밝혔고, 2023년 GQ 코리아 영상에서도 자신을 MBTI의 T 성향으로 언급했습니다. 다만 과거 검사 결과이므로 현재도 동일하다고 단정하지는 않습니다.",
    ],
    sections: [
      { heading: "정윤하 대신 새로 선정한 이유", paragraphs: ["지난주 1위였던 정윤하는 이번 발표의 상위 5명에서 빠졌고, 류준열이 ‘들쥐’로 5위에 진입했습니다. 넷플릭스 공식 페이지에서도 ‘들쥐’가 8월 28일 공개된 2026년 리미티드 시리즈이며 류준열이 주연임을 확인할 수 있습니다."] },
      { heading: "직접 밝힌 ESTJ", paragraphs: ["‘올빼미’ 인터뷰에서 류준열은 자신의 MBTI가 ESTJ라고 말하며 친구의 고민을 들을 때 공감보다 해결책을 제시하는 편이라고 설명했습니다. 이는 단순 팬 추측이 아니라 본인의 직접 답변을 인용한 보도입니다."] },
      { heading: "GQ 영상에서 다시 확인되는 T 발언", paragraphs: ["GQ 코리아의 2023년 공식 영상 제목과 상담 내용에서도 류준열이 자신의 T 성향을 직접 이야기합니다. 네 글자 전체의 최신 재검사 결과는 아니지만, 적어도 T에 관한 자기 설명은 별도 원출처로 교차 확인됩니다."] },
      { heading: "ESTJ 특징과 배우 본인을 동일시하지 않기", paragraphs: ["ESTJ는 일반적으로 구조와 실행, 현실적인 해결을 선호하는 유형으로 설명됩니다. 그러나 유형 설명을 류준열의 사생활이나 모든 선택에 적용하면 과도한 추측이 됩니다. ‘들쥐’의 문재 역시 배우가 연기한 인물일 뿐 실제 성격의 증거가 아닙니다."] },
    ],
    cta,
    relatedSlugs: ["lee-dong-wook-mbti", "gong-hyo-jin-mbti", "mbti-t-vs-f"],
    sources: [
      { label: "FUNdex 2026년 8월 3주차 출연자 화제성 보도", href: rankingSource },
      { label: "류준열 ESTJ 직접 답변 인터뷰 보도", href: "https://www.topstarnews.net/news/articleView.html?idxno=14779993" },
      { label: "GQ KOREA 류준열 MBTI T 공식 영상", href: "https://www.youtube.com/playlist?list=PLyuqI_Wl_ppNs-BKAx4nmrMbvWr0LOG0P" },
      { label: "넷플릭스 들쥐 공식 작품 페이지", href: "https://www.netflix.com/kr/title/81991749" },
      { label: "FUNdex 공식 순위·조사 기준", href: fundexSource },
    ],
  },
  {
    slug: "yoo-jae-suk-mbti",
    category: "트렌드",
    title: "유재석 MBTI는 ISFP, 본인이 방송에서 직접 확인한 결과",
    description:
      "유재석이 유 퀴즈 온 더 블럭에서 검사받아 공개한 ISFP 결과와 당시 발언, 2026년 9월 예능방송인 브랜드평판 1위 기록을 원출처 기준으로 정리했습니다.",
    keywords: ["유재석 MBTI", "유재석 ISFP", "유재석 성격", "예능인 MBTI", "유재석 브랜드평판"],
    readTime: "약 6분",
    publishedAt: septReputationAt,
    updatedAt: septReputationAt,
    intro: [
      "유재석의 MBTI는 ISFP 입니다. 추측이 아니라 2020년 4월 29일 방송된 tvN ‘유 퀴즈 온 더 블럭’에서 본인이 직접 검사를 받고 결과지를 확인한 내용이며, 그 자리에서 “맞다”고 답했습니다.",
      "유재석은 2026년 9월 예능방송인 브랜드평판에서도 1위에 올랐습니다. 한국기업평판연구소가 2026년 8월 5일부터 9월 5일까지 모은 빅데이터 6,489만 건을 분석한 결과입니다.",
    ],
    sections: [
      {
        heading: "유재석이 직접 밝힌 MBTI",
        paragraphs: [
          "방송에서 ISFP 설명을 읽은 유재석은 “사람들과의 갈등과 불화를 좋아하지 않는다”고 했고, “성격 유형으로 보면 연예인과 나와 잘 안 맞는다, 너무 나를 주목하는 거 싫어한다”고 덧붙였습니다. 검사 결과를 보고 “소름 돋았다”는 반응도 함께 보도됐습니다.",
          "이 글이 ISFP 를 단정해 쓰는 이유는 본인이 검사받고 확인한 장면이 방송과 다수 언론 보도로 남아 있기 때문입니다. 다만 2020년 시점의 결과라는 점은 함께 봐야 합니다.",
        ],
      },
      {
        heading: "2026년 9월 예능방송인 평판 1위",
        paragraphs: [
          "한국기업평판연구소의 2026년 9월 예능방송인 브랜드평판에서 1위는 유재석, 2위 이선민, 3위 신동엽, 4위 김종국, 5위 강호동 순으로 분석됐습니다.",
          "유재석 브랜드의 링크분석에서는 ‘토크하다, 웃기다, 꾸준하다’가, 키워드분석에서는 ‘놀면뭐하니, 유퀴즈, 런닝맨’이 높게 나왔고 긍정비율은 92.83%였습니다. 브랜드평판지수는 4,809,272 로 전월 대비 8.63% 내렸습니다.",
        ],
      },
      {
        heading: "‘국민 MC 인데 I 라니’가 이상하지 않은 이유",
        paragraphs: [
          "I 는 말수가 적거나 사람을 싫어한다는 뜻이 아니라, 에너지를 어디서 충전하는지에 대한 선호입니다. 무대와 카메라 앞에서 몇 시간을 끌고 간 뒤 혼자 있는 시간으로 회복한다면 그것은 I 의 설명과 어긋나지 않습니다.",
          "직업이 성격을 증명하지 않습니다. 진행이라는 일을 잘하는 것과 주목받는 상황을 편하게 느끼는 것은 다른 문제입니다.",
        ],
      },
      {
        heading: "결과가 달라졌을 수 있습니다",
        paragraphs: [
          "공개된 검사는 2020년입니다. 그 뒤 다시 검사해 다른 결과를 받았는지는 확인된 자료가 없으므로, 이 글은 ‘지금도 반드시 ISFP’ 라고는 쓰지 않습니다.",
          "MBTI 는 자기보고식이라 최근 환경과 답할 때 떠올린 상황에 따라 한두 글자가 바뀌는 일이 흔합니다. 네 글자만 비교하기보다 각 지표의 비율을 함께 보는 편이 낫습니다.",
        ],
      },
    ],
    cta,
    relatedSlugs: ["lim-young-woong-mbti", "rescene-mbti", "mbti-result-changes"],
    sources: [
      { label: "유 퀴즈 온 더 블럭 유재석 ISFP 공개 보도 (MK스포츠)", href: "https://www.mksports.co.kr/news/entertain/9319213" },
      { label: "유재석 MBTI 공개 보도 (엑스포츠뉴스)", href: "https://www.xportsnews.com/article/1264695" },
      { label: "예능방송인 2026년 9월 브랜드평판 분석 보도", href: "https://www.dtoday.co.kr/news/articleView.html?idxno=790066" },
      { label: "한국기업평판연구소 브랜드평판 랭킹", href: "https://brikorea.com/" },
    ],
  },
  {
    slug: "lim-young-woong-mbti",
    category: "트렌드",
    title: "임영웅 MBTI는? 본인이 밝힌 것은 ‘I’ 하나뿐입니다",
    description:
      "임영웅의 MBTI 네 글자는 공개된 적이 없습니다. 본인이 직접 말한 내향형(I) 발언과 2026년 9월 광고모델 브랜드평판 3위 기록을 원출처로 정리했습니다.",
    keywords: ["임영웅 MBTI", "임영웅 성격", "임영웅 내향형", "임영웅 브랜드평판", "트로트 가수 MBTI"],
    readTime: "약 5분",
    publishedAt: septReputationAt,
    updatedAt: septReputationAt,
    intro: [
      "임영웅의 MBTI 네 글자는 공개된 적이 없습니다. 본인이 직접 말한 것은 내향형, 즉 ‘I’ 라는 한 글자뿐입니다. 인터넷에 도는 네 글자 조합은 팬과 커뮤니티의 추측입니다.",
      "임영웅은 2026년 9월 광고모델 브랜드평판에서 3위에 올랐습니다. 같은 조사에서 1위는 방탄소년단, 2위는 리센느였습니다.",
    ],
    sections: [
      {
        heading: "본인이 말한 것은 ‘I’ 까지입니다",
        paragraphs: [
          "임영웅은 예능 출연을 두고 제작진과 만난 자리에서 자신이 MBTI 의 ‘I’ 라서 출연이 많이 망설여졌다는 취지로 이야기했습니다. 2023년 5월 보도로 남아 있는 발언입니다.",
          "여기서 확인되는 것은 에너지 방향(E·I) 한 축뿐입니다. 나머지 세 축(S·N, T·F, J·P)에 대해서는 본인이 밝힌 자료가 없습니다.",
        ],
      },
      {
        heading: "그럼 검색에 나오는 네 글자는 무엇인가요",
        paragraphs: [
          "상당수는 팬 투표 사이트나 커뮤니티 글에서 나온 추측입니다. 투표로 모인 숫자는 ‘팬들이 그렇게 생각한다’는 자료이지 본인의 검사 결과가 아닙니다.",
          "무대 위 모습이나 인터뷰 말투로 유형을 역산하는 글도 많습니다. 무대는 준비된 공연이고 인터뷰는 공적인 자리라, 그 장면만으로 일상의 선호를 판정할 수 없습니다.",
        ],
      },
      {
        heading: "2026년 9월 광고모델 평판 3위",
        paragraphs: [
          "한국기업평판연구소의 2026년 9월 광고모델 브랜드평판 분석에서 1위 방탄소년단, 2위 리센느, 3위 임영웅 순으로 나타났습니다. 광고모델 평판은 브랜드가 실제로 기용할 때 참고하는 지표라 팬덤 규모와 호감도가 함께 반영됩니다.",
        ],
      },
      {
        heading: "‘I 인데 무대에 선다’는 모순이 아닙니다",
        paragraphs: [
          "I 는 혼자 있는 시간에서 에너지를 회복한다는 뜻이지, 사람 앞에 서지 못한다는 뜻이 아닙니다. 큰 공연을 끝내고 조용한 시간이 꼭 필요하다면 그것이 I 의 설명에 가깝습니다.",
          "임영웅 본인의 발언도 ‘출연이 망설여졌다’는 것이지 ‘하지 못한다’가 아니었습니다.",
        ],
      },
    ],
    cta,
    relatedSlugs: ["yoo-jae-suk-mbti", "rescene-mbti", "mbti-e-vs-i"],
    sources: [
      { label: "임영웅 예능 출연 결심 이유 보도 (세계일보, 2023-05-28)", href: "https://m.segye.com/ampView/20230528504892" },
      { label: "광고모델 2026년 9월 브랜드평판 분석 보도", href: "https://www.dtoday.co.kr/news/articleView.html?idxno=789446" },
      { label: "한국기업평판연구소 브랜드평판 랭킹", href: "https://brikorea.com/" },
    ],
  },
  {
    slug: "rescene-mbti",
    category: "트렌드",
    title: "리센느 멤버 MBTI 정리 — 다섯 명 전원 P형, 메이만 T형",
    description:
      "팬 커뮤니티와 프로필 사이트에 정리된 기준으로 리센느 원이·리브·미나미·메이·제나의 MBTI와, 2026년 9월 신인 아이돌그룹 브랜드평판 1위 기록을 함께 정리했습니다.",
    keywords: ["리센느 MBTI", "리센느 멤버 MBTI", "RESCENE MBTI", "아이돌 MBTI", "리센느 브랜드평판"],
    readTime: "약 6분",
    publishedAt: septReputationAt,
    updatedAt: septReputationAt,
    intro: [
      "팬 커뮤니티와 아이돌 프로필 사이트에 정리된 기준으로 리센느 멤버의 MBTI는 원이 ESFP, 리브 ESFP, 미나미 ENFP, 메이 INTP, 제나 INFP 입니다. 다섯 명 모두 P 형이고, T 는 메이 한 명뿐입니다.",
      "다만 이 값은 소속사 공식 발표로 확인된 것이 아니라 팬들이 모아 정리한 추정치입니다. 이 글은 그 전제를 그대로 두고 읽습니다.",
      "리센느는 2026년 9월 신인 아이돌그룹 브랜드평판에서 1위에 올랐습니다. 한국기업평판연구소가 2026년 8월 1일부터 9월 1일까지 모은 빅데이터 1,973만 건을 분석한 결과입니다.",
    ],
    sections: [
      {
        heading: "멤버별 MBTI (팬 정리 기준 추정)",
        paragraphs: [
          "아래는 팬 커뮤니티와 프로필 위키에 올라와 있는 값을 모은 것입니다. 소속사가 배포한 공식 프로필에서는 확인하지 못했습니다.",
        ],
        bullets: [
          "원이 (리더, 2004년생) — ESFP",
          "리브 (2006년생) — ESFP",
          "미나미 (2006년생, 일본) — ENFP",
          "메이 (2008년생) — INTP",
          "제나 (2008년생) — INFP",
        ],
      },
      {
        heading: "다섯 명 전원 P 형이라는 점",
        paragraphs: [
          "P 는 계획을 미리 못 박기보다 상황에 맞춰 열어두는 쪽을 편하게 느끼는 선호입니다. 다섯 명이 전부 같은 글자로 모이는 조합은 흔하지 않습니다.",
          "팀 분위기로 읽으면, 정해진 대로만 굴러가기보다 현장에서 즉흥적으로 나오는 반응이 많은 쪽에 가깝습니다. 리센느 브랜드의 링크분석에서 ‘응원하다, 기부하다, 광고하다’가 높게 나온 것과도 겹쳐 읽을 여지가 있습니다.",
          "다만 이것은 해석이지 증명이 아닙니다. 유형이 같다고 팀 색깔이 결정되지는 않습니다.",
        ],
      },
      {
        heading: "T 는 메이 한 명",
        paragraphs: [
          "네 명이 F, 메이만 T 로 정리돼 있습니다. F 는 판단할 때 사람과 관계에 무게를 두고, T 는 기준과 논리를 먼저 보는 선호입니다.",
          "한 명만 다른 글자를 가진 구성은 팀 안에서 역할이 갈리기 쉽습니다. 다만 실제로 메이가 그런 자리를 맡는지는 방송으로 확인된 사실이 아니라, 유형 설명에서 나오는 일반적인 이야기입니다.",
        ],
      },
      {
        heading: "이 값은 어디서 나왔고, 얼마나 믿을 수 있나",
        paragraphs: [
          "아이돌 MBTI 는 대개 세 곳에서 나옵니다 — 소속사 공식 프로필, 방송에서 본인이 말한 장면, 그리고 팬이 모아 정리한 위키와 투표 사이트입니다. 이 글에 적은 값은 세 번째에 해당합니다.",
          "그래서 사이트마다 값이 어긋나는 일이 생깁니다. 데뷔 전 프로필과 몇 년 뒤 다시 검사한 결과가 다른데 목록은 갱신되지 않거나, 팬 투표 결과가 본인 답변처럼 인용되는 경우입니다.",
          "본인이 다시 밝혀 달라지면 이 글도 고칩니다. 확인되면 ‘추정’ 표시를 빼고 출처를 붙일 예정입니다.",
        ],
      },
      {
        heading: "2026년 9월 신인 아이돌그룹 평판 1위",
        paragraphs: [
          "1위 리센느, 2위 코르티스, 3위 키키, 4위 하츠투하츠, 5위 튜이드, 6위 아일릿, 7위 투어스, 8위 베이비몬스터, 9위 캣츠아이, 10위 미야오 순으로 분석됐습니다.",
          "리센느 브랜드의 키워드분석에서는 ‘러브어택, 프리티걸, 안원잘부’가 높게 나왔고 긍정비율은 94.30% 였습니다.",
        ],
      },
      {
        heading: "내 유형과 비교해 보려면",
        paragraphs: [
          "팬 추정이든 본인 발언이든, 남의 네 글자는 내 유형을 알려주지 않습니다. 같은 ENFP 라도 자란 환경과 지금 상황에 따라 모습이 크게 다릅니다.",
          "비교가 목적이라면 내 결과부터 확인하는 편이 빠릅니다. 40문항, 약 4분이면 끝납니다.",
        ],
      },
    ],
    cta,
    relatedSlugs: ["yoo-jae-suk-mbti", "lim-young-woong-mbti", "mbti-result-changes"],
    sources: [
      { label: "신인 아이돌그룹 2026년 9월 브랜드평판 분석 보도", href: "https://www.dtoday.co.kr/news/articleView.html?idxno=789045" },
      { label: "한국기업평판연구소 브랜드평판 랭킹", href: "https://brikorea.com/" },
      { label: "RESCENE 프로필 (나무위키)", href: "https://namu.wiki/w/RESCENE" },
      { label: "메이(RESCENE) 프로필 (Kpop Wiki)", href: "https://kpop.fandom.com/wiki/May_(RESCENE)" },
    ],
  },
];
