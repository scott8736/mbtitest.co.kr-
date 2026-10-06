"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Axis } from "../lib/mbti-data";
import { recordTestEventOnce } from "../lib/test-events";
import { moriImage } from "../lib/mori";
import { MORI_WORLD } from "../lib/mori-world";
import { REPORT_EVENT, fmtEventDate as fmt } from "../lib/report-config";
import { afterEventText, useReportPricing, won } from "./ReportEvent";
import { REPORT_READY_TYPES } from "../report/content/ready";

/**
 * 유료 리포트 「모리 마음숲 안내서」 안내 카드.
 *
 * 2026-10-03~ 수요 측정 카드였고(가짜 결제 없이 클릭만 셈), 2026-10-04 실제 판매로 바꿨습니다.
 * report_seen·report_click 은 그대로 세어 측정 기간과 이어 볼 수 있게 합니다.
 *
 * 문구 원칙: 끌리게 쓰되 사실만. 쪽수는 실제 조판 결과(생년월일 없이 104쪽, 넣으면 110쪽),
 * 「81가지」는 축마다 3단계 글(3⁴). 판 적 없는 「정가」 취소선 할인 표시는 하지 않습니다(표시광고법).
 * 원고가 아직 없는 유형은 주문 화면으로 보내지 않고 「준비 중」으로 둡니다.
 *
 * 2026-10-06 미리보기 띠: 카드를 본 사람 104명 중 3명만 눌렀다(2.9%). 「누르게」 하지 말고 누르지 않아도 보이게 —
 * 정지 그림 3장을 옆으로 넘기는 6쪽 띠로 바꾸고, 맨 앞 쪽은 방금 검사한 사람의 실제 점수로 그린 「나의 네 가지 성향」
 * (리포트 MY SCORES 쪽과 같은 단계 규칙: 60 이하 거의 반반 · 61~79 분명한 편 · 80 이상 아주 뚜렷)입니다.
 * 둘째 쪽 이상 넘겨 본 사람을 report_peek 으로 셉니다.
 */

const HOOKS = [
  ["104쪽", "연애·일·돈·공부·관계까지 11가지 주제"],
  ["81가지", "같은 유형도 내 점수 농도로 글이 달라져요"],
  ["+사주", "생년월일을 넣으면 사주 장까지 110쪽"],
  ["13개월", "이번 달부터 마음 달력 + 배경화면 3종"],
];

const AXES: [Axis, string, string, string, string, string][] = [
  ["EI", "E", "외향", "I", "내향", "에너지를 어디서 얻나"],
  ["SN", "S", "감각", "N", "직관", "정보를 어떻게 받아들이나"],
  ["TF", "T", "사고", "F", "감정", "무엇으로 결정하나"],
  ["JP", "J", "판단", "P", "인식", "생활을 어떻게 꾸리나"],
];
const band = (pct: number) => (pct <= 60 ? "거의 반반" : pct <= 79 ? "분명한 편" : "아주 뚜렷");
/** 리포트 미리보기 쪽 그림. 3쪽은 견본 점수 쪽이라 빼고, 맨 앞에 내 점수 쪽을 그립니다. */
const PAGES = [1, 2, 5, 4, 6];

function MyScoresPage({ code, scores }: { code: string; scores: Record<Axis, number> }) {
  return (
    <div className="rt-myscores" role="img" aria-label={`내 ${code} 점수 쪽 미리보기`}>
      <span className="rt-tab">MY SCORES</span>
      <small>CHAPTER 02 · MY SCORES</small>
      <h3>나의 네 가지 성향</h3>
      {AXES.map(([k, l, ln, rr, rn, q]) => {
        const left = Math.round(((scores[k] + 10) / 20) * 100);
        const mineLeft = code.includes(l);
        const pct = mineLeft ? left : 100 - left;
        return (
          <div className="rt-axis" key={k}>
            <div className="rt-names"><b>{l} {ln}</b><span>{q}</span><b>{rr} {rn}</b></div>
            <div className="rt-bar"><i style={{ width: `${left}%` }}><em>{left}%</em></i><u>{100 - left}%</u></div>
            <p>{mineLeft ? l : rr}({mineLeft ? ln : rn}) 쪽 {pct}% — <b>{band(pct)}</b></p>
          </div>
        );
      })}
      <p className="rt-body">다음 네 쪽은 이 점수에 맞춰 골라 넣은 글이에요. 같은 {code}라도 81가지 조합이 나와요.</p>
    </div>
  );
}

export default function ReportTeaser({ code, slug = "mbti", scores }: { code: string; slug?: string; scores?: Record<Axis, number> }) {
  const ref = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const peeked = useRef(false);
  const ready = REPORT_READY_TYPES.includes(code);
  const says = MORI_WORLD[code]?.says ?? "";
  const { ready: priced, eventOn, price } = useReportPricing();

  // 카드가 화면에 절반 이상 들어왔을 때 한 번 셉니다. 클릭이 적을 때
  // "안 눌렀다"와 "거기까지 내려오지 않았다"를 가르기 위해서입니다.
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          recordTestEventOnce(slug, "report_seen");
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slug]);

  // 띠가 화면에 들어오면 한 번 살짝 밀었다 돌아와 「옆으로 넘어간다」를 보여 줍니다(동작 줄이기 설정이면 안 함).
  useEffect(() => {
    const el = strip.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setTimeout(() => {
          if (el.scrollLeft > 0) return;
          el.scrollTo({ left: 90, behavior: "smooth" });
          setTimeout(() => {
            if (el.scrollLeft < 120) el.scrollTo({ left: 0, behavior: "smooth" });
          }, 650);
        }, 500);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const total = PAGES.length + (scores ? 1 : 0);
  const onScroll = () => {
    const el = strip.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const i = Math.min(total - 1, Math.round(el.scrollLeft / (first.offsetWidth + 12)));
    setAt(i);
    if (i >= 1 && !peeked.current) {
      peeked.current = true;
      recordTestEventOnce(slug, "report_peek");
    }
  };

  return (
    <section ref={ref} className="report-teaser" aria-labelledby="report-teaser-title">
      <div className="report-teaser-hero">
        <div className="report-teaser-mori">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
          <img src={moriImage(code)} alt={`${code} 모리`} width={160} height={160} loading="lazy" />
          {says ? <span>“{says}”</span> : null}
        </div>
        <div>
          <span className="report-teaser-eyebrow">MORI REPORT · 104쪽</span>
          <h2 id="report-teaser-title">
            내 점수로 만든
            <br />
            <em>104쪽짜리 {code} 안내서</em>
          </h2>
          <p className="report-teaser-lead">
            결과 화면이 한 장이라면, 이건 한 권이에요. 방금 푼 40문항 점수로 같은 {code} 안에서도 내 성향의 농도에 맞는 글만 골라
            {" "}{code} 모리가 한 권으로 엮어 드려요.
          </p>
        </div>
      </div>
      <ul className="report-teaser-hooks">
        {HOOKS.map(([big, text]) => (
          <li key={big}>
            <b>{big}</b>
            <span>{text}</span>
          </li>
        ))}
      </ul>
      {ready ? (
        <div className="rt-strip-wrap">
          <div className="rt-strip-bar">
            <span>👉 옆으로 넘겨 보세요 · 내 점수로 만든 쪽부터</span>
            <b>{at + 1} / {total}</b>
          </div>
          <div className="rt-strip" ref={strip} onScroll={onScroll}>
            {scores ? <MyScoresPage code={code} scores={scores} /> : null}
            {PAGES.map((n) => (
              // eslint-disable-next-line @next/next/no-img-element -- 위와 같음
              <img key={n} src={`/report-app/preview/${code}-${n}.jpg`} alt={`${code} 리포트 미리보기`} loading="lazy" />
            ))}
          </div>
        </div>
      ) : null}
      <div className="report-teaser-buy">
        <p className="report-teaser-price">
          {eventOn ? <small>{REPORT_EVENT.label} · {fmt(REPORT_EVENT.to)}까지 ({afterEventText()})</small> : null}
          <strong>{priced ? won(price) : "\u00a0"}</strong>
        </p>
        {ready ? (
          <Link href="/report/?from=result-card" className="primary-button" onClick={() => recordTestEventOnce(slug, "report_click")}>
            내 104쪽 리포트 미리보기 <span>→</span>
          </Link>
        ) : (
          <p className="report-teaser-soon" role="status">
            <strong>{code} 리포트는 지금 만들고 있어요.</strong>
          </p>
        )}
      </div>
    </section>
  );
}
