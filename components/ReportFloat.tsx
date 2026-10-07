"use client";

/**
 * 떠 있는 「100쪽 리포트」 알약 버튼 (2026-10-04 사용자 제안 「플로팅 배너」).
 *
 * - 오른쪽 아래, 애드센스 하단 고정(앵커) 광고 자리보다 위에 둡니다. 광고를 가리면 애드센스 정책 위반입니다.
 * - 스크롤을 600px 넘게 내렸을 때만 나타나고, 닫으면 3일 동안 다시 뜨지 않습니다.
 * - 검사 진행 중(/tests/mbti/), 판매·결제·열람(/report…), 마음건강 자가진단(/check), 관리자에는 띄우지 않습니다.
 * - 이 기기에 MBTI 결과가 있고 그 유형이 준비됐으면 바로 /report/, 아니면 무료 검사로 보냅니다.
 * - 2026-10-06 사용자 요청: 가격(9,900원)은 빼고(누르기 전에 값부터 보이면 안 누름), 더 크게, 주목 모션.
 *   모션은 몇 초마다 한 번 살짝 튀고 빛 띠가 지나가는 정도이고, 「동작 줄이기」 설정이면 멈춥니다.
 */
import { useEffect, useState } from "react";
import { readLastResult } from "../lib/my-mori";
import { REPORT_READY_TYPES } from "../report/content/ready";

const HIDE_KEY = "mori-float-hidden";
// 숲 산책 게임에는 결제로 이어지는 버튼을 두지 않습니다(기획안 5절 — 10대 이용자, 게임 중간 팝업 금지).
const SKIP = [/^\/tests\/mbti\//, /^\/test\//, /^\/report/, /^\/check/, /^\/admin/, /^\/refund/, /^\/mori\/forest/];

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
        <span>{mine ? "미리보기 6쪽 무료로 보기 →" : "내 점수로 만든 104쪽 안내서 →"}</span>
      </a>
      <button type="button" onClick={close} aria-label="리포트 안내 닫기">×</button>
    </div>
  );
}
