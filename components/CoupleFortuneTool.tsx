"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCouple } from "../lib/fortune-couple";
import { elementLabels, earthlyBranchesKo, heavenlyStemsKo } from "../lib/fortune-engine";
import styles from "../lib/fortune.module.css";
import SajuLabBanner from "./SajuLabBanner";
import ReportCrossSell from "./ReportCrossSell";
import ResultShareCard from "./ResultShareCard";

/**
 * 사주 궁합 화면.
 *
 * 사주 풀이(FortuneTool)와 달리 사람이 둘이라 입력이 두 벌입니다. 그래서
 * 그쪽 컴포넌트를 늘리지 않고 따로 뒀습니다. 계산은 lib/fortune-couple 이
 * 하고 여기서는 받아 보여주기만 합니다.
 *
 * 결과를 같은 화면에 펼칩니다. 사주 풀이는 결과 주소를 따로 두는데, 궁합은
 * 두 사람의 생일이 결과 주소에 남는 셈이라 그렇게 하지 않았습니다.
 */

type Side = { year: string; month: string; day: string };

const empty: Side = { year: "", month: "", day: "" };

const ok = (s: Side) =>
  Number(s.year) >= 1900 &&
  Number(s.year) <= 2035 &&
  Number(s.month) >= 1 &&
  Number(s.month) <= 12 &&
  Number(s.day) >= 1 &&
  Number(s.day) <= 31;

const toInput = (s: Side) => ({ year: Number(s.year), month: Number(s.month), day: Number(s.day) });

function Fields({
  label,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  value: Side;
  onChange: (next: Side) => void;
  idPrefix: string;
}) {
  const set = (key: keyof Side) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });
  return (
    <fieldset className={styles.coupleSide}>
      <legend>{label}</legend>
      <div className={styles.formRow}>
        <label className={styles.field} htmlFor={`${idPrefix}-year`}>
          <span>연도</span>
          <input id={`${idPrefix}-year`} type="number" inputMode="numeric" placeholder="1970" value={value.year} onChange={set("year")} />
        </label>
        <label className={styles.field} htmlFor={`${idPrefix}-month`}>
          <span>월</span>
          <input id={`${idPrefix}-month`} type="number" inputMode="numeric" placeholder="3" value={value.month} onChange={set("month")} />
        </label>
        <label className={styles.field} htmlFor={`${idPrefix}-day`}>
          <span>일</span>
          <input id={`${idPrefix}-day`} type="number" inputMode="numeric" placeholder="15" value={value.day} onChange={set("day")} />
        </label>
      </div>
    </fieldset>
  );
}

const PAIR_KEY = "gunghap-pair";
const RESULT_PATH = "/fortune/gunghap/result/";

/**
 * 「궁합 보기」를 누르면 같은 화면에 예고(일간 관계만, 점수는 가림)를 보여 주고, 풀이는
 * 「내 결과 확인하기」 <a href> 로 /fortune/gunghap/result/ 에서 엽니다(2026-10-11, MBTI 와 같은 구조).
 * 애드센스 전면광고는 링크 클릭에만 붙습니다.
 */
export default function CoupleFortuneTool({ resultOnly = false }: { resultOnly?: boolean }) {
  const [a, setA] = useState<Side>(empty);
  const [b, setB] = useState<Side>(empty);
  const [shown, setShown] = useState<{ a: Side; b: Side } | null>(null);
  const [teaser, setTeaser] = useState<{ a: Side; b: Side } | null>(null);
  const teaserRef = useRef<HTMLDivElement>(null);
  // 입력칸 자리에 예고 화면이 들어가 높이가 줄어듭니다. 화면 밖에 남지 않게 가운데로 가져옵니다.
  useEffect(() => {
    if (teaser) teaserRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [teaser]);

  // 결과 페이지: 이 탭에 남긴 두 사람 생년월일로 계산합니다. 없으면 입력 화면으로 보냅니다.
  useEffect(() => {
    if (!resultOnly) return;
    const id = setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(PAIR_KEY) || "null") as { a: Side; b: Side } | null;
        if (!saved || !ok(saved.a) || !ok(saved.b)) throw new Error("no pair");
        setShown(saved);
      } catch {
        location.replace("/fortune/gunghap/");
      }
    }, 0);
    return () => clearTimeout(id);
  }, [resultOnly]);

  const teaserResult = useMemo(() => (teaser ? buildCouple(toInput(teaser.a), toInput(teaser.b)) : null), [teaser]);

  const valid = ok(a) && ok(b);

  const result = useMemo(() => {
    if (!shown) return null;
    return buildCouple(toInput(shown.a), toInput(shown.b));
  }, [shown]);

  const pillar = (p: { stemIdx: number; branchIdx: number }) =>
    `${heavenlyStemsKo[p.stemIdx]}${earthlyBranchesKo[p.branchIdx]}`;

  return (
    <section className={styles.section}>
      {!resultOnly && !teaser && (
      <form className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          try {
            sessionStorage.setItem(PAIR_KEY, JSON.stringify({ a, b }));
          } catch {
            // 저장이 막힌 브라우저는 결과 페이지에서 입력 화면으로 돌아갑니다.
          }
          setTeaser({ a, b });
        }}
      >
        <Fields label="첫 번째 사람" value={a} onChange={setA} idPrefix="couple-a" />
        <Fields label="두 번째 사람" value={b} onChange={setB} idPrefix="couple-b" />
        <button className={styles.submit} type="submit" disabled={!valid}>
          궁합 보기 <span>→</span>
        </button>
        <p className={styles.formNote}>
          양력 생년월일을 넣어 주세요. 태어난 시간은 궁합에서 쓰지 않으므로 몰라도 됩니다.
          입력한 값은 이 브라우저 안에서만 계산되고 서버로 보내지 않습니다.
        </p>
      </form>
      )}

      {/* 예고 화면. 점수·풀이는 가리고 일간 관계 이름만. 버튼 옆에 광고를 두지 않습니다(실수 클릭). */}
      {teaserResult && (
        <div className="question-card test-teaser" ref={teaserRef}>
          <span className="question-kicker">궁합 계산 완료!</span>
          <h2>두 사람의 궁합 점수는…</h2>
          <div className="screener-score" style={{ borderColor: "#c9bdf0" }}>
            <strong>? ?<span>/ 100</span></strong>
          </div>
          <p className="test-teaser-traits" aria-label="결과 일부 공개">
            <span>일간 관계 · {teaserResult.relation}</span>
            <span className="masked">띠 관계 ? ? ?</span>
          </p>
          <p className="mbti-teaser-hint">궁합 점수와 띠 관계, 서로 채워 주는 기운,<br />같이 지낼 때 조언까지 결과 화면에 있어요.</p>
          <a className="mbti-teaser-cta" href={RESULT_PATH}>내 결과 확인하기 →</a>
        </div>
      )}

      {result && (
        <div className={styles.coupleResult}>
          <div className={styles.coupleScore} style={{ "--score-color": result.score >= 62 ? "#5d9080" : "#c9873f" } as React.CSSProperties}>
            <strong>{result.score}</strong>
            <span>/ 100</span>
            <b>{result.headline}</b>
          </div>
          <p className={styles.coupleSummary}>{result.summary}</p>

          <div className={styles.coupleGrid}>
            <article>
              <span>첫 번째 사람</span>
              <b>
                {pillar(result.a.year)} · {pillar(result.a.month)} · {pillar(result.a.day)}
              </b>
              <p>
                일간 오행 {elementLabels[result.a.dayElement]} · 가장 많은 기운 {elementLabels[result.a.strongestElement]}
              </p>
            </article>
            <article>
              <span>두 번째 사람</span>
              <b>
                {pillar(result.b.year)} · {pillar(result.b.month)} · {pillar(result.b.day)}
              </b>
              <p>
                일간 오행 {elementLabels[result.b.dayElement]} · 가장 많은 기운 {elementLabels[result.b.strongestElement]}
              </p>
            </article>
          </div>

          <h3>일간 관계 — {result.relation}</h3>
          <p>{result.relationNote}</p>

          <h3>띠 관계 — {result.branch}</h3>
          <p>{result.branchNote}</p>

          <h3>서로 채워 주는 기운</h3>
          <p>{result.complementNote}</p>

          <h3>같이 지낼 때</h3>
          <ul className={styles.coupleAdvice}>
            {result.advice.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <p className={styles.formNote}>
            궁합은 관계의 성공이나 실패를 예측하지 않습니다. 두 사람이 어디서 손이 더 가는지를 미리
            일러 주는 참고 자료로만 보시기 바랍니다.
          </p>

          <ResultShareCard
            id={`gunghap-${result.score}`}
            kicker="생년월일 궁합"
            big={String(result.score)}
            bigLabel="궁합 점수"
            headline={result.headline}
            sub={`일간 관계 ${result.relation} · 띠 관계 ${result.branch}`}
            color={result.score >= 62 ? "#5d9080" : "#c9873f"}
            path="/fortune/gunghap/"
            shareText={`우리 궁합 ${result.score}점 나왔어요!`}
            linkTitle="무료 궁합"
            group="fortune"
          />

          <ReportCrossSell from="gunghap" />
          <SajuLabBanner placement="gunghap" />
          {resultOnly && <p style={{ textAlign: "center" }}><a className="secondary-button" href="/fortune/gunghap/">다른 사람과 궁합 보기</a></p>}
        </div>
      )}
    </section>
  );
}
