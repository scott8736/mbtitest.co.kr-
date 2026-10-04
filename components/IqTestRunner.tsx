"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IQ_AREAS, IQ_SLUG, iqBandFor, iqFaq, iqIntro, iqQuestions } from "../lib/iq-test";
import AdUnit from "./AdUnit";
import CrossPromo from "./CrossPromo";
import ResultShareCard from "./ResultShareCard";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import TestResultPick from "./TestResultPick";
import SajuLabBanner from "./SajuLabBanner";
import ReportCrossSell from "./ReportCrossSell";
import { markTestCompleted, recordCompletionOnce, recordTestEvent } from "../lib/test-events";

/**
 * IQ 테스트 러너.
 *
 * 자가진단 러너와 모양은 같지만 채점이 다릅니다. 문항마다 정답이 있고, 결과는
 * 맞힌 개수·영역별 정답률·문제별 해설로 보여 줍니다. IQ 숫자로 환산하지 않는
 * 이유는 lib/iq-test.ts 에 적었습니다.
 */

// 시작·완료 클릭에서만 부릅니다. 컴포넌트 안에서 직접 부르면 린트(react-compiler)가
// 렌더 중 호출로 오인합니다.
const now = () => Date.now();

function formatDuration(ms: number): string {
  const sec = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}분 ${s}초` : `${s}초`;
}

export default function IqTestRunner() {
  const [screen, setScreen] = useState<"intro" | "test" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const total = iqQuestions.length;
  const question = iqQuestions[index];

  const correct = useMemo(
    () => iqQuestions.filter((q, i) => answers[i] === q.answer).length,
    [answers],
  );
  const band = iqBandFor(correct);

  const byArea = useMemo(
    () =>
      IQ_AREAS.map((area) => {
        const idx = iqQuestions.map((q, i) => (q.area === area ? i : -1)).filter((i) => i >= 0);
        const hit = idx.filter((i) => answers[i] === iqQuestions[i].answer).length;
        return { area, hit, total: idx.length };
      }),
    [answers],
  );

  const start = () => {
    setAnswers([]);
    setIndex(0);
    startedAt.current = now();
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pick = (choice: number) => {
    if (index === 0) recordTestEvent(IQ_SLUG, "answered");
    const next = [...answers];
    next[index] = choice;
    setAnswers(next);

    if (index < total - 1) {
      setIndex(index + 1);
      return;
    }
    setElapsed(now() - startedAt.current);
    markTestCompleted(IQ_SLUG);
    recordCompletionOnce(IQ_SLUG);
    setScreen("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    if (index === 0) {
      setScreen("intro");
      return;
    }
    setIndex(index - 1);
  };

  return (
    <main className="generic-test screener iq-test" style={{ "--test-accent": band.color } as React.CSSProperties}>
      <SiteHeader active="/tests" />

      {screen === "intro" && (
        <>
          <section className="generic-intro">
            <span className="eyebrow">IQ PUZZLE 20</span>
            <h1>IQ 테스트 무료 — 20문제로 보는 나의 두뇌 퍼즐 점수</h1>
            <p>
              수열·언어·논리·수리 네 영역 20문제를 풀고, 몇 문제를 맞혔는지와 어느 영역이 강한지
              확인합니다. 약 5~10분 걸리고 시간 제한은 없으며, 문제마다 해설이 붙어 있습니다. 회원가입 없이 무료입니다.
            </p>
            <div className="generic-meta">
              <span>{total}문제</span>
              <span>약 5~10분</span>
              <span>시간 제한 없음</span>
              <span>가입 없음</span>
            </div>
            <button className="primary-button" onClick={start}>
              IQ 테스트 시작 <span>→</span>
            </button>
            <p className="test-disclaimer">
              재미로 푸는 두뇌 퍼즐입니다. 표준화된 지능검사가 아니며, 결과를 IQ 숫자로 환산하지
              않습니다.
            </p>
          </section>

          <section className="generic-explain">
            <h2>IQ란 무엇인가요</h2>
            {iqIntro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <AdUnit position="testIntro" />

          <section className="generic-explain">
            <h2>자주 묻는 질문</h2>
            {iqFaq.map((item) => (
              <details key={item.q} className="screener-faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        </>
      )}

      {screen === "test" && (
        <section className="test-shell">
          <div className="test-top">
            <span>
              {index + 1} / {total}
            </span>
            <button className="secondary-button" onClick={back}>
              이전
            </button>
          </div>
          <div className="progress">
            <i style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
          <div className="question-card">
            <span className="question-kicker">{question.area}</span>
            <p>{question.prompt}</p>
            {question.figure && (
              <div className="iq-figure">
                {question.figure.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            )}
            <div className="screener-options">
              {question.choices.map((label, value) => (
                <button
                  key={label}
                  className={answers[index] === value ? "active" : ""}
                  onClick={() => pick(value)}
                >
                  <b>{label}</b>
                </button>
              ))}
            </div>
          </div>
          <p className="test-tip">모르겠으면 가장 그럴듯한 답을 고르고 넘어가세요. 결과 화면에서 해설을 볼 수 있습니다.</p>
        </section>
      )}

      {screen === "result" && (
        <section className="rich-result">
          <span className="result-kicker">IQ 테스트 결과</span>

          <div className="screener-score" style={{ borderColor: band.color }}>
            <strong>
              {correct}
              <span>/ {total}문제</span>
            </strong>
            <div className="screener-meter" aria-hidden="true">
              <i style={{ width: `${(correct / total) * 100}%`, background: band.color }} />
            </div>
          </div>

          <h1 style={{ color: band.color }}>{band.name}</h1>
          <p className="rich-tagline">걸린 시간 {formatDuration(elapsed)}</p>
          <p className="rich-summary">{band.summary}</p>

          <div className="iq-areas">
            <h2>영역별 정답</h2>
            <ul>
              {byArea.map((row) => (
                <li key={row.area}>
                  <b>{row.area}</b>
                  <span className="screener-meter" aria-hidden="true">
                    <i style={{ width: `${(row.hit / row.total) * 100}%`, background: band.color }} />
                  </span>
                  <em>
                    {row.hit} / {row.total}
                  </em>
                </li>
              ))}
            </ul>
          </div>

          <AdUnit position="resultMiddle" />

          <div className="iq-review">
            <h2>문제별 해설</h2>
            <ol>
              {iqQuestions.map((q, i) => {
                const ok = answers[i] === q.answer;
                return (
                  <li key={q.prompt + i} className={ok ? "ok" : "miss"}>
                    <p className="iq-review-q">
                      <b>{ok ? "정답" : "오답"}</b> {q.prompt}
                      {q.figure ? ` ${q.figure.join(" / ")}` : ""}
                    </p>
                    <p>
                      정답: <b>{q.choices[q.answer]}</b>
                      {!ok && answers[i] !== undefined ? ` · 내 답: ${q.choices[answers[i]]}` : ""}
                    </p>
                    <p className="iq-review-explain">{q.explain}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="disclaimer">
            이 결과는 IQ가 아닙니다. 표준화된 지능검사가 아니라서 점수를 IQ로 환산하지 않았습니다.
            정식 IQ는 웩슬러 지능검사처럼 전문가가 실시하는 검사로 확인할 수 있습니다.
          </p>

          <ReportCrossSell from="iq" />
          <SajuLabBanner placement="iq" />
          <TestResultPick slug={IQ_SLUG} resultKey={String(band.min)} />

          <ResultShareCard
            id={`iq-${correct}`}
            kicker="IQ 퍼즐 20문제"
            big={`${correct}/${total}`}
            bigLabel="맞힌 문제"
            headline={band.name}
            sub={`걸린 시간 ${formatDuration(elapsed)}`}
            color={band.color}
            path="/tests/iq/"
            shareText={`IQ 퍼즐 20문제 중 ${correct}문제 맞혔어요. 몇 개 맞힐 수 있나요?`}
            linkTitle="IQ 테스트 20문제"
          />

          <div className="result-actions">
            <button className="secondary-button" onClick={start}>
              다시 풀기
            </button>
            <Link className="secondary-button" href="/tests/">
              다른 테스트 보기
            </Link>
          </div>

          <CrossPromo variant="tests" />
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
