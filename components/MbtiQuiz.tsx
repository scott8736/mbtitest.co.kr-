"use client";

import { useEffect, useState } from "react";
import AdUnit from "./AdUnit";
import { questions, type Answer, type Axis } from "../lib/mbti-data";

export const QUESTIONS_PER_STEP = 10;
export const TOTAL_STEPS = Math.ceil(questions.length / QUESTIONS_PER_STEP);

const PROGRESS_KEY = "mbti-progress";
const RESULT_KEY = "mbti-test-result";
const FIRST_STEP_PATH = "/tests/mbti/";

type Progress = { scores: Record<Axis, number>; answered: number };

const emptyScores = (): Record<Axis, number> => ({ EI: 0, SN: 0, TF: 0, JP: 0 });

const stepPath = (step: number) => (step === 1 ? FIRST_STEP_PATH : `/tests/mbti/step${step}/`);

function readProgress(): Progress | null {
  try {
    const saved = sessionStorage.getItem(PROGRESS_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Progress;
    if (typeof parsed.answered !== "number" || !parsed.scores) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 40문항을 10문항씩 네 단계로 나눠 각 단계를 별도 주소에서 보여줍니다.
 * 단계 사이 점수는 sessionStorage 에 쌓아 두고, 마지막 단계에서 유형을 계산합니다.
 */
export default function MbtiQuiz({ step = 1 }: { step?: number }) {
  const stepQuestions = questions.slice((step - 1) * QUESTIONS_PER_STEP, step * QUESTIONS_PER_STEP);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<Axis, number>>(emptyScores);
  const [ready, setReady] = useState(step === 1);

  useEffect(() => {
    if (step === 1) {
      // 1단계는 언제나 처음부터 시작합니다.
      sessionStorage.removeItem(PROGRESS_KEY);
      sessionStorage.removeItem(RESULT_KEY);
      return;
    }
    // 앞 단계를 건너뛰고 들어온 경우에는 처음으로 돌려보냅니다.
    const progress = readProgress();
    if (!progress || progress.answered < (step - 1) * QUESTIONS_PER_STEP) {
      location.replace(FIRST_STEP_PATH);
      return;
    }
    setScores(progress.scores);
    setReady(true);
  }, [step]);

  const answeredBefore = (step - 1) * QUESTIONS_PER_STEP;
  const progressPercent = ((answeredBefore + index + 1) / questions.length) * 100;

  const answer = (value: Answer) => {
    const axis = stepQuestions[index].axis;
    const next = { ...scores, [axis]: scores[axis] + value };

    if (index < stepQuestions.length - 1) {
      setScores(next);
      setIndex(index + 1);
      return;
    }

    const answered = answeredBefore + stepQuestions.length;
    if (step < TOTAL_STEPS) {
      sessionStorage.setItem(PROGRESS_KEY, JSON.stringify({ scores: next, answered }));
      location.assign(stepPath(step + 1));
      return;
    }

    const type = `${next.EI >= 0 ? "E" : "I"}${next.SN >= 0 ? "S" : "N"}${next.TF >= 0 ? "T" : "F"}${next.JP >= 0 ? "J" : "P"}`;
    sessionStorage.removeItem(PROGRESS_KEY);
    sessionStorage.setItem(RESULT_KEY, JSON.stringify({ result: type, scores: next }));
    location.assign("/mbti-result/");
  };

  const leave = () => {
    sessionStorage.removeItem(PROGRESS_KEY);
    location.assign("/");
  };

  if (!ready) {
    return (
      <section className="test-shell" aria-busy="true">
        <p className="test-tip">이전 단계 답변을 불러오는 중입니다…</p>
      </section>
    );
  }

  return (
    <section className="test-shell">
      <AdUnit key={`test-top-${step}`} position="testTop" label={`MBTI 검사 ${step}단계 상단 광고`} />
      <div className="test-top">
        <button type="button" onClick={leave}>← 나가기</button>
        <span>{answeredBefore + index + 1} / {questions.length}</span>
      </div>
      <div className="progress"><i style={{ width: `${progressPercent}%` }} /></div>
      <p className="step-badge">{step}단계 / 총 {TOTAL_STEPS}단계</p>
      <div className="question-card">
        <span className="question-kicker">둘 중 나와 더 가까운 문장은?</span>
        <h2>평소의 나를 떠올리며<br />한 가지를 선택해 주세요.</h2>
        <div className="answers">
          <button onClick={() => answer(1)}><span>A</span><strong>{stepQuestions[index].a}</strong><small>이 문장에 더 가까워요</small></button>
          <em>또는</em>
          <button onClick={() => answer(-1)}><span>B</span><strong>{stepQuestions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
        </div>
      </div>
      <p className="test-tip">생각이 길어지면 처음 마음이 간 문장을 선택해 보세요.</p>
    </section>
  );
}
