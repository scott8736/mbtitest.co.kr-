"use client";

import { useEffect, useRef } from "react";
import { onResultLinkClick } from "../lib/test-events";

/**
 * 「너는 어떤 모리?」 15초 반복 영상 카드 (2026-10-04).
 *
 * 영상은 영상_모리15초/render.py --site 로 뽑은 사이트판입니다 — 끝 장면의 주소 줄을 빼고
 * 540x960 · 무음으로 줄였습니다(소리가 없어 음원 라이선스 문제도 없습니다).
 * 첫 화면 로딩을 무겁게 하지 않도록 화면에 보일 때만 받고, 벗어나면 멈춥니다.
 */
const SRC = "/videos/mori-loop.mp4";
const POSTER = "/videos/mori-loop.jpg";

export default function MoriLoopVideo({ variant }: { variant: "home" | "share" }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!video.src) video.src = SRC;
        video.play().catch(() => {});
      } else if (video.src) {
        video.pause();
      }
    }, { rootMargin: "200px 0px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const home = variant === "home";
  return (
    <section className={`mori-video${home ? " is-home" : ""}`} aria-label="MBTI 검사 미리보기 영상">
      <video ref={ref} poster={POSTER} muted loop playsInline preload="none" width={540} height={960} aria-hidden="true" />
      <div className="mori-video-copy" onClick={home ? onResultLinkClick("home-mori-video") : undefined}>
        <strong>{home ? "검사가 끝나면 내 모리가 나와요" : "이렇게 4분이면 끝나요"}</strong>
        <p>40문항에 답하면 16가지 모리 중 나와 닮은 캐릭터를 알려 드려요.</p>
        <a href="/tests/mbti/">{home ? "나는 어떤 모리일까? →" : "나도 검사 시작하기 →"}</a>
      </div>
    </section>
  );
}
