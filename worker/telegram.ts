/**
 * 판매자 텔레그램 알림 (2026-10-05). 봇 「스캇작업」으로 결제·환불을 알립니다.
 *
 * 봇 토큰·대화 ID 는 관리자 화면(/admin/report)에서 넣어 app_settings 에 둡니다(저장소가 공개라 코드에 두지 않음).
 * 알림이 실패해도 결제 처리는 그대로 끝나야 하므로 여기서는 절대 예외를 던지지 않습니다.
 */
import { readSetting } from "./naver";

const API = "https://api.telegram.org/bot";
/** BotFather 토큰 모양: 숫자:영숫자 35자 안팎. 모양이 틀리면 텔레그램에 보내지도 않습니다. */
export const TELEGRAM_TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{30,50}$/;

export async function telegramConfig(db: D1Database): Promise<{ token: string; chatId: string }> {
  return { token: await readSetting(db, "telegram_bot_token"), chatId: await readSetting(db, "telegram_chat_id") };
}

/** 보내면 true. 설정이 없거나 실패하면 false(예외 없음). */
export async function sendTelegram(db: D1Database, text: string): Promise<boolean> {
  try {
    const { token, chatId } = await telegramConfig(db);
    if (!TELEGRAM_TOKEN_RE.test(token) || !chatId) return false;
    const res = await fetch(`${API}${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 봇에게 마지막으로 말을 건 대화의 ID. 봇에게 아무 말이나 한 번 보낸 뒤 부릅니다. */
export async function findTelegramChatId(token: string): Promise<string> {
  if (!TELEGRAM_TOKEN_RE.test(token)) return "";
  try {
    const res = await fetch(`${API}${token}/getUpdates`);
    if (!res.ok) return "";
    const data = (await res.json()) as { result?: { message?: { chat?: { id?: number } } }[] };
    const ids = (data.result ?? []).map((u) => u.message?.chat?.id).filter((id): id is number => typeof id === "number");
    return ids.length ? String(ids[ids.length - 1]) : "";
  } catch {
    return "";
  }
}
