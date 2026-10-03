"use client";

import { useEffect, useRef, useState } from "react";
import { recordTestEventOnce } from "../lib/test-events";

/**
 * 유료 정밀 리포트 수요 측정 카드 (2026-10-03~).
 *
 * 상품은 아직 없습니다. 결과 화면에 목차와 실제 가격을 보여 주고 「내 리포트 받기」를
 * 몇 명이 누르는지 셉니다. 가격을 빼고 재면 공짜인 줄 알고 누른 사람까지 섞여
 * 숫자가 부풀려지므로 가격을 그대로 보여 줍니다.
 *
 * 누르면 결제창처럼 보이는 화면 없이 바로 "만들고 있다"고 밝힙니다. 출시 날짜는
 * 약속하지 않습니다 — 측정이 불합격이면 지킬 수 없는 날짜가 되기 때문입니다.
 * 대신 출시 소식을 받을 곳으로 스레드 계정을 안내합니다.
 */

const THREADS_URL = "https://www.threads.com/@aseyo8282";

const CHAPTERS = [
  "나는 어떤 사람인가",
  "연애 스타일",
  "공부 스타일",
  "직업 · 일하는 방식",
  "돈 관리",
  "인간관계",
  "어울리는 색",
  "어울리는 옷 · 패션",
  "어울리는 음식",
  "생활습관 · 컨디션",
  "올해 흐름",
];

export default function ReportTeaser({ code, slug = "mbti" }: { code: string; slug?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState(false);

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

  const request = () => {
    recordTestEventOnce(slug, "report_click");
    setOpened(true);
  };

  return (
    <section ref={ref} className="report-teaser" aria-labelledby="report-teaser-title">
      <span className="report-teaser-eyebrow">PREMIUM REPORT</span>
      <h2 id="report-teaser-title">
        🔒 {code} × 내 생년월일
        <br />
        정밀 리포트
      </h2>
      <p className="report-teaser-lead">
        40문항 결과에 생년월일 사주를 겹쳐, 같은 {code} 안에서도 나에게만 맞는 이야기를 11개 장으로 풀어 드려요.
      </p>
      <ol className="report-teaser-chapters">
        {CHAPTERS.map((title, i) => (
          <li key={title}>
            <b>{i + 1}장</b>
            <span>{title}</span>
            <i aria-hidden="true">🔒</i>
          </li>
        ))}
      </ol>
      {opened ? (
        <div className="report-teaser-soon" role="status">
          <strong>지금 만들고 있어요.</strong>
          <p>
            출시되면 스레드에서 제일 먼저 알려드려요.
            <br />
            <small>결제는 일어나지 않았어요.</small>
          </p>
          <a
            href={THREADS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordTestEventOnce(slug, "report_follow")}
          >
            @aseyo8282 팔로우하기 →
          </a>
        </div>
      ) : (
        <div className="report-teaser-buy">
          <p className="report-teaser-price">
            <s>정가 9,900원</s>
            <strong>출시가 6,900원</strong>
          </p>
          <button type="button" className="primary-button" onClick={request}>
            내 리포트 받기 <span>→</span>
          </button>
        </div>
      )}
    </section>
  );
}
