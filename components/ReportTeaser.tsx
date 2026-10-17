"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Axis } from "../lib/mbti-data";
import { recordTestEventOnce } from "../lib/test-events";
import { moriImage } from "../lib/mori";
import { MORI_WORLD } from "../lib/mori-world";
import { REPORT_READY_TYPES } from "../report/content/ready";
import { SAJU_CHAPTER, SAJU_LABEL, chapterLabel, teaserSlides, type TeaserMeta } from "../lib/report-teaser";

/**
 * 유료 리포트 「MBTI 유형 마음숲 안내서」 안내 카드.
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
 *
 * 2026-10-18 흐린 미리보기: 띠를 21쪽(선명 9 + 군데군데 가린 12, 표지는 사용자 요청으로 뺌)으로 늘리고, 아래에 104쪽 전체를 장별 흐린 격자로 보여 줍니다.
 * 그림은 public/report-app/teaser/ (리포트_디자인/render_teaser.py 가 운영 열람 화면을 찍어 픽셀에서 흐림 — 가린 글은 글자로 실리지 않음).
 * 격자가 보이면 report_blur_seen, 가린 쪽·격자를 누르면 report_blur_tap 을 셉니다.
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

/** 104쪽 흐린 격자. 장마다 한 줄, 쪽은 rest.webp 한 장에서 잘라 씁니다(요청 1번). */
function BlurGrid({ code, meta, slug, onJump }: { code: string; meta: TeaserMeta; slug: string; onJump: (chapter: number) => void }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return setShow(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setShow(true);
        recordTestEventOnce(slug, "report_blur_seen");
        observer.disconnect();
      },
      { rootMargin: "300px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slug]);

  const seen = new Set([...meta.clear, ...meta.half]);
  const starts = [{ n: 1, no: "", title: "표지 · 차례" }, ...meta.chapters];
  const rows = starts.map((c, i) => {
    const end = (starts[i + 1]?.n ?? meta.total + 1) - 1;
    const pages = Array.from({ length: end - c.n + 1 }, (_, k) => c.n + k);
    return { ...c, pages, locked: pages.filter((p) => !seen.has(p)).length };
  });
  const locked = meta.total - seen.size;
  const sheet = `/report-app/teaser/${code}/rest.webp`;

  const sheetRows = Math.ceil(meta.total / meta.cols);
  const tile = (p: number) => ({
    backgroundImage: `url(${sheet})`,
    backgroundSize: `${meta.cols * 100}% ${sheetRows * 100}%`,
    backgroundPosition: `${(((p - 1) % meta.cols) / (meta.cols - 1)) * 100}% ${(Math.floor((p - 1) / meta.cols) / Math.max(1, sheetRows - 1)) * 100}%`,
  });

  // 휴대폰 한 화면 안에 들어가게: 104칸을 촘촘한 한 덩어리로, 장 이름은 아래 칩으로(2026-10-18 장별 줄은 2,500px 라 접음).
  // 목차 칩을 누르면 위 띠가 그 장의 샘플로 넘어갑니다(2026-10-18 목차별 샘플). 칩은 링크 밖에 둡니다.
  return (
    <div className="rt-grid">
    <Link ref={ref} href="/report/?from=result-blur-grid" className="rt-grid-link" onClick={() => recordTestEventOnce(slug, "report_blur_tap")}>
      <div className="rt-grid-head">
        <b>전체 {meta.total}쪽 한눈에</b>
        <span>테두리 {seen.size}쪽은 위에서 미리 봤고, 흐린 {locked}쪽은 결제하면 내 이름·점수로 열려요</span>
      </div>
      <div className="rt-grid-wall" aria-hidden="true">
        {Array.from({ length: meta.total }, (_, k) => k + 1).map((p) => (
          <span key={p} className={seen.has(p) ? "is-seen" : undefined} style={show ? tile(p) : undefined} />
        ))}
      </div>
    </Link>
      <p className="rt-grid-hint">👇 장을 누르면 그 장 샘플을 위에서 보여 드려요</p>
      <ul className="rt-grid-chapters">
        {rows.filter((r) => r.no).map((r) => (
          <li key={r.n}>
            <button type="button" onClick={() => onJump(r.n)}>
              {chapterLabel(r)}
              {r.locked ? <small>🔒{r.locked}</small> : null}
            </button>
          </li>
        ))}
        {meta.saju ? (
          <li>
            <button type="button" onClick={() => onJump(SAJU_CHAPTER)}>{SAJU_LABEL}</button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

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

/** showMori=false: 결과 화면 맨 위에 이미 큰 모리 그림이 있어 카드 안 그림·말버릇을 뺍니다(2026-10-15, 같은 그림·말이 다섯 번 나왔음). */
export default function ReportTeaser({ code, slug = "mbti", scores, showMori = true }: { code: string; slug?: string; scores?: Record<Axis, number>; showMori?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const peeked = useRef(false);
  const ready = REPORT_READY_TYPES.includes(code);
  const [meta, setMeta] = useState<TeaserMeta | null>(null);

  // 흐린 미리보기 쪽 정보. 못 받으면 예전 6쪽 띠를 그대로 씁니다.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    fetch(`/report-app/teaser/${code}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: TeaserMeta | null) => { if (alive && j && Array.isArray(j.clear) && Array.isArray(j.half)) setMeta(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [code, ready]);

  // 띠에 들어갈 쪽(책 순서). 내 점수가 있으면 견본 점수 쪽(MY SCORES) 자리에 내 점수 쪽을 그립니다.
  const scoresPage = meta?.scores ?? meta?.clear[3];
  const slides = meta ? teaserSlides(code, meta) : [];
  const lockedCount = meta ? meta.total - meta.clear.length - meta.half.length : 0;
  // 목차 칩 → 띠를 그 장 첫 샘플로 넘기고, 띠가 화면에 보이게 올립니다.
  const jump = (chapter: number) => {
    const el = strip.current;
    const i = slides.findIndex((x) => x.chapter === chapter);
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    // 상단 고정 메뉴(약 64px)에 가리지 않게 여백을 두고 올립니다.
    const top = (el.parentElement ?? el).getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: "smooth" });
  };
  const says = MORI_WORLD[code]?.says ?? "";

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

  const total = meta ? slides.length : PAGES.length + (scores ? 1 : 0);
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
      <div className={showMori ? "report-teaser-hero" : "report-teaser-hero no-mori"}>
        {showMori ? (
          <div className="report-teaser-mori">
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
            <img src={moriImage(code)} alt={code} width={160} height={160} loading="lazy" />
            {says ? <span>“{says}”</span> : null}
          </div>
        ) : null}
        <div>
          <span className="report-teaser-eyebrow">MBTI REPORT · 104쪽</span>
          <h2 id="report-teaser-title">
            내 점수로 만든
            <br />
            <em>104쪽짜리 {code} 안내서</em>
          </h2>
          <p className="report-teaser-lead">
            결과 화면이 한 장이라면, 이건 한 권이에요. 방금 푼 40문항 점수로 같은 {code} 안에서도 내 성향의 농도에 맞는 글만 골라
            {" "}한 권으로 엮어 드려요.
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
            <span>{meta ? `👉 넘겨 보세요 · 장마다 샘플 ${slides.length}쪽` : "👉 옆으로 넘겨 보세요 · 내 점수로 만든 쪽부터"}</span>
            <b>{at + 1} / {total}</b>
          </div>
          {meta ? (
            <div className="rt-strip" ref={strip} onScroll={onScroll}>
              {slides.map((x) =>
                x.n === scoresPage && scores ? (
                  <MyScoresPage key={x.key} code={code} scores={scores} />
                ) : x.kind === "clear" ? (
                  <div key={x.key} className="rt-page">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같음 */}
                    <img src={x.src} alt={`${code} 리포트 ${x.n}쪽 미리보기`} loading="lazy" decoding="async" />
                    <span className="rt-chap">{x.label}</span>
                  </div>
                ) : (
                  <Link key={x.key} href="/report/?from=result-blur-page" className="rt-page rt-half" onClick={() => recordTestEventOnce(slug, "report_blur_tap")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같음 */}
                    <img src={x.src} alt={x.kind === "saju" ? `${code} 리포트 사주 장 견본 일부` : `${code} 리포트 ${x.n}쪽 일부 미리보기`} loading="lazy" decoding="async" />
                    <span className="rt-chap">{x.label}</span>
                    <span className="rt-lock">🔒 여기서부터가 진짜예요</span>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <div className="rt-strip" ref={strip} onScroll={onScroll}>
              {scores ? <MyScoresPage code={code} scores={scores} /> : null}
              {PAGES.map((n) => (
                // eslint-disable-next-line @next/next/no-img-element -- 위와 같음
                <img key={n} src={`/report-app/preview/${code}-${n}.jpg`} alt={`${code} 리포트 미리보기`} loading="lazy" />
              ))}
            </div>
          )}
          {meta ? <p className="rt-sample-note">미리보기는 견본(이름 「하늘」)이에요. 실제 리포트는 내 이름과 방금 나온 점수로 만들어져요.</p> : null}
          {meta ? <BlurGrid code={code} meta={meta} slug={slug} onJump={jump} /> : null}
        </div>
      ) : null}
      <div className="report-teaser-buy">
        {ready ? (
          <Link href="/report/?from=result-card" className="primary-button" onClick={() => recordTestEventOnce(slug, "report_click")}>
            {meta ? `가려진 ${lockedCount}쪽까지 열어 보기` : "내 104쪽 리포트 미리보기"} <span>→</span>
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
