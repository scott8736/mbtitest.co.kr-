"use client";

import { useMemo, useState } from "react";
import { buildCouple } from "../lib/fortune-couple";
import { elementLabels, earthlyBranchesKo, heavenlyStemsKo } from "../lib/fortune-engine";
import styles from "../lib/fortune.module.css";

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

export default function CoupleFortuneTool() {
  const [a, setA] = useState<Side>(empty);
  const [b, setB] = useState<Side>(empty);
  const [shown, setShown] = useState<{ a: Side; b: Side } | null>(null);

  const valid = ok(a) && ok(b);

  const result = useMemo(() => {
    if (!shown) return null;
    return buildCouple(toInput(shown.a), toInput(shown.b));
  }, [shown]);

  const pillar = (p: { stemIdx: number; branchIdx: number }) =>
    `${heavenlyStemsKo[p.stemIdx]}${earthlyBranchesKo[p.branchIdx]}`;

  return (
    <section className={styles.section}>
      <form className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setShown({ a, b });
        }}
      >
        <Fields label="첫 번째 사람" value={a} onChange={setA} idPrefix="couple-a" />
        <Fields label="두 번째 사람" value={b} onChange={setB} idPrefix="couple-b" />
        <button className={styles.submit} type="submit" disabled={!valid}>
          궁합 보기 <span>→</span>
        </button>
        <p className={styles.formNote}>
          양력 생년월일을 넣어 주세요. 태어난 시간은 궁합에서 쓰지 않으므로 몰라도 됩니다.
          입력한 값은 이 브라우저 안에서만 계산되고 어디에도 저장되지 않습니다.
        </p>
      </form>

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
        </div>
      )}
    </section>
  );
}
