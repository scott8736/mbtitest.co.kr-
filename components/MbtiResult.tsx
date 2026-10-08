"use client";

import { useEffect, useMemo, useState } from "react";
import AdUnit from "./AdUnit";
import { MoriPortrait, MoriShare } from "./MoriCard";
import MoriVideoShare from "./MoriVideoShare";
import { MoriForestCard } from "./MoriWorld";
import ForestEntry from "./ForestEntry";
import { ForestInviteReturn } from "./OurForest";
import { GuessMePanel } from "./GuessMe";
import MbtiResultPick from "./MbtiResultPick";
import ReportTeaser from "./ReportTeaser";
import SajuLabBanner from "./SajuLabBanner";
import { questions, typeData, typeDetails, type Axis } from "../lib/mbti-data";
import { onResultLinkClick, recordCompletionOnce, recordTestEvent } from "../lib/test-events";
import { MORI_BEST } from "../lib/mori";
import { saveLastResult } from "../lib/my-mori";

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
      // 리포트 주문용으로 결과를 이 기기에 오래 남깁니다(탭을 닫아도 다른 페이지에서 「내 리포트」로 이어지게).
      saveLastResult(parsed);
      // 결과 유형 분포와 동점 축을 함께 남깁니다. 동점(5:5)은 10-06 전까지 E·S·T·J 로 갔고, 지금은 그 축 마지막 응답 쪽입니다.
      recordCompletionOnce("mbti", () => {
        recordTestEvent(parsed.result.toLowerCase(), "mbti_type");
        for (const axis of ["EI", "SN", "TF", "JP"] as const) {
          if (parsed.scores[axis] === 0) recordTestEvent(axis.toLowerCase(), "mbti_tie");
        }
      });
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

  return (
    <section className="result-shell" style={{ "--result-color": resultInfo.color } as React.CSSProperties}>
      <span className="result-kicker">잠들어 있던 내 모리가 깨어났어요</span>
      {/* 결과 화면 첫 그림은 유형별 모리 캐릭터입니다(2026-10-04). 예전 1200x630 결과 카드는
          글자뿐이라 공유할 맛이 없었습니다. 공유 카드는 아래 MoriShare 가 9:16 으로 그립니다. */}
      <MoriPortrait code={result} name={resultInfo.name} />
      {/* 친구 「우리 숲」 초대에서 「검사로 알아보기」로 온 사람만 보입니다(2026-10-07). */}
      <ForestInviteReturn code={result} />
      <h1>{resultInfo.name}</h1>
      <p className="result-tagline">{resultInfo.tagline}</p>
      <p className="result-description">{resultInfo.description}</p>
      <MoriShare code={result} name={resultInfo.name} tagline={resultInfo.tagline} percents={percentages} best={MORI_BEST[result]} />
      {/* 「친구가 본 내 모리」(2026-10-08, 핵심 목표 = 공유·바이럴). 공유 카드 바로 아래 — 결과를 보고 가장 자랑하고 싶은 순간. */}
      <GuessMePanel me={result} placement="mbti-guessme" />
      {/* 모리 게임(2026-10-07). 방금 깨어난 내 모리를 데리고 다른 검사로 가게 하는 길입니다. */}
      <ForestEntry code={result} placement="mbti-forest" />
      <MoriVideoShare code={result} channel="mori-video" />
      <MoriForestCard code={result} />
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
      <ReportTeaser code={result} scores={stored?.scores} />
      <AdUnit key={`result-middle-${result}`} position="resultMiddle" label="MBTI 결과 본문 광고" />
      <div className="growth-plan mbti-growth"><span>GROWTH POINT</span><h2>나를 더 편안하게 만드는 실천</h2>{typeDetails[result].growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
      <SajuLabBanner placement="mbti" />
      {/* 다음 검사를 쿠팡 카드 위로 올렸습니다(2026-10-04). 맨 아래 광고 밑에 있을 때 MBTI → 다른 검사 전환이 5.2%였습니다. */}
      <div className="related-results mbti-related" onClick={onResultLinkClick("mbti-next")}>
        <span className="eyebrow">다음 테스트</span><h2>지금 결과와 이어서 해보세요</h2>
        <div>
          <a href="/tests/adult-attachment/"><span>연애</span><strong>성인 애착유형 테스트</strong><small>24문항 · 약 3분</small><i>내 애착유형 확인하기 →</i></a>
          <a href="/tests/egen-teto/"><span>성격</span><strong>에겐·테토 성향 테스트</strong><small>20문항 · 약 2~3분</small><i>에겐·테토 비율 보기 →</i></a>
          <a href="/tests/mental-age/"><span>재미</span><strong>정신연령 테스트</strong><small>15문항 · 약 2분</small><i>내 마음 나이 확인하기 →</i></a>
        </div>
      </div>
      <MbtiResultPick code={result} />
      <div className="result-actions"><button className="secondary-button" onClick={start}>다시 검사하기</button></div>
      <p className="disclaimer">본 테스트는 자기이해를 위한 간이 성격 테스트이며, 전문적인 심리 진단을 대신하지 않습니다.</p>
      <div className="related-results result-deep-link" onClick={onResultLinkClick("mbti-type")}>
        <span className="eyebrow">MORE ABOUT {result}</span>
        <h2>{result} 유형을 더 자세히 알아보기</h2>
        <div>
          <a href={`/types/${result.toLowerCase()}/`}><span>유형</span><strong>{result} 특징 총정리</strong><small>성격 · 연애 · 직업 · 스트레스</small><i>{result} 자세히 보기 →</i></a>
          <a href={`/compatibility/${result.toLowerCase()}/`}><span>궁합</span><strong>{result} MBTI 궁합</strong><small>잘 맞는 유형과 소통 방법</small><i>{result} 궁합 보기 →</i></a>
        </div>
      </div>
      <div className="related-results result-fortune-cta" onClick={onResultLinkClick("mbti-fortune")}>
        <span className="eyebrow">TODAY&apos;S FORTUNE</span>
        <h2>성격을 봤다면, 오늘의 흐름도</h2>
        <div>
          <a href="/fortune/today/"><span>운세</span><strong>오늘의 운세</strong><small>생년월일로 보는 오늘의 흐름</small><i>오늘의 운세 보기 →</i></a>
          <a href="/fortune/saju/"><span>사주</span><strong>무료 사주 보기</strong><small>타고난 기운과 성향 풀이</small><i>무료 사주 보기 →</i></a>
          <a href="/fortune/saju-mbti/"><span>사주 × MBTI</span><strong>{result} 사주 궁합</strong><small>사주와 성격유형을 함께</small><i>{result} 사주 보기 →</i></a>
        </div>
      </div>
      <AdUnit key={`result-bottom-${result}`} position="resultBottom" label="MBTI 결과 하단 광고" />
    </section>
  );
}
