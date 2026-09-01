"use client";

import { useEffect, useMemo, useState } from "react";
import AdUnit from "./AdUnit";
import { questions, typeData, typeDetails, type Axis } from "../lib/mbti-data";

const TEST_PATH = "/tests/mbti/";
const STORAGE_KEY = "mbti-test-result";

type StoredResult = { result: string; scores: Record<Axis, number> };

export default function MbtiResult() {
  // 검사 결과는 sessionStorage 에만 있으므로 서버 렌더에는 값이 없고,
  // 마운트 이후에 읽어옵니다. 결과가 없으면 검사 페이지로 돌려보냅니다.
  const [stored, setStored] = useState<StoredResult | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) {
        location.replace(TEST_PATH);
        return;
      }
      const parsed = JSON.parse(saved) as StoredResult;
      if (!typeData[parsed.result] || !parsed.scores) throw new Error("invalid result");
      setStored(parsed);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      location.replace(TEST_PATH);
    }
  }, []);

  const result = stored?.result ?? "";

  const percentages = useMemo(() => {
    const scores = stored?.scores ?? { EI: 0, SN: 0, TF: 0, JP: 0 };
    const totalPerAxis = questions.filter((q) => q.axis === "EI").length;
    const labels: Record<Axis, [string, string]> = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };
    return (Object.keys(labels) as Axis[]).map((axis) => {
      const left = Math.round(((scores[axis] + totalPerAxis) / (2 * totalPerAxis)) * 100);
      return { axis, left: labels[axis][0], right: labels[axis][1], value: Math.max(10, Math.min(90, left)) };
    });
  }, [stored]);

  if (!result) return <section className="result-shell result-loading" aria-busy="true"><p>결과를 불러오는 중입니다…</p></section>;

  const resultInfo = typeData[result];

  const start = () => {
    sessionStorage.removeItem("mbti-test-result");
    location.assign(TEST_PATH);
  };

  const share = async () => {
    const text = `나의 MBTI는 ${result}, ${resultInfo.name}! 무료 MBTI 검사로 당신의 유형도 확인해보세요.`;
    const url = `${location.origin}/types/${result.toLowerCase()}/`;
    if (navigator.share) await navigator.share({ title: "마음결 MBTI 결과", text, url });
    else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert("결과 링크를 복사했습니다.");
    }
  };

  const downloadResult = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#172A46"); gradient.addColorStop(.58, "#302268"); gradient.addColorStop(1, resultInfo.color);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.beginPath(); ctx.arc(900, 160, 280, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#DCD4FF"; ctx.font = "700 30px sans-serif"; ctx.fillText("MY MBTI RESULT", 90, 120);
    ctx.fillStyle = "#fff"; ctx.font = "900 130px sans-serif"; ctx.fillText(result, 90, 330);
    ctx.font = "800 52px sans-serif"; ctx.fillText(resultInfo.name, 90, 420);
    ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = "500 34px sans-serif"; ctx.fillText(resultInfo.tagline, 90, 490);
    resultInfo.strengths.forEach((x, i) => { ctx.fillStyle = "#fff"; ctx.font = "600 29px sans-serif"; ctx.fillText(`✦ ${x}`, 90, 650 + i * 64); });
    ctx.fillStyle = "#fff"; ctx.font = "700 30px sans-serif"; ctx.fillText("나도 무료 MBTI 검사하기", 90, 930);
    ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = "500 24px sans-serif"; ctx.fillText(location.host, 90, 975);
    const link = document.createElement("a"); link.download = `mbti-${result}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  };

  return (
    <section className="result-shell" style={{ "--result-color": resultInfo.color } as React.CSSProperties}>
      <span className="result-kicker">검사가 완료되었습니다</span>
      <div className="result-code">{result}</div>
      <h1>{resultInfo.name}</h1>
      <p className="result-tagline">{resultInfo.tagline}</p>
      <p className="result-description">{resultInfo.description}</p>
      <AdUnit key={`result-top-${result}`} position="resultTop" label="MBTI 결과 상단 광고" />
      <div className="result-grid">
        <article className="axis-card">
          <h2>나의 성향 지표</h2>
          {percentages.map((p) => <div className="axis-row" key={p.axis}><div><b>{p.left}</b><span>{p.axis === "EI" ? "에너지" : p.axis === "SN" ? "인식" : p.axis === "TF" ? "판단" : "생활"}</span><b>{p.right}</b></div><div className="axis-bar"><i style={{ left: `${p.value}%` }} /></div></div>)}
        </article>
        <article className="trait-card"><h2>빛나는 강점</h2>{resultInfo.strengths.map((x) => <p key={x}>✦ {x}</p>)}</article>
        <article className="trait-card watch"><h2>기억하면 좋은 점</h2>{resultInfo.watch.map((x) => <p key={x}>○ {x}</p>)}</article>
      </div>
      <div className="mbti-deep-result">
        <article><span>LOVE</span><h2>연애와 가까운 관계</h2><p>{typeDetails[result].love}</p></article>
        <article><span>WORK</span><h2>일과 협업 스타일</h2><p>{typeDetails[result].work}</p></article>
        <article><span>RECOVERY</span><h2>스트레스 신호와 회복</h2><p>{typeDetails[result].stress}</p></article>
      </div>
      <AdUnit key={`result-middle-${result}`} position="resultMiddle" label="MBTI 결과 본문 광고" />
      <div className="growth-plan mbti-growth"><span>GROWTH POINT</span><h2>나를 더 편안하게 만드는 실천</h2>{typeDetails[result].growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
      <div className="result-actions"><button className="primary-button" onClick={share}>결과 공유하기 <span>↗</span></button><button className="secondary-button" onClick={downloadResult}>결과 이미지 저장</button><button className="secondary-button" onClick={start}>다시 검사하기</button></div>
      <p className="disclaimer">본 테스트는 자기이해를 위한 간이 성격 테스트이며, 전문적인 심리 진단을 대신하지 않습니다.</p>
      <div className="result-deep-link mbti-related">
        <span className="eyebrow">MORE ABOUT {result}</span>
        <h2>{result} 유형을 더 자세히 알아보기</h2>
        <div>
          <a href={`/types/${result.toLowerCase()}/`}><span>유형</span><strong>{result} 특징 총정리</strong><small>성격 · 연애 · 직업 · 스트레스</small><i>{result} 자세히 보기 →</i></a>
          <a href={`/compatibility/${result.toLowerCase()}/`}><span>궁합</span><strong>{result} MBTI 궁합</strong><small>잘 맞는 유형과 소통 방법</small><i>{result} 궁합 보기 →</i></a>
        </div>
      </div>
      <AdUnit key={`result-bottom-${result}`} position="resultBottom" label="MBTI 결과 하단 광고" />
      <div className="related-results mbti-related">
        <span className="eyebrow">NEXT TEST</span><h2>지금 결과와 이어서 해보세요</h2>
        <div>
          <a href="/tests/adult-attachment/"><span>연애</span><strong>성인 애착유형 테스트</strong><small>24문항 · 약 3분</small><i>내 애착유형 확인하기 →</i></a>
          <a href="/tests/egen-teto/"><span>성격</span><strong>에겐·테토 성향 테스트</strong><small>20문항 · 약 2~3분</small><i>에겐·테토 비율 보기 →</i></a>
          <a href="/tests/mental-age/"><span>재미</span><strong>정신연령 테스트</strong><small>15문항 · 약 2분</small><i>내 마음 나이 확인하기 →</i></a>
        </div>
      </div>
    </section>
  );
}
