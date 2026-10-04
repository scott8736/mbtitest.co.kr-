"use client";

import { useEffect, useRef, useState } from "react";
import { MORI, type ShareChannel } from "../lib/mori";
import { recordShare } from "../lib/test-events";

/**
 * 「내 모리」 15초 영상 공유 (2026-10-04).
 *
 * 유형마다 결과가 그 유형으로 멈추는 영상을 미리 만들어 둡니다(영상_모리15초/render.py --share).
 * 화면에 보이면 영상을 미리 받아 둡니다 — 아이폰 사파리는 버튼을 누른 직후에만 공유창을 열어 주는데,
 * 누른 뒤에 받으면 그사이 허락이 풀려 공유창이 막히기 때문입니다(모리 카드 이미지와 같은 이유).
 * 영상에는 링크가 안 붙어서 화면 아래에 mbtitest.co.kr 을 내내 띄웠습니다. 소리는 없습니다 —
 * 사용자 계정으로 퍼지는 파일이라 권리가 불분명한 음원을 넣지 않고, 인스타·틱톡 앱의 음악을 쓰게 합니다.
 */
export const moriShareVideo = (code: string) => `/videos/share/mori-${code.toLowerCase()}.mp4`;

export default function MoriVideoShare({ code, channel, label }: { code: string; channel: ShareChannel; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [note, setNote] = useState("");
  const src = moriShareVideo(code);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let alive = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      fetch(src)
        .then((r) => (r.ok ? r.blob() : null))
        .then((b) => alive && b && setBlob(b))
        .catch(() => {});
    }, { rootMargin: "300px 0px" });
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [src]);

  // 받아 둔 영상을 그대로 미리보기에도 씁니다(같은 파일을 두 번 받지 않게).
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (!MORI[code]) return null;

  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(""), 4000);
  };

  const share = async () => {
    recordShare(channel);
    const data = blob ?? (await fetch(src).then((r) => r.blob()).catch(() => null));
    if (!data) return flash("영상을 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.");
    const file = new File([data], `mori-${code.toLowerCase()}.mp4`, { type: "video/mp4" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        flash("🎵 인스타·틱톡에서 음악을 붙여 올려 보세요!");
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    const link = document.createElement("a");
    const href = URL.createObjectURL(data);
    link.href = href;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    flash("영상을 저장했어요. 릴스·스토리에 올리고 앱에서 음악을 붙여 보세요 🎵");
  };

  return (
    <div className="mori-video-share" ref={box}>
      <video src={preview || undefined} poster={`/characters/mori-${code.toLowerCase()}.webp`} muted loop playsInline autoPlay width={720} height={1280} aria-hidden="true" />
      <div>
        <strong>{label ?? `나는 ${code} 모리 영상`}</strong>
        <p>15초 릴스·스토리용 영상이에요. 슬롯이 돌다가 {code}에서 멈춰요.</p>
        <button type="button" className="mori-video-share-btn" onClick={share}>🎬 영상 저장·공유</button>
        <p className="mori-video-share-note" role="status">{note}</p>
      </div>
    </div>
  );
}
