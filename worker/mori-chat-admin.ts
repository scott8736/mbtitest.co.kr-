/**
 * 관리자 「리포트 판매」 화면 안의 「모리 AI 대화」 칸 (2026-10-08 초안). worker/report-admin.ts 가 부릅니다.
 *
 * - 중계 워커(mori-chat-api) 주소·확인 키 등록. 값은 보여 주지 않고 글자 수만.
 * - 대화 열기 스위치. 꺼져 있으면 손님 화면은 「준비 중」, 대화권 판매도 닫힘.
 * - 하루 사용량: 무료·리포트·대화권·안내문(위험한 말)·막힘(횟수 없음), 몇 번째 말에서 그만두는지.
 * - 검수용 무료 대화권(0원, 시험 표시): 결제 없이 대화권 흐름을 확인할 때 씁니다.
 */
import { CHAT_FREE_PER_DAY, CHAT_PASS_PRICE, CHAT_PASS_SIZE, CHAT_REPORT_DAYS, CHAT_REPORT_PER_DAY } from "../lib/mori-chat";
import { REPORT_TEST_PRICE } from "../lib/report-config";
import { readSetting, writeSetting } from "./naver";
import { chatOpen, createPassOrder, ensureChatSchema, passSalesOpen, relayConfig } from "./mori-chat";
import { logEvent, newToken, payappKeys, phoneHash } from "./report";

/** 처리한 POST 면 돌아갈 주소, 아니면 null. */
export async function moriChatAdminPost(path: string, form: FormData, db: D1Database): Promise<string | null> {
  if (!path.startsWith("/admin/report/mori-chat")) return null;
  await ensureChatSchema(db);
  const val = (k: string) => String(form.get(k) ?? "").trim();

  if (path === "/admin/report/mori-chat/relay") {
    const url = val("relay_url").replace(/\s+/g, "");
    const secret = val("relay_secret").replace(/\s+/g, "");
    if (url && !/^https:\/\/[^\s/]+\.workers\.dev\/chat$/.test(url)) return "/admin/report/?err=chaturl#mori-chat";
    if (secret && secret.length < 32) return "/admin/report/?err=chatsecret#mori-chat";
    if (url) await writeSetting(db, "mori_chat_relay_url", url);
    if (secret) await writeSetting(db, "mori_chat_relay_secret", secret);
    // 기상청 초단기실황 키(공공데이터포털, 이미 인코딩된 값 그대로). 「-」 하나만 넣으면 지웁니다.
    const kma = val("kma_key").replace(/\s+/g, "");
    if (kma === "-") await writeSetting(db, "kma_service_key", "");
    else if (kma) await writeSetting(db, "kma_service_key", kma);
    return "/admin/report/?saved=1#mori-chat";
  }
  if (path === "/admin/report/mori-chat/open") {
    await writeSetting(db, "mori_chat_open", val("open") === "1" ? "1" : "0");
    return "/admin/report/?saved=1#mori-chat";
  }
  if (path === "/admin/report/mori-chat/free-pass") {
    // 결제 없이 결제 완료 상태의 0원 시험 대화권. 매출에는 잡히지 않습니다.
    const token = newToken();
    const orderNo = `MC-ADMIN-${Date.now().toString(36).toUpperCase()}`;
    await db
      .prepare(
        `INSERT INTO mori_chat_passes (token, order_no, size, price, test, phone_last4, phone_hash, status, pay_type, paid_at, consent_version, consent_at)
         VALUES (?, ?, ?, 0, 1, '0000', ?, 'paid', 'admin-free', ?, 'admin', ?)`,
      )
      .bind(token, orderNo, CHAT_PASS_SIZE, await phoneHash(db, "01000000000"), new Date().toISOString(), new Date().toISOString())
      .run();
    await logEvent(db, orderNo, "admin_free", "관리자 검수용 무료 대화권");
    return `/admin/report/?chatpass=${token}#mori-chat`;
  }
  if (path === "/admin/report/mori-chat/test-pay") {
    const keys = await payappKeys(db);
    if (!keys.linkkey || !keys.linkval) return "/admin/report/?err=keys#mori-chat";
    const phone = val("phone").replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phone)) return "/admin/report/?err=test#mori-chat";
    const made = await createPassOrder(db, { phone, test: true, price: REPORT_TEST_PRICE });
    if (!made.ok) return "/admin/report/?err=pay#mori-chat";
    return `/admin/report/?chatpay=${made.token}#mori-chat`;
  }
  return "/admin/report/#mori-chat";
}

type Row = { day: string; kind: string; n: number; devices: number };

/** 추천 카드(리포트·심리테스트) 노출·클릭과 이어가기, 대화에서 온 리포트 주문. 지난 7일. */
async function promoTable(db: D1Database, since: string, esc: (v: unknown) => string): Promise<string> {
  const rows = (await db
    .prepare("SELECT kind, ref, COUNT(*) AS n FROM mori_chat_usage WHERE day >= ? AND kind IN ('promo_seen','promo_click','resume_seen','resume_click') GROUP BY kind, ref")
    .bind(since)
    .all<{ kind: string; ref: string; n: number }>()).results ?? [];
  const refs = [...new Set(rows.filter((r) => r.kind.startsWith("promo")).map((r) => r.ref))].sort((a, b) => (a === "report" ? -1 : b === "report" ? 1 : a.localeCompare(b)));
  const n = (kind: string, ref?: string) => rows.filter((r) => r.kind === kind && (ref === undefined || r.ref === ref)).reduce((a, r) => a + r.n, 0);
  const rate = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");
  const orders = await db
    .prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN status IN ('paid','partial') THEN 1 ELSE 0 END) AS paid FROM report_orders WHERE test = 0 AND entry LIKE 'mori-chat%' AND created_at >= ?")
    .bind(`${since} 00:00:00`)
    .first<{ n: number; paid: number }>();
  const body = refs
    .map((ref) => `<tr><td>${ref === "report" ? "📖 리포트" : esc(ref)}</td><td>${n("promo_seen", ref)}</td><td>${n("promo_click", ref)}</td><td>${rate(n("promo_click", ref), n("promo_seen", ref))}</td></tr>`)
    .join("");
  return `<h3 style="margin-top:16px">대화 속 추천 카드 (지난 7일)</h3>
<p class="note">모리 답 3번 뒤부터 40% 확률로 리포트·심리테스트 카드를 번갈아 띄웁니다(위험한 말 뒤·리포트 산 기기는 리포트 카드 없음).
테스트로 간 사람에게는 다른 페이지 위쪽에 「이어가기」 버튼이 뜹니다: 노출 ${n("resume_seen")} → 누름 ${n("resume_click")} (${rate(n("resume_click"), n("resume_seen"))}).
대화에서 온 리포트 주문(결제창 열기) ${orders?.n ?? 0}건 · 결제 <b>${orders?.paid ?? 0}건</b>.</p>
<div class="scroll"><table><thead><tr><th>카드</th><th>노출</th><th>클릭</th><th>클릭률</th></tr></thead>
<tbody>${body || `<tr><td colspan="4" class="muted">아직 기록이 없습니다.</td></tr>`}</tbody></table></div>`;
}

/** 메인 /admin/ 요약 칸: 오늘·7일 대화한 사람, 대화 수, 막힘, 대화권 매출, 추천 클릭. */
export async function moriChatSummaryBox(db: D1Database): Promise<string> {
  try {
    await ensureChatSchema(db);
    const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
    const since = new Date(Date.now() + 9 * 3600_000 - 6 * 86400_000).toISOString().slice(0, 10);
    const stat = async (from: string) =>
      (await db
        .prepare(
          `SELECT COUNT(DISTINCT CASE WHEN kind IN ('free','report','pass') THEN device END) AS people,
                  SUM(CASE WHEN kind IN ('free','report','pass') THEN 1 ELSE 0 END) AS talks,
                  COUNT(DISTINCT CASE WHEN kind = 'wall' THEN device END) AS walled,
                  SUM(CASE WHEN kind = 'crisis' THEN 1 ELSE 0 END) AS crisis,
                  SUM(CASE WHEN kind = 'promo_click' THEN 1 ELSE 0 END) AS clicks
             FROM mori_chat_usage WHERE day >= ?`,
        )
        .bind(from)
        .first<{ people: number; talks: number; walled: number; crisis: number; clicks: number }>()) ?? { people: 0, talks: 0, walled: 0, crisis: 0, clicks: 0 };
    const [t, w] = [await stat(today), await stat(since)];
    const sales = await db
      .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(price),0) AS won FROM mori_chat_passes WHERE test = 0 AND status IN ('paid','partial') AND created_at >= ?")
      .bind(`${since} 00:00:00`)
      .first<{ n: number; won: number }>();
    const open = await chatOpen(db);
    const cell = (x: { people: number; talks: number; walled: number; crisis: number; clicks: number }) =>
      `<td>${x.people ?? 0}</td><td>${x.talks ?? 0}</td><td>${x.walled ?? 0}</td><td>${x.crisis ?? 0}</td><td>${x.clicks ?? 0}</td>`;
    return `<div class="box"><h2>모리 AI 대화 · ${open ? "열림" : "닫힘"} · <a href="/admin/report/#mori-chat">자세히 →</a></h2>
<p class="note">대화 내용은 저장하지 않습니다(횟수·번째·모델만). 「막힘」은 무료를 다 써 결제 안내를 본 사람, 「위험한 말」은 상담 전화 안내가 나간 횟수 — 0이 아니면 한 번씩 흐름을 확인하세요.
지난 7일 대화권 매출 ${sales?.n ?? 0}건 · ${(sales?.won ?? 0).toLocaleString()}원.</p>
<div class="scroll"><table><thead><tr><th></th><th>대화한 사람</th><th>대화 수</th><th>막힘(명)</th><th>위험한 말</th><th>추천 카드 클릭</th></tr></thead><tbody>
<tr><td>오늘</td>${cell(t)}</tr><tr><td>지난 7일</td>${cell(w)}</tr></tbody></table></div></div>`;
  } catch {
    return "";
  }
}

/** 「모리 AI 대화」 칸 HTML. */
export async function moriChatAdminBox(db: D1Database, q: URLSearchParams, esc: (v: unknown) => string): Promise<string> {
  await ensureChatSchema(db);
  const relay = await relayConfig(db);
  const kmaKey = await readSetting(db, "kma_service_key");
  const openFlag = (await readSetting(db, "mori_chat_open")) === "1";
  const live = await chatOpen(db);
  const selling = await passSalesOpen(db);

  const since = new Date(Date.now() + 9 * 3600_000 - 6 * 86400_000).toISOString().slice(0, 10);
  const rows = (await db
    .prepare("SELECT day, kind, COUNT(*) AS n, COUNT(DISTINCT device) AS devices FROM mori_chat_usage WHERE day >= ? GROUP BY day, kind ORDER BY day DESC")
    .bind(since)
    .all<Row>()).results ?? [];
  const days = [...new Set(rows.map((r) => r.day))];
  const cell = (day: string, kind: string) => rows.find((r) => r.day === day && r.kind === kind);
  const people = (await db
    .prepare("SELECT day, COUNT(DISTINCT device) AS n FROM mori_chat_usage WHERE day >= ? AND kind IN ('free','report','pass') GROUP BY day")
    .bind(since)
    .all<{ day: string; n: number }>()).results ?? [];
  const tableRows = days
    .map((d) => `<tr><td>${esc(d)}</td><td>${people.find((p) => p.day === d)?.n ?? 0}</td><td>${cell(d, "free")?.n ?? 0}</td><td>${cell(d, "report")?.n ?? 0}</td><td>${cell(d, "pass")?.n ?? 0}</td><td>${cell(d, "crisis")?.n ?? 0}</td><td>${cell(d, "wall")?.devices ?? 0}명</td></tr>`)
    .join("");

  // 몇 번째 말까지 하고 그만두나(지난 7일, 기기·하루마다 가장 많이 간 번째). 무료 5번을 정한 근거를 다시 볼 때 씁니다.
  const depth = (await db
    .prepare(
      `SELECT CASE WHEN t >= 10 THEN '10+' ELSE CAST(t AS text) END AS bucket, COUNT(*) AS n FROM (
         SELECT MAX(turn) AS t FROM mori_chat_usage WHERE day >= ? AND kind IN ('free','report','pass') GROUP BY day, device
       ) GROUP BY bucket`,
    )
    .bind(since)
    .all<{ bucket: string; n: number }>()).results ?? [];
  const order = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];
  const depthText = order.map((b) => `${b}번째 ${depth.find((x) => x.bucket === b)?.n ?? 0}`).join(" · ");

  const models = (await db
    .prepare("SELECT model, tier, COUNT(*) AS n FROM mori_chat_usage WHERE day >= ? AND model != '' GROUP BY model, tier ORDER BY n DESC")
    .bind(since)
    .all<{ model: string; tier: string; n: number }>()).results ?? [];

  const passes = (await db
    .prepare("SELECT order_no, size, used, price, test, status, pay_type, paid_at, created_at, token FROM mori_chat_passes ORDER BY created_at DESC LIMIT 30")
    .all<{ order_no: string; size: number; used: number; price: number; test: number; status: string; pay_type: string; paid_at: string; created_at: string; token: string }>()).results ?? [];
  const passRows = passes
    .map((p) => `<tr><td>${esc(p.order_no)}${p.test ? " <small>(시험)</small>" : ""}</td><td>${esc(p.status)}</td><td>${p.price.toLocaleString()}원</td><td>${p.used}/${p.size}</td><td>${esc(p.pay_type)}</td><td>${esc(p.paid_at || p.created_at)}</td></tr>`)
    .join("");

  const made = q.get("chatpass");
  const pay = q.get("chatpay");
  const madeBox = made && /^[0-9a-f]{64}$/.test(made)
    ? `<p class="note" style="color:#3f7d5c">검수용 대화권을 만들었습니다. 이 기기에서 열기: <a href="/mori/chat/?pass=${made}" target="_blank" rel="noopener"><b>대화 화면에 대화권 붙이기</b></a></p>`
    : "";
  const payBox = pay && /^[0-9a-f]{64}$/.test(pay)
    ? `<p class="note" style="color:#7657d6">시험 결제 주문을 만들었습니다. 아래 표의 결제창 주소는 페이앱 관리자에서도 보입니다. 결제 뒤 <a href="/mori/chat/?pass=${pay}" target="_blank" rel="noopener">손님이 돌아오는 화면</a>에서 횟수가 붙는지 보고, 페이앱에서 취소로 돌려받으세요.</p>`
    : "";

  return `<div class="box" id="mori-chat"><h2>모리 AI 대화 (초안)</h2>
<p class="note">하루 무료 ${CHAT_FREE_PER_DAY}번 → 리포트 구매자 ${CHAT_REPORT_DAYS}일 동안 하루 ${CHAT_REPORT_PER_DAY}번 → 대화권 ${CHAT_PASS_SIZE}번 ${CHAT_PASS_PRICE.toLocaleString()}원 (lib/mori-chat.ts)<br>
상태: 대화 <b>${live ? "열림" : "닫힘"}</b> · 대화권 판매 <b>${selling ? "열림" : "닫힘"}</b><br>
① 중계 워커: ${relay.url ? `등록됨 (${esc(relay.url)})` : "<b style='color:#b6483c'>주소 미등록</b>"} · 확인 키: ${relay.secret ? `등록됨 (${relay.secret.length}자)` : "<b style='color:#b6483c'>미등록</b>"}<br>
② 스위치: ${openFlag ? "켜짐" : "꺼짐"} — 대화권 판매는 위 페이앱 키·판매자 정보도 갖춰져야 열립니다.</p>
${madeBox}${payBox}
<form method="post" action="/admin/report/mori-chat/open" class="row"><input type="hidden" name="open" value="${openFlag ? "0" : "1"}">
<button type="submit">${openFlag ? "대화 닫기" : "대화 열기"}</button></form>
<form method="post" action="/admin/report/mori-chat/relay" autocomplete="off" style="margin-top:12px"><div class="fields">
<label><span>중계 주소</span><input name="relay_url" autocomplete="off" spellcheck="false" placeholder="${relay.url ? "바꿀 때만 입력" : "https://mori-chat-api.….workers.dev/chat"}"></label>
<label><span>확인 키</span><input name="relay_secret" autocomplete="off" spellcheck="false" placeholder="${relay.secret ? "바꿀 때만 입력" : "D:/00 cloud/mori_chat_relay.env 내용"}"></label>
<label><span>기상청 키 (날씨)</span><input name="kma_key" autocomplete="off" spellcheck="false" placeholder="${kmaKey ? "등록됨 · 바꿀 때만 입력(지우기는 -)" : "공공데이터포털 단기예보 키(없으면 시간대·기념일만)"}"></label>
</div><button type="submit" style="margin-top:12px">저장</button></form>
<div class="row" style="margin-top:12px;gap:8px;display:flex;flex-wrap:wrap">
<form method="post" action="/admin/report/mori-chat/free-pass"><button type="submit">검수용 무료 대화권 만들기</button></form>
<form method="post" action="/admin/report/mori-chat/test-pay"><input name="phone" placeholder="시험 결제 휴대폰" inputmode="numeric" style="width:150px"> <button type="submit">${REPORT_TEST_PRICE.toLocaleString()}원 시험 결제</button></form>
</div>
<h3 style="margin-top:16px">지난 7일 사용</h3>
<div class="scroll"><table><thead><tr><th>날짜</th><th>대화한 사람</th><th>무료</th><th>리포트 몫</th><th>대화권</th><th>안내문(위험한 말)</th><th>횟수 없어 막힘</th></tr></thead>
<tbody>${tableRows || `<tr><td colspan="7" class="muted">아직 기록이 없습니다.</td></tr>`}</tbody></table></div>
<p class="note">몇 번째 말까지 했나(기기·하루마다): ${depthText}</p>
${await promoTable(db, since, esc)}
<p class="note">모델·키: ${models.map((m) => `${esc(m.model)} ${esc(m.tier)} ${m.n}`).join(" · ") || "-"}</p>
<h3 style="margin-top:16px">대화권 주문</h3>
<p class="note">환불은 결제 후 7일 안 요청만, 페이앱 관리자에서 「남은 횟수 × ${Math.round(CHAT_PASS_PRICE / CHAT_PASS_SIZE)}원」 부분 취소로 합니다. 부분 취소 통보가 오면 남은 횟수는 자동으로 닫힙니다.</p>
<div class="scroll"><table><thead><tr><th>주문</th><th>상태</th><th>금액</th><th>쓴 횟수</th><th>결제수단</th><th>시각</th></tr></thead>
<tbody>${passRows || `<tr><td colspan="6" class="muted">아직 주문이 없습니다.</td></tr>`}</tbody></table></div>
</div>`;
}
