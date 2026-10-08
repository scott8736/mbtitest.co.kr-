"use client";

/**
 * 「모리랑 하던 이야기 이어가기」 버튼 (2026-10-08). 대화 중 추천 테스트로 간 사람에게 다른 페이지에서 보입니다.
 * SiteFooter 가 모든 페이지에 붙입니다. 표시는 lib/mori-chat-return.ts — 6시간이 지나거나 대화로 돌아가면 사라집니다.
 * 화면 아래쪽은 애드센스 하단 광고 자리라(광고를 덮으면 정책 위반) 머리 아래 오른쪽에 둡니다.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { MORI, moriImage } from "../lib/mori";
import { chatEvent, clearChatReturn, markChatReturnSeen, readChatReturn, type ChatReturn } from "../lib/mori-chat-return";

export default function MoriChatResume() {
  const [back, setBack] = useState<ChatReturn | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (location.pathname.startsWith("/mori/chat")) return;
      const v = readChatReturn();
      if (v && MORI[v.mori]) {
        setBack(v);
        if (!v.seen) {
          chatEvent("resume_seen", v.mori, v.slug);
          markChatReturnSeen();
        }
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  if (!back) return null;
  return (
    <div className="mori-resume" role="complementary" aria-label="모리 대화 이어가기">
      <Link href={`/mori/chat/?mori=${back.mori}&back=1`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다 */}
        <img src={moriImage(back.mori)} alt="" width={32} height={32} />
        <span>{back.mori} 모리랑 하던 이야기 이어가기</span>
      </Link>
      <button type="button" aria-label="닫기" onClick={() => { clearChatReturn(); setBack(null); }}>×</button>
    </div>
  );
}
