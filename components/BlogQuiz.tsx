"use client";

import { useId, useRef, useState } from "react";
import { quizResult, type BlogQuiz as BlogQuizData } from "../lib/blog-quiz";

/**
 * 블로그 글 속 미니 테스트 (2026-11-03~). 데이터 형식은 lib/blog-quiz.ts.
 * 모든 문항을 한 화면에 두고 다 고른 뒤 결과를 보여 준다. alert 를 쓰지 않는다 —
 * 덜 고른 문항이 있으면 버튼 아래에 글로 알리고 첫 빈 문항으로 옮긴다.
 */
export default function BlogQuiz({ quiz }: { quiz: BlogQuizData }) {
  const id = useId();
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => quiz.questions.map(() => undefined));
  const [shown, setShown] = useState(false);
  const [missing, setMissing] = useState(0);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const answered = answers.filter((a) => a !== undefined).length;
  const result = shown ? quizResult(quiz, answers) : undefined;

  function pick(qi: number, oi: number) {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
    setMissing(0);
  }

  function showResult() {
    const first = answers.findIndex((a) => a === undefined);
    if (first >= 0) {
      setMissing(answers.filter((a) => a === undefined).length);
      document.getElementById(`${id}-q${first}`)?.focus();
      return;
    }
    setShown(true);
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function reset() {
    setAnswers(quiz.questions.map(() => undefined));
    setShown(false);
    setMissing(0);
    requestAnimationFrame(() => document.getElementById(`${id}-q0`)?.focus());
  }

  return (
    <section className="blog-quiz" aria-labelledby={`${id}-title`}>
      <span className="blog-quiz-kicker">미니 테스트 · {quiz.questions.length}문항</span>
      <h3 id={`${id}-title`}>{quiz.title}</h3>
      {quiz.intro && <p className="blog-quiz-intro">{quiz.intro}</p>}

      {!shown && (
        <>
          {quiz.questions.map((q, qi) => (
            <fieldset className="blog-quiz-q" key={qi}>
              <legend id={`${id}-q${qi}`} tabIndex={-1}>
                <b>{qi + 1}.</b> {q.q}
              </legend>
              <div className="blog-quiz-options">
                {q.options.map((o, oi) => (
                  <button
                    type="button"
                    key={o.label}
                    aria-pressed={answers[qi] === oi}
                    onClick={() => pick(qi, oi)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="blog-quiz-actions">
            <button type="button" className="blog-quiz-submit" onClick={showResult}>
              결과 보기 ({answered}/{quiz.questions.length})
            </button>
            <p className="blog-quiz-missing" aria-live="polite">
              {missing > 0 ? `아직 고르지 않은 문항이 ${missing}개 있어요.` : ""}
            </p>
          </div>
        </>
      )}

      {shown && result && (
        <div className="blog-quiz-result" aria-live="polite">
          <span>내 결과</span>
          <h4 ref={resultRef} tabIndex={-1}>
            {result.title}
          </h4>
          <p>{result.body}</p>
          <a className="blog-quiz-cta" href={quiz.cta.href}>
            {quiz.cta.label}&nbsp;→
          </a>
          <button type="button" className="blog-quiz-reset" onClick={reset}>
            다시 하기
          </button>
        </div>
      )}

      <p className="blog-quiz-note">재미로 보는 간단한 문항이며, 의학적·심리학적 진단이 아닙니다.</p>
    </section>
  );
}
