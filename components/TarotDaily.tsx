"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TarotCard, TarotFortune } from "../lib/tarot";
import {
  dailyCandidates,
  tarotCardByNo,
  tarotFortunes,
  tarotTypeLabels,
  todayKst,
} from "../lib/tarot";
import AdUnit from "./AdUnit";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import Mascot from "./Mascot";
import { markTestCompleted, recordCompletionOnce, recordTestEvent } from "../lib/test-events";

/**
 * 오늘의 타로.
 *
 * 핵심은 "같은 날에는 같은 결과" 입니다. 새로고침할 때마다 카드가 바뀌면
 * 운세로 읽히지 않고, 마음에 드는 카드가 나올 때까지 돌리게 됩니다. 그러면
 * 내일 다시 올 이유도 사라집니다.
 *
 * 그래서 두 겹으로 고정합니다. 후보 다섯 장은 날짜·방문자·운세 종류를 시드로
 * 만들고(lib/tarot.ts), 뽑은 카드는 날짜별 키로 localStorage 에 저장합니다.
 * 자정(KST)이 지나면 키가 달라져 자동으로 새 카드를 뽑게 됩니다.
 *
 * 서버가 없어도 됩니다. 전부 브라우저 안에서 끝납니다.
 */

const VISITOR_KEY = "tarot-visitor";
const pickKey = (slug: string, date: string) => `tarot-pick:${slug}:${date}`;

function getVisitorId(): string {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;
    const made = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, made);
    return made;
  } catch {
    // 저장이 막힌 브라우저에서는 세션마다 다른 사람으로 취급됩니다.
    return "guest";
  }
}

export default function TarotDaily({ fortune }: { fortune: TarotFortune }) {
  const [dateKey, setDateKey] = useState("");
  const [candidates, setCandidates] = useState<TarotCard[]>([]);
  const [picked, setPicked] = useState<TarotCard | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const date = todayKst();
    const visitor = getVisitorId();
    setDateKey(date);
    setCandidates(dailyCandidates(date, visitor, fortune.type));

    try {
      const saved = localStorage.getItem(pickKey(fortune.slug, date));
      if (saved) {
        const card = tarotCardByNo(Number(saved));
        if (card) setPicked(card);
      }
    } catch {
      // 저장이 막혀 있으면 오늘 다시 뽑게 됩니다.
    }
    setReady(true);
  }, [fortune.slug, fortune.type]);

  const choose = (card: TarotCard) => {
    recordTestEvent(fortune.slug, "answered");
    setPicked(card);
    try {
      localStorage.setItem(pickKey(fortune.slug, dateKey), String(card.no));
    } catch {
      // 저장 실패해도 이번 화면에서는 결과가 보입니다.
    }
    markTestCompleted(fortune.slug);
    recordCompletionOnce(fortune.slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const others = tarotFortunes.filter((f) => f.slug !== fortune.slug);

  return (
    <main
      className="generic-test tarot"
      style={{ "--test-accent": picked?.color || fortune.color } as React.CSSProperties}
    >
      <SiteHeader active="/tarot" />

      <section className="generic-intro">
        <span className="eyebrow">{fortune.eyebrow}</span>
        <h1>{fortune.heading}</h1>
        <p>{fortune.description}</p>
        <div className="generic-meta">
          <span>{dateKey || "오늘"}</span>
          <span>하루 한 번</span>
          <span>가입 없음</span>
        </div>
      </section>

      {!ready && (
        <section className="test-shell" aria-busy="true">
          <p className="test-tip">오늘의 카드를 준비하는 중입니다…</p>
        </section>
      )}

      {ready && !picked && (
        <section className="tarot-pick">
          <Mascot className="tarot-mascot" mood="excited" size={104} accent={fortune.color} />
          <p className="tarot-guide">
            마음이 가는 카드를 한 장 고르세요. <b>오늘은 한 번만 뽑을 수 있습니다.</b>
          </p>
          <div className="tarot-deck">
            {candidates.map((card, i) => (
              <button key={card.no} onClick={() => choose(card)} aria-label={`${i + 1}번 카드 뽑기`}>
                <span className="tarot-back">
                  <i>✦</i>
                  <b>{i + 1}</b>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {ready && picked && (
        <section className="rich-result">
          <span className="result-kicker">{dateKey} · {tarotTypeLabels[fortune.type]}</span>

          <div className="tarot-card-face" style={{ background: picked.color }}>
            <span className="tarot-no">{picked.no}</span>
            <span className="tarot-symbol">{picked.symbol}</span>
            <b>{picked.ko}</b>
            <span className="tarot-en">{picked.en}</span>
          </div>

          <p className="tarot-keyword">{picked.keyword}</p>
          <p className="rich-summary">{picked.readings[fortune.type]}</p>

          <div className="tarot-lucky">
            <div>
              <span>행운의 색</span>
              <b>{picked.luckyColor}</b>
            </div>
            <div>
              <span>행운의 물건</span>
              <b>{picked.luckyItem}</b>
            </div>
            <div>
              <span>행운의 숫자</span>
              <b>{picked.luckyNumber}</b>
            </div>
          </div>

          <div className="growth-plan">
            <span>오늘의 한 줄</span>
            <h2>{picked.advice}</h2>
          </div>

          <AdUnit position="resultMiddle" />

          <p className="tarot-again">
            오늘의 카드는 자정까지 그대로입니다. <b>내일 다시 오시면</b> 새 카드를 뽑을 수 있어요.
          </p>

          <div className="tarot-others">
            <h2>다른 운세도 오늘 것으로 볼 수 있어요</h2>
            <ul>
              {others.map((f) => (
                <li key={f.slug}>
                  <Link href={`/tarot/${f.slug}/`} style={{ borderColor: f.color }}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <b>{tarotTypeLabels[f.type]}</b>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="disclaimer">
            타로는 재미로 보는 콘텐츠입니다. 의학·법률·투자 판단의 근거로 삼지 마세요.
          </p>
        </section>
      )}

      <section className="generic-explain">
        <h2>이 운세는 어떻게 나오나요</h2>
        {fortune.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          카드는 메이저 아르카나 22장을 씁니다. 뽑은 결과는 브라우저 안에만 저장되며
          서버로 전송되지 않습니다.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
