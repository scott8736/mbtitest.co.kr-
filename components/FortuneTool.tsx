"use client";

import { useEffect, useMemo, useState } from "react";
import AdUnit from "./AdUnit";
import {
  birthTimeSlots,
  buildChart,
  elementLabels,
  elementSymbols,
  elementColors,
  elementDirections,
  elementNumbers,
  heavenlyStemsKo,
  hashSeed,
  pickBy,
  pillarLabel,
  scoreBy,
  seoulDateKey,
  stemYinYang,
  tenGodReadings,
  zodiacSlugs,
  starSignSlugs,
} from "../lib/fortune-engine";
import {
  dayMasterReadings,
  elementBalanceNotes,
  luckyColors,
  luckyDirections,
  luckyItems,
  mbtiCodeList,
  todayAdvice,
  todayCautions,
  todayDetails,
  todayHeadlines,
} from "../lib/fortune-readings";
import { zodiacFortunes } from "../lib/fortune-zodiac";
import { starSigns } from "../lib/fortune-star-signs";
import styles from "../lib/fortune.module.css";

export type FortuneMode = "today" | "saju" | "saju-mbti";

const STORAGE_KEY = "mbtitest.fortune.birth";

type Draft = { year: string; month: string; day: string; timeSlot: string; mbti: string };

const emptyDraft: Draft = { year: "", month: "", day: "", timeSlot: "0", mbti: "" };

function readStoredDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (!parsed.year || !parsed.month || !parsed.day) return null;
    return { ...emptyDraft, ...parsed } as Draft;
  } catch {
    return null;
  }
}

function storeDraft(draft: Draft) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // 시크릿 모드나 저장 차단 환경에서는 그냥 넘어갑니다.
  }
}

/** 오행 분포에서 사주 쪽 기질을 MBTI 네 축으로 옮깁니다. */
function sajuAxes(counts: number[]) {
  const [wood, fire, earth, metal, water] = counts;
  const pairs: Array<[string, number, string, number]> = [
    ["E", fire * 2 + wood, "I", water * 2 + metal],
    ["N", wood * 2 + water, "S", earth * 2 + metal],
    ["T", metal * 2 + earth, "F", fire * 2 + water],
    ["J", earth * 2 + metal, "P", water * 2 + wood],
  ];
  return pairs.map(([left, leftScore, right, rightScore]) => ({
    left,
    right,
    leftScore,
    rightScore,
    pick: leftScore >= rightScore ? left : right,
  }));
}

export default function FortuneTool({ mode }: { mode: FortuneMode }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [submitted, setSubmitted] = useState<Draft | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) {
      setDraft(stored);
      setRestored(true);
    }
  }, []);

  const today = seoulDateKey();

  const result = useMemo<Result | null>(() => {
    if (!submitted) return null;
    const year = Number(submitted.year);
    const month = Number(submitted.month);
    const day = Number(submitted.day);
    const timeSlot = Number(submitted.timeSlot) || 0;
    if (!year || !month || !day) return null;

    const chart = buildChart({ year, month, day, timeSlot });
    const dailySeed = hashSeed(`${year}-${month}-${day}-${timeSlot}-${today}`);

    return {
      chart,
      dailySeed,
      zodiac: zodiacFortunes[chart.zodiacIndex],
      zodiacSlug: zodiacSlugs[chart.zodiacIndex],
      starSign: starSigns[chart.starSignIndex],
      starSignSlug: starSignSlugs[chart.starSignIndex],
    };
  }, [submitted, today]);

  const valid =
    Number(draft.year) >= 1900 &&
    Number(draft.year) <= 2035 &&
    Number(draft.month) >= 1 &&
    Number(draft.month) <= 12 &&
    Number(draft.day) >= 1 &&
    Number(draft.day) <= 31 &&
    (mode !== "saju-mbti" || draft.mbti !== "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    storeDraft(draft);
    setSubmitted({ ...draft });
  };

  const update = (key: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label htmlFor="fortune-year">태어난 해</label>
            <input
              id="fortune-year"
              type="number"
              inputMode="numeric"
              placeholder="1995"
              min={1900}
              max={2035}
              value={draft.year}
              onChange={update("year")}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fortune-month">월</label>
            <input
              id="fortune-month"
              type="number"
              inputMode="numeric"
              placeholder="7"
              min={1}
              max={12}
              value={draft.month}
              onChange={update("month")}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fortune-day">일</label>
            <input
              id="fortune-day"
              type="number"
              inputMode="numeric"
              placeholder="14"
              min={1}
              max={31}
              value={draft.day}
              onChange={update("day")}
              required
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label htmlFor="fortune-time">태어난 시간</label>
            <select id="fortune-time" value={draft.timeSlot} onChange={update("timeSlot")}>
              {birthTimeSlots.map((slot, index) => (
                <option key={slot} value={index}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          {mode === "saju-mbti" && (
            <div className={styles.field}>
              <label htmlFor="fortune-mbti">내 MBTI</label>
              <select id="fortune-mbti" value={draft.mbti} onChange={update("mbti")} required>
                <option value="">선택하세요</option>
                {mbtiCodeList.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button className={styles.submit} type="submit" disabled={!valid}>
          {mode === "today" ? "오늘의 운세 보기" : mode === "saju" ? "사주 풀이 보기" : "사주 MBTI 비교하기"}
        </button>

        <p className={styles.formNote}>
          입력한 생년월일은 이 브라우저 안에서만 계산에 쓰이고 서버로 전송되거나 저장되지 않습니다.
          {restored && " 이전에 입력한 값을 불러왔습니다."}
          {mode !== "today" && " 태어난 시간을 모르면 '모름'을 선택해도 됩니다."}
        </p>
      </form>

      {result && (
        <div>
          <AdUnit position="resultTop" label="운세 결과 상단 광고" />

          {mode === "today" && <TodayResult result={result} today={today} />}
          {mode === "saju" && <SajuResult result={result} />}
          {mode === "saju-mbti" && <SajuMbtiResult result={result} mbti={submitted?.mbti ?? ""} />}

          <AdUnit position="resultBottom" label="운세 결과 하단 광고" />
        </div>
      )}
    </>
  );
}

type Result = {
  chart: ReturnType<typeof buildChart>;
  dailySeed: number;
  zodiac: (typeof zodiacFortunes)[number];
  zodiacSlug: (typeof zodiacSlugs)[number];
  starSign: (typeof starSigns)[number];
  starSignSlug: (typeof starSignSlugs)[number];
};

function ElementBars({ counts }: { counts: number[] }) {
  const total = counts.reduce((sum, value) => sum + value, 0) || 1;
  return (
    <div className={styles.elementBars}>
      {counts.map((count, index) => (
        <div key={elementLabels[index]} className={styles.elementRow}>
          <span>
            {elementSymbols[index]} {elementLabels[index]}
          </span>
          <span className={styles.elementTrack}>
            <span className={styles.elementFill} style={{ width: `${Math.round((count / total) * 100)}%` }} />
          </span>
          <em>{count}</em>
        </div>
      ))}
    </div>
  );
}

function TodayResult({ result, today }: { result: Result; today: string }) {
  const { chart, dailySeed, zodiac, zodiacSlug, starSign, starSignSlug } = result;
  const overall = scoreBy(dailySeed, 0, 52, 97);
  const categories = [
    { label: "연애운", score: scoreBy(dailySeed, 1) },
    { label: "재물운", score: scoreBy(dailySeed, 3) },
    { label: "직장운", score: scoreBy(dailySeed, 5) },
    { label: "건강운", score: scoreBy(dailySeed, 7) },
  ];

  return (
    <section className={styles.section}>
      <h2>{today} 오늘의 운세</h2>
      <p>{pickBy(todayHeadlines, dailySeed)}</p>

      <div className={styles.scoreGrid}>
        <div className={styles.score}>
          <span>총운</span>
          <b>{overall}</b>
        </div>
        {categories.map((category) => (
          <div key={category.label} className={styles.score}>
            <span>{category.label}</span>
            <b>{category.score}</b>
          </div>
        ))}
      </div>

      <h3>오늘의 흐름</h3>
      <p>{pickBy(todayDetails, dailySeed, 1)}</p>

      <AdUnit position="resultMiddle" label="오늘의 운세 본문 광고" />

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>오늘 해볼 것</h3>
          <p>{pickBy(todayAdvice, dailySeed, 2)}</p>
        </div>
        <div className={styles.card}>
          <h3>오늘 조심할 것</h3>
          <p>{pickBy(todayCautions, dailySeed, 3)}</p>
        </div>
        <div className={styles.card}>
          <h3>행운의 색 · 방향</h3>
          <p>
            {pickBy(luckyColors, dailySeed, 4)} · {pickBy(luckyDirections, dailySeed, 5)}
          </p>
        </div>
        <div className={styles.card}>
          <h3>오늘의 소지품</h3>
          <p>{pickBy(luckyItems, dailySeed, 6)}</p>
        </div>
      </div>

      <h3>내 띠와 별자리</h3>
      <p>
        {chart.zodiacIndex >= 0 && (
          <>
            생년월일 기준으로 <a href={`/fortune/zodiac/${zodiacSlug}/`}>{zodiac.name}</a>,{" "}
            <a href={`/fortune/star-sign/${starSignSlug}/`}>{starSign.name}</a>입니다. 각 페이지에서 성격과 2027년
            흐름까지 확인할 수 있습니다.
          </>
        )}
      </p>

      <p className={styles.formNote}>
        오늘의 운세는 매일 0시(한국 시간)에 바뀝니다. 같은 날 다시 열면 같은 결과가 나옵니다.
      </p>
    </section>
  );
}

function SajuResult({ result }: { result: Result }) {
  const { chart, zodiac, zodiacSlug, starSign, starSignSlug } = result;
  const dayMaster = dayMasterReadings[chart.dayStemIdx];
  const tenGod = tenGodReadings[chart.tenGod];
  const strong = elementBalanceNotes[chart.strongestElement].strong;
  const weak = elementBalanceNotes[chart.weakestElement].weak;

  return (
    <section className={styles.section}>
      <h2>내 사주 네 기둥</h2>
      <p>
        연·월·일{chart.time ? "·시" : ""} 기둥입니다. 각 기둥은 천간(위)과 지지(아래) 두 글자로 이뤄지며, 이 여덟
        글자를 사주팔자라고 부릅니다.
      </p>

      <div className={styles.pillars}>
        {[
          ["연주", chart.year],
          ["월주", chart.month],
          ["일주", chart.day],
          ["시주", chart.time],
        ].map(([label, pillar]) => (
          <div key={label as string} className={styles.pillar}>
            <span>{label as string}</span>
            <b>{pillarLabel(pillar as typeof chart.year | null)}</b>
            <em>{pillar ? "" : "시간 미입력"}</em>
          </div>
        ))}
      </div>

      <h3>일간 — 사주에서 &lsquo;나&rsquo;에 해당하는 글자</h3>
      <p>
        내 일간은 <strong>{heavenlyStemsKo[chart.dayStemIdx]}({stemYinYang[chart.dayStemIdx] === 0 ? "양" : "음"})</strong>
        입니다. 사주 풀이는 이 글자를 기준으로 나머지 일곱 글자와의 관계를 읽습니다.
      </p>
      <h3>{dayMaster.title}</h3>
      <p>{dayMaster.body}</p>

      <AdUnit position="resultMiddle" label="사주 풀이 본문 광고" />

      <h3>오행 분포</h3>
      <p>네 기둥의 여덟 글자가 어느 오행에 몰려 있는지 보여줍니다. 많다고 좋고 적다고 나쁜 것은 아니며, 균형이 관건입니다.</p>
      <ElementBars counts={chart.elementCounts} />
      <p>{strong}</p>
      <p>{weak}</p>

      <h3>{tenGod.title}</h3>
      <p>{tenGod.desc}</p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>기운을 돕는 색</h3>
          <p>{elementColors[chart.weakestElement]}</p>
        </div>
        <div className={styles.card}>
          <h3>기운을 돕는 방향</h3>
          <p>{elementDirections[chart.weakestElement]}</p>
        </div>
        <div className={styles.card}>
          <h3>기운을 돕는 숫자</h3>
          <p>{elementNumbers[chart.weakestElement]}</p>
        </div>
        <div className={styles.card}>
          <h3>내 띠 · 별자리</h3>
          <p>
            <a href={`/fortune/zodiac/${zodiacSlug}/`}>{zodiac.name}</a> ·{" "}
            <a href={`/fortune/star-sign/${starSignSlug}/`}>{starSign.name}</a>
          </p>
        </div>
      </div>

      <p className={styles.formNote}>
        이 계산은 절기가 아닌 양력 월을 기준으로 월주를 세우는 간이 방식입니다. 절입일 부근(각 월 초)에 태어난 경우
        월주가 한 칸 달라질 수 있습니다.
      </p>
    </section>
  );
}

function SajuMbtiResult({ result, mbti }: { result: Result; mbti: string }) {
  const { chart, zodiac, zodiacSlug } = result;
  const axes = sajuAxes(chart.elementCounts);
  const sajuCode = axes.map((axis) => axis.pick).join("");
  const matched = axes.filter((axis, index) => axis.pick === mbti[index]).length;

  return (
    <section className={styles.section}>
      <h2>사주가 말하는 나 vs 내가 아는 나</h2>
      <p>
        사주의 오행 분포를 MBTI 네 축으로 옮기면 <strong>{sajuCode}</strong> 쪽에 가깝습니다. 내가 고른 MBTI는{" "}
        <strong>{mbti}</strong>이고, 네 축 가운데 <strong>{matched}개</strong>가 같은 방향입니다.
      </p>

      <div className={styles.scoreGrid}>
        {axes.map((axis, index) => (
          <div key={axis.left} className={styles.score}>
            <span>
              {axis.left} vs {axis.right}
            </span>
            <b>{axis.pick === mbti[index] ? "일치" : `${axis.pick}↔${mbti[index]}`}</b>
          </div>
        ))}
      </div>

      <AdUnit position="resultMiddle" label="사주 MBTI 본문 광고" />

      <h3>어떻게 계산했나요</h3>
      <p>
        오행에는 예로부터 기질이 함께 붙어 있습니다. 목(木)은 뻗어나가는 계획, 화(火)는 밖으로 향하는 표현, 토(土)는
        손에 잡히는 현실, 금(金)은 기준과 결단, 수(水)는 안으로 스미는 사색입니다. 이 결을 MBTI의 네 축과 짝지어
        비교했습니다. 학술적으로 검증된 변환은 아니며, 두 관점을 나란히 놓고 보기 위한 장치입니다.
      </p>
      <ul>
        <li>E/I — 화·목이 강하면 E, 수·금이 강하면 I</li>
        <li>N/S — 목·수가 강하면 N, 토·금이 강하면 S</li>
        <li>T/F — 금·토가 강하면 T, 화·수가 강하면 F</li>
        <li>J/P — 토·금이 강하면 J, 수·목이 강하면 P</li>
      </ul>

      <h3>차이가 나는 축은 무엇을 뜻하나요</h3>
      <p>
        {matched === 4
          ? "네 축이 모두 같은 방향입니다. 타고난 결과 지금의 선택이 크게 어긋나지 않는 상태로 볼 수 있습니다."
          : "차이가 나는 축은 '타고난 결'과 '지금 살아가는 방식'이 갈리는 지점입니다. 대개 환경에 맞추면서 만들어진 습관이라, 어느 쪽이 틀린 것이 아니라 지금 무엇에 힘을 쓰고 있는지를 알려줍니다."}
      </p>

      <ElementBars counts={chart.elementCounts} />

      <div className={styles.actions}>
        <a href="/tests/mbti/">내 MBTI 다시 검사하기</a>
        <a href={`/fortune/zodiac/${zodiacSlug}/`}>{zodiac.name} 운세 보기</a>
      </div>
    </section>
  );
}
