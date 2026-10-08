"use client";

import { moriImage } from "../lib/mori";
import type { ResultClickPlacement } from "../lib/result-clicks";
import { recordResultClick } from "../lib/test-events";

/** 모리 AI 대화로 들어가는 버튼(2026-10-08). 숲 산책 버튼과 같은 모양이고 MBTI 결과 화면에 둡니다. */
export function MoriChatEntry({ code }: { code: string }) {
  return (
    <a className="forest-entry is-chat" href={`/mori/chat/?mori=${code}`} onClick={() => recordResultClick("mbti-chat")}>
      <img src={moriImage(code)} width={64} height={64} alt="" loading="lazy" />
      <span>
        <b>내 {code} 모리랑 이야기하기</b>
        <small>깨어난 모리와 AI 대화 · 하루 5번 무료 · 가입 없음</small>
      </span>
      <i aria-hidden="true">💬</i>
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
