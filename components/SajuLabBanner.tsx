"use client";

import { useEffect, useRef } from "react";
import { recordTestEventOnce } from "../lib/test-events";
import { SAJULAB_URL, type SajulabPlacement } from "../lib/sajulab";

/**
 * 결과 화면의 「프리미엄 사주」 배너. 자리 목록과 이유는 lib/sajulab.ts 에 있습니다.
 *
 * 「지금 N명 시청 중」 같은 실시간 숫자는 넣지 않습니다. 셀 방법이 없는 숫자를
 * 지어내면 그대로 거짓 광고가 됩니다. 「기간 한정」도 사주랩 쪽에서 확인되지 않아 뺐습니다.
 * 사주랩은 유료 프리미엄입니다. 무료 사이트 결과 화면이라 「무료」로 읽히면
 * 눌러 본 사람이 속았다고 느끼므로, 배너 안에 「무료」를 쓰지 않고 유료임을 밝힙니다.
 */
export default function SajuLabBanner({ placement }: { placement: SajulabPlacement }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // 배너가 화면에 절반 이상 들어왔을 때 한 번 셉니다. 클릭이 적을 때
  // "안 눌렀다"와 "거기까지 내려오지 않았다"를 가르기 위해서입니다.
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          recordTestEventOnce(placement, "saju_seen");
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [placement]);

  return (
    <a
      ref={ref}
      className="sajulab-banner"
      href={SAJULAB_URL}
      target="_blank"
      rel="noopener"
      onClick={() => recordTestEventOnce(placement, "saju_click")}
    >
      <span className="sajulab-eyebrow">🔥 재물운 · 연애운 · 직장운까지</span>
      <strong className="sajulab-title">
        무료 운세로는 볼 수 없는
        <br />
        숨겨진 운명의 비밀 🔐
      </strong>
      <span className="sajulab-button">
        🔮 프리미엄 사주 보러 가기 <i aria-hidden="true">→</i>
      </span>
      <small className="sajulab-note">💎 유료 프리미엄 · 100장 이상 상세 분석 리포트</small>
    </a>
  );
}
