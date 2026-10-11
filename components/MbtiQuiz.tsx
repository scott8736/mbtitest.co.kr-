"use client";

import ReportQuizStrip from "./ReportQuizStrip";
import { Fragment, useEffect, useState } from "react";
import AdUnit from "./AdUnit";
import Mascot, { moodForQuestion } from "./Mascot";
import { isFlipped, questions, scoreType, type Answer, type Axis } from "../lib/mbti-data";
import { moriImage } from "../lib/mori";
import { markStep2Reached, markTestCompleted, recordAnswered, recordStep2Once, recordTestEvent, recordVisitOnce, remainingMinutes } from "../lib/test-events";

/** 관리자 퍼널의 「2단계 도착」을 이어서 세는 지점입니다. 주소는 바뀌지 않습니다. */
export const HALF_POINT = 20;

const PROGRESS_KEY = "mbti-progress";
const RESULT_KEY = "mbti-test-result";
const RESULT_PATH = "/mbti-result/";

const emptyScores = (): Record<Axis, number> => ({ EI: 0, SN: 0, TF: 0, JP: 0 });

/** 예고 화면에서 가릴 글자 자리(0부터). 첫째·셋째는 보여 주고 둘째·넷째를 가립니다. */
const HIDDEN_LETTERS = [1, 3];

/**
 * 40문항을 한 페이지에서 풉니다(2026-10-11). 예전에는 20번 뒤 2단계 주소로,
 * 40번 뒤 결과 화면으로 저절로 넘어갔습니다. 이제 마지막 답 뒤에는 같은 화면에
 * 유형 일부만 보여 주고, 결과는 사람이 「내 결과 확인하기」를 눌러 엽니다.
 * 그 버튼은 반드시 진짜 <a href> 여야 합니다 — 애드센스 전면광고(비네트)는
 * 링크 클릭에만 붙고 location.assign() 이동에는 붙지 않습니다.
 */
export default function MbtiQuiz() {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<Axis, number>>(emptyScores);
  const [last, setLast] = useState<Partial<Record<Axis, Answer>>>({});
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    // 언제나 처음부터 시작합니다.
    sessionStorage.removeItem(PROGRESS_KEY);
    sessionStorage.removeItem(RESULT_KEY);
    recordVisitOnce("mbti");
  }, []);

  const progressPercent = ((index + 1) / questions.length) * 100;

  const answer = (value: Answer) => {
    // 첫 문항에 답한 순간을 한 번만 남깁니다. 열 때마다 처음부터 시작하므로
    // 여기가 곧 "검사를 실제로 시작했다"는 뜻입니다.
    if (index === 0) recordAnswered("mbti");

    const axis = questions[index].axis;
    const next = { ...scores, [axis]: scores[axis] + value };
    const nextLast = { ...last, [axis]: value };
    setScores(next);
    setLast(nextLast);

    if (index < questions.length - 1) {
      if (index + 1 === HALF_POINT) {
        markStep2Reached("mbti");
        recordStep2Once("mbti");
      }
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }

    const type = scoreType(next, nextLast);
    sessionStorage.setItem(RESULT_KEY, JSON.stringify({ result: type, scores: next }));
    markTestCompleted("mbti");
    // 문항을 다 푼 사람. 결과 화면의 「완주」 ÷ 이것 = 결과 버튼을 누른 비율입니다.
    recordTestEvent("mbti", "teaser");
    setDone(type);
    window.scrollTo({ top: 0 });
  };

  const leave = () => {
    sessionStorage.removeItem(PROGRESS_KEY);
    location.assign("/");
  };

  if (done) {
    return (
      <section className="test-shell mbti-quiz">
        <div className="progress"><i style={{ width: "100%" }} /></div>
        <div className="question-card mbti-teaser">
          <span className="question-kicker">40문항 완료!</span>
          <h2>잠들어 있던 내 모리가<br />깨어나고 있어요</h2>
          <div className="mbti-teaser-mori" aria-hidden="true">
            <img src={moriImage(done)} width={180} height={180} alt="" />
            <b>?</b>
          </div>
          <p className="mbti-teaser-letters" aria-label="유형 일부 공개">
            {done.split("").map((letter, i) => (
              <span key={i} className={HIDDEN_LETTERS.includes(i) ? "masked" : undefined}>
                {HIDDEN_LETTERS.includes(i) ? "?" : letter}
              </span>
            ))}
          </p>
          <p className="mbti-teaser-hint">가려진 두 글자와 내 모리의 정체,<br />성향 비율까지 결과 화면에 있어요.</p>
          <a className="mbti-teaser-cta" href={RESULT_PATH}>내 결과 확인하기 →</a>
        </div>
      </section>
    );
  }

  return (
    <section className="test-shell mbti-quiz">
      <div className="test-top">
        <button type="button" onClick={leave}>← 나가기</button>
        <span>{index + 1} / {questions.length}</span>
      </div>
      <div className="progress"><i style={{ width: `${progressPercent}%` }} /></div>
      {index === 0 && <ReportQuizStrip />}
      {index === HALF_POINT && (
        <p className="step-cheer">
          절반 왔어요 · 남은 {questions.length - HALF_POINT}문항, 약 {remainingMinutes(questions.length - HALF_POINT)}분
        </p>
      )}
      <div className="question-card">
        <span className="question-kicker">둘 중 나와 더 가까운 문장은?</span>
        {/* 표정이 문항마다 바뀝니다. 같은 화면이 계속 나오면 넘어가지 않는 것
            같은 착시가 생겨 중간에 나갑니다. 방문 431명 중 204명이 1단계에서
            빠지는 화면이라 사이트에서 여기가 가장 중요합니다. */}
        <Mascot className="question-mascot" mood={moodForQuestion(index)} size={112} />
        <h2>평소의 나를 떠올리며<br />한 가지를 선택해 주세요.</h2>
        {/* 절반 문항은 E·S·T·J 문장을 B 자리에 둡니다. 늘 A 가 같은 쪽이면 첫 보기를 고르는 버릇이 결과를 끌고 갑니다. */}
        <div className="answers">
          {(isFlipped(index) ? [-1, 1] as const : [1, -1] as const).map((value, i) => (
            <Fragment key={value}>
              {i === 1 && <em>또는</em>}
              <button onClick={() => answer(value)}><span>{i === 0 ? "A" : "B"}</span><strong>{value === 1 ? questions[index].a : questions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
            </Fragment>
          ))}
        </div>
      </div>
      <p className="test-tip">생각이 길어지면 처음 마음이 간 문장을 선택해 보세요.</p>
      {/* 광고는 질문 아래에 둡니다. 위에 있으면 모바일 첫 화면이 광고로 채워져
          질문이 접히는데, 같은 페이지라 아래로 내려도 노출은 그대로입니다. */}
      <AdUnit key="test-below" position="testTop" label="MBTI 검사 광고" />
    </section>
  );
}
