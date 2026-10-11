"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { moriImage } from "../lib/mori";
import type { TarotCard, TarotFortune } from "../lib/tarot";
import {
  dailyCandidates,
  tarotCards,
  tarotFortunes,
  tarotTypeLabels,
  todayKst,
} from "../lib/tarot";
import AdUnit from "./AdUnit";
import SajuLabBanner from "./SajuLabBanner";
import ReportCrossSell from "./ReportCrossSell";
import ResultShareCard from "./ResultShareCard";
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
 * 2026-10-05 사용자 결정으로 「하루 한 번」 고정을 없앴습니다. 뽑은 카드를 저장하지 않고,
 * 결과 화면의 「다시 뽑기」로 몇 번이든 새 후보 다섯 장을 섞습니다(라운드 번호를 시드에 더함).
 *
 * 서버가 없어도 됩니다. 전부 브라우저 안에서 끝납니다.
 */

const VISITOR_KEY = "tarot-visitor";

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

const PICKED_KEY = (slug: string) => `tarot-picked:${slug}`;

/**
 * 카드를 고르면 같은 화면에 예고(카드 상징·첫 키워드만)를 보여 주고, 풀이는
 * 「내 결과 확인하기」 <a href> 로 /tarot/<slug>/result/ 에서 엽니다(2026-10-11, MBTI 와 같은 구조).
 * 애드센스 전면광고는 링크 클릭에만 붙습니다.
 */
export default function TarotDaily({ fortune, resultOnly = false }: { fortune: TarotFortune; resultOnly?: boolean }) {
  const [dateKey, setDateKey] = useState("");
  const [candidates, setCandidates] = useState<TarotCard[]>([]);
  const [picked, setPicked] = useState<TarotCard | null>(null);
  const [teaser, setTeaser] = useState<TarotCard | null>(null);
  const [ready, setReady] = useState(false);
  const [round, setRound] = useState(0);
  const resultPath = `/tarot/${fortune.slug}/result/`;

  // 결과 페이지: 이 탭에서 뽑은 카드를 읽습니다. 없으면 카드 고르는 화면으로 보냅니다.
  useEffect(() => {
    if (!resultOnly) return;
    const id = setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(PICKED_KEY(fortune.slug)) || "null") as { no: number; date: string } | null;
        const card = saved && tarotCards.find((c) => c.no === saved.no);
        if (!saved || !card) throw new Error("no pick");
        setDateKey(saved.date);
        setPicked(card);
        setReady(true);
        recordCompletionOnce(fortune.slug);
      } catch {
        location.replace(`/tarot/${fortune.slug}/`);
      }
    }, 0);
    return () => clearTimeout(id);
  }, [resultOnly, fortune.slug]);

  // localStorage 는 붙은 뒤에만 읽을 수 있어 한 박자 늦게 채웁니다(정적 렌더와 어긋나지 않게).
  useEffect(() => {
    if (resultOnly) return;
    const id = setTimeout(() => {
      const date = todayKst();
      setDateKey(date);
      setCandidates(dailyCandidates(date, `${getVisitorId()}-${round}`, fortune.type));
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, [fortune.slug, fortune.type, round, resultOnly]);

  const again = () => {
    setPicked(null);
    setRound((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const choose = (card: TarotCard) => {
    recordTestEvent(fortune.slug, "answered");
    try {
      sessionStorage.setItem(PICKED_KEY(fortune.slug), JSON.stringify({ no: card.no, date: dateKey }));
    } catch {
      // 저장이 막힌 브라우저는 결과 페이지에서 카드 고르기로 돌아갑니다.
    }
    markTestCompleted(fortune.slug);
    recordTestEvent(fortune.slug, "teaser");
    setTeaser(card);
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
          <span>몇 번이든 무료</span>
          <span>가입 없음</span>
        </div>
      </section>

      {!ready && (
        <section className="test-shell" aria-busy="true">
          <p className="test-tip">오늘의 카드를 준비하는 중입니다…</p>
        </section>
      )}

      {/* 예고 화면. 카드 이름·풀이는 가리고 상징과 첫 키워드만. 버튼 옆에 광고를 두지 않습니다(실수 클릭). */}
      {teaser && (
        <section className="test-shell">
          <div className="question-card test-teaser">
            <span className="question-kicker">카드를 뽑았어요</span>
            <h2>오늘 나에게 온 카드는…</h2>
            <div className="tarot-card-face" style={{ background: teaser.color }}>
              <span className="tarot-symbol">{teaser.symbol}</span>
              <b>? ? ?</b>
            </div>
            <p className="test-teaser-traits" aria-label="키워드 일부 공개">
              <span>{teaser.keyword.split(" · ")[0]}</span>
              <span className="masked">? ? ?</span>
            </p>
            <p className="mbti-teaser-hint">카드 이름과 오늘의 풀이,<br />행운의 색·물건·숫자까지 결과 화면에 있어요.</p>
            <a className="mbti-teaser-cta" href={resultPath}>내 결과 확인하기 →</a>
          </div>
        </section>
      )}

      {ready && !picked && !teaser && (
        <section className="tarot-pick">
          <Mascot className="tarot-mascot" type="INFJ" size={104} />
          <p className="tarot-guide">
            마음속 질문을 하나 떠올리고, <b>마음이 가는 카드를 한 장</b> 고르세요.
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
          {/* 카드 아래. 이 화면도 푸터 광고 하나뿐이었습니다. 타로는 매일 다시
              오게 하려고 만든 자리라 진입 화면 노출이 그대로 손실이었습니다.
              카드를 뽑으면 이 자리는 사라지고 아래 결과 화면 광고로 바뀌므로
              한 페이지에 같은 단위가 두 번 나오지 않습니다. */}
          <AdUnit position="articleTop" label={`${fortune.title} 카드 선택 화면 광고`} />
        </section>
      )}

      {ready && picked && (
        <section className="rich-result">
          {/* 결과 최상단. 성향 테스트 결과(GenericTestRunner)와 같은 구성입니다.
              타로 결과만 본문 중간 하나뿐이었습니다. */}
          <AdUnit key={`tarot-result-top-${picked.no}`} position="resultTop" label={`${fortune.title} 결과 상단 광고`} />
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

          <ResultShareCard
            id={`tarot-${fortune.slug}-${picked.no}`}
            kicker={`${dateKey} ${fortune.title}`}
            big={picked.symbol}
            bigLabel={picked.ko}
            headline={`${picked.ko} · ${picked.en}`}
            sub={picked.advice}
            pills={picked.keyword.split(" · ")}
            color={picked.color}
            path={`/tarot/${fortune.slug}/`}
            shareText={`오늘 내 타로는 「${picked.ko}」 카드!`}
            linkTitle={fortune.title}
            group="tarot"
          />

          <AdUnit position="resultMiddle" />

          <ReportCrossSell from="tarot" />
          <SajuLabBanner placement="tarot" />

          <div className="tarot-again">
            <p>다른 질문이 떠올랐다면 <b>카드를 다시 뽑아</b> 보세요.</p>
            {resultOnly
              ? <a className="primary-button" href={`/tarot/${fortune.slug}/`}>🔄 카드 다시 뽑기</a>
              : <button type="button" className="primary-button" onClick={again}>🔄 카드 다시 뽑기</button>}
          </div>

          <div className="tarot-others">
            <h2>다른 운세도 오늘 것으로 볼 수 있어요</h2>
            <ul>
              {others.map((f) => (
                <li key={f.slug}>
                  <Link href={`/tarot/${f.slug}/`} style={{ borderColor: f.color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다 */}
                    <img className="tarot-other-mori" src={moriImage(f.mori)} alt="" width={28} height={28} loading="lazy" />
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
