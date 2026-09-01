"use client";

import { useEffect, useMemo, useState } from "react";
import type { GenericTest, ScoreMap } from "../lib/generic-tests";
import { testCatalog } from "../lib/test-catalog";
import AdUnit from "./AdUnit";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function GenericTestRunner({ test, resultOnly = false }: { test: GenericTest; resultOnly?: boolean }) {
  const [screen, setScreen] = useState<"intro" | "test" | "result">(resultOnly ? "result" : "intro");
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<ScoreMap>({});
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

  useEffect(() => {
    if (!resultOnly) return;
    const saved = sessionStorage.getItem(`test-result:${test.slug}`);
    if (!saved) {
      location.replace(`/tests/${test.slug}`);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as { resultKey: string; scores: ScoreMap; gender: "" | "여성" | "남성" };
      if (!test.results[parsed.resultKey]) throw new Error("invalid result");
      setResultKey(parsed.resultKey);
      setScores(parsed.scores || {});
      setGender(parsed.gender || "");
    } catch {
      sessionStorage.removeItem(`test-result:${test.slug}`);
      location.replace(`/tests/${test.slug}`);
    }
  }, [resultOnly, test]);

  const start = () => {
    if (resultOnly) {
      location.assign(`/tests/${test.slug}`);
      return;
    }
    setScores({});
    setIndex(0);
    setScreen("test");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answer = (add: ScoreMap) => {
    const next = { ...scores };
    Object.entries(add).forEach(([key, value]) => { next[key] = (next[key] || 0) + value; });
    if (index < test.questions.length - 1) {
      setScores(next);
      setIndex(index + 1);
    } else {
      const nextResultKey = evaluateTest(test, next);
      setScores(next);
      setResultKey(nextResultKey);
      sessionStorage.setItem(`test-result:${test.slug}`, JSON.stringify({ resultKey: nextResultKey, scores: next, gender }));
      location.assign(`/tests/${test.slug}/result`);
    }
  };

  const share = async () => {
    const text = `나는 ${displayName}! ${result.shareText} 당신의 결과도 확인해 보세요.`;
    if (navigator.share) await navigator.share({ title: test.title, text, url: location.href });
    else {
      await navigator.clipboard.writeText(`${text} ${location.href}`);
      alert("결과 링크를 복사했습니다.");
    }
  };

  const downloadCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#172A46");
    gradient.addColorStop(0.55, "#302268");
    gradient.addColorStop(1, result.color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.beginPath(); ctx.arc(900, 140, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(100, 980, 330, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#DCD4FF";
    ctx.font = "700 30px sans-serif";
    ctx.fillText(test.eyebrow, 90, 120);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 78px sans-serif";
    ctx.fillText(displayName, 90, 310);
    ctx.font = "600 38px sans-serif";
    wrapText(ctx, result.tagline, 90, 385, 850, 56);
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.font = "500 31px sans-serif";
    result.traits.forEach((trait, i) => {
      ctx.fillStyle = "rgba(255,255,255,.13)";
      roundRect(ctx, 90 + i * 290, 620, 250, 74, 37);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(trait, 215 + i * 290, 668);
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 30px sans-serif";
    ctx.fillText("나도 테스트하기", 90, 920);
    ctx.fillStyle = "rgba(255,255,255,.68)";
    ctx.font = "500 25px sans-serif";
    ctx.fillText(location.host, 90, 968);
    const link = document.createElement("a");
    link.download = `${test.slug}-${result.key}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="generic-test" style={{ "--test-accent": result?.color || "#7657D6" } as React.CSSProperties}>
      <SiteHeader active="/tests" />

      {screen === "intro" && (
        <>
          <section className="generic-intro">
            <span className="eyebrow">{test.eyebrow}</span>
            <h1>{test.title}</h1>
            <p>{test.description}</p>
            <div className="generic-meta"><span>{test.questions.length}문항</span><span>{test.duration}</span><span>가입 없음</span></div>
            {test.slug === "egen-teto" && (
              <div className="gender-choice" aria-label="결과명 선택">
                <span>결과 표현 선택 · 선택하지 않아도 검사할 수 있어요</span>
                <div><button className={gender === "여성" ? "active" : ""} onClick={() => setGender("여성")}>에겐녀·테토녀</button><button className={gender === "남성" ? "active" : ""} onClick={() => setGender("남성")}>에겐남·테토남</button></div>
              </div>
            )}
            <button className="primary-button" onClick={start}>무료 테스트 시작 <span>→</span></button>
          </section>
          <section className="generic-explain">
            <h2>이 테스트에서 확인할 수 있어요</h2>
            <div>{test.dimensions.map((dimension) => <article key={dimension.key}><b>{dimension.label}</b><p>일상과 관계에서 나타나는 나의 현재 성향을 질문을 통해 살펴봅니다.</p></article>)}</div>
            <p className="test-disclaimer">{test.disclaimer}</p>
          </section>
          <AdUnit label={`${test.title} 시작 전 광고`} />
        </>
      )}

      {screen === "test" && (
        <section className="test-shell">
          <div className="test-top"><button onClick={() => setScreen("intro")}>← 나가기</button><span>{index + 1} / {test.questions.length}</span></div>
          <div className="progress"><i style={{ width: `${((index + 1) / test.questions.length) * 100}%` }} /></div>
          <div className="question-card">
            <span className="question-kicker">나와 더 가까운 문장은?</span>
            <h2>{index + 1}. 평소의 나를 떠올려<br />한 가지를 선택해 주세요.</h2>
            <div className="answers">
              <button onClick={() => answer(test.questions[index].aScores)}><span>A</span><strong>{test.questions[index].a}</strong><small>이 문장에 더 가까워요</small></button>
              <em>또는</em>
              <button onClick={() => answer(test.questions[index].bScores)}><span>B</span><strong>{test.questions[index].b}</strong><small>이 문장에 더 가까워요</small></button>
            </div>
          </div>
        </section>
      )}

      {screen === "result" && (
        <section className="rich-result">
          <span className="result-kicker">테스트가 완료되었습니다</span>
          <div className="result-symbol" style={{ background: result.color }}>{result.name.slice(0, 2)}</div>
          <h1>{displayName}</h1>
          <p className="rich-tagline">{result.tagline}</p>
          <p className="rich-summary">{result.summary}</p>
          <div className="trait-pills">{result.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          <div className="rich-result-grid">
            <article><span>01</span><h2>빛나는 강점</h2>{result.strengths.map((x) => <p key={x}>✦ {x}</p>)}</article>
            <article><span>02</span><h2>주의할 패턴</h2>{result.cautions.map((x) => <p key={x}>○ {x}</p>)}</article>
            <article className="wide"><span>03</span><h2>관계 속의 나</h2><p>{result.relationship}</p></article>
            <article className="wide"><span>04</span><h2>일상과 성장</h2><p>{result.dailyLife}</p></article>
          </div>
          <div className="growth-plan"><span>나를 위한 작은 실천</span><h2>오늘부터 이렇게 해보세요</h2>{result.growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
          <div className="result-actions"><button className="primary-button" onClick={share}>결과 공유하기 <span>↗</span></button><button className="secondary-button" onClick={downloadCard}>결과 이미지 저장</button><button className="secondary-button" onClick={start}>다시 검사하기</button></div>
          <p className="disclaimer">{test.disclaimer}</p>
          <AdUnit label={`${test.title} 결과 광고`} />
          <div className="related-results"><span className="eyebrow">NEXT TEST</span><h2>나를 더 알아보는 다음 테스트</h2><div>{related.map((item) => item && <a href={item.href} key={item.slug}><span>{item.category}</span><strong>{item.title}</strong><small>{item.duration} · {item.questionCount}문항</small><i>시작하기 →</i></a>)}</div></div>
        </section>
      )}
      <SiteFooter />
    </main>
  );
}

function evaluateTest(test: GenericTest, scores: ScoreMap) {
  if (test.evaluation === "egen-teto") {
    const egen = scores.egen || 0;
    const teto = scores.teto || 0;
    return Math.abs(egen - teto) <= 3 ? "balance" : egen > teto ? "egen" : "teto";
  }
  if (test.evaluation === "attachment") {
    const anxiety = (scores.anxiety || 0) + (scores.fear || 0);
    const avoidance = (scores.avoidance || 0) + (scores.fear || 0);
    if (anxiety >= 7 && avoidance >= 7) return "fearful";
    if (anxiety >= 7) return "anxious";
    if (avoidance >= 7) return "avoidant";
    return "secure";
  }
  if (test.evaluation === "mental-age") {
    const young = scores.young || 0;
    if (young >= 12) return "teen";
    if (young >= 9) return "twenties";
    if (young >= 6) return "thirties";
    if (young >= 3) return "forties";
    return "wise";
  }
  return Object.keys(test.results).reduce((best, key) =>
    (scores[key] || 0) > (scores[best] || 0) ? key : best,
  Object.keys(test.results)[0]);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else line = testLine;
  });
  ctx.fillText(line, x, y);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
