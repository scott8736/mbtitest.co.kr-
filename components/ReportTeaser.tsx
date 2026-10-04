"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
 */

const HOOKS = [
  ["104쪽", "연애·일·돈·공부·관계까지 11가지 주제"],
  ["81가지", "같은 유형도 내 점수 농도로 글이 달라져요"],
  ["+사주", "생년월일을 넣으면 사주 장까지 110쪽"],
  ["13개월", "이번 달부터 마음 달력 + 배경화면 3종"],
];

export default function ReportTeaser({ code, slug = "mbti" }: { code: string; slug?: string }) {
  const ref = useRef<HTMLElement>(null);
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
        <div className="report-teaser-pages" aria-hidden="true">
          {[1, 3, 5].map((n) => (
            // eslint-disable-next-line @next/next/no-img-element -- 위와 같음
            <img key={n} src={`/report-app/preview/${code}-${n}.jpg`} alt="" loading="lazy" />
          ))}
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
