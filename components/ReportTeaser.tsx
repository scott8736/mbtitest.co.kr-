"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { recordTestEventOnce } from "../lib/test-events";
import { REPORT_EVENT, REPORT_PRICE } from "../lib/report-config";
import { REPORT_READY_TYPES } from "../report/content/ready";

/**
 * 유료 리포트 「모리 마음숲 안내서」 안내 카드.
 *
 * 2026-10-03~ 수요 측정 카드였고(가짜 결제 없이 클릭만 셈), 2026-10-04 실제 판매로 바꿨습니다.
 * report_seen·report_click 은 그대로 세어 측정 기간과 이어 볼 수 있게 합니다.
 *
 * 가격 표시: 판 적이 없는 「정가」에 취소선을 긋는 할인 표시는 하지 않습니다(표시광고법 — 예전 카드의
 * 「정가 9,900원 → 출시가 6,900원」을 걷어냈습니다). 이벤트 기간과 판매가만 그대로 씁니다.
 * 원고가 아직 없는 유형은 주문 화면으로 보내지 않고 「준비 중」으로 둡니다.
 */

const TOPICS = [
  "내 성향의 농도 (실제 점수로 고른 글)",
  "나는 어떤 사람일까",
  "연애할 때의 나",
  "친구와 사람들 사이에서",
  "일하는 방식",
  "공부할 때의 나",
  "돈을 대하는 마음",
  "방전과 충전",
  "하루의 리듬",
  "나를 꾸미는 색",
  "앞으로 13개월 마음 달력",
];

const fmt = (d: string) => d.replace(/^\d{4}-(\d{2})-(\d{2})$/, (_, m, dd) => `${Number(m)}월 ${Number(dd)}일`);

export default function ReportTeaser({ code, slug = "mbti" }: { code: string; slug?: string }) {
  const ref = useRef<HTMLElement>(null);
  const ready = REPORT_READY_TYPES.includes(code);

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

  return (
    <section ref={ref} className="report-teaser" aria-labelledby="report-teaser-title">
      <span className="report-teaser-eyebrow">MORI REPORT</span>
      <h2 id="report-teaser-title">
        {code} 모리의
        <br />
        마음숲 안내서
      </h2>
      <p className="report-teaser-lead">
        40문항 검사의 내 점수로, 같은 {code} 안에서도 내 성향의 농도에 맞춘 이야기를 골라 11가지 주제로 풀어 드려요.
        생년월일을 넣으면 사주 이야기가 한 장 더해져요.
      </p>
      <ol className="report-teaser-chapters">
        {TOPICS.map((title, i) => (
          <li key={title}>
            <b>{i + 1}장</b>
            <span>{title}</span>
            <i aria-hidden="true">🔒</i>
          </li>
        ))}
      </ol>
      <div className="report-teaser-buy">
        <p className="report-teaser-price">
          {REPORT_EVENT.label ? <small>{REPORT_EVENT.label} · {fmt(REPORT_EVENT.to)}까지</small> : null}
          <strong>{REPORT_PRICE.toLocaleString()}원</strong>
        </p>
        {ready ? (
          <Link href="/report/" className="primary-button" onClick={() => recordTestEventOnce(slug, "report_click")}>
            미리보기 · 주문하기 <span>→</span>
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
