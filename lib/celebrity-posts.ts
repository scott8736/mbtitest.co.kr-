import type { BlogPost } from "./blog-posts";

const publishedAt = "2026-08-31";
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
];
