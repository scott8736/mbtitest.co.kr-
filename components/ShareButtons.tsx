"use client";

import { useEffect, useState } from "react";

type Props = {
  /** 넘기지 않으면 현재 문서의 제목과 주소를 씁니다. 어느 페이지에 놓아도 맞습니다 */
  title?: string;
  url?: string;
  label?: string;
  /** footer 는 모든 페이지 하단에 들어가는 좁은 형태입니다 */
  variant?: "article" | "footer";
};

/**
 * 공유 버튼.
 *
 * 모바일에서는 navigator.share 가 기기의 공유 시트를 열어 카카오톡·메시지·
 * 링크 복사를 한 번에 처리합니다. 이 API 가 없는 데스크톱 브라우저에서는
 * 클립보드 복사로 넘어갑니다. 외부 SDK 를 쓰지 않으므로 광고·추적 스크립트가
 * 늘지 않고, 페이지 속도에도 영향이 없습니다.
 */
export default function ShareButtons({ title, url, label, variant = "article" }: Props) {
  const [notice, setNotice] = useState("");

  // 알림 문구를 자동으로 지웁니다.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // 정적으로 만들어진 같은 HTML 이 여러 주소에서 쓰일 수 있으므로,
  // 주소는 넘겨받은 값이 없으면 누를 때 현재 주소에서 읽습니다.
  const current = () => ({
    title: title ?? document.title,
    url: url ?? window.location.href,
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current().url);
      setNotice("링크를 복사했습니다");
    } catch {
      setNotice("복사하지 못했습니다");
    }
  };

  const share = async () => {
    const target = current();
    if (navigator.share) {
      try {
        await navigator.share({ title: target.title, url: target.url });
        return;
      } catch {
        // 사용자가 공유 시트를 닫은 경우입니다. 복사로 넘기지 않습니다.
        return;
      }
    }
    await copy();
  };

  return (
    <div className={variant === "footer" ? "share-bar" : "article-share"}>
      <span>{label ?? (variant === "footer" ? "이 페이지가 도움이 되었다면" : "이 글 공유하기")}</span>
      <div className="share-actions">
        <button type="button" onClick={share}>공유하기</button>
        <button type="button" onClick={copy}>링크 복사</button>
      </div>
      <p aria-live="polite">{notice}</p>
    </div>
  );
}
