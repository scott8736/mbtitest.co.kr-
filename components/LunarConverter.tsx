"use client";

import { useMemo, useState } from "react";
import KoreanLunarCalendar from "korean-lunar-calendar";
import styles from "../lib/fortune.module.css";

/**
 * 양력·음력 변환기.
 *
 * 토정비결·사주·제사처럼 음력을 써야 하는 자리가 많은데, 정작 자기 음력 생일을
 * 모르는 분이 많습니다. 그래서 토정비결 설명 안에 계산기를 같이 둡니다.
 *
 * 변환은 korean-lunar-calendar 가 합니다. 실제 설날 날짜로 검증해 두었고
 * tests/lunar.test.mjs 가 계속 지킵니다.
 */

type Dir = "solarToLunar" | "lunarToSolar";

const ganji = (n: number, list: readonly string[]) => list[((n % list.length) + list.length) % list.length];
const STEMS = ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"] as const;
const BRANCHES = ["신", "유", "술", "해", "자", "축", "인", "묘", "진", "사", "오", "미"] as const;

export default function LunarConverter() {
  const [dir, setDir] = useState<Dir>("solarToLunar");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [leap, setLeap] = useState(false);
  const [submitted, setSubmitted] = useState<{ y: number; m: number; d: number; leap: boolean; dir: Dir } | null>(null);

  const valid =
    Number(year) >= 1900 && Number(year) <= 2050 && Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31;

  const result = useMemo(() => {
    if (!submitted) return null;
    const cal = new KoreanLunarCalendar();
    try {
      const ok =
        submitted.dir === "solarToLunar"
          ? cal.setSolarDate(submitted.y, submitted.m, submitted.d)
          : cal.setLunarDate(submitted.y, submitted.m, submitted.d, submitted.leap);
      if (!ok) return { error: "그 날짜는 변환할 수 없습니다. 날짜를 다시 확인해 주세요." } as const;
      const lunar = cal.getLunarCalendar();
      const solar = cal.getSolarCalendar();
      return { lunar, solar } as const;
    } catch {
      return { error: "그 날짜는 변환할 수 없습니다. 날짜를 다시 확인해 주세요." } as const;
    }
  }, [submitted]);

  const fmt = (o: { year: number; month: number; day: number }) =>
    `${o.year}년 ${o.month}월 ${o.day}일`;

  return (
    <section className={styles.section}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setSubmitted({ y: Number(year), m: Number(month), d: Number(day), leap, dir });
        }}
      >
        <div className={styles.formRow} style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className={styles.field} htmlFor="lunar-dir">
            <span>무엇을 바꿀까요</span>
            <select id="lunar-dir" value={dir} onChange={(e) => setDir(e.target.value as Dir)}>
              <option value="solarToLunar">양력 → 음력</option>
              <option value="lunarToSolar">음력 → 양력</option>
            </select>
          </label>
          {dir === "lunarToSolar" && (
            <label className={styles.field} htmlFor="lunar-leap">
              <span>윤달인가요</span>
              <select id="lunar-leap" value={leap ? "y" : "n"} onChange={(e) => setLeap(e.target.value === "y")}>
                <option value="n">평달</option>
                <option value="y">윤달</option>
              </select>
            </label>
          )}
        </div>
        <div className={styles.formRow}>
          <label className={styles.field} htmlFor="lunar-year">
            <span>연도</span>
            <input id="lunar-year" type="number" inputMode="numeric" placeholder="1970" value={year} onChange={(e) => setYear(e.target.value)} />
          </label>
          <label className={styles.field} htmlFor="lunar-month">
            <span>월</span>
            <input id="lunar-month" type="number" inputMode="numeric" placeholder="3" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label className={styles.field} htmlFor="lunar-day">
            <span>일</span>
            <input id="lunar-day" type="number" inputMode="numeric" placeholder="15" value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
        </div>
        <button className={styles.submit} type="submit" disabled={!valid}>
          변환하기 <span>→</span>
        </button>
        <p className={styles.formNote}>1900년부터 2050년까지 변환됩니다. 입력값은 이 브라우저 안에서만 계산됩니다.</p>
      </form>

      {result && (
        <div className={styles.coupleResult}>
          {"error" in result ? (
            <p>{result.error}</p>
          ) : (
            <>
              <div className={styles.coupleGrid}>
                <article>
                  <span>양력</span>
                  <b>{fmt(result.solar)}</b>
                </article>
                <article>
                  <span>음력</span>
                  <b>
                    {fmt(result.lunar)}
                    {result.lunar.intercalation ? " (윤달)" : ""}
                  </b>
                </article>
              </div>
              <p className={styles.formNote}>
                간지는 {ganji(result.lunar.year, STEMS)}
                {ganji(result.lunar.year, BRANCHES)}년입니다. 토정비결과 사주에서 쓰는 해의 이름입니다.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
