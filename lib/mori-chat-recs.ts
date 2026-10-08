/**
 * 모리가 대화 끝에 추천하는 사이트 안 콘텐츠 (2026-10-08 사용자 요청: 「채팅으로 답해 주고 마지막에 심리테스트·운세·모리 게임 추천」).
 *
 * AI 지시문에 이 목록만 주고, 모리가 고른 id 를 답 끝 [추천:id] 로 받는다. 서버가 목록에 있는 id 인지 확인하고 지운 뒤
 * 화면이 카드로 그린다 — AI 가 사이트에 없는 테스트·주소를 지어낼 수 없게.
 * 마음건강 자가진단(우울·불안 선별 등)은 넣지 않는다: 고민 이야기 끝에 진단 검사를 권하는 모양이 되면 안 된다.
 */
import { fortuneEntries } from "./fortune-catalog";
import { testCatalog } from "./test-catalog";

export type ChatRec = { id: string; kind: "test" | "fortune" | "game" | "tarot" | "type"; title: string; desc: string; href: string; icon: string };

const short = (s: string, n = 46) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export const CHAT_RECS: ChatRec[] = [
  ...testCatalog
    .filter((t) => t.status === "published" && t.slug !== "mbti" && t.category !== "마음건강")
    .map((t) => ({ id: `t-${t.slug}`, kind: "test" as const, title: t.shortTitle, desc: short(t.description), href: t.href, icon: t.icon })),
  ...fortuneEntries.map((f) => ({
    id: `f-${f.href.replace(/^\/fortune\/|\/$/g, "").replace(/[^a-z0-9-]/g, "") || "hub"}`,
    kind: "fortune" as const, title: f.shortTitle, desc: short(f.description), href: f.href, icon: f.emoji,
  })),
  { id: "g-forest", kind: "game", title: "마음숲 산책(모리 게임)", desc: "내 모리를 데리고 네 마을을 걸으며 친구 모리 16명의 부탁을 들어주는 무료 게임", href: "/mori/forest/", icon: "🌳" },
  { id: "g-tarot", kind: "tarot", title: "오늘의 타로", desc: "카드 한 장으로 오늘 마음의 흐름을 가볍게 보는 무료 타로", href: "/tarot/", icon: "🃏" },
  { id: "g-compat", kind: "type", title: "MBTI 궁합", desc: "나와 그 사람 유형의 잘 맞는 점·부딪히는 점", href: "/compatibility/", icon: "💞" },
];

const BY_ID = new Map(CHAT_RECS.map((r) => [r.id, r]));
export const chatRec = (id: string): ChatRec | undefined => BY_ID.get(id);

/** 지시문에 넣는 목록(한 줄에 하나). */
export function recListForPrompt(): string {
  return CHAT_RECS.map((r) => `${r.id} — ${r.title}: ${r.desc}`).join("\n");
}

/** 답에서 [추천:id] 를 떼어 낸다. 목록에 있는 첫 id 만 돌려주고, 표시는 모두 지운다. */
export function takeRec(text: string): { text: string; rec: string | null } {
  let rec: string | null = null;
  const cleaned = text.replace(/\[\s*추천\s*[:：]\s*([a-z0-9-]+)\s*\]/gi, (_, id: string) => {
    if (!rec && BY_ID.has(id.toLowerCase())) rec = id.toLowerCase();
    return "";
  });
  return { text: cleaned.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(), rec };
}
