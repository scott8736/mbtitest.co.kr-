/**
 * 모리 세계관 「마음숲」 (2026-10-04, 사용자 기획서 「모리 캐릭터 세계관 기획서」를 사이트 데이터로 옮김).
 *
 * 모리는 사람마다 마음속에 하나씩 사는 작은 숲의 정령입니다. 검사를 하면 잠들어 있던 「내 모리」가 깨어납니다.
 * 핵심 메시지: 달라서 틀린 게 아니라, 달라서 숲이 완성된다 — 유형을 깎아내리거나 줄 세우는 글을 쓰지 않습니다.
 *
 * 네 마을은 사이트의 네 그룹(탐구형·공감형·안정형·행동형)과 같습니다.
 * 짝꿍은 MORI_BEST(lib/mori.ts) 와 같고, 라이벌은 궁합 데이터의 challenges(lib/mbti-content.ts) 안에서만 골랐습니다
 * — 궁합표와 이야기가 어긋나지 않게 tests/mori-world.test.mjs 가 대조합니다.
 * 상징 소품은 실제 그림(MORI.prop)을 기준으로 합니다.
 */

export type VillageKey = "nt" | "nf" | "sj" | "sp";

export const VILLAGES: Record<VillageKey, { name: string; group: string; scene: string; landmarks: string; color: string; image: string }> = {
  nt: { name: "별빛 언덕", group: "탐구형 NT", scene: "밤하늘이 가장 가까운 언덕", landmarks: "천문대 · 숲 연구소", color: "#6a4fc8", image: "/images/world/village-nt.webp" },
  nf: { name: "달빛 호수", group: "공감형 NF", scene: "물에 마음이 비치는 호수", landmarks: "등불 나루터 · 이야기 도서관", color: "#2f8f7c", image: "/images/world/village-nf.webp" },
  sj: { name: "도토리 마을", group: "안정형 SJ", scene: "질서 있는 오두막 마을", landmarks: "숲 우체국 · 도토리 창고", color: "#8a5a32", image: "/images/world/village-sj.webp" },
  sp: { name: "바람 들판", group: "행동형 SP", scene: "늘 바람이 부는 넓은 들판", landmarks: "수리 공방 · 축제 무대", color: "#c25e14", image: "/images/world/village-sp.webp" },
};

export const villageOf = (code: string): VillageKey => {
  const c = code.toUpperCase();
  if (c[1] === "N") return c[2] === "T" ? "nt" : "nf";
  return c[3] === "J" ? "sj" : "sp";
};

/** 16모리: 성격 한 줄 · 말버릇 · 숲에서 맡은 일 */
export const MORI_WORLD: Record<string, { line: string; says: string; role: string }> = {
  INTJ: { line: "10년 뒤 숲까지 그려 두는 조용한 전략가", says: "B안까지 이미 있어.", role: "숲 길 설계" },
  INTP: { line: "궁금한 게 생기면 밤새 파고드는 연구자", says: "근데 그건 왜 그래?", role: "숲 연구소장" },
  ENTJ: { line: "목표를 정하면 모두를 이끌고 가는 길잡이", says: "좋아, 지금 바로 시작!", role: "축제 총감독" },
  ENTP: { line: "뒤집어 생각하는 게 취미인 장난꾸러기", says: "반대로 생각해 보면?", role: "아이디어 시장 운영" },
  INFJ: { line: "말하지 않아도 마음을 알아채는 안내자", says: "괜찮아, 다 알아.", role: "길 잃은 모리 안내" },
  INFP: { line: "자기만의 상상 세계가 넓은 몽상가", says: "이건 나만의 이야기야.", role: "이야기 도서관 사서" },
  ENFJ: { line: "모두의 가능성을 먼저 믿어 주는 리더", says: "넌 할 수 있어!", role: "마을 화합 담당" },
  ENFP: { line: "설렘으로 움직이는 에너자이저", says: "우와, 이거 재밌겠다!", role: "새 놀이 발명" },
  ISTJ: { line: "한 번 한 약속은 끝까지 지키는 원칙파", says: "약속은 약속이야.", role: "숲 우체국장" },
  ISFJ: { line: "남의 컨디션부터 챙기는 다정한 보호자", says: "밥은 먹었어?", role: "숲 보건소 지킴이" },
  ESTJ: { line: "일이 굴러가게 만드는 실행 대장", says: "순서대로 하자.", role: "도토리 창고 관리" },
  ESFJ: { line: "모두가 함께하는 자리를 만드는 사교가", says: "다 같이 모이자!", role: "마을 잔치 준비" },
  ISTP: { line: "말없이 뚝딱 고쳐 내는 실용주의자", says: "…고쳤어.", role: "수리 공방" },
  ISFP: { line: "지금 이 순간의 아름다움을 아는 감성파", says: "오늘 하늘 예쁘다.", role: "숲 풍경 기록" },
  ESTP: { line: "생각보다 몸이 먼저 나가는 모험가", says: "일단 해 보고!", role: "숲 구조대" },
  ESFP: { line: "어디서든 무대를 만드는 흥부자", says: "파티 타임!", role: "축제 무대 MC" },
};

/** 짝꿍(=MORI_BEST)과 티격태격 라이벌. 라이벌 이야기는 늘 함께 마음나무 열매를 맺으며 끝납니다. */
export const MORI_PAIRS: { a: string; b: string; kind: "짝꿍" | "라이벌"; hook: string; story: string }[] = [
  { a: "INTJ", b: "ENFP", kind: "짝꿍", hook: "계획 없는 모험에 지도를 그려 주는 사이",
    story: "아이디어 뱅크가 「우와, 이거 재밌겠다!」 하며 숲 밖으로 뛰어나가면, 별지도 제작자는 말없이 지도를 한 장 더 그려 둡니다. 계획 없는 모험이 길을 잃지 않는 건 그 지도 덕분이고, 별지도 제작자가 처음 가 보는 길을 걷게 되는 건 아이디어 뱅크 덕분입니다." },
  { a: "INTP", b: "ENTJ", kind: "짝꿍", hook: "이론을 만들면 바로 실행해 주는 콤비",
    story: "탐구가가 밤새 숲 연구소에서 「근데 그건 왜 그래?」를 풀어내면, 다음 날 아침 길잡이 대장이 깃발을 들고 「좋아, 지금 바로 시작!」을 외칩니다. 생각이 실행이 되고, 실행이 다시 새 질문을 낳는 콤비입니다." },
  { a: "INFJ", b: "ENTP", kind: "짝꿍", hook: "엉뚱한 질문에 깊은 답을 주는 대화 친구",
    story: "엉뚱 질문왕이 「반대로 생각해 보면?」 하고 던진 질문을, 마음 등대는 등불 아래에서 오래 붙잡고 깊은 답을 돌려줍니다. 서로의 질문과 대답 덕분에 둘 다 혼자서는 닿지 못한 생각에 닿습니다." },
  { a: "INFP", b: "ENFJ", kind: "짝꿍", hook: "혼자 쓰던 이야기를 세상에 꺼내 주는 사이",
    story: "이야기꾼이 도서관 구석에서 혼자 쓰던 이야기를, 응원단장이 「넌 할 수 있어!」라며 마을 무대로 데리고 나옵니다. 이야기꾼은 용기를 얻고, 응원단장은 마음을 울리는 이야기를 얻습니다." },
  { a: "ISTJ", b: "ESFP", kind: "짝꿍", hook: "시간표와 파티가 만나 균형을 찾는 사이",
    story: "약속 지킴이의 시간표 덕분에 축제는 제때 열리고, 분위기 메이커의 「파티 타임!」 덕분에 약속 지킴이도 오랜만에 크게 웃습니다. 시간표와 파티가 만나 숲의 하루가 균형을 찾습니다." },
  { a: "ISFJ", b: "ESTP", kind: "짝꿍", hook: "다쳐서 돌아오면 늘 붕대를 감아 주는 사이",
    story: "숲 구조대 행동대장은 늘 「일단 해 보고!」 뛰어나갔다가 무릎이 까져 돌아옵니다. 그럴 때마다 돌봄 요정이 「밥은 먹었어?」 하며 붕대를 감아 주고, 행동대장은 다음 모험에서 돌봄 요정에게 줄 들꽃을 꺾어 옵니다." },
  { a: "ESTJ", b: "ISFP", kind: "짝꿍", hook: "바쁜 반장에게 쉬는 법을 알려 주는 사이",
    story: "도토리 창고를 정리하느라 바쁜 현장 반장에게 산책가가 「오늘 하늘 예쁘다.」 하고 말을 겁니다. 반장은 처음으로 일을 멈추고 하늘을 보고, 산책가는 반장 덕분에 미뤄 둔 그림을 끝냅니다." },
  { a: "ESFJ", b: "ISTP", kind: "짝꿍", hook: "잔치마다 고장 난 걸 말없이 고쳐 주는 사이",
    story: "모임 호스트가 마을 잔치를 열 때마다 어딘가 하나씩 고장이 납니다. 해결사는 잔치 한쪽에서 말없이 「…고쳤어.」 하고 돌아서고, 호스트는 그런 해결사의 자리를 늘 따로 챙겨 둡니다." },
  { a: "ISTJ", b: "ENFP", kind: "라이벌", hook: "계획대로 vs 기분대로",
    story: "약속 지킴이는 아이디어 뱅크가 시간표를 지키지 않아 속상하고, 아이디어 뱅크는 시간표가 너무 빡빡해 답답합니다. 그래도 둘이 함께 준비한 축제에서는 「계획된 깜짝 이벤트」가 열렸고, 그날 마음나무에 열매가 하나 맺혔습니다." },
  { a: "ENTJ", b: "ISFP", kind: "라이벌", hook: "빠르게 vs 내 속도대로",
    story: "길잡이 대장은 깃발을 들고 앞서가고, 산책가는 들꽃 앞에서 자꾸 멈춥니다. 대장이 처음으로 걸음을 늦춘 날, 둘은 지도에 없던 아름다운 길을 찾아냈고 마음나무에 열매가 하나 맺혔습니다." },
  { a: "ESTJ", b: "INFP", kind: "라이벌", hook: "규칙 vs 의미",
    story: "현장 반장은 「순서대로 하자.」, 이야기꾼은 「이건 왜 하는 거야?」. 반장이 이야기꾼의 이야기를 끝까지 들어 준 날, 창고 정리에도 이유가 생겨 모두가 더 즐겁게 일했고 마음나무에 열매가 하나 맺혔습니다." },
  { a: "INTP", b: "ESFJ", kind: "라이벌", hook: "혼자 있고 싶음 vs 다 같이 모이자",
    story: "모임 호스트는 탐구가를 잔치에 꼭 부르고 싶고, 탐구가는 연구소에 숨고 싶습니다. 호스트가 연구소 앞에 조용한 자리를 따로 마련해 준 날, 탐구가가 처음으로 잔치에 나와 별 이야기를 들려줬고 마음나무에 열매가 하나 맺혔습니다." },
];

export const pairOf = (x: string, y: string) => {
  const a = x.toUpperCase(), b = y.toUpperCase();
  return MORI_PAIRS.find((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a));
};

export const pairsFor = (code: string) => MORI_PAIRS.filter((p) => p.a === code.toUpperCase() || p.b === code.toUpperCase());
