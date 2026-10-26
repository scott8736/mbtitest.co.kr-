// ─────────────────────────────────────────────────────────────────────────────
// 「내 성향 신문」 조판 (2026-10-25)
// 원고는 content/<유형>.js(window.NEWS), 주문 값은 window.PARAMS(사이트) 또는 주소 쿼리(로컬 견본).
// 점수로 바뀌는 부분(여론조사·기자 분석)은 유형과 상관없는 공용 문장이라 여기 있다.
// ─────────────────────────────────────────────────────────────────────────────
const N = window.NEWS;
const Q = new URLSearchParams(window.PARAMS || location.search);
const CODE = N.code;
const NAME = (Q.get("name") || "").trim();
const WHO = NAME || "독자";
const AX = { EI: +(Q.get("ei") ?? 30), SN: +(Q.get("sn") ?? 68), TF: +(Q.get("tf") ?? 64), JP: +(Q.get("jp") ?? 74) };
const IMG = (k) => `img/${CODE}/${k}.jpg`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fill = (s) => esc(String(s ?? "").replaceAll("{N}", WHO));

// 발행일 = 주문일(사이트) 또는 오늘
const d = Q.get("date") ? new Date(Q.get("date") + "T00:00:00+09:00") : new Date();
const DATE = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${"일월화수목금토"[d.getDay()]}요일`;
const PAPER = NAME ? `${NAME}일보` : "내 성향 신문";

// ── 여론조사: 4축 ──
const AXES = [
  ["EI", "외향 E", "내향 I", "에너지를 어디서 얻나"],
  ["SN", "감각 S", "직관 N", "무엇을 먼저 보나"],
  ["TF", "사고 T", "감정 F", "무엇으로 정하나"],
  ["JP", "판단 J", "인식 P", "어떻게 움직이나"],
];
// 축 글자별 한 줄. 정도(살짝·뚜렷·강하게)는 점수로 붙인다.
const LETTER_LINE = {
  E: "사람들과 부딪히며 생각이 정리되고 힘이 난다",
  I: "혼자 있는 시간에 배터리가 다시 찬다",
  S: "눈앞의 사실과 경험을 먼저 믿는다",
  N: "지금보다 ‘그다음’과 가능성을 먼저 본다",
  T: "마음이 불편해도 맞는 쪽을 고른다",
  F: "맞는 말보다 사람이 다치지 않는 쪽을 고른다",
  J: "정해 두어야 마음이 놓인다",
  P: "정해 두지 않아야 숨이 쉬어진다",
};
const level = (p) => (p >= 80 ? "아주 강하게" : p >= 65 ? "뚜렷하게" : "살짝");
const axisInfo = AXES.map(([k, l, r, q]) => {
  const left = AX[k];
  const win = left >= 50 ? l : r;
  const pct = left >= 50 ? left : 100 - left;
  return { k, l, r, q, left, win, pct, letter: win.slice(-1) };
});

function poll() {
  const bars = axisInfo.map((a) => `<div class="bar">
    <div class="lab"><span class="${a.left >= 50 ? "win" : ""}">${a.l} ${a.left}%</span><span class="${a.left < 50 ? "win" : ""}">${a.r} ${100 - a.left}%</span></div>
    <div class="track"><div class="l" style="width:${a.left}%"></div><div class="r" style="width:${100 - a.left}%"></div></div></div>`).join("");
  return `<div class="poll"><div class="q">여론조사 · ${fill("{N}")} 씨 마음속 네 번의 표결</div>${bars}
    <div class="note">검사 문항 응답으로 낸 비율입니다. 50%에 가까울수록 양쪽을 오가는 편입니다.</div></div>`;
}

function analysis() {
  const s = [...axisInfo].sort((a, b) => b.pct - a.pct);
  const top = s[0], low = s[s.length - 1];
  const close = low.pct < 58
    ? ` 반면 ‘${low.q}’ 표결은 ${low.pct}% 대 ${100 - low.pct}%로 접전이었다. 상황에 따라 ${low.l.slice(0, 2)}·${low.r.slice(0, 2)} 양쪽 모습이 다 나올 수 있다는 뜻이다.`
    : ` 가장 표 차이가 작았던 ‘${low.q}’ 표결도 ${low.pct}%로 한쪽에 기울었다. 성향이 비교적 또렷한 편이다.`;
  return `<p class="analysis"><b>기자 분석</b> — 네 번의 표결 가운데 가장 큰 표 차이는 ‘${top.q}’였다(${top.win} ${top.pct}%). ${fill("{N}")} 씨의 응답은 ${level(top.pct)} ‘${LETTER_LINE[top.letter]}’ 쪽으로 기울었다.${close}</p>`;
}

// ── 면 만들기 ──
const pages = [];
let face = 0;
const sheet = (id, section, html, cls = "") => {
  face++;
  pages.push({ id, label: face === 1 ? "1면" : `${face}면 ${section}`,
    html: `<section class="sheet ${cls}" id="${id}">
      ${face === 1 ? "" : `<div class="folio"><span><b>${esc(PAPER)}</b> · ${DATE}</span><span>제${face}면 · ${esc(section)}</span></div>`}
      ${html}</section>` });
};
const cols = (arr) => `<div class="cols">${arr.map((p) => `<p>${fill(p)}</p>`).join("")}</div>`;
// cap 은 이미 fill() 로 이스케이프된 글
const fig = (k, cap, cls = "") => `<figure class="fig ${cls}"><img src="${IMG(k)}" alt=""></figure><p class="cap">${cap}</p>`;

// 1면
const F = N.front;
sheet("p1", "종합", `
  <div class="mast">
    <div class="top"><span>제1호</span><span>${CODE} 특별판</span></div>
    <h1>${esc(PAPER)}</h1>
    <div class="motto">오직 한 사람을 위해 발행하는 신문</div>
  </div>
  <div class="dateline"><span>${DATE}</span><span>${esc(N.nick)}</span></div>
  <span class="kicker">속보</span>
  <h2 class="hl">${fill(F.headline)}</h2>
  <p class="deck">${fill(F.deck)}</p>
  ${fig("front", `▲ ${fill(N.caps.front)}`)}
  ${cols(F.lead)}
  <div class="by">${esc(PAPER)} 성향부</div>
  <hr class="rule">
  ${poll()}
  ${analysis()}
  <hr class="rule">
  <div class="editorial"><h3 class="sub">${fill(F.editorial.title)}</h3>${F.editorial.body.map((p) => `<p class="t">${fill(p)}</p>`).join("")}</div>
`, "front");

// 2면 연애
const L = N.love;
sheet("p2", L.section, `
  <span class="kicker">${esc(L.section)}</span>
  <h2 class="hl">${fill(L.headline)}</h2>
  <p class="deck">${fill(L.deck)}</p>
  ${fig("love", `▲ ${fill(N.caps.love)}`)}
  ${cols(L.body)}
  <div class="box"><h4>${fill(L.box.title)}</h4><ol>${L.box.items.map((i) => `<li>${fill(i)}</li>`).join("")}</ol></div>
`);

// 3면 직장·경제
const W = N.work;
sheet("p3", W.section, `
  <span class="kicker">${esc(W.section)}</span>
  <h2 class="hl">${fill(W.headline)}</h2>
  <p class="deck">${fill(W.deck)}</p>
  ${fig("work", `▲ ${fill(N.caps.work)}`)}
  ${cols(W.body)}
  <hr class="rule">
  <h3 class="sub">${fill(W.money.title)}</h3>
  ${W.money.body.map((p) => `<p class="t">${fill(p)}</p>`).join("")}
`);

// 4면 사회
const S = N.society;
sheet("p4", S.section, `
  <span class="kicker">${esc(S.section)}</span>
  <h2 class="hl">${fill(S.headline)}</h2>
  <p class="deck">${fill(S.deck)}</p>
  ${S.incidents.map((i, n) => `<div class="inc"><b>사건 ${n + 1}. ${fill(i.title)}</b><span>${fill(i.body)}</span></div>`).join("")}
  <div class="box"><h4>재발 방지 대책</h4><ul>${S.tips.map((t) => `<li>${fill(t)}</li>`).join("")}</ul></div>
`);

// 5면 관계
const R = N.people;
sheet("p5", R.section, `
  <span class="kicker">${esc(R.section)}</span>
  <h2 class="hl">${fill(R.headline)}</h2>
  <p class="deck">${fill(R.deck)}</p>
  <div class="pair best"><div class="code">${R.best.code}</div><div><span class="tag">가장 잘 맞는 짝</span><p>${fill(R.best.why)}</p></div></div>
  ${R.good.map((g) => `<div class="pair"><div class="code">${g.code}</div><div><span class="tag">편한 사이</span><p>${fill(g.why)}</p></div></div>`).join("")}
  ${R.hard.map((h) => `<div class="pair"><div class="code">${h.code}</div><div><span class="tag">노력이 필요한 사이 · 이렇게 해 보자</span><p>${fill(h.tip)}</p></div></div>`).join("")}
`);

// 6면 생활
const V = N.life;
// 신문 흑백에 맞게 글자 기호(︎ = 컬러 이모지 말고 글자로)
const SKY = { "맑음": "☀︎", "구름": "☁︎", "갬": "◑", "비": "☂︎" };
sheet("p6", V.section, `
  <span class="kicker">${esc(V.section)}</span>
  <h2 class="hl">이번 주 마음 날씨</h2>
  <p class="deck">앞날을 맞히는 예보가 아니다. ${esc(CODE)}에게 흔한 날씨별 처방을 요일에 빗대 정리했다</p>
  <div class="wx">${V.forecast.map((w) => `<div><div class="d"><span>${esc(w.when)}</span><span>${esc(w.sky)}</span></div><div class="s">${SKY[w.sky] || ""}</div><p>${fill(w.text)}</p></div>`).join("")}</div>
  <div class="ad"><div class="t">${fill(V.ad.title)}</div><p>${fill(V.ad.copy)}</p></div>
  <p class="quote">${fill(V.quote)}</p>
  <!-- 2026-10-25 미끼 상품 → 본 상품(9,900원 책) 안내. 할인 문구 없음(할인권 폐지 결정). 진짜 <a> 링크. -->
  <div class="next">
    <div class="t">다음 호 예고</div>
    <p>신문 6면에 다 싣지 못한 이야기가 있습니다. 연애·친구·일·공부·돈·방전과 충전까지 장마다 깊게 풀고, 16유형 궁합과 13개월 흐름도 담은 A4 104쪽 「MBTI 유형 마음숲 안내서」가 있습니다.</p>
    <a href="/report/">${esc(CODE)} 안내서 미리보기 ›</a>
  </div>
  <p class="notice">이 신문은 공식 MBTI® 검사 결과가 아니라 자기이해를 돕기 위한 읽을거리입니다. 의료·심리 진단을 대신하지 않습니다. MBTI®는 The Myers-Briggs Company의 등록상표이며 이 신문은 공식 검사와 관련이 없습니다. 기사 속 인물 평가는 검사 응답을 바탕으로 쓴 글입니다.</p>
`);

document.getElementById("app").innerHTML =
  `<nav class="nav">${pages.map((p) => `<a href="#${p.id}">${esc(p.label)}</a>`).join("")}</nav>` + pages.map((p) => p.html).join("");
document.title = `${PAPER} — ${CODE}`;
