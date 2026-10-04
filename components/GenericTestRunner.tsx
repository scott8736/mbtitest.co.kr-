"use client";

import { useEffect, useMemo, useState } from "react";
import type { GenericTest, ScoreMap } from "../lib/generic-tests";
import { evaluateTest, type Picks } from "../lib/generic-eval";
import { testCatalog } from "../lib/test-catalog";
import AdUnit from "./AdUnit";
import { markStep2Reached, markTestCompleted, onResultLinkClick, recordAnswered, recordCompletionOnce, recordStep2Once, recordVisitOnce, remainingMinutes } from "../lib/test-events";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import CrossPromo from "./CrossPromo";
import TestGuide from "./TestGuide";
import { leadFacts } from "../lib/test-lead";
import TestResultPick from "./TestResultPick";
import SajuLabBanner from "./SajuLabBanner";
import ReportCrossSell from "./ReportCrossSell";
import TestShareCard from "./TestShareCard";
import Mascot, { moodForQuestion } from "./Mascot";

const PROGRESS_KEY = (slug: string) => `test-progress:${slug}`;

/** 문항을 반으로 나눠 2단계는 별도 주소에서 보여줍니다. */
export function firstHalfCount(total: number) {
  return Math.ceil(total / 2);
}

export default function GenericTestRunner({ test, resultOnly = false, part = 1 }: { test: GenericTest; resultOnly?: boolean; part?: 1 | 2 }) {
  const [screen, setScreen] = useState<"intro" | "test" | "result">(resultOnly ? "result" : part === 2 ? "test" : "intro");
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(part === 1);
  const [scores, setScores] = useState<ScoreMap>({});
  // 문항별로 고른 쪽. 동점일 때 결과를 가르는 데 씁니다 (lib/generic-eval.ts).
  const [picks, setPicks] = useState<Picks>([]);
  const [resultKey, setResultKey] = useState(Object.keys(test.results)[0]);
  const [gender, setGender] = useState<"" | "여성" | "남성">("");
  const result = test.results[resultKey];
  const displayName = test.slug === "egen-teto" && gender
    ? resultKey === "egen" ? (gender === "여성" ? "에겐녀" : "에겐남")
      : resultKey === "teto" ? (gender === "여성" ? "테토녀" : "테토남")
      : `${gender} 에겐·테토 균형형`
    : result.name;

  const related = useMemo(
    () => test.related.map((slug) => testCatalog.find((item) => item.slug === slug && item.status === "published")).filter(Boolean),
    [test.related],
  );

  // 소개 화면 방문. 결과 화면과 2단계는 세지 않습니다.
  useEffect(() => {
    if (part === 1 && !resultOnly) recordVisitOnce(test.slug);
  }, [part, resultOnly, test.slug]);

  // 2단계로 들어오면 1단계에서 쌓은 점수를 이어받습니다. 없으면 처음으로 돌려보냅니다.
  useEffect(() => {
    if (part !== 2) return;
    try {
      const saved = sessionStorage.getItem(PROGRESS_KEY(test.slug));
      if (!saved) throw new Error("no progress");
      const parsed = JSON.parse(saved) as { scores: ScoreMap; gender: "" | "여성" | "남성"; picks?: Picks };
      setScores(parsed.scores || {});
      setGender(parsed.gender || "");
      setPicks(parsed.picks || []);
      setReady(true);
      recordStep2Once(test.slug);
    } catch {
      sessionStorage.removeItem(PROGRESS_KEY(test.slug));
      location.replace(`/tests/${test.slug}/`);
    }
  }, [part, test.slug]);

  useEffect(() => {
    if (!resultOnly) return;
    const saved = sessionStorage.getItem(`test-result:${test.slug}`);
    if (!saved) {
      location.replace(`/tests/${test.slug}/`);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { resultKey: string; scores: ScoreMap; gender: "" | "여성" | "남성" };
      if (!test.results[parsed.resultKey]) throw new Error("invalid result");
      setResultKey(parsed.resultKey);
      setScores(parsed.scores || {});
      setGender(parsed.gender || "");
      recordCompletionOnce(test.slug);
    } catch {
      sessionStorage.removeItem(`test-result:${test.slug}`);
      location.replace(`/tests/${test.slug}/`);
    }
  }, [resultOnly, test]);

  const half = firstHalfCount(test.questions.length);
  const stepQuestions = part === 1 ? test.questions.slice(0, half) : test.questions.slice(half);
  const answeredBefore = part === 1 ? 0 : half;

  const start = () => {
    if (resultOnly) {
      location.assign(`/tests/${test.slug}/`);
      return;
    }
    setScores({});
    setPicks([]);
    setIndex(0);
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answer = (side: "a" | "b") => {
    const question = stepQuestions[index];
    const add = side === "a" ? question.aScores : question.bScores;
    const nextPicks = [...picks];
    nextPicks[answeredBefore + index] = side;
    // 첫 문항에 답한 순간. 화면을 열자마자 나간 사람과 여기까지 온 사람을
    // 가르는 지점이라 따로 셉니다.
    if (part === 1 && index === 0) recordAnswered(test.slug);

    const next = { ...scores };
    Object.entries(add).forEach(([key, value]) => { next[key] = (next[key] || 0) + value; });
    if (index < stepQuestions.length - 1) {
      setScores(next);
      setPicks(nextPicks);
      setIndex(index + 1);
      return;
    }
    if (part === 1) {
      sessionStorage.setItem(PROGRESS_KEY(test.slug), JSON.stringify({ scores: next, gender, picks: nextPicks }));
      markStep2Reached(test.slug);
      location.assign(`/tests/${test.slug}/step2/`);
      return;
    }
    const nextResultKey = evaluateTest(test, next, nextPicks);
    setScores(next);
    setResultKey(nextResultKey);
    sessionStorage.removeItem(PROGRESS_KEY(test.slug));
    sessionStorage.setItem(`test-result:${test.slug}`, JSON.stringify({ resultKey: nextResultKey, scores: next, gender }));
    markTestCompleted(test.slug);
    location.assign(`/tests/${test.slug}/result/`);
  };

  return (
    <main className="generic-test" style={{ "--test-accent": result?.color || "#7657D6" } as React.CSSProperties}>
      <SiteHeader active="/tests" />

      {screen === "intro" && (
        <>
          <section className="generic-intro">
            <Mascot className="intro-mascot" mood="hello" size={120} />
            <span className="eyebrow">{test.eyebrow}</span>
            <h1>{test.heading || test.title}</h1>
            <p>{test.description} {leadFacts(test.description, test.questions.length, test.duration, Object.keys(test.results).length)}</p>
            <div className="generic-meta"><span>{test.questions.length}문항</span><span>{test.duration}</span><span>가입 없음</span></div>
            <button className="primary-button" onClick={start}>무료 테스트 시작 <span>→</span></button>
            {/* 시작 버튼 아래에 둡니다. 위에 있을 때 응답 시작률이 50% 로 다른 테스트(57~61%)보다
                낮았습니다 — 두 버튼이 먼저 눌러야 하는 단계처럼 보였을 가능성이 큽니다(2026-09-30). */}
            {test.slug === "egen-teto" && (
              <div className="gender-choice" aria-label="결과명 선택">
                <span>선택 사항 · 결과 이름을 에겐녀/에겐남으로 받고 싶다면 먼저 골라 주세요</span>
                <div><button className={gender === "여성" ? "active" : ""} onClick={() => setGender("여성")}>에겐녀·테토녀</button><button className={gender === "남성" ? "active" : ""} onClick={() => setGender("남성")}>에겐남·테토남</button></div>
              </div>
            )}
          </section>
          {/* 시작 버튼 아래. 홈(MbtiHome)의 testIntro 와 같은 자리입니다.
              그전까지 이 화면은 푸터 광고 하나뿐이었습니다. 테스트 44개가 전부
              여기로 착지하는데 광고가 한 자리도 없었습니다. 버튼 위에 두지 않는
              이유는 검사 화면과 같습니다 — 첫 화면이 광고로 덮이면 시작을 안 누릅니다.
              시작을 누르면 이 자리는 사라지고 검사 화면의 testTop 으로 바뀝니다. */}
          <AdUnit key={`intro-${test.slug}`} position="testIntro" label={`${test.title} 시작 전 광고`} />
          {!test.whatYouLearn?.length && (
          <section className="generic-explain">
            <h2>이 테스트에서 확인할 수 있어요</h2>
            <div>{test.dimensions.map((dimension) => <article key={dimension.key}><b>{dimension.label}</b><p>일상과 관계에서 나타나는 나의 현재 성향을 질문을 통해 살펴봅니다.</p></article>)}</div>
            <p className="test-disclaimer">{test.disclaimer}</p>
          </section>
          )}
          <TestGuide test={test} />
        </>
      )}

      {screen === "test" && !ready && (
        <section className="test-shell" aria-busy="true">
          <p className="test-tip">앞 단계 답변을 불러오는 중입니다…</p>
        </section>
      )}

      {screen === "test" && ready && (
        <section className="test-shell">
          <div className="test-top">
            <button onClick={() => (part === 1 ? setScreen("intro") : location.assign(`/tests/${test.slug}/`))}>← 나가기</button>
            <span>{answeredBefore + index + 1} / {test.questions.length}</span>
          </div>
          <div className="progress"><i style={{ width: `${((answeredBefore + index + 1) / test.questions.length) * 100}%` }} /></div>
          <p className="step-badge">{part}단계 / 총 2단계</p>
          {part === 2 && index === 0 && (
            <p className="step-cheer">
              절반 왔어요 · 남은 {stepQuestions.length}문항, 약 {remainingMinutes(stepQuestions.length)}분
            </p>
          )}
          <div className="question-card">
            {/* 문항마다 표정이 바뀝니다. 같은 그림이 계속 나오면 "안 넘어가는 것
                같은" 착시가 생겨 중간에 나갑니다. */}
            <Mascot className="question-mascot" mood={moodForQuestion(answeredBefore + index)} size={112} />
            <span className="question-kicker">나와 더 가까운 문장은?</span>
            <h2>{answeredBefore + index + 1}. 평소의 나를 떠올려<br />한 가지를 선택해 주세요.</h2>
            <div className="answers">
              <button onClick={() => answer("a")}><span>A</span><strong>{stepQuestions[index].a}</strong><small>이 문장에 더 가까워요</small></button>
              <em>또는</em>
              <button onClick={() => answer("b")}><span>B</span><strong>{stepQuestions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
            </div>
          </div>
          {/* 광고는 질문 아래에 둡니다. 위에 있으면 모바일 첫 화면이 광고로
              채워져 질문이 접히는데, 같은 페이지라 노출 수는 그대로입니다. */}
          <AdUnit key={`test-below-${test.slug}-${part}`} position="testTop" label={`${test.title} ${part}단계 광고`} />
        </section>
      )}

      {screen === "result" && (
        <section className="rich-result">
          <AdUnit key={`result-top-${resultKey}`} position="resultTop" label={`${test.title} 결과 최상단 광고`} />
          <span className="result-kicker">테스트가 완료되었습니다</span>
          <Mascot className="result-mascot" mood="celebrate" size={96} accent={result.color} />
          {/* 결과마다 구워 둔 카드입니다. 그동안 카카오톡 미리보기로만 쓰고
              정작 검사를 끝낸 사람에게는 보여주지 않았습니다. 사람들이
              캡처해서 올리는 그림이 이것이라 결과의 첫 화면으로 둡니다.
              색 네모에 두 글자를 넣던 result-symbol 을 대신합니다. */}
          <img className="result-card-image" src={`/images/og/r/${test.slug}-${resultKey}.png`} width={1200} height={630} alt={`${displayName} 결과 카드`} />
          <h1>{displayName}</h1>
          <p className="rich-tagline">{result.tagline}</p>
          <p className="rich-summary">{result.summary}</p>
          <div className="trait-pills">{result.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          <TestShareCard slug={test.slug} resultKey={resultKey} testTitle={test.title} displayName={displayName} tagline={result.tagline} traits={result.traits} color={result.color} shareText={result.shareText} />
          <div className="rich-result-grid">
            <article><span>01</span><h2>빛나는 강점</h2>{result.strengths.map((x) => <p key={x}>✦ {x}</p>)}</article>
            <article><span>02</span><h2>주의할 패턴</h2>{result.cautions.map((x) => <p key={x}>○ {x}</p>)}</article>
            <article className="wide"><span>03</span><h2>관계 속의 나</h2><p>{result.relationship}</p></article>
            <article className="wide"><span>04</span><h2>일상과 성장</h2><p>{result.dailyLife}</p></article>
          </div>
          <AdUnit key={`result-middle-${resultKey}`} position="resultMiddle" label={`${test.title} 결과 본문 광고`} />
          <div className="growth-plan"><span>나를 위한 작은 실천</span><h2>오늘부터 이렇게 해보세요</h2>{result.growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
          <ReportCrossSell from="test-result" />
          <SajuLabBanner placement="test" />
          <TestResultPick slug={test.slug} resultKey={resultKey} />
          <div className="result-actions"><button className="secondary-button" onClick={start}>다시 검사하기</button></div>
          <p className="disclaimer">{test.disclaimer}</p>
          <AdUnit key={`result-bottom-${resultKey}`} position="resultBottom" label={`${test.title} 결과 하단 광고`} />
          <div className="related-results" onClick={onResultLinkClick("test-next")}><span className="eyebrow">다음 테스트</span><h2>나를 더 알아보는 다음 테스트</h2><div>{related.map((item) => item && <a href={item.href} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><small>{item.duration} · {item.questionCount}문항</small><i>시작하기 →</i></a>)}</div></div>
          <CrossPromo variant="fortune" />
        </section>
      )}
      <SiteFooter />
    </main>
  );
}
