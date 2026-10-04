/**
 * 관리자 「리포트 판매」 화면 (/admin/report). handleAdmin 이 로그인 확인 뒤에만 부릅니다.
 *
 * - 페이앱 연동 KEY·VALUE 등록(값은 보여주지 않고 글자 수만) — 대화창·코드에 키를 두지 않으려고 여기서 넣습니다.
 * - 판매 열기 스위치. 판매자 표시 정보(lib/report-config.ts SELLER)가 다 차야 실제로 열립니다.
 * - 1,000원 시험 결제: 진짜 결제창을 띄웁니다. 결제 후 「취소」로 바로 돌려받습니다.
 * - 주문 목록·통보 기록·결제 취소.
 */
import {
  BIRTH_TIME_SLOTS,
  isSellerInfoComplete,
  MBTI_TYPES,
  PAYAPP_USERID,
  REPORT_EVENT,
  REPORT_EVENT_PRICE,
  REPORT_REGULAR_PRICE,
  reportPrice,
  REPORT_TEST_PRICE,
  SELLER,
} from "../lib/report-config";
import { bookTypes, hasBook, keyWorks } from "./report-books";
import { readSetting, writeSetting } from "./naver";
import { findTelegramChatId, sendTelegram, telegramConfig, TELEGRAM_TOKEN_RE } from "./telegram";
import { SOURCE_LABELS } from "../lib/analytics";
import { createOrder, ensureReportSchema, logEvent, payappKeys, payappPost, salesOpen, type OrderRow } from "./report";

type Helpers = {
  esc: (v: unknown) => string;
  shell: (title: string, body: string) => string;
  html: (body: string) => Response;
  redirect: (to: string) => Response;
};

/**
 * D1 의 CURRENT_TIMESTAMP 와 toISOString 은 UTC 라, 페이앱이 주는 결제 시각(한국 시각)과 9시간 어긋나 보였습니다.
 * 관리자 화면에서는 모두 한국 시각으로 맞춰 보여 줍니다.
 */
export function kst(value: string): string {
  if (!value) return "";
  const at = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(at.getTime())) return value;
  return new Date(at.getTime() + 9 * 3600_000).toISOString().replace("T", " ").slice(0, 19);
}

/**
 * 유입 경로 칸: 어디서 왔는지(스레드·네이버 검색…) + 리퍼러 주소 + utm + 처음 연 페이지 + 어느 버튼으로 주문 화면에 왔는지.
 * 페이스북·스레드 앱은 리퍼러를 안 보내는 일이 많아 「직접 유입」으로 잡힙니다 — 링크에 utm 을 붙이면 메뉴·게시물까지 갈립니다.
 */
const ENTRY_KO: Record<string, string> = { "result-card": "결과 화면 카드", "report-cta": "글·검사 안내 링크" };
function sourceCell(o: OrderRow, esc: (v: unknown) => string): string {
  if (!o.src && !o.entry) return `<small class="muted">기록 전 주문</small>`;
  const parts = [
    `<b>${esc(SOURCE_LABELS[o.src ?? ""] ?? o.src ?? "")}</b>${o.ref_host ? ` <small>${esc(o.ref_host)}</small>` : ""}`,
    o.utm ? `<small>utm ${esc(o.utm)}</small>` : "",
    o.landing ? `<small>첫 페이지 ${esc(o.landing)}</small>` : "",
    `<small>${esc(ENTRY_KO[o.entry ?? ""] ?? (o.entry || "주문 화면 직접"))} · ${o.device === "mobile" ? "모바일" : "PC"}</small>`,
  ];
  return parts.filter(Boolean).join("<br>");
}

const STATUS_KO: Record<string, string> = {
  pending: "결제 대기", paid: "결제 완료", partial: "부분 취소", refunded: "환불(승인취소)", cancelled: "요청 취소", failed: "결제창 실패",
};

export async function handleReportAdmin(request: Request, url: URL, path: string, db: D1Database, h: Helpers): Promise<Response> {
  await ensureReportSchema(db);
  const { esc, shell, html, redirect } = h;

  if (request.method === "POST") {
    const form = await request.formData();
    const val = (k: string) => String(form.get(k) ?? "").trim();

    if (path === "/admin/report/keys") {
      // 빈 칸은 기존 값을 지우지 않습니다. 공백·줄바꿈이 섞여 들어오는 일이 잦아 걷어냅니다.
      const key = val("linkkey").replace(/\s+/g, "");
      const value = val("linkval").replace(/\s+/g, "");
      if (key) await writeSetting(db, "payapp_linkkey", key);
      if (value) await writeSetting(db, "payapp_linkval", value);
      const contentKey = val("content_key").replace(/\s+/g, "");
      if (contentKey) {
        // 틀린 키를 넣으면 손님이 결제하고도 못 보므로, 실제로 풀리는지 확인하고 저장합니다.
        if (!(await keyWorks(contentKey))) return redirect("/admin/report/?err=contentkey");
        await writeSetting(db, "report_content_key", contentKey);
      }
      return redirect("/admin/report/?saved=1");
    }

    if (path === "/admin/report/telegram") {
      // 토큰만 넣으면 봇에게 마지막으로 말을 건 대화를 찾아 대화 ID 를 채웁니다.
      const token = val("tg_token").replace(/\s+/g, "");
      if (token && !TELEGRAM_TOKEN_RE.test(token)) return redirect("/admin/report/?err=tgtoken");
      if (token) await writeSetting(db, "telegram_bot_token", token);
      let chatId = val("tg_chat").replace(/\s+/g, "");
      if (!chatId) {
        const saved = await telegramConfig(db);
        chatId = saved.chatId || (await findTelegramChatId(saved.token));
      }
      if (!chatId) return redirect("/admin/report/?err=tgchat");
      await writeSetting(db, "telegram_chat_id", chatId);
      return redirect("/admin/report/?saved=1");
    }

    if (path === "/admin/report/telegram-test") {
      const ok = await sendTelegram(db, "mbtitest 리포트 판매 알림 시험입니다. 이 메시지가 보이면 결제·환불 알림이 여기로 옵니다.");
      return redirect(ok ? "/admin/report/?tgsent=1" : "/admin/report/?err=tgsend");
    }

    if (path === "/admin/report/open") {
      await writeSetting(db, "report_open", val("open") === "1" ? "1" : "0");
      return redirect("/admin/report/?saved=1");
    }

    if (path === "/admin/report/test") {
      const keys = await payappKeys(db);
      if (!keys.linkkey || !keys.linkval) return redirect("/admin/report/?err=keys");
      const type = val("type").toUpperCase();
      const phone = val("phone").replace(/\D/g, "");
      if (!hasBook(type) || !/^01[016789]\d{7,8}$/.test(phone)) return redirect("/admin/report/?err=test");
      const left = ["E", "S", "T", "J"];
      // 시험 주문은 유형에 맞는 그럴듯한 점수로 만듭니다(왼쪽 글자면 65, 아니면 35).
      const scores = [0, 1, 2, 3].map((i) => (type[i] === left[i] ? 65 : 35)) as [number, number, number, number];
      const made = await createOrder(db, { type, scores, name: "시험", birth: "1995-01-20", bt: 7, phone }, { price: REPORT_TEST_PRICE, test: true });
      if (!made.ok) return redirect("/admin/report/?err=pay");
      return redirect(`/admin/report/?test=${encodeURIComponent(made.orderNo)}`);
    }

    if (path === "/admin/report/cancel") {
      const orderNo = val("order_no");
      const row = await db.prepare("SELECT * FROM report_orders WHERE order_no = ?").bind(orderNo).first<OrderRow>();
      if (!row || !row.mul_no || !["paid", "partial", "pending"].includes(row.status)) return redirect("/admin/report/?err=cancel");
      const keys = await payappKeys(db);
      const res = await payappPost({
        cmd: "paycancel",
        userid: PAYAPP_USERID,
        linkkey: keys.linkkey,
        mul_no: row.mul_no,
        cancelmemo: (val("memo") || "고객 요청 취소").slice(0, 100),
        ...(row.status === "pending" ? { cancelmode: "ready" } : {}),
      });
      await logEvent(db, orderNo, "paycancel", `state=${res.state} ${res.errno ?? ""} ${res.errorMessage ?? ""}`);
      if (res.state !== "1") return redirect(`/admin/report/?err=cancelfail&msg=${encodeURIComponent(res.errorMessage ?? "")}`);
      const to = row.status === "pending" ? "cancelled" : "refunded";
      await db.prepare("UPDATE report_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE token = ? AND status = ?").bind(to, row.token, row.status).run();
      return redirect("/admin/report/?saved=1");
    }
    return redirect("/admin/report/");
  }

  // ── 화면 ──
  const keys = await payappKeys(db);
  const contentKey = await readSetting(db, "report_content_key");
  const openFlag = (await readSetting(db, "report_open")) === "1";
  const tg = await telegramConfig(db);
  const live = await salesOpen(db);
  const orders = (await db.prepare("SELECT * FROM report_orders ORDER BY created_at DESC LIMIT 60").all<OrderRow>()).results ?? [];
  const events = (await db.prepare("SELECT order_no, kind, detail, created_at FROM report_events ORDER BY id DESC LIMIT 30").all<{ order_no: string; kind: string; detail: string; created_at: string }>()).results ?? [];
  const sums = (await db.prepare("SELECT status, test, COUNT(*) AS n, SUM(price) AS won FROM report_orders GROUP BY status, test").all<{ status: string; test: number; n: number; won: number }>()).results ?? [];
  const paidReal = sums.filter((s) => !s.test && ["paid", "partial"].includes(s.status));

  const q = url.searchParams;
  const err: Record<string, string> = {
    keys: "연동 KEY·VALUE 를 먼저 넣어 주세요.", test: "시험 결제: 유형(원고가 있는 것)과 휴대폰 번호를 확인하세요.",
    pay: "페이앱 결제요청이 실패했습니다. 아래 기록을 보세요.", cancel: "취소할 수 없는 주문입니다.",
    cancelfail: `페이앱 취소 실패: ${q.get("msg") ?? ""}`,
    contentkey: "원고 해독 키가 맞지 않습니다. report_content.key 파일 내용을 그대로 붙여넣으세요.",
    tgtoken: "봇 토큰 모양이 아닙니다. BotFather 가 준 「숫자:영문」 토큰 전체를 붙여넣으세요.",
    tgchat: "대화 ID 를 찾지 못했습니다. 텔레그램에서 봇에게 아무 말이나 한 번 보낸 뒤 다시 저장하세요.",
    tgsend: "텔레그램 알림을 보내지 못했습니다. 토큰·대화 ID 를 확인하세요.",
  };
  const testOrder = q.get("test") ? orders.find((o) => o.order_no === q.get("test")) : null;
  const testBox = testOrder
    ? `<div class="box" style="border-color:#7657d6"><h2>시험 결제 주문을 만들었습니다 — ${esc(testOrder.order_no)}</h2>
<p class="note">아래 결제창에서 ${REPORT_TEST_PRICE.toLocaleString()}원을 결제하세요. 결제가 끝나면 이 화면을 새로고침해 상태가 「결제 완료」로 바뀌는지, 열람 링크가 열리는지 확인하고 표의 「취소」로 돌려받습니다.</p>
<p><a href="${esc(testOrder.payurl)}" target="_blank" rel="noopener"><b>① 결제창 열기</b></a> · <a href="/report/done/?o=${testOrder.token}" target="_blank" rel="noopener">② 결제 완료 화면(손님이 보는 화면)</a> · <a href="/report-app/?o=${testOrder.token}" target="_blank" rel="noopener">리포트 열람 화면</a></p></div>`
    : "";

  const body = `<div class="wrap">
<div class="head"><div><h1>리포트 판매</h1><p>${esc(SELLER.name)} · 페이앱 ${esc(PAYAPP_USERID)} · 지금 판매가 ${reportPrice().toLocaleString()}원 (이벤트 ${esc(REPORT_EVENT.from)}~${esc(REPORT_EVENT.to)} ${REPORT_EVENT_PRICE.toLocaleString()}원 · 그 뒤 ${REPORT_REGULAR_PRICE.toLocaleString()}원)</p></div>
<nav class="ranges"><a href="/admin/">접속 현황</a><a href="/admin/report/" class="on">리포트 판매</a></nav></div>
${q.get("saved") ? `<p class="note" style="color:#3f7d5c">저장했습니다.</p>` : ""}
${q.get("tgsent") ? `<p class="note" style="color:#3f7d5c">텔레그램으로 시험 알림을 보냈습니다. 휴대폰에서 확인하세요.</p>` : ""}
${q.get("err") ? `<p class="note" style="color:#b6483c">${esc(err[q.get("err") ?? ""] ?? "오류")}</p>` : ""}
${testBox}
<div class="cards">
<div><b>${live ? "판매 중" : "닫힘"}</b><span>손님 주문</span></div>
<div><b>${paidReal.reduce((a, s) => a + s.n, 0)}</b><span>실결제 건수</span></div>
<div><b>${paidReal.reduce((a, s) => a + (s.won ?? 0), 0).toLocaleString()}원</b><span>실결제 금액(환불 제외)</span></div>
<div><b>${bookTypes().length}/16</b><span>원고 준비된 유형</span></div>
</div>

<div class="box"><h2>판매 열기</h2>
<p class="note">아래가 모두 갖춰져야 손님 주문이 열립니다.<br>
① 페이앱 연동 키: ${keys.linkkey && keys.linkval ? `등록됨 (KEY ${keys.linkkey.length}자 · VALUE ${keys.linkval.length}자)` : "<b style='color:#b6483c'>미등록</b>"}
 · 원고 해독 키: ${contentKey ? "등록됨" : "<b style='color:#b6483c'>미등록</b>"}<br>
② 판매자 표시 정보: ${isSellerInfoComplete() ? "완료" : "<b style='color:#b6483c'>미완료 — 통신판매업 신고번호·주소·연락처를 lib/report-config.ts 에 채워야 합니다</b>"}<br>
③ 스위치: ${openFlag ? "켜짐" : "꺼짐"}</p>
<form method="post" action="/admin/report/open" class="row"><input type="hidden" name="open" value="${openFlag ? "0" : "1"}">
<button type="submit">${openFlag ? "판매 닫기" : "판매 열기"}</button></form></div>

<div class="box"><h2>페이앱 연동 KEY · VALUE · 원고 해독 키</h2>
<p class="note">페이앱 판매자 관리자 → 설정메뉴 → 연동정보의 값을 붙여넣습니다. 원고 해독 키는 PC의 <code>D:/00 cloud/report_content.key</code> 파일 내용입니다(저장소가 공개라 원고를 암호문으로 올립니다). 저장된 값은 다시 보여주지 않습니다. 빈 칸은 기존 값을 지우지 않습니다.</p>
<form method="post" action="/admin/report/keys" autocomplete="off"><div class="fields">
<label><span>연동 KEY</span><input name="linkkey" autocomplete="off" spellcheck="false" placeholder="${keys.linkkey ? "바꿀 때만 입력" : "붙여넣으세요"}"></label>
<label><span>연동 VALUE</span><input name="linkval" autocomplete="off" spellcheck="false" placeholder="${keys.linkval ? "바꿀 때만 입력" : "붙여넣으세요"}"></label>
<label><span>원고 해독 키</span><input name="content_key" autocomplete="off" spellcheck="false" placeholder="${contentKey ? "바꿀 때만 입력" : "report_content.key 내용"}"></label>
</div><button type="submit" style="margin-top:12px">저장</button></form></div>

<div class="box"><h2>텔레그램 알림 (결제·환불)</h2>
<p class="note">결제가 끝나거나 환불되면 텔레그램으로 알려 줍니다. 지금: ${tg.token ? "토큰 등록됨" : "<b style='color:#b6483c'>토큰 미등록</b>"} · ${tg.chatId ? "대화 ID 등록됨" : "<b style='color:#b6483c'>대화 ID 미등록</b>"}<br>
① 텔레그램 BotFather → /mybots → 봇 고르기 → API Token 을 복사해 아래에 붙여넣습니다.<br>
② 저장 전에 그 봇에게 아무 말이나 한 번 보내 두면 대화 ID 는 비워 둬도 자동으로 찾습니다.<br>
저장된 값은 다시 보여주지 않습니다. 빈 칸은 기존 값을 지우지 않습니다.</p>
<form method="post" action="/admin/report/telegram" autocomplete="off"><div class="fields">
<label><span>봇 토큰</span><input name="tg_token" autocomplete="off" spellcheck="false" placeholder="${tg.token ? "바꿀 때만 입력" : "123456789:AA…"}"></label>
<label><span>대화 ID</span><input name="tg_chat" autocomplete="off" spellcheck="false" placeholder="${tg.chatId ? "바꿀 때만 입력" : "비워 두면 자동으로 찾음"}"></label>
</div><button type="submit" style="margin-top:12px">저장</button></form>
${tg.token && tg.chatId ? `<form method="post" action="/admin/report/telegram-test" style="margin-top:10px"><button type="submit">시험 알림 보내기</button></form>` : ""}</div>

<div class="box"><h2>${REPORT_TEST_PRICE.toLocaleString()}원 시험 결제</h2>
<p class="note">판매를 열지 않아도 됩니다. 진짜 결제창이 열리고, 결제 완료 통보·열람·취소까지 실제 흐름을 그대로 탑니다. 결제창 링크는 입력한 휴대폰으로 가지 않고(문자 끔) 다음 화면에 나옵니다.</p>
<form method="post" action="/admin/report/test" class="row" autocomplete="off">
<select name="type">${MBTI_TYPES.filter((t) => hasBook(t)).map((t) => `<option>${t}</option>`).join("")}</select>
<input name="phone" placeholder="결제할 휴대폰 번호" inputmode="numeric" required>
<button type="submit">시험 주문 만들기</button></form>
<p class="note">사주 시험값: 1995-01-20 ${esc(BIRTH_TIME_SLOTS[7])}</p></div>

<div class="box"><h2>주문 (최근 60건)</h2><div class="scroll"><table><thead><tr>
<th>주문번호</th><th>유형</th><th>금액</th><th>상태</th><th>휴대폰</th><th>유입 경로</th><th>결제</th><th>첫 열람</th><th>열람</th><th></th></tr></thead><tbody>
${orders
  .map(
    (o) => `<tr><td>${esc(o.order_no)}${o.test ? " <small>(시험)</small>" : ""}<br><small class="muted">${esc(kst(o.created_at))}</small></td>
<td>${esc(o.type)}</td><td>${o.price.toLocaleString()}</td><td>${esc(STATUS_KO[o.status] ?? o.status)}</td>
<td><small>***-${esc(o.phone_last4)}</small></td><td>${sourceCell(o, esc)}</td>
<td><small>${esc(o.paid_at)}</small></td><td><small>${esc(o.first_viewed_at ? kst(o.first_viewed_at) : "-")}</small></td><td>${o.view_count}</td>
<td>${o.status === "pending" && o.payurl ? `<a href="${esc(o.payurl)}" target="_blank" rel="noopener">결제창</a> ` : ""}${
      // 열람 링크는 시험 주문에만 둡니다. 손님 주문을 관리자가 열면 「첫 열람」이 찍혀 환불 판단 근거가 흐려집니다.
      o.test && ["paid", "partial"].includes(o.status) ? `<a href="/report-app/?o=${o.token}" target="_blank" rel="noopener">열기</a> ` : ""
    }${["paid", "partial", "pending"].includes(o.status) && o.mul_no
      ? `<form method="post" action="/admin/report/cancel" onsubmit="return confirm('${esc(o.order_no)} 를 취소할까요? 결제된 주문이면 환불됩니다.')" style="display:inline">
<input type="hidden" name="order_no" value="${esc(o.order_no)}"><input name="memo" placeholder="취소 사유" style="width:90px;padding:4px 6px"><button type="submit" style="padding:4px 10px">취소</button></form>`
      : ""}</td></tr>`,
  )
  .join("") || `<tr><td colspan="8" class="muted">아직 주문이 없습니다.</td></tr>`}
</tbody></table></div></div>

<div class="box"><h2>페이앱 기록 (최근 30건)</h2><div class="scroll"><table><thead><tr><th>시각</th><th>주문번호</th><th>종류</th><th>내용</th></tr></thead><tbody>
${events.map((e) => `<tr><td><small>${esc(kst(e.created_at))}</small></td><td>${esc(e.order_no)}</td><td>${esc(e.kind)}</td><td><small>${esc(e.detail)}</small></td></tr>`).join("") || `<tr><td colspan="4" class="muted">기록 없음</td></tr>`}
</tbody></table></div></div>
</div>`;
  return html(shell("리포트 판매", body));
}
