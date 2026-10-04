// ─────────────────────────────────────────────────────────────────────────────
// 모리 마음숲 안내서 — 본편 조판 (2026-10-04)
// report.html?type=INFP&name=하늘&ei=38&sn=27&tf=31&jp=36&birth=1995-01-20&bt=7&from=2026-10
//   ei·sn·tf·jp : 왼쪽 글자(E·S·T·J) 쪽 % — 사이트 결과 화면과 같은 값
//   birth·bt    : 생년월일(양력)·시진(0=모름, 1=자시 … 12=해시). birth 가 없으면 사주 장을 뺀다
//   from        : 13개월 달력 시작 달(구매한 달). 없으면 이번 달
// 원고는 render.py 가 content/*.json 을 모아 book.js(window.BOOK)로 넣는다. 사주 계산은 saju_calc.js(절입 시각표).
// 다른 상품(타로·궁합·별자리)도 이 틀의 page()/chapter()/textPage() 를 그대로 쓰고 장 목록만 바꾼다.
// ─────────────────────────────────────────────────────────────────────────────
const D = window.DATA, B = window.BOOK;
// 사이트 열람 화면은 window.PARAMS(서버가 준 주문 값)로, 로컬 견본은 주소 쿼리로 받는다.
const Q = new URLSearchParams(window.PARAMS || location.search);
const CODE = (Q.get("type") || "INFP").toUpperCase();
const NAME = Q.get("name") || "하늘";
const AX = { EI: +(Q.get("ei") ?? 38), SN: +(Q.get("sn") ?? 27), TF: +(Q.get("tf") ?? 31), JP: +(Q.get("jp") ?? 36) };
const BIRTH = Q.get("birth") || "";
const BT = +(Q.get("bt") || 0);
const T = D.typeData[CODE], P = D.profiles[CODE.toLowerCase()], M = D.MORI[CODE], W = D.MORI_WORLD[CODE];
const VK = CODE[1] === "N" ? (CODE[2] === "T" ? "nt" : "nf") : (CODE[3] === "J" ? "sj" : "sp");
const V = D.VILLAGES[VK];
// 사이트 WebP 를 JPG 로 옮긴 사본(assets/). PDF 는 WebP 를 무손실로 다시 넣어 용량이 커진다.
const IMG = (c) => `assets/mori-${c.toLowerCase()}.jpg`;
const VIMG = (k) => `assets/village-${k}.jpg`;
const SCENE = (k) => `scenes/${CODE}/${k}.jpg`; // 책에는 JPG(용량), 원본 PNG는 배경화면 파일용
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 유형 색으로 책 전체 테마
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixc = (h, to, t) => "#" + hex(h).map((v) => Math.round(v + (to - v) * t).toString(16).padStart(2, "0")).join("");
const root = document.documentElement.style;
root.setProperty("--c", M.color);
root.setProperty("--cd", mixc(M.color, 0, 0.48));
root.setProperty("--cl", mixc(M.color, 255, 0.84));
root.setProperty("--cx", mixc(M.color, 255, 0.7));
root.setProperty("--v", V.color);

// ── 쪽 만들기 ──
let pageNo = 0;
const pages = [];
const toc = []; // [장 번호, 제목, 부제, 시작 쪽]
const page = (cls, html, ribbon) => {
  pageNo++;
  const bare = /cover|chapter|back|full/.test(cls);
  pages.push(`<section class="page ${cls}">${ribbon ? `<div class="ribbon">${ribbon}</div>` : ""}${html}${bare ? "" : `<div class="folio"><span>${CODE} 모리의 마음숲 안내서</span><b>${pageNo}</b></div>`}</section>`);
  return pageNo;
};
let chNo = 0;
const chapter = (title, sub, scene, memo) => {
  chNo++;
  toc.push([chNo, title, sub, pageNo + 1]);
  page("chapter", `<img src="${scene}"><div class="inner">
    <div class="num">${String(chNo).padStart(2, "0")}</div><div class="label">CHAPTER</div><h2>${esc(title)}</h2><p>${esc(sub)}</p>
    ${memo ? `<div class="memo"><b>내 점수 메모 · ${memo.badge}</b>${esc(memo.text)}</div>` : ""}</div>`);
};
const kick = (label) => `<div class="kicker">CHAPTER ${String(chNo).padStart(2, "0")} · ${label}</div>`;
// 원고 한 쪽: {title, lead, body[], points[]}
const textPage = (label, c, extra = "") => page("", `<div class="inner fit">
  ${kick(label)}<h2 class="t">${esc(c.title)}</h2>
  ${c.lead ? `<p class="body lead">${esc(c.lead)}</p>` : ""}
  ${(c.body || []).map((b) => `<p class="body">${esc(b)}</p>`).join("")}
  ${extra}
  ${(c.points || []).length ? `<div class="points"><b>기억해 둘 것</b>${c.points.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
</div>`, label);
// 써 보는 쪽
const workbook = (qs, checks) => page("", `<div class="inner">
  ${kick("WORKBOOK")}<h2 class="t">써 보는 페이지</h2>
  <div class="write">${qs.map((q) => `<div><div class="q">${esc(q)}</div><div class="lines"></div></div>`).join("")}
    <div class="checks">${checks.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>
</div>`, "WORKBOOK");

// ── 점수 → 단계 (반반 ≤60 · 중간 61~79 · 뚜렷 ≥80, 유형 쪽 글자 기준) ──
const AXES = [["EI", "E", "외향", "I", "내향", "에너지를 어디서 얻나"], ["SN", "S", "감각", "N", "직관", "정보를 어떻게 받아들이나"],
  ["TF", "T", "사고", "F", "감정", "무엇으로 결정하나"], ["JP", "J", "판단", "P", "인식", "생활을 어떻게 꾸리나"]];
const mine = (ax) => { const [k, l, ln, r, rn] = AXES.find((a) => a[0] === ax); const left = CODE.includes(l); return { letter: left ? l : r, name: left ? ln : rn, pct: left ? AX[k] : 100 - AX[k] }; };
const band = (pct) => (pct <= 60 ? "half" : pct <= 79 ? "mid" : "strong");
const BAND_KO = { half: "거의 반반", mid: "분명한 편", strong: "아주 뚜렷" };
const MEMO_AXIS = { love: "TF", friends: "EI", work: "JP", study: "SN", recharge: "EI", money: "JP" };
const memoFor = (ch) => {
  const ax = MEMO_AXIS[ch]; const m = B.axes.memos?.[ch]; if (!ax || !m) return null;
  const me = mine(ax); return { badge: `${me.letter} ${me.pct}% · ${BAND_KO[band(me.pct)]}`, text: m[band(me.pct)] };
};

// ── 사주 (절입 시각표로 계산, 시각 모르면 정오·시주 없음) ──
const STEM_H = "甲乙丙丁戊己庚辛壬癸", STEM_K = "갑을병정무기경신임계", BR_H = "子丑寅卯辰巳午未申酉戌亥", BR_K = "자축인묘진사오미신유술해";
const STEM_EL = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4], BR_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
// 적은 기운 채우기: 전통 오행 색(목 청록·초록, 화 빨강·주황, 토 노랑·갈색, 금 흰색·아이보리, 수 검정·남색)과 그 기운의 생활
const FILL = [["청록색·초록색 소품을 가까이 두기", "작은 화분 하나 키워 보기", "아침에 가볍게 걷기"],
  ["빨간색·주황색 포인트 하나 더하기", "햇볕 드는 곳에서 시간 보내기", "좋아하는 사람과 웃는 시간 만들기"],
  ["노란색·갈색 톤 소품 두기", "식사·잠자리 시간 일정하게 지키기", "도자기·나무 그릇 써 보기"],
  ["흰색·아이보리 톤으로 공간 비우기", "물건 하나 정리하고 마감 정하기", "단정한 금속 소품 하나 두기"],
  ["검정·남색 소품으로 차분하게", "물 가까이 산책하기", "조용히 혼자 읽고 쉬는 시간"]];
const EL_K = ["목", "화", "토", "금", "수"], EL_H = ["木", "火", "土", "金", "水"], EL_C = ["#4f9d69", "#e0674f", "#d4a64a", "#9aa3ad", "#3f6fb5"];
let SAJU = null;
if (/^\d{4}-\d{2}-\d{2}$/.test(BIRTH)) {
  const [y, m, d] = BIRTH.split("-").map(Number);
  const hour = BT > 0 ? ((BT - 1) * 2) % 24 : 12;
  const { sajuYear, monthBranchIdx } = ST.sajuYearMonth(y, m, d, hour, 0);
  const ys = ((sajuYear - 4) % 10 + 10) % 10, yb = ((sajuYear - 4) % 12 + 12) % 12;
  const g = ST.dayGanzhiIdx(y, m, d);
  const day = { s: g % 10, b: g % 12 };
  const pil = { year: { s: ys, b: yb }, month: { s: ST.monthStemIdx(ys, monthBranchIdx), b: monthBranchIdx }, day,
    time: BT > 0 ? { s: ([0, 2, 4, 6, 8][day.s % 5] + (BT - 1) % 12) % 10, b: (BT - 1) % 12 } : null };
  const all = [pil.year, pil.month, pil.day, pil.time].filter(Boolean);
  const counts = [0, 0, 0, 0, 0];
  all.forEach((p) => { counts[STEM_EL[p.s]]++; counts[BR_EL[p.b]]++; });
  const de = STEM_EL[day.s];
  const tg = { 비견: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }, KEYS = ["비견", "식상", "재성", "관성", "인성"];
  // 일간을 뺀 나머지 글자(천간+지지)의 오행을 일간과의 관계로 센다
  [...all.filter((p) => p !== day).map((p) => STEM_EL[p.s]), ...all.map((p) => BR_EL[p.b])].forEach((e) => { tg[KEYS[(e - de + 5) % 5]]++; });
  const tenGod = KEYS.reduce((a, k) => (tg[k] > tg[a] ? k : a), "비견");
  // 같은 수로 겹치면 모두 밝힌다. 해석 글은 일간 오행이 끼어 있으면 그것, 아니면 앞의 것.
  const tied = (v) => counts.map((n, i) => (n === v ? i : -1)).filter((i) => i >= 0);
  const strongs = tied(Math.max(...counts)), weaks = tied(Math.min(...counts));
  const pick = (arr) => (arr.includes(de) ? de : arr[0]);
  SAJU = { y, m, d, pil, counts, de, tenGod, strongs, weaks, strong: pick(strongs), weak: pick(weaks) };
}

// ════════════════════════════ 본문 시작 ════════════════════════════
// 1. 표지 (첫 쪽 고지 포함)
page("cover", `<div class="inner">
  <div class="brand">MORI · 마음숲 안내서</div>
  <div class="arch"><img src="${SCENE("profile")}"><div class="says">“${esc(W.says)}”</div></div>
  <h1><em>${CODE} 모리</em>의<br>마음숲 안내서</h1>
  <div class="owner">${esc(NAME)} 님의 마음속에 사는 ${esc(T.name)}</div>
  <div class="chips"><span class="chip v">${esc(V.name)} 주민</span><span class="chip">${esc(W.role)}</span></div>
  <div class="date">자기이해를 돕는 콘텐츠이며 심리 진단이 아닙니다 · mbtitest.co.kr</div>
</div>`);

// 2. 읽는 법 + 고지
page("", `<div class="inner">
  <div class="kicker">BEFORE YOU READ</div>
  <h2 class="t">이 책을 읽는 법</h2>
  <div class="howto">
    <div><b>1</b><p>같은 ${CODE}라도 사람마다 다릅니다. 이 책은 ${esc(NAME)} 님의 <b>네 가지 성향 점수</b>에 맞춰 일부 쪽의 글이 달라집니다.</p></div>
    <div><b>2</b><p>${SAJU ? "생년월일로 세운 <b>사주 장</b>이 들어 있어요. 전통 해석을 재미로 읽는 글이에요." : "생년월일을 넣으면 <b>사주 장</b>이 더해져요. 이번 책에는 들어 있지 않아요."}</p></div>
    <div><b>3</b><p>장마다 <b>써 보는 페이지</b>가 있고, 맨 뒤 <b>소장 페이지</b>의 배경화면과 포스터는 따로 내려받을 수 있어요.</p></div>
  </div>
  <p class="body">모리(森)는 숲이라는 뜻이에요. 모든 사람의 마음속에는 작은 숲의 정령 모리가 살고 있고, ${esc(NAME)} 님의 숲에는 「${esc(T.name)}」가 살고 있어요.</p>
  <div class="notice-box">이 책은 공식 MBTI® 검사 결과가 아니라 자기이해를 돕기 위한 콘텐츠입니다. 의료·심리 진단을 대신하지 않으며, 마음이 오래 힘들다면 전문가와 이야기해 보세요. 사주 장은 전통 해석을 재미로 풀어 쓴 것으로 미래를 단정하지 않습니다. MBTI®는 The Myers-Briggs Company의 등록상표이며 이 책은 공식 검사와 관련이 없습니다.</div>
</div>`);

// 3. 차례 (자리만 잡고 맨 끝에 채운다)
page("", `<div class="inner fit"><div class="kicker">CONTENTS</div><h2 class="t">차례</h2><ol class="toc">%%TOC%%</ol></div>`);
const TOC_INDEX = pages.length - 1;

// ── 01 마음숲 이야기 (세계관이 먼저) ──
chapter("마음숲 이야기", "모든 사람의 마음속에는 작은 숲의 정령이 살아요", VIMG(VK));
page("", `<div class="inner fit">
  ${kick("WORLD")}<h2 class="t">마음속에 숲이 하나 있어요</h2>
  <p class="body lead">모든 사람의 마음속에는 작은 숲, 마음숲이 있고 거기에는 숲의 정령 모리가 살아요.</p>
  <p class="body">모리는 그 사람이 세상을 느끼고, 고르고, 쉬는 방식을 닮았어요. 그래서 모리는 열여섯 가지 모습으로 깨어나요. 수줍게 호숫가를 걷는 모리도 있고, 광장 한가운데서 축제를 여는 모리도 있어요.</p>
  <p class="body">숲 한가운데에는 커다란 마음나무가 있어요. 마음나무의 열매는 모리들이 서로를 이해할 때 하나씩 열려요. 그래서 마음숲에서는 이런 말을 자주 해요.</p>
  <div class="quote"><img src="${IMG(CODE)}"><p>달라서 틀린 게 아니라,<br>달라서 숲이 완성돼요.</p></div>
</div>`, "WORLD");
page("", `<div class="inner">
  ${kick("VILLAGES")}<h2 class="t">마음숲의 네 마을</h2>
  <p class="body">모리들은 비슷한 결끼리 모여 네 마을을 이루고 살아요. ${esc(NAME)} 님의 모리는 <b>${esc(V.name)}</b>에 살아요.</p>
  <div class="villages">${Object.entries(D.VILLAGES).map(([k, v]) => `<figure class="${k === VK ? "home" : ""}"><img src="${VIMG(k)}"><figcaption><b>${esc(v.name)}</b>${esc(v.scene)}</figcaption></figure>`).join("")}</div>
</div>`, "VILLAGES");
page("", `<div class="inner">
  ${kick("MY MORI")}<h2 class="t">${esc(NAME)} 님의 모리를 소개해요</h2>
  <div class="hero"><img src="${SCENE("profile")}"></div>
  <dl class="facts">
    <div><dt>이름</dt><dd>${CODE} 모리 · ${esc(T.name)}</dd></div>
    <div><dt>사는 곳</dt><dd>${esc(V.name)} — ${esc(V.landmarks)}</dd></div>
    <div><dt>숲에서 맡은 일</dt><dd>${esc(W.role)}</dd></div>
    <div><dt>늘 들고 다니는 것</dt><dd>${esc(M.prop)}</dd></div>
    <div><dt>말버릇</dt><dd>“${esc(W.says)}”</dd></div>
  </dl>
</div>`, "MY MORI");
const mate = D.MORI_BEST[CODE];
const rivals = D.MORI_PAIRS.filter((p) => p.kind === "라이벌" && (p.a === CODE || p.b === CODE)).map((p) => (p.a === CODE ? p.b : p.a));
const codes = Object.keys(D.MORI);
page("", `<div class="inner">
  ${kick("16 MORI")}<h2 class="t">마음숲의 열여섯 모리</h2>
  <p class="body">${esc(W.line)} 짝꿍은 ${mate} 모리, 티격태격하면서도 서로를 키우는 라이벌도 있어요.</p>
  <div class="pairs-grid">${codes.map((c) => { const cls = c === CODE ? "me" : c === mate ? "mate" : rivals.includes(c) ? "rival" : ""; return `<div class="${cls}">${c === mate ? "<em>💞</em>" : rivals.includes(c) ? "<em>⚡</em>" : ""}<img src="${IMG(c)}"><b>${c}</b><small>${esc(D.typeData[c].name.split(" ").slice(-1)[0])}</small></div>`; }).join("")}</div>
  <div class="key"><span>💞 짝꿍 ${mate}</span><span>⚡ 라이벌</span><span>진한 테두리 = 나</span></div>
</div>`, "16 MORI");

// ── 02 내 성향의 농도 (점수 맞춤) ──
chapter("내 성향의 농도", `같은 ${CODE}라도 기울기는 사람마다 달라요. ${NAME} 님의 실제 점수로 읽어요.`, SCENE("axes"));
page("", `<div class="inner">
  ${kick("MY SCORES")}<h2 class="t">${esc(NAME)} 님의 네 가지 성향</h2>
  <div class="axes">${AXES.map(([k, l, ln, r, rn, q]) => { const v = AX[k]; const me = mine(k); return `<div class="axis"><div class="names">${l} ${ln}<span>${q}</span>${r} ${rn}</div>
    <div class="bar"><i style="width:${v}%"></i><i style="width:${100 - v}%"></i><b class="l">${v}%</b><b class="r">${100 - v}%</b></div>
    <div class="note">${me.letter}(${me.name}) 쪽 ${me.pct}% — <b>${BAND_KO[band(me.pct)]}</b></div></div>`; }).join("")}</div>
  <p class="body">다음 네 쪽은 이 점수에 맞춰 골라 넣은 글이에요. 축마다 세 가지 글 중 하나가 들어가서, 같은 ${CODE}라도 81가지 조합이 나와요. 퍼센트가 높다고 더 좋거나 나쁜 게 아니에요.</p>
</div>`, "MY SCORES");
AXES.forEach(([k]) => { const me = mine(k); const c = B.axes.axes[k][band(me.pct)]; textPage(`${k} · ${me.letter} ${me.pct}%`, c); });
workbook(["네 막대 중 가장 고개가 끄덕여진 것은?", "반대쪽 성향이 나오는 순간은 언제였나요?", "이 점수를 보고 나에게 해 주고 싶은 말"], ["반대쪽 성향의 사람에게 먼저 말 걸어 보기", "내 기울기가 도움이 된 순간 적어 두기", "한 달 뒤 다시 검사해 보기"]);

// ── 본문 장들 ──
const CH = [
  ["who", "나는 어떤 사람일까", "남들이 보는 나와 내가 아는 나 사이", "WHO AM I", ["남들이 나를 오해한 적이 있다면, 실제 마음은?", "나만 아는 내 숨은 강점 한 가지", "더 편안해지기 위해 이번 달 해 볼 것"]],
  ["love", "연애할 때의 나", "호감이 생기면 어떤 신호가 나올까", "LOVE", ["내가 사랑받는다고 느끼는 순간은?", "연애에서 꼭 지키고 싶은 나만의 원칙", "다음에 마음이 상하면 해 볼 말 한마디"]],
  ["friends", "친구와 사람들 사이에서", "편한 사람, 지치는 상황", "FRIENDS", ["함께 있으면 편해지는 사람 세 명", "서운했던 일을 다시 꺼낸다면 어떻게 말할까", "모임에서 내가 맡는 역할은?"]],
  ["work", "일하는 방식", "몰입이 잘 되는 조건과 잘 맞는 자리", "WORK", ["최근 시간 가는 줄 몰랐던 일은?", "일하다 지칠 때 나타나는 내 신호", "1년 뒤 일하는 내 모습"]],
  ["study", "공부할 때의 나", "기억이 잘 남는 방식", "STUDY", ["가장 잘 외워졌던 공부 방법은?", "집중이 잘 되는 장소와 시간", "다음 시험·자격증에 써 볼 전략"]],
  ["money", "돈을 대하는 마음", "쓰는 사람일까, 모으는 사람일까", "MONEY", ["최근 가장 만족스러웠던 소비는?", "충동구매가 생기는 상황", "한 달 뒤 모아 두고 싶은 금액과 이유"]],
  ["recharge", "방전과 충전", "지쳤다는 신호와 회복법", "RECHARGE", ["요즘 나를 방전시키는 것", "10분 만에 충전되는 나만의 방법", "이번 주 회복 루틴 계획"]],
  ["rhythm", "하루의 리듬", "컨디션이 좋은 생활 습관", "RHYTHM", ["내 컨디션이 가장 좋은 시간대는?", "마음이 편해지는 공간의 조건", "내일 아침 바꿔 볼 작은 습관"]],
  ["color", "나를 꾸미는 색", "어울리는 색과 분위기", "COLOR", null],
];
const CH_CHECKS = ["오늘 바로 해 볼 것 하나 고르기", "이 장에서 마음에 남은 문장에 밑줄", "가까운 사람에게 이 장 이야기해 보기"];
CH.forEach(([key, title, sub, label, qs]) => {
  chapter(title, sub, SCENE(key), memoFor(key));
  (B.content[key] || []).forEach((c, i) => {
    // 연애 장 첫 쪽 뒤에 짝꿍 이야기를 붙이지 않고 원고 그대로 — 원고에 love-mate 쪽이 있다
    textPage(label, c);
  });
  if (key === "color") {
    const PAL = [[M.color, "마음숲 대표색", "내 모리의 몸 색이에요. 포인트 소품 하나로 충분해요."], [mixc(M.color, 255, .55), "새벽 안개", "니트·셔츠처럼 얼굴 가까이에 두면 인상이 부드러워져요."], [mixc(M.color, 0, .45), "깊은 밤", "가방·신발처럼 무게를 잡아 주는 자리에 어울려요."], ["#f4ead8", "오두막 크림", "대표색을 받쳐 주는 바탕색. 방 벽지·침구에 좋아요."], [V.color, `${V.name}의 빛`, "우리 마을의 색. 작은 액세서리로 챙겨 보세요."]];
    page("", `<div class="inner">${kick("PALETTE")}<h2 class="t">${esc(NAME)} 님의 마음숲 팔레트</h2>
      <div class="swatches">${PAL.map(([h, n, d]) => `<div class="sw"><i style="background:${h}"></i><div><b>${esc(n)}</b><span>${esc(d)}</span><code>${h.toUpperCase()}</code></div></div>`).join("")}</div></div>`, "PALETTE");
  }
  if (qs) workbook(qs, CH_CHECKS);
});

// ── 16모리와 나 ──
chapter("16모리와 나", "어느 조합이든 잘 지내는 법이 있어요", SCENE("pairs"));
codes.filter((c) => c !== CODE && B.pairs[c]).forEach((c) => {
  const x = B.pairs[c];
  const tag = c === mate ? `<span class="tag mate">💞 짝꿍</span>` : rivals.includes(c) ? `<span class="tag rival">⚡ 라이벌</span>` : "";
  page("", `<div class="inner fit">
    ${kick(`${c} 모리`)}
    <div class="pair-head"><img src="${IMG(c)}"><div><small>${c} 모리 ${tag}</small><h2 class="t">${esc(x.title)}</h2></div></div>
    <p class="body lead">${esc(x.lead)}</p>
    ${(x.body || []).map((b) => `<p class="body">${esc(b)}</p>`).join("")}
    <div class="pair-boxes"><div><b>잘 맞는 점</b>${esc(x.good)}</div><div><b>부딪히기 쉬운 점</b>${esc(x.clash)}</div><div><b>함께 지내는 팁</b>${esc(x.tip)}</div></div>
  </div>`, `${c}`);
});

// ── 사주 × 모리 (생년월일이 있을 때만) ──
if (SAJU && B.saju) {
  chapter("사주 × 모리", "타고난 결과 지금의 나 — 전통 해석을 재미로 읽어요", SCENE("saju"));
  const cell = (p, label) => p ? `<div class="pil"><small>${label}</small><b style="color:${EL_C[STEM_EL[p.s]]}">${STEM_H[p.s]}</b><b style="color:${EL_C[BR_EL[p.b]]}">${BR_H[p.b]}</b><span>${STEM_K[p.s]}${BR_K[p.b]}</span></div>` : `<div class="pil none"><small>${label}</small><b>?</b><b>?</b><span>시각 모름</span></div>`;
  page("", `<div class="inner">
    ${kick("SAJU")}<h2 class="t">${esc(NAME)} 님의 사주 여덟 글자</h2>
    <p class="body">${SAJU.y}년 ${SAJU.m}월 ${SAJU.d}일${BT > 0 ? ` ${["", "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"][BT]}시` : ""}(양력)에 태어난 분의 네 기둥이에요. 위 글자는 하늘의 기운(천간), 아래 글자는 땅의 기운(지지)이에요.</p>
    <div class="pillars">${cell(SAJU.pil.time, "시주")}${cell(SAJU.pil.day, "일주 · 나")}${cell(SAJU.pil.month, "월주")}${cell(SAJU.pil.year, "년주")}</div>
    <p class="body">가운데 <b>일주의 위 글자 ${STEM_H[SAJU.pil.day.s]}(${STEM_K[SAJU.pil.day.s]})</b>가 사주의 주인공, 곧 「나」를 뜻해요. 다음 쪽에서 이 글자의 결을 읽어요.</p>
    <div class="notice-box">계산 기준: 한국 표준시, 년·월은 입춘·절입 시각으로 나눕니다. 태어난 시각을 모르면 정오로 보고 시주는 비워 둡니다. 자시를 밤 11시 30분부터 보는 등 보는 법에 따라 시주가 달라질 수 있어요.</div>
  </div>`, "SAJU");
  const ds = B.saju.daystem[SAJU.pil.day.s];
  textPage(`일간 · ${STEM_H[SAJU.pil.day.s]}`, ds);
  const mx = Math.max(...SAJU.counts, 1), E = B.saju.element;
  page("", `<div class="inner fit">
    ${kick("FIVE ELEMENTS")}<h2 class="t">다섯 기운의 균형</h2>
    <div class="els">${SAJU.counts.map((n, i) => `<div class="el"><span>${EL_K[i]}<small>${EL_H[i]}</small></span><div><i style="width:${(n / mx) * 100}%;background:${EL_C[i]}"></i></div><b>${n}</b></div>`).join("")}</div>
    <div class="card"><h3><i>${EL_H[SAJU.strong]}</i>가장 많은 기운 · ${SAJU.strongs.map((i) => EL_K[i]).join("·")}${SAJU.strongs.length > 1 ? " (같은 수)" : ""}</h3><p>${SAJU.strongs.length > 1 ? `${SAJU.strongs.map((i) => EL_K[i]).join("·")} 기운이 같은 수로 많아요. 그중 ${EL_K[SAJU.strong]} 기운의 결을 읽어 보면 — ` : ""}${esc(E[SAJU.strong].many)}</p>
      <p class="tipline"><b>넘칠 때 다스리는 팁</b> ${(E[SAJU.strong].balance || []).map(esc).join(" · ")}</p></div>
    <div class="card warm" style="margin-top:3mm"><h3><i>${EL_H[SAJU.weak]}</i>가장 적은 기운 · ${SAJU.weaks.map((i) => EL_K[i]).join("·")}${SAJU.weaks.length > 1 ? " (같은 수)" : ""}</h3><p>${esc(E[SAJU.weak].few)}</p></div>
    <div class="points"><b>적은 기운을 채우는 생활 팁 · ${EL_K[SAJU.weak]}</b>${FILL[SAJU.weak].map((x) => `<span>${esc(x)}</span>`).join("")}</div>
  </div>`, "ELEMENTS");
  const tgx = B.saju.tengod[SAJU.tenGod];
  page("", `<div class="inner fit">
    ${kick("TEN GODS")}<h2 class="t">${esc(tgx.title)}</h2>
    <p class="body lead">나(일간 ${EL_K[SAJU.de]})를 기준으로 나머지 글자들의 관계를 세어 보면, 가장 두드러지는 갈래는 「${SAJU.tenGod}」이에요.</p>
    <p class="body">${esc(tgx.body)}</p>
    <div class="tg">${["비견", "식상", "재성", "관성", "인성"].map((k) => `<span class="${k === SAJU.tenGod ? "on" : ""}">${k}</span>`).join("")}</div>
  </div>`, "TEN GODS");
  const sx = B.sajuType?.[EL_K[SAJU.de]];
  if (sx) textPage(`${EL_K[SAJU.de]} × ${CODE}`, sx);
}

// ── 앞으로 13개월 ──
chapter("앞으로 13개월의 흐름", "이번 달부터 내년 이맘때까지 — 재미로 보는 마음 달력", SCENE("months"));
const START = Q.get("from") ? new Date(Q.get("from") + "-01T00:00:00") : new Date();
const MONTHS = Array.from({ length: 13 }, (_, i) => new Date(START.getFullYear(), START.getMonth() + i, 1));
const TAG = ["up", "care", "up", "rest", "up", "rest", "up", "care", "up", "up", "care", "rest", "up"];
const TAGN = { up: "상승", rest: "쉼표", care: "돌봄" };
const ym = (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
const MC = B.content.months || [];
page("", `<div class="inner">
  ${kick("13 MONTHS")}<h2 class="t">13개월 마음 달력</h2>
  <div class="mo-first"><span>이번 달</span><b>${ym(MONTHS[0])}</b><span class="tag ${TAG[0]}">${TAGN[TAG[0]]}</span><p>${esc(MC[0]?.lead || "")}</p></div>
  <div class="months">${MONTHS.slice(1).map((d, k) => { const i = k + 1; return `<div class="mo"><b>${d.getMonth() + 1}월</b>${d.getMonth() === 0 ? `<small class="yr">${d.getFullYear()}</small>` : ""}<span class="tag ${TAG[i]}">${TAGN[TAG[i]]}</span><p>${esc(MC[i]?.lead || "")}</p></div>`; }).join("")}</div>
  <p class="mo-range">${ym(MONTHS[0])} ~ ${ym(MONTHS[12])} · 운세가 아니라 한 달을 보내는 마음가짐 제안이에요</p>
</div>`, "13 MONTHS");
MC.slice(0, 13).forEach((c, i) => textPage(`${ym(MONTHS[i])} · ${TAGN[TAG[i]]}`, c));

// ── 소장 페이지 ──
chapter("소장 페이지", "휴대폰 배경화면 3종 · 액자용 포스터", SCENE("wall1"));
[["wall1", "배경화면 1 · 달 위의 모리"], ["wall2", "배경화면 2 · 별 쿠션"], ["wall3", "배경화면 3 · 숲속 산책"]].forEach(([k, cap]) => page("", `<div class="inner">
  ${kick("KEEP")}<h2 class="t">${cap}</h2>
  <div class="phone"><img src="${SCENE(k)}"><div class="clock">9:41</div></div>
  <p class="body center">1080×2340 크기 파일로 따로 드려요. 휴대폰 잠금화면에 맞춰 위쪽에 시계 자리를 비워 두었어요.</p>
</div>`, "KEEP"));
page("", `<div class="inner">
  ${kick("POSTER")}<h2 class="t">액자용 포스터</h2>
  <div class="poster-mini"><div class="img"><img src="${SCENE("profile")}"></div><b>${CODE} 모리</b><span>${esc(T.name)}</span></div>
  <div class="frame-tip">🖼️ <b>액자 팁</b> — A4 포스터는 <b>A4 액자(21×29.7cm)</b>, 여백을 두고 싶으면 <b>A3 액자 + 매트</b>에 넣으면 갤러리 느낌이 나요. 추천 액자는 리포트 페이지 아래쪽 링크에서 볼 수 있어요.</div>
</div>`, "POSTER");

// ── 마무리 편지 + 뒤표지 ──
page("", `<div class="inner fit">
  <div class="kicker">A LETTER FROM MORI</div><h2 class="t">${esc(NAME)} 님에게</h2>
  <p class="body lead">여기까지 함께 걸어 줘서 고마워요. 나는 ${esc(NAME)} 님 마음숲에 사는 ${esc(T.name)}예요.</p>
  <p class="body">이 책에 적힌 말들은 ${esc(NAME)} 님을 정해 버리는 말이 아니라, 숲을 걷다가 잠깐 들여다보는 지도 같은 거예요. 맞는 길도 있고 아닌 길도 있을 거예요. 아닌 길은 지워도 괜찮아요. 숲은 ${esc(NAME)} 님이 걸을 때마다 조금씩 모양이 바뀌니까요.</p>
  <p class="body">힘든 날엔 ${esc(V.name)}의 오두막을 떠올려 주세요. 나는 거기서 늘 이렇게 말하고 있을 거예요.</p>
  <div class="quote"><img src="${IMG(CODE)}"><p>“${esc(W.says)}”</p></div>
</div>`, "LETTER");
page("back", `<div class="inner"><img src="${IMG(CODE)}"><p>달라서 틀린 게 아니라,<br>달라서 숲이 완성돼요.</p><small>MORI · mbtitest.co.kr</small></div>`);

// 차례 채우기
pages[TOC_INDEX] = pages[TOC_INDEX].replace("%%TOC%%", toc.map(([n, t, s, p]) => `<li><span class="no">${String(n).padStart(2, "0")}</span><span class="tt">${esc(t)}<small>${esc(s)}</small></span><span class="pg">${p}</span></li>`).join(""));
document.getElementById("book").innerHTML = pages.join("");
window.PAGE_COUNT = pageNo;

// 넘치는 쪽은 글자를 한 단계씩 줄인다(최대 3단계). 그래도 넘치면 OVERFLOW 에 남겨 render.py 가 알린다.
window.OVERFLOW = [];
document.fonts.ready.then(() => {
  document.querySelectorAll(".page .fit").forEach((el, i) => {
    for (let k = 1; k <= 3 && el.scrollHeight > el.clientHeight + 1; k++) el.dataset.tight = k;
    if (el.scrollHeight > el.clientHeight + 1) window.OVERFLOW.push(el.closest(".page").querySelector(".folio b")?.textContent || "?");
  });
  window.READY = true;
});

// 배경화면 3종 + 포스터 (따로 내려받는 파일)
document.getElementById("extras").innerHTML = `
  <div class="wall" id="wall1"><img class="bg" src="${SCENE("wall1")}"><div class="foot">${CODE} 모리 · ${esc(T.name)}</div></div>
  <div class="wall" id="wall2"><img class="bg" src="${SCENE("wall2")}"><div class="foot">“${esc(W.says)}”</div></div>
  <div class="wall" id="wall3"><img class="bg" src="${SCENE("wall3")}"><div class="foot">${esc(V.name)}</div></div>
  <div class="poster" id="poster"><div class="top">MORI · 마음숲</div><div class="img"><img src="${SCENE("profile")}"></div><h3>${CODE} 모리</h3><div class="nm">${esc(T.name)}</div><div class="ln">${esc(W.line)}<br>“${esc(W.says)}”</div><div class="vil">${esc(V.name)} · ${esc(NAME)}</div></div>`;
