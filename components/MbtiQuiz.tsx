"use client";

import { useState } from "react";
import AdUnit from "./AdUnit";
import { questions, type Answer, type Axis } from "../lib/mbti-data";

export default function MbtiQuiz() {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<Axis, number>>({ EI: 0, SN: 0, TF: 0, JP: 0 });

  const progress = ((index + 1) / questions.length) * 100;

  const answer = (value: Answer) => {
    const axis = questions[index].axis;
    const next = { ...scores, [axis]: scores[axis] + value };
    if (index < questions.length - 1) {
      setScores(next);
      setIndex(index + 1);
      return;
    }
    const type = `${next.EI >= 0 ? "E" : "I"}${next.SN >= 0 ? "S" : "N"}${next.TF >= 0 ? "T" : "F"}${next.JP >= 0 ? "J" : "P"}`;
    sessionStorage.setItem("mbti-test-result", JSON.stringify({ result: type, scores: next }));
    location.assign("/mbti-result/");
  };

  return (
    <section className="test-shell">
      <AdUnit position="testTop" label="MBTI 검사 진행 화면 상단 광고" />
      <div className="test-top"><a href="/">← 나가기</a><span>{index + 1} / {questions.length}</span></div>
      <div className="progress"><i style={{ width: `${progress}%` }} /></div>
      <div className="question-card">
        <span className="question-kicker">둘 중 나와 더 가까운 문장은?</span>
        <h2>평소의 나를 떠올리며<br />한 가지를 선택해 주세요.</h2>
        <div className="answers">
          <button onClick={() => answer(1)}><span>A</span><strong>{questions[index].a}</strong><small>이 문장에 더 가까워요</small></button>
          <em>또는</em>
          <button onClick={() => answer(-1)}><span>B</span><strong>{questions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
        </div>
      </div>
      <p className="test-tip">생각이 길어지면 처음 마음이 간 문장을 선택해 보세요.</p>
    </section>
  );
}
