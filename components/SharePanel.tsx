"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ShareChannel } from "../lib/mori";
import { recordShare } from "../lib/test-events";

/**
 * 공유 카드 미리보기 + 공유 버튼 네 개. MBTI 모리 카드와 다른 테스트 결과 카드가 같이 씁니다.
 *
 * 카드는 화면이 열릴 때 미리 그려 둡니다. ① 공유될 모습을 먼저 보여 주고 ② 아이폰 사파리는 버튼을
 * 누른 직후에만 공유창을 열어 주는데, 누른 뒤에 그리면 그사이 허락이 풀려 공유창이 막힙니다.
 * 카카오 전용 버튼은 없습니다(앱 키 없음) — 카톡은 휴대폰 공유창으로 갑니다.
 */
export type ShareChannels = { image: ShareChannel; link: ShareChannel; threads: ShareChannel; copy: ShareChannel };

export default function SharePanel({
  draw,
  drawKey,
  fileName,
  url,
  text,
  linkTitle,
  lead,
  previewAlt,
  channels,
  children,
}: {
  draw: () => Promise<Blob | null>;
  /** 이 값이 바뀔 때만 카드를 다시 그립니다 */
  drawKey: string;
  fileName: string;
  url: string;
  text: string;
  linkTitle: string;
  lead: string;
  previewAlt: string;
  channels: ShareChannels;
  children?: ReactNode;
}) {
  const [note, setNote] = useState("");
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let alive = true;
    let made = "";
    draw()
      .then((blob) => {
        if (!alive || !blob) return;
        made = URL.createObjectURL(blob);
        setCard({ blob, url: made });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
    // draw 는 렌더마다 새 함수라 drawKey 로 비교합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(""), 2500);
  };

  const shareImage = async () => {
    recordShare(channels.image);
    const blob = card?.blob ?? (await draw());
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    // 휴대폰은 공유창에 이미지를 넘겨 인스타 스토리·카톡으로 바로 보냅니다. 안 되면 저장합니다.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        // 공유창을 닫은 것이면 끝. 공유가 막힌 것(NotAllowedError 등)이면 아래 저장으로 넘어갑니다.
        if ((error as Error).name === "AbortError") return;
      }
    }
    const link = document.createElement("a");
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    flash("카드를 저장했어요. 인스타 스토리에 올리고 링크 스티커로 사이트 주소를 붙여 보세요.");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      flash("링크를 복사했어요.");
    } catch {
      flash(url);
    }
  };

  const shareLink = async () => {
    recordShare(channels.link);
    if (navigator.share) {
      try {
        await navigator.share({ title: linkTitle, text, url });
      } catch {
        // 공유창을 닫음
      }
      return;
    }
    await copy();
  };

  const threads = () => {
    recordShare(channels.threads);
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  };

  const copyLink = async () => {
    recordShare(channels.copy);
    await copy();
  };

  const buttons: Array<[string, string, () => void]> = [
    ["image", "📸 카드 저장 · 인스타 스토리", shareImage],
    ["link", "💬 카톡 · 문자로 보내기", shareLink],
    ["threads", "🧵 스레드에 올리기", threads],
    ["copy", "🔗 링크 복사", copyLink],
  ];

  return (
    <div className="mori-share">
      <p className="mori-share-lead">{lead}</p>
      <button type="button" className="mori-share-preview" onClick={() => card && setZoom(true)} aria-label="공유 카드 크게 보기" disabled={!card}>
        {card ? <img src={card.url} width={1080} height={1920} alt={previewAlt} /> : <span>카드 만드는 중…</span>}
        <small>{card ? "이 카드가 저장·공유돼요 · 눌러서 크게 보기" : ""}</small>
      </button>
      {zoom && card ? (
        <div className="mori-share-zoom" role="dialog" aria-label="공유 카드" onClick={() => setZoom(false)}>
          <img src={card.url} alt={previewAlt} />
          <button type="button" onClick={() => setZoom(false)}>닫기</button>
        </div>
      ) : null}
      <div className="mori-share-buttons">
        {buttons.map(([key, label, onClick]) => (
          <button key={key} type="button" onClick={onClick}>{label}</button>
        ))}
      </div>
      <p className="mori-share-note" role="status">{note}</p>
      {children}
    </div>
  );
}
