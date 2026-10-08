/**
 * 「모리랑 하던 이야기 이어가기」 표시 (2026-10-08 사용자 요청: 채팅하다 심리테스트를 해도 대화가 없어지지 않고 이어지게).
 *
 * 대화 화면에서 추천 테스트를 누르면 여기에 「어느 모리와 이야기하다 어느 테스트로 갔는지」를 남깁니다.
 * 다른 페이지 아래쪽의 이어가기 버튼(components/MoriChatResume.tsx)이 이것을 읽고, 대화 화면이 돌아오면 지웁니다.
 * 대화 내용 자체는 대화 화면이 이 기기(localStorage)에 따로 둡니다. 서버로 보내지 않습니다.
 */
const KEY = "mori-chat-return";
/** 이보다 오래된 표시는 버립니다. 다음 날 아무 페이지에서나 버튼이 뜨면 거슬립니다. */
const KEEP_MS = 6 * 3600_000;

export type ChatReturn = { mori: string; slug: string; title: string; at: number };

export function markChatReturn(value: Omit<ChatReturn, "at">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...value, at: Date.now() }));
  } catch {
    // 저장이 막히면 버튼이 안 뜰 뿐, 대화 화면으로 돌아가면 기록은 그대로 있습니다.
  }
}

export function readChatReturn(): ChatReturn | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as ChatReturn | null;
    if (!v || !/^[EI][SN][TF][JP]$/.test(v.mori) || typeof v.at !== "number" || Date.now() - v.at > KEEP_MS) return null;
    return v;
  } catch {
    return null;
  }
}

export function clearChatReturn(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 없어도 됩니다.
  }
}

/** 화면 기록(추천 카드 노출·클릭, 이어가기). 실패해도 화면에는 영향이 없습니다. */
export function chatEvent(kind: string, mori: string, ref = ""): void {
  try {
    const device = localStorage.getItem("mori-chat-device") ?? "";
    if (!/^[a-z0-9-]{16,64}$/.test(device)) return;
    void fetch("/api/mori-chat/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device, kind, mori, ref }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // 기록 실패는 무시합니다.
  }
}
