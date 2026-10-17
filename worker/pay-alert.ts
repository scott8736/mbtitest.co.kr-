/**
 * 페이앱 결제 오류 텔레그램 알림 (2026-10-18 사용자 요청: 「결제 단계 오류는 모두 즉시 알림」).
 *
 * 대상: 리포트·모리 대화권의 결제요청(payrequest) 실패, 결과 통보(feedback) 거절·예외,
 *       결제완료인데 지급(열람권·대화권) 실패, 관리자 환불(paycancel) 실패. 토스 인앱결제는 대상이 아닙니다.
 *
 * - 첫 줄: 「🧩 MBTI테스트 · 🚨결제오류 · <단계> · <금액>」(사용자 결정). 키·휴대폰 전체·이메일은 넣지 않습니다.
 * - 중복 억제: 같은 (단계 + 주문번호, 주문번호가 없거나 믿을 수 없으면 단계 + 원인) 은 30분에 한 번만 보냅니다(D1 pay_alerts).
 *   기록(report_events 「pay_alert」)은 억제돼도 매번 남깁니다.
 * - 여기서는 절대 예외를 던지지 않습니다. 알림이 실패해도 결제 흐름은 그대로 갑니다.
 */
import { sendTelegram } from "./telegram";

export const PAY_ALERT_WINDOW_MS = 30 * 60_000;

export type PayAlert = {
  /** 단계. 리포트/모리채팅 구분을 앞에 넣습니다. 예: 「리포트 결제요청 실패」 */
  stage: string;
  orderNo?: string;
  mulNo?: string;
  state?: string;
  price?: number;
  test?: boolean;
  /** 원인(짧게) */
  cause: string;
  /** 할 일 */
  todo: string;
  /** 주문번호를 믿을 수 없을 때(인증 실패한 통보의 var1 등) — 억제 묶음을 주문번호가 아닌 원인으로 잡습니다. */
  untrustedOrderNo?: boolean;
};

/** 알림 보내는 함수. ctx.waitUntil 로 감싼 것(응답을 막지 않음)이나 sendTelegram 을 그대로 넘깁니다. */
export type PaySend = (text: string) => unknown;

const clean = (v: unknown, n: number) => String(v ?? "").replace(/[\r\n\t]+/g, " ").replace(/[^\w\-.:=/ 가-힣()·,]/g, "").trim().slice(0, n);

export function payAlertText(a: PayAlert, now: number = Date.now()): string {
  const at = new Date(now + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ");
  const ids = [
    a.orderNo ? `주문 ${clean(a.orderNo, 40)}` : "",
    a.mulNo ? `mul_no ${clean(a.mulNo, 30)}` : "",
    a.state ? `state ${clean(a.state, 10)}` : "",
  ].filter(Boolean);
  return [
    `🧩 MBTI테스트 · 🚨결제오류 · ${a.stage}${a.price ? ` · ${a.price.toLocaleString()}원` : ""}`,
    ids.length ? ids.join(" · ") : "",
    a.test ? "🧪시험 주문" : "",
    `원인: ${clean(a.cause, 160)}`,
    `할 일: ${a.todo}`,
    `${at} (한국 시각)`,
  ].filter(Boolean).join("\n");
}

export function payAlertKey(a: PayAlert): string {
  const who = a.orderNo && !a.untrustedOrderNo ? clean(a.orderNo, 40) : `cause:${clean(a.cause, 80)}`;
  return `${a.stage}|${who}`.slice(0, 200);
}

const tableReady = new WeakMap<object, Promise<unknown>>();
function ensureTable(db: D1Database): Promise<unknown> {
  let ready = tableReady.get(db);
  if (!ready) {
    ready = db
      .prepare("CREATE TABLE IF NOT EXISTS pay_alerts (key text PRIMARY KEY NOT NULL, at integer NOT NULL)")
      .run()
      .catch((error) => {
        tableReady.delete(db);
        throw error;
      });
    tableReady.set(db, ready);
  }
  return ready;
}

/** 30분 창 안에 처음이면 true(보낼 차례). D1 이 막혀도 알림은 보냅니다(놓치는 것보다 두 번이 낫습니다). */
async function claimWindow(db: D1Database, key: string, now: number): Promise<boolean> {
  try {
    await ensureTable(db);
    const res = (await db
      .prepare("INSERT INTO pay_alerts (key, at) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET at = excluded.at WHERE pay_alerts.at <= ?")
      .bind(key, now, now - PAY_ALERT_WINDOW_MS)
      .run()) as { meta?: { changes?: number }; changes?: number };
    if (Math.random() < 0.02) await db.prepare("DELETE FROM pay_alerts WHERE at < ?").bind(now - 86400_000).run();
    return (res?.meta?.changes ?? res?.changes ?? 0) > 0;
  } catch {
    return true;
  }
}

/**
 * 결제 오류 한 건: 기록은 매번, 텔레그램은 30분에 한 번. 보냈으면 true.
 * send 가 없으면(시험 코드 등) 기록만 하고 억제 창도 건드리지 않습니다.
 */
export async function payAlert(db: D1Database, a: PayAlert, send?: PaySend, now: number = Date.now()): Promise<boolean> {
  try {
    const sending = send ? await claimWindow(db, payAlertKey(a), now) : false;
    try {
      await db
        .prepare("INSERT INTO report_events (order_no, kind, detail) VALUES (?, ?, ?)")
        .bind(a.untrustedOrderNo ? "" : clean(a.orderNo, 40), "pay_alert",
          `${a.stage} | ${clean(a.cause, 200)}${a.mulNo ? ` mul_no=${clean(a.mulNo, 30)}` : ""}${a.state ? ` state=${clean(a.state, 10)}` : ""}${send && !sending ? " (30분 안 같은 알림이라 텔레그램 생략)" : ""}`.slice(0, 500))
        .run();
    } catch {
      // 기록 실패가 알림을 막으면 안 됩니다.
    }
    if (!send || !sending) return false;
    const r = send(payAlertText(a, now));
    if (r && typeof (r as Promise<unknown>).then === "function") await (r as Promise<unknown>).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

/** ctx 가 없는 곳(관리자 화면)에서 쓰는 기본 보내기 — 텔레그램을 끝까지 기다립니다(sendTelegram 은 예외 없음). */
export const directSend = (db: D1Database): PaySend => (text) => sendTelegram(db, text);

/** 페이앱 통보 상태 중 「취소·만료」 — 지운 시험 주문에 뒤늦게 오는 고아 통보는 알리지 않고 SUCCESS 로 끝냅니다. */
export const ORPHAN_STATES = ["8", "32", "9", "64", "70", "71"];
