"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Screener } from "../lib/screeners";
import { HELPLINES, bandFor, maxScore, screenerBySlug } from "../lib/screeners";
import AdUnit from "./AdUnit";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { markTestCompleted, recordCompletionOnce, recordTestEvent } from "../lib/test-events";

/**
 * 자가진단 러너.
 *
 * 성향 테스트 러너(GenericTestRunner)와 따로 둡니다. 답하는 방식이 A/B 선택이
 * 아니라 0~3점 척도이고, 결과를 유형이 아니라 구간으로 읽기 때문입니다.
 *
 * 성향 테스트와 다르게 처리하는 것이 셋 있습니다.
 *
 * 1. 결과 주소를 따로 두지 않고 한 화면에서 끝냅니다. 자가진단 결과는 공유를
 *    권할 내용이 아니라서, 링크가 돌아다닐 이유가 없습니다.
 * 2. 상담 안내는 모든 결과에 붙이되, 도움이 필요한 구간이거나 위험 문항에
 *    응답이 있으면 결과 맨 위로 올립니다. 광고보다 위입니다.
 * 3. 그 경우 공유·저장 버튼을 아예 내보내지 않습니다.
 */

function Helplines({ urgent }: { urgent: boolean }) {
  return (
    <aside className={urgent ? "screener-help urgent" : "screener-help"}>
      <h2>{urgent ? "지금 연락할 수 있는 곳" : "도움이 필요할 때"}</h2>
      <ul>
        {HELPLINES.map((line) => (
          <li key={line.tel}>
            <a href={`tel:${line.tel}`}>{line.tel}</a>
            <span>
              {line.name} · {line.note}
            </span>
          </li>
        ))}
      </ul>
      <p>
        통화료는 들지 않습니다. 가까운 지역 정신건강복지센터 상담도 무료이며,
        1577-0199 로 전화하면 거주지 센터로 연결됩니다.
      </p>
    </aside>
  );
}

export default function ScreenerRunner({ screener }: { screener: Screener }) {
  const [screen, setScreen] = useState<"intro" | "test" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const total = screener.questions.length;
  const top = maxScore(screener);

  const score = useMemo(() => answers.reduce((sum, n) => sum + n, 0), [answers]);
  const band = useMemo(() => bandFor(screener, score), [screener, score]);

  const criticalTriggered =
    screener.criticalIndex !== undefined && (answers[screener.criticalIndex] ?? 0) > 0;
  const urgent = band.seekHelp || criticalTriggered;

  const related = useMemo(
    () => screener.related.map((slug) => screenerBySlug(slug)).filter(Boolean) as Screener[],
    [screener.related],
  );

  const start = () => {
    setAnswers([]);
    setIndex(0);
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pick = (value: number) => {
    if (index === 0) recordTestEvent(screener.slug, "answered");
    const next = [...answers];
    next[index] = value;
    setAnswers(next);

    if (index < total - 1) {
      setIndex(index + 1);
      return;
    }
    markTestCompleted(screener.slug);
    recordCompletionOnce(screener.slug);
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
    <main
      className="generic-test screener"
      style={{ "--test-accent": band.color } as React.CSSProperties}
    >
      <SiteHeader active="/check" />

      {screen === "intro" && (
        <>
          <section className="generic-intro">
            <span className="eyebrow">{screener.eyebrow}</span>
            <h1>{screener.heading}</h1>
            <p>{screener.description}</p>
            <div className="generic-meta">
              <span>{total}문항</span>
              <span>{screener.duration}</span>
              <span>가입 없음</span>
            </div>
            <p className="screener-period">
              모든 문항은 <b>{screener.period}</b>을 기준으로 답해 주세요.
            </p>
            <button className="primary-button" onClick={start}>
              자가진단 시작 <span>→</span>
            </button>
            <p className="test-disclaimer">
              이 검사는 진단이 아니라 <b>선별 도구</b>입니다. 결과가 어떤 질환의 진단을
              대신하지 않으며, 정확한 확인은 정신건강의학과 전문의 또는 지역
              정신건강복지센터에서 받으시기 바랍니다.
            </p>
          </section>

          <section className="generic-explain">
            <h2>알아두기</h2>
            {screener.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <AdUnit position="testIntro" />

          <section className="generic-explain">
            <h2>자주 묻는 질문</h2>
            {screener.faq.map((item) => (
              <details key={item.q} className="screener-faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>

          <Helplines urgent={false} />
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
            <span className="question-kicker">{screener.period}</span>
            <p>{screener.questions[index]}</p>
            <div className="screener-options">
              {screener.options.map((label, value) => (
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
          <p className="test-tip">
            정답이 없습니다. 오래 고민하지 말고 최근의 나에 가까운 쪽을 고르세요.
          </p>
        </section>
      )}

      {screen === "result" && (
        <section className="rich-result">
          {urgent && <Helplines urgent />}

          {criticalTriggered && screener.criticalNote && (
            <p className="screener-critical">{screener.criticalNote}</p>
          )}

          <span className="result-kicker">자가진단이 완료되었습니다</span>

          <div className="screener-score" style={{ borderColor: band.color }}>
            <strong>
              {score}
              <span>/ {top}점</span>
            </strong>
            <div className="screener-meter" aria-hidden="true">
              <i style={{ width: `${(score / top) * 100}%`, background: band.color }} />
            </div>
          </div>

          <h1 style={{ color: band.color }}>{band.name}</h1>
          <p className="rich-tagline">{band.tagline}</p>
          <p className="rich-summary">{band.summary}</p>

          <div className="growth-plan">
            <span>지금 해볼 수 있는 것</span>
            <h2>다음 단계</h2>
            {band.advice.map((line, i) => (
              <p key={line}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                {line}
              </p>
            ))}
          </div>

          {!urgent && <AdUnit position="resultMiddle" />}
          {!urgent && <Helplines urgent={false} />}

          <p className="screener-source">
            <b>문항과 점수 구간에 대해</b>
            {screener.source}
          </p>

          <p className="disclaimer">
            이 결과는 진단이 아닙니다. 점수가 낮아도 힘들다면 그 어려움이 사실이고,
            점수가 높아도 그것만으로 질환이 있다는 뜻은 아닙니다. 판단은 전문가와 함께
            하시기 바랍니다.
          </p>

          <div className="result-actions">
            <button className="secondary-button" onClick={start}>
              다시 검사하기
            </button>
            <Link className="secondary-button" href="/check/">
              다른 자가진단 보기
            </Link>
          </div>

          {related.length > 0 && (
            <div className="screener-related">
              <h2>함께 확인해 보면 좋은 검사</h2>
              <ul>
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/check/${item.slug}/`}>
                      <b>{item.title}</b>
                      <span>{item.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
