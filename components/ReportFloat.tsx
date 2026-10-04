"use client";

/**
 * 떠 있는 「100쪽 리포트」 알약 버튼 (2026-10-04 사용자 제안 「플로팅 배너」).
 *
 * - 오른쪽 아래, 애드센스 하단 고정(앵커) 광고 자리보다 위에 둡니다. 광고를 가리면 애드센스 정책 위반입니다.
 * - 스크롤을 600px 넘게 내렸을 때만 나타나고, 닫으면 3일 동안 다시 뜨지 않습니다.
 * - 검사 진행 중(/tests/mbti/), 판매·결제·열람(/report…), 마음건강 자가진단(/check), 관리자에는 띄우지 않습니다.
 * - 이 기기에 MBTI 결과가 있고 그 유형이 준비됐으면 바로 /report/, 아니면 무료 검사로 보냅니다.
 */
import { useEffect, useState } from "react";
import { readLastResult } from "../lib/my-mori";
import { REPORT_PRICE } from "../lib/report-config";
import { REPORT_READY_TYPES } from "../report/content/ready";

const HIDE_KEY = "mori-float-hidden";
const SKIP = [/^\/tests\/mbti\//, /^\/test\//, /^\/report/, /^\/check/, /^\/admin/, /^\/refund/];

export default function ReportFloat() {
  const [show, setShow] = useState(false);
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    if (SKIP.some((re) => re.test(location.pathname))) return;
    try {
      if (Number(localStorage.getItem(HIDE_KEY) ?? 0) > Date.now()) return;
    } catch {
      // 저장소가 막혀 있어도 그냥 보여 줍니다.
    }
    const last = readLastResult()?.result ?? null;
    const onScroll = () => {
      if (window.scrollY > 600) {
        setMine(last && REPORT_READY_TYPES.includes(last) ? last : null);
        setShow(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now() + 3 * 86400_000));
    } catch {
      // 닫기만 되고 기억은 못 할 뿐입니다.
    }
  };
  return (
    <div className="report-float" role="complementary" aria-label="유료 리포트 안내">
      <a href={mine ? "/report/?from=float" : "/tests/mbti/"}>
        <b>📖 {mine ? `내 ${mine} 104쪽 리포트` : "무료 검사 → 유료 리포트"}</b>
        <span>{mine ? `미리보기 6쪽 무료 · ${REPORT_PRICE.toLocaleString()}원` : `내 점수로 만든 안내서 · ${REPORT_PRICE.toLocaleString()}원`}</span>
      </a>
      <button type="button" onClick={close} aria-label="리포트 안내 닫기">×</button>
    </div>
  );
}
