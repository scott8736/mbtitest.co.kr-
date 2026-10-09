"use client";

import { moriImage } from "../lib/mori";
import type { ResultClickPlacement } from "../lib/result-clicks";
import { recordResultClick } from "../lib/test-events";

/** 모리 AI 대화로 들어가는 버튼(2026-10-08). 숲 산책 버튼과 같은 모양 — MBTI 결과 화면·세계관 페이지. 유형을 모르면 고르기 화면으로. */
export function MoriChatEntry({ code, placement = "mbti-chat" }: { code?: string; placement?: ResultClickPlacement }) {
  return (
    <a className="forest-entry is-chat" href={code ? `/mori/chat/?mori=${code}` : "/mori/chat/"} onClick={() => recordResultClick(placement)}>
      <img src={moriImage(code ?? "INFP")} width={64} height={64} alt="" loading="lazy" />
      <span>
        <b>{code ? `내 ${code} 모리랑 이야기하기` : "16모리 중 하나랑 이야기하기"}</b>
        <small>깨어난 모리와 AI 대화 · 하루 5번 무료 · 가입 없음</small>
      </span>
      <i aria-hidden="true">💬</i>
    </a>
  );
}

/**
 * 결과 화면 모리 그림 바로 아래 말풍선(2026-10-09). 방금 깨어난 모리가 먼저 말을 거는 모양 — 첫날 데이터에서
 * 리포트 카드 아래 버튼은 완주 대비 1.7%만 눌러서, 가장 먼저 보이는 자리에 둔다.
 */
export function MoriChatBubble({ code, says }: { code: string; says?: string }) {
  return (
    <a className="mori-chat-bubble" href={`/mori/chat/?mori=${code}`} onClick={() => recordResultClick("mbti-chat-bubble")}>
      <span className="mori-chat-bubble-text">
        {says ? <q>{says}</q> : null} 나 방금 깨어났어! <b>나랑 얘기해 볼래?</b>
      </span>
      <span className="mori-chat-bubble-go">💬 대화하기 · 무료</span>
    </a>
  );
}

/** 모리 게임 「마음숲 산책」으로 들어가는 버튼(2026-10-07). MBTI 결과 · 홈 · 세계관 페이지에 둡니다. */
export default function ForestEntry({ code, placement, title = "내 모리랑 숲 산책하기" }: { code?: string; placement?: ResultClickPlacement; title?: string }) {
  return (
    <a className="forest-entry" href="/mori/forest/" onClick={placement ? () => recordResultClick(placement) : undefined}>
      <img src={moriImage(code ?? "ENFP")} width={64} height={64} alt="" loading="lazy" />
      <span>
        <b>{title}</b>
        <small>네 마을 · 친구 모리 16명의 부탁 · 무료 게임</small>
      </span>
      <i aria-hidden="true">🌳</i>
    </a>
  );
}
