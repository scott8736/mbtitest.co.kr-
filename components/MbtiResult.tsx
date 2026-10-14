"use client";

import { useEffect, useMemo, useState } from "react";
import AdUnit from "./AdUnit";
import { MoriPortrait, MoriShare } from "./MoriCard";
import MoriVideoShare from "./MoriVideoShare";
import { MoriForestCard } from "./MoriWorld";
import ForestEntry, { MoriChatEntry } from "./ForestEntry";
import { ForestInviteReturn } from "./OurForest";
import { GuessMePanel } from "./GuessMe";
import ReportTeaser from "./ReportTeaser";
import ReportSampleCta from "./ReportSampleCta";
import SajuLabBanner from "./SajuLabBanner";
import { questions, typeData, typeDetails, type Axis } from "../lib/mbti-data";
import { onResultLinkClick, recordCompletionOnce, recordResultClick, recordTestEvent } from "../lib/test-events";
import { MORI_BEST } from "../lib/mori";
import { saveLastResult } from "../lib/my-mori";
import { REPORT_READY_TYPES } from "../report/content/ready";

const TEST_PATH = "/tests/mbti/";
const STORAGE_KEY = "mbti-test-result";

/** 무료 상세 세 칸 + 이어지는 리포트 장(이름은 app/report/page.tsx TOPICS 그대로) + 주문 표 ?from= 값 */
const DEEP = [
  ["LOVE", "연애와 가까운 관계", "love", "연애할 때의 나", "result-love"],
  ["WORK", "일과 협업 스타일", "work", "일하는 방식", "result-work"],
  ["RECOVERY", "스트레스 신호와 회복", "stress", "방전과 충전", "result-rest"],
] as const;

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
  const reportReady = REPORT_READY_TYPES.includes(result);
  const tiedAxes = stored ? (["EI", "SN", "TF", "JP"] as const).filter((a) => stored.scores[a] === 0) : [];

  const start = () => {
    sessionStorage.removeItem("mbti-test-result");
    location.assign(TEST_PATH);
  };

  return (
    <section className="result-shell" style={{ "--result-color": resultInfo.color } as React.CSSProperties}>
      <span className="result-kicker">내 MBTI 유형 결과</span>
      {/* 결과 화면 첫 그림은 유형별 모리 캐릭터입니다(2026-10-04). 예전 1200x630 결과 카드는
          글자뿐이라 공유할 맛이 없었습니다. 공유 카드는 아래 MoriShare 가 9:16 으로 그립니다. */}
      <MoriPortrait code={result} name={resultInfo.name} />
      {/* 2026-10-15 순서 개편(사용자 「위에서부터 광고만 보인다 — 정보 먼저, 더 궁금할 때 결제로」):
          완주자의 47%가 2.4화면(리포트 카드)까지도 내려오지 않는데, 그 위가 공유·친구 맞히기라 진짜 결과(지표·강점)는
          5.2화면 아래에 있었습니다. 순서 = 결과 → 공유 버튼(작게) → 지표·강점·주의 → 리포트 카드 → 연애·일·회복(장마다 리포트 한 줄)
          → 성장 → 친구 맞히기·대화·숲. 대화 말풍선은 첫 화면에서 뺐습니다(대화 입구는 아래 MoriChatEntry).
          리포트 카드는 지표 바로 뒤라 위치(약 2.2화면)가 전과 비슷합니다. 판정: 10-13~15 대비 카드 노출 ÷ 완주 50%↑ 유지,
          공유 클릭 20%↑ 유지, 카드 클릭 ÷ 완주 4.4%보다 높게. tests/result-exits.test.mjs 가 순서를 지킵니다. */}
      {/* 친구 「우리 숲」 초대에서 「검사로 알아보기」로 온 사람만 보입니다(2026-10-07). */}
      <ForestInviteReturn code={result} />
      <h1>{resultInfo.name}</h1>
      <p className="result-tagline">{resultInfo.tagline}</p>
      <p className="result-description">{resultInfo.description}</p>
      <MoriShare code={result} name={resultInfo.name} tagline={resultInfo.tagline} percents={percentages} best={MORI_BEST[result]} compact />
      <div className="result-grid">
        <article className="axis-card">
          <h2>나의 성향 지표</h2>
          {percentages.map((p) => <div className="axis-row" key={p.axis}><div><b>{p.left}</b><span>{p.axis === "EI" ? "에너지" : p.axis === "SN" ? "인식" : p.axis === "TF" ? "판단" : "생활"}</span><b>{p.right}</b></div><div className="axis-bar"><i style={{ left: `${p.value}%` }} /></div></div>)}
          {/* 5:5 동점 축은 추가 문항 한 개로 글자만 정했다고 솔직하게 알립니다(2026-10-15). */}
          {tiedAxes.length ? <p className="axis-tie-note">정확히 반반(5:5)인 축 · {tiedAxes.map((a) => `${a[0]}·${a[1]}`).join(", ")}<br />추가 문항 한 개로 글자를 정했어요. 두 쪽 성향을 다 가진 편이에요.</p> : null}
        </article>
        <article className="trait-card"><h2>빛나는 강점</h2>{resultInfo.strengths.map((x) => <p key={x}>✦ {x}</p>)}</article>
        <article className="trait-card watch"><h2>기억하면 좋은 점</h2>{resultInfo.watch.map((x) => <p key={x}>○ {x}</p>)}</article>
      </div>
      {/* 유료 리포트 카드: 무료 결과(지표·강점·주의)를 다 읽은 바로 뒤. 10-03~07 아래에 있을 때 노출 44%·결제 3건,
          10-08 2.4화면으로 올린 뒤 노출 52%·결제 0건 — 위에 둘수록 팔린다는 근거는 없었습니다. */}
      <ReportTeaser code={result} scores={stored?.scores} showMori={false} />
      {/* 104쪽 전체 샘플(2026-10-14): 미리보기 6쪽보다 실물 전체를 넘겨 볼 때 결제 마음이 커집니다. 새 창으로 엽니다. */}
      <ReportSampleCta code={result} />
      <div className="mbti-deep-result">
        {DEEP.map(([tag, title, key, chapter, from]) => (
          <article key={tag}>
            <span>{tag}</span><h2>{title}</h2><p>{typeDetails[result][key]}</p>
            {/* 장마다 「더 궁금하면」 한 줄. 장 이름은 /report/ 목차(app/report/page.tsx TOPICS)에 실제로 있는 것만 씁니다. */}
            {reportReady ? <a className="deep-more" href={`/report/?from=${from}`} onClick={() => recordResultClick("mbti-report-bridge")}>더 깊게: 유료 리포트 「{chapter}」 장 →</a> : null}
          </article>
        ))}
      </div>
      <AdUnit key={`result-middle-${result}`} position="resultMiddle" label="MBTI 결과 본문 광고" />
      <div className="growth-plan mbti-growth"><span>GROWTH POINT</span><h2>나를 더 편안하게 만드는 실천</h2>{typeDetails[result].growth.map((x, i) => <p key={x}><b>{String(i + 1).padStart(2, "0")}</b>{x}</p>)}</div>
      {/* 「친구가 본 내 모리」(2026-10-08 바이럴)·AI 대화·숲 게임은 결과를 다 읽은 뒤로 내렸습니다(2026-10-15). */}
      <GuessMePanel me={result} placement="mbti-guessme" />
      <MoriChatEntry code={result} />
      <ForestEntry code={result} placement="mbti-forest" />
      <MoriForestCard code={result} />
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
      {/* 영상 저장·공유는 거의 안 써서 맨 아래로 내렸습니다(2026-10-14 사용자 요청). */}
      <MoriVideoShare code={result} channel="mori-video" />
      <AdUnit key={`result-bottom-${result}`} position="resultBottom" label="MBTI 결과 하단 광고" />
    </section>
  );
}
