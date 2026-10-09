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
  TOSS_REPORT_PRICE,
} from "../lib/report-config";
import { bookTypes, hasBook, keyWorks } from "./report-books";
import { readSetting, writeSetting } from "./naver";
import { findTelegramChatId, sendTelegram, telegramConfig, TELEGRAM_TOKEN_RE } from "./telegram";
import { SOURCE_LABELS } from "../lib/analytics";
import { moriChatAdminBox, moriChatAdminPost } from "./mori-chat-admin";
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

/**
 * 주문 표에서 골라 지울 수 있는 주문(2026-10-06).
 * 시험 주문만 지웁니다 — 손님 주문은 환불 의무·매출 증빙 때문에 남겨야 합니다.
 * 시험 주문도 돈이 걸린 채로 남아 있으면(1,000원 결제 완료·결제 대기) 먼저 「취소」해야 지울 수 있습니다.
 */
function deletable(o: { test: number; price: number; status: string }): boolean {
  return !!o.test && (o.price === 0 || !["paid", "partial", "pending"].includes(o.status));
}
const DELETABLE_SQL = "test = 1 AND (price = 0 OR status NOT IN ('paid','partial','pending'))";

export async function handleReportAdmin(request: Request, url: URL, path: string, db: D1Database, h: Helpers): Promise<Response> {
  await ensureReportSchema(db);
  const { esc, shell, html, redirect } = h;

  if (request.method === "POST") {
    const form = await request.formData();
    const val = (k: string) => String(form.get(k) ?? "").trim();

    // 모리 AI 대화 칸(worker/mori-chat-admin.ts)
    const chatTo = await moriChatAdminPost(path, form, db);
    if (chatTo) return redirect(chatTo);

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

    if (path === "/admin/report/toss") {
      // 토스 미니앱 인앱결제(2026-10-07). 빈 칸은 기존 값을 지우지 않습니다.
      const verifyUrl = val("toss_verify_url").replace(/\s+/g, "");
      const secret = val("toss_verify_secret").replace(/\s+/g, "");
      const sku = val("toss_report_sku").replace(/\s+/g, "");
      if (verifyUrl && !/^https:\/\/[^\s/]+\.workers\.dev\/verify$/.test(verifyUrl)) return redirect("/admin/report/?err=tossurl");
      if (secret && secret.length < 32) return redirect("/admin/report/?err=tosssecret");
      if (verifyUrl) await writeSetting(db, "toss_verify_url", verifyUrl);
      if (secret) await writeSetting(db, "toss_verify_secret", secret);
      if (sku) await writeSetting(db, "toss_report_sku", sku);
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

    if (path === "/admin/report/free") {
      // 검수용 무료 리포트. 결제 없이 결제 완료 상태의 시험 주문(0원)을 만들어 바로 열람합니다. 매출에는 잡히지 않습니다.
      const type = val("type").toUpperCase();
      if (!hasBook(type)) return redirect("/admin/report/?err=free");
      const left = ["E", "S", "T", "J"];
      // 입력은 「내 유형 글자 쪽 %」(50~100)입니다(2026-10-05 — 왼쪽 글자 비율로 받았더니 헷갈려서 막혔습니다).
      // 저장은 사이트 규칙대로 왼쪽 글자(E·S·T·J) 비율로 바꿉니다.
      const scores = (["a1", "a2", "a3", "a4"] as const).map((k, i) => {
        const raw = Number(val(k));
        const mine = Math.min(100, Math.max(50, Number.isFinite(raw) && val(k) !== "" ? Math.round(raw) : 70));
        return type[i] === left[i] ? mine : 100 - mine;
      }) as [number, number, number, number];
      const birth = /^\d{4}-\d{2}-\d{2}$/.test(val("birth")) ? val("birth") : "";
      const bt = birth ? Math.min(12, Math.max(0, Number(val("bt")) || 0)) : 0;
      const name = (val("name") || "검수").replace(/[^가-힣a-zA-Z0-9 ]/g, "").slice(0, 10) || "검수";
      const made = await createOrder(db, { type, scores, name, birth, bt, phone: "01000000000" }, { price: 0, test: true, free: true });
      if (!made.ok) return redirect("/admin/report/?err=free");
      return redirect(`/admin/report/?free=${encodeURIComponent(made.orderNo)}`);
    }

    if (path === "/admin/report/delete") {
      const picked = [...new Set(form.getAll("order_no").map((v) => String(v).trim()).filter(Boolean))].slice(0, 60);
      let deleted = 0;
      for (const orderNo of picked) {
        // 화면을 거치지 않은 요청도 막도록 조건을 SQL 에도 겁니다.
        const res = await db.prepare(`DELETE FROM report_orders WHERE order_no = ? AND ${DELETABLE_SQL}`).bind(orderNo).run();
        const n = res.meta?.changes ?? 0;
        if (n) await logEvent(db, orderNo, "admin_delete", "관리자가 시험 주문을 지움");
        deleted += n;
      }
      return redirect(`/admin/report/?deleted=${deleted}&skipped=${picked.length - deleted}`);
    }

    if (path === "/admin/report/cancel") {
      const orderNo = val("order_no");
      const row = await db.prepare("SELECT * FROM report_orders WHERE order_no = ?").bind(orderNo).first<OrderRow>();
      if (!row || !row.mul_no || !["paid", "partial", "pending"].includes(row.status)) return redirect("/admin/report/?err=cancel");
      if (row.pay_type === "toss-iap") {
        // 토스 인앱결제 환불은 토스 앱(구글·애플 정책)에서 처리된다. 여기서는 우리 쪽 열람만 막는다(페이앱을 부르지 않음).
        await db.prepare("UPDATE report_orders SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE token = ? AND status = ?").bind(row.token, row.status).run();
        await logEvent(db, orderNo, "toss_mark_refunded", (val("memo") || "관리자가 환불 처리로 표시").slice(0, 100));
        return redirect("/admin/report/?saved=1");
      }
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
  // 검수용 무료 리포트 발행 이력(2026-10-06): 예전에 만든 것을 다시 만들지 않고 바로 열도록 따로 모읍니다.
  const freeHistory = (await db
    .prepare("SELECT * FROM report_orders WHERE pay_type = 'admin-free' ORDER BY created_at DESC LIMIT 200")
    .all<OrderRow>()).results ?? [];
  const events = (await db.prepare("SELECT order_no, kind, detail, created_at FROM report_events ORDER BY id DESC LIMIT 30").all<{ order_no: string; kind: string; detail: string; created_at: string }>()).results ?? [];
  const sums = (await db.prepare("SELECT status, test, COUNT(*) AS n, SUM(price) AS won FROM report_orders GROUP BY status, test").all<{ status: string; test: number; n: number; won: number }>()).results ?? [];
  const paidReal = sums.filter((s) => !s.test && ["paid", "partial"].includes(s.status));

  const q = url.searchParams;
  const err: Record<string, string> = {
    keys: "연동 KEY·VALUE 를 먼저 넣어 주세요.", test: "시험 결제: 유형(원고가 있는 것)과 휴대폰 번호를 확인하세요.",
    pay: "페이앱 결제요청이 실패했습니다. 아래 기록을 보세요.", cancel: "취소할 수 없는 주문입니다.",
    cancelfail: `페이앱 취소 실패: ${q.get("msg") ?? ""}`,
    contentkey: "원고 해독 키가 맞지 않습니다. report_content.key 파일 내용을 그대로 붙여넣으세요.",
    free: "무료 리포트를 만들지 못했습니다. 유형(원고가 있는 것)을 확인하세요.",
    tgtoken: "봇 토큰 모양이 아닙니다. BotFather 가 준 「숫자:영문」 토큰 전체를 붙여넣으세요.",
    tgchat: "대화 ID 를 찾지 못했습니다. 텔레그램에서 봇에게 아무 말이나 한 번 보낸 뒤 다시 저장하세요.",
    tgsend: "텔레그램 알림을 보내지 못했습니다. 토큰·대화 ID 를 확인하세요.",
    tossurl: "확인 워커 주소는 https://….workers.dev/verify 모양이어야 합니다.",
    tosssecret: "확인 키가 너무 짧습니다(32자 이상).",
    chaturl: "모리 대화 중계 주소는 https://….workers.dev/chat 모양이어야 합니다.",
    chatsecret: "모리 대화 확인 키가 너무 짧습니다(32자 이상).",
    qadevice: "이 브라우저에 모리 대화 기기 번호가 없습니다. /mori/chat/ 을 한 번 연 뒤 다시 누르세요.",
  };
  const toss = {
    url: await readSetting(db, "toss_verify_url"),
    secret: await readSetting(db, "toss_verify_secret"),
    sku: await readSetting(db, "toss_report_sku"),
  };
  const chatBox = await moriChatAdminBox(db, q, esc);
  const testOrder = q.get("test") ? orders.find((o) => o.order_no === q.get("test")) : null;
  const freeOrder = q.get("free") ? orders.find((o) => o.order_no === q.get("free")) : null;
  const freeBox = freeOrder
    ? `<div class="box" style="border-color:#3f7d5c"><h2>검수용 무료 리포트를 만들었습니다 — ${esc(freeOrder.order_no)} (${esc(freeOrder.type)} · ${esc(freeOrder.scores)})</h2>
<p><a href="/report-app/?o=${freeOrder.token}" target="_blank" rel="noopener"><b>📖 리포트 열기</b></a> · 아래 주문 표에도 「(시험) 0원」으로 남고 「열기」로 다시 볼 수 있습니다.</p></div>`
    : "";
  const testBox = testOrder
    ? `<div class="box" style="border-color:#7657d6"><h2>시험 결제 주문을 만들었습니다 — ${esc(testOrder.order_no)}</h2>
<p class="note">아래 결제창에서 ${REPORT_TEST_PRICE.toLocaleString()}원을 결제하세요. 결제가 끝나면 이 화면을 새로고침해 상태가 「결제 완료」로 바뀌는지, 열람 링크가 열리는지 확인하고 표의 「취소」로 돌려받습니다.</p>
<p><a href="${esc(testOrder.payurl)}" target="_blank" rel="noopener"><b>① 결제창 열기</b></a> · <a href="/report/done/?o=${testOrder.token}" target="_blank" rel="noopener">② 결제 완료 화면(손님이 보는 화면)</a> · <a href="/report-app/?o=${testOrder.token}" target="_blank" rel="noopener">리포트 열람 화면</a></p></div>`
    : "";

  const body = `<div class="wrap">
<div class="head"><div><h1>리포트 판매</h1><p>${esc(SELLER.name)} · 페이앱 ${esc(PAYAPP_USERID)} · 지금 판매가 ${reportPrice().toLocaleString()}원 (이벤트 ${esc(REPORT_EVENT.from)}~${esc(REPORT_EVENT.to)} ${REPORT_EVENT_PRICE.toLocaleString()}원 · 그 뒤 ${REPORT_REGULAR_PRICE.toLocaleString()}원)</p></div>
<nav class="ranges"><a href="/admin/">접속 현황</a><a href="/admin/report/" class="on">리포트 판매</a></nav></div>
${q.get("saved") ? `<p class="note" style="color:#3f7d5c">저장했습니다.</p>` : ""}
${q.get("deleted") !== null ? `<p class="note" style="color:#3f7d5c">시험 주문 ${esc(q.get("deleted") ?? "0")}건을 지웠습니다.${Number(q.get("skipped")) > 0 ? ` ${esc(q.get("skipped") ?? "")}건은 지울 수 없는 주문이라 남겼습니다.` : ""}</p>` : ""}
${q.get("tgsent") ? `<p class="note" style="color:#3f7d5c">텔레그램으로 시험 알림을 보냈습니다. 휴대폰에서 확인하세요.</p>` : ""}
${q.get("err") ? `<p class="note" style="color:#b6483c">${esc(err[q.get("err") ?? ""] ?? "오류")}</p>` : ""}
${testBox}
${freeBox}
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

${chatBox}

<div class="box"><h2>토스 미니앱 인앱결제 (MBTI 검사 앱)</h2>
<p class="note">토스 앱 안에서 산 리포트를 여기서 확인해 열어 줍니다. 가격은 ${TOSS_REPORT_PRICE.toLocaleString()}원 고정입니다.
지금: 확인 워커 ${toss.url ? "등록됨" : "<b style='color:#b6483c'>미등록</b>"} · 확인 키 ${toss.secret ? "등록됨" : "<b style='color:#b6483c'>미등록</b>"} · 상품 ID ${toss.sku ? esc(toss.sku) : "<b style='color:#b6483c'>미등록</b>"}<br>
확인 워커는 토스 mTLS 인증서를 가진 Cloudflare 워커(toss-iap-verify)이고, 확인 키는 그 워커의 VERIFY_SECRET 과 같은 값입니다. 저장된 키는 다시 보여주지 않습니다.</p>
<form method="post" action="/admin/report/toss" autocomplete="off"><div class="fields">
<label><span>확인 워커 주소</span><input name="toss_verify_url" autocomplete="off" spellcheck="false" placeholder="${toss.url ? esc(toss.url) : "https://toss-iap-verify.….workers.dev/verify"}"></label>
<label><span>확인 키</span><input name="toss_verify_secret" autocomplete="off" spellcheck="false" placeholder="${toss.secret ? "바꿀 때만 입력" : "붙여넣으세요"}"></label>
<label><span>상품 ID (sku)</span><input name="toss_report_sku" autocomplete="off" spellcheck="false" placeholder="${toss.sku ? "바꿀 때만 입력" : "토스 콘솔 상품 ID"}"></label>
</div><button type="submit" style="margin-top:12px">저장</button></form></div>

<div class="box"><h2>검수용 무료 리포트 (결제 없음)</h2>
<p class="note">관리자만 씁니다. 결제 없이 바로 리포트를 엽니다. 매출·판매 통계에는 잡히지 않고 주문 표에 「(시험) 0원」으로 남습니다.
점수는 <b>내 유형 글자 쪽 %</b>(50~100)입니다. 유형을 고르면 칸 이름이 바뀌고 숫자가 자동으로 채워집니다. 「단계」로 네 칸을 한 번에 바꾸거나 칸마다 직접 고쳐도 됩니다.
반반(55)·중간(70)·뚜렷(85)을 바꿔 가며 점수 단계 원고를 검수하세요. 생년월일을 넣으면 사주 장 6쪽이 붙습니다.</p>
<form method="post" action="/admin/report/free" autocomplete="off" id="free-form">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;align-items:end">
<label style="display:flex;flex-direction:column;gap:4px;font-size:12px">유형<select name="type" id="free-type">${MBTI_TYPES.filter((t) => hasBook(t)).map((t) => `<option>${t}</option>`).join("")}</select></label>
<label style="display:flex;flex-direction:column;gap:4px;font-size:12px">단계 (네 칸 한 번에)<select id="free-band"><option value="85">아주 뚜렷 85</option><option value="70" selected>분명한 편 70</option><option value="55">거의 반반 55</option></select></label>
${[0, 1, 2, 3].map((i) => `<label style="display:flex;flex-direction:column;gap:4px;font-size:12px"><span class="free-letter">-</span> 쪽 %<input name="a${i + 1}" type="number" min="50" max="100" value="70" class="free-score"></label>`).join("")}
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end;margin-top:10px">
<label style="display:flex;flex-direction:column;gap:4px;font-size:12px">이름<input name="name" placeholder="검수"></label>
<label style="display:flex;flex-direction:column;gap:4px;font-size:12px">생년월일(선택)<input name="birth" type="date"></label>
<label style="display:flex;flex-direction:column;gap:4px;font-size:12px">태어난 시각<select name="bt">${BIRTH_TIME_SLOTS.map((label, i) => `<option value="${i}">${esc(label)}</option>`).join("")}</select></label>
<button type="submit" style="min-height:44px">무료 리포트 만들기</button>
</div></form>
<script>
(() => {
  const type = document.getElementById("free-type"), band = document.getElementById("free-band");
  const letters = document.querySelectorAll("#free-form .free-letter"), scores = document.querySelectorAll("#free-form .free-score");
  const sync = () => { letters.forEach((el, i) => { el.textContent = type.value[i]; }); };
  type.addEventListener("change", sync);
  band.addEventListener("change", () => scores.forEach((el) => { el.value = band.value; }));
  sync();
})();
</script>
<h3 style="margin:22px 0 6px;font-size:15px">발행 이력 (${freeHistory.length}건)</h3>
<p class="note" style="margin-top:0">예전에 만든 검수용 리포트를 다시 만들지 않고 「열기」로 바로 봅니다. 점수는 만들 때 넣은 「내 유형 글자 쪽 %」입니다.</p>
${freeHistory.length ? `<div class="row" style="margin-bottom:8px"><label style="font-size:12px">유형 거르기 <select id="free-hist-type"><option value="">전체</option>${[...new Set(freeHistory.map((o) => o.type))].sort().map((t) => `<option>${esc(t)}</option>`).join("")}</select></label></div>
<div class="scroll"><table id="free-hist"><thead><tr><th>만든 시각</th><th>유형</th><th>점수 (내 유형 쪽 %)</th><th>이름</th><th>생년월일</th><th>열람</th><th></th></tr></thead><tbody>
${freeHistory
  .map((o) => {
    const left = ["E", "S", "T", "J"];
    const raw = o.scores.split(",").map(Number);
    const mine = [0, 1, 2, 3].map((i) => `${esc(o.type[i] ?? "")} ${o.type[i] === left[i] ? raw[i] : 100 - raw[i]}`).join(" · ");
    return `<tr data-type="${esc(o.type)}"><td><small>${esc(kst(o.created_at))}</small><br><small class="muted">${esc(o.order_no)}</small></td>
<td><b>${esc(o.type)}</b></td><td><small>${mine}</small></td><td>${esc(o.name || "-")}</td>
<td><small>${esc(o.birth ? `${o.birth} ${BIRTH_TIME_SLOTS[o.bt] ?? ""}` : "-")}</small></td><td>${o.view_count}</td>
<td><a href="/report-app/?o=${o.token}" target="_blank" rel="noopener">열기</a></td></tr>`;
  })
  .join("")}
</tbody></table></div>
<script>
(() => {
  const sel = document.getElementById("free-hist-type");
  sel.addEventListener("change", () => document.querySelectorAll("#free-hist tbody tr").forEach((tr) => {
    tr.style.display = !sel.value || tr.dataset.type === sel.value ? "" : "none";
  }));
})();
</script>` : `<p class="note muted">아직 만든 검수용 리포트가 없습니다.</p>`}
</div>

<div class="box"><h2>${REPORT_TEST_PRICE.toLocaleString()}원 시험 결제</h2>
<p class="note">판매를 열지 않아도 됩니다. 진짜 결제창이 열리고, 결제 완료 통보·열람·취소까지 실제 흐름을 그대로 탑니다. 결제창 링크는 입력한 휴대폰으로 가지 않고(문자 끔) 다음 화면에 나옵니다.</p>
<form method="post" action="/admin/report/test" class="row" autocomplete="off">
<select name="type">${MBTI_TYPES.filter((t) => hasBook(t)).map((t) => `<option>${t}</option>`).join("")}</select>
<input name="phone" placeholder="결제할 휴대폰 번호" inputmode="numeric" required>
<button type="submit">시험 주문 만들기</button></form>
<p class="note">사주 시험값: 1995-01-20 ${esc(BIRTH_TIME_SLOTS[7])}</p></div>

<div class="box"><h2>주문 (최근 60건)</h2>
<form method="post" action="/admin/report/delete" id="del-form" class="row" style="margin-bottom:10px"
  onsubmit="const n = this.querySelectorAll('input:checked').length + document.querySelectorAll('input.del-pick:checked').length; if (!n) { alert('지울 주문을 고르세요.'); return false; } return confirm('고른 시험 주문 ' + n + '건을 지울까요? 되돌릴 수 없습니다.')">
<button type="submit" style="padding:6px 14px">고른 시험 주문 삭제</button>
<span class="note" style="margin:0">시험 주문만 고를 수 있습니다. 손님 주문은 지우지 않습니다. 1,000원 시험 결제가 아직 「결제 완료」면 먼저 「취소」하세요.</span></form>
<div class="scroll"><table><thead><tr>
<th><input type="checkbox" id="del-all" title="지울 수 있는 주문 전체 선택" onclick="document.querySelectorAll('input.del-pick:not(:disabled)').forEach((c) => { c.checked = this.checked; })"></th>
<th>주문번호</th><th>유형</th><th>금액</th><th>상태</th><th>휴대폰</th><th>유입 경로</th><th>결제</th><th>첫 열람</th><th>열람</th><th></th></tr></thead><tbody>
${orders
  .map(
    (o) => `<tr><td>${
      deletable(o)
        ? `<input type="checkbox" class="del-pick" form="del-form" name="order_no" value="${esc(o.order_no)}">`
        : `<input type="checkbox" class="del-pick" disabled title="${o.test ? "먼저 취소(환불)해야 지울 수 있습니다" : "손님 주문은 지울 수 없습니다"}">`
    }</td><td>${esc(o.order_no)}${o.test ? " <small>(시험)</small>" : ""}<br><small class="muted">${esc(kst(o.created_at))}</small></td>
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
  .join("") || `<tr><td colspan="11" class="muted">아직 주문이 없습니다.</td></tr>`}
</tbody></table></div></div>

<div class="box"><h2>페이앱 기록 (최근 30건)</h2><div class="scroll"><table><thead><tr><th>시각</th><th>주문번호</th><th>종류</th><th>내용</th></tr></thead><tbody>
${events.map((e) => `<tr><td><small>${esc(kst(e.created_at))}</small></td><td>${esc(e.order_no)}</td><td>${esc(e.kind)}</td><td><small>${esc(e.detail)}</small></td></tr>`).join("") || `<tr><td colspan="4" class="muted">기록 없음</td></tr>`}
</tbody></table></div></div>
</div>`;
  return html(shell("리포트 판매", body));
}
