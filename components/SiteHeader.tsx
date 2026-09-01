"use client";

import { useEffect, useState } from "react";

const links = [
  ["/tests/mbti/", "MBTI 검사"],
  ["/tests/", "심리테스트"],
  ["/types/", "16가지 유형"],
  ["/compatibility/", "MBTI 궁합"],
  ["/blog/", "심리 콘텐츠"],
] as const;

// 호출하는 쪽이 "/tests" 처럼 슬래시 없이 넘겨도 현재 메뉴가 표시되도록 맞춥니다.
const samePath = (a: string, b: string) =>
  a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

export default function SiteHeader({ active }: { active: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <header className="site-header global-header">
        <a className="logo" href="/" aria-label="MBTI 검사 홈">
          <span className="brain-mark" aria-hidden="true">✦</span>
          <b>MBTI 검사</b>
        </a>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {links.map(([href, label]) => (
            <a key={href} className={samePath(active, href) ? "active" : ""} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href="/tests/mbti/" aria-label="무료 MBTI 검사 시작">
          무료 검사 시작
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <button
        className={`menu-backdrop ${open ? "is-open" : ""}`}
        type="button"
        aria-label="메뉴 닫기"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />
      <nav
        id="mobile-navigation"
        className={`mobile-nav ${open ? "is-open" : ""}`}
        aria-label="모바일 주요 메뉴"
        aria-hidden={!open}
      >
        <span className="mobile-nav-label">MENU</span>
        {links.map(([href, label]) => (
          <a
            key={href}
            className={samePath(active, href) ? "active" : ""}
            href={href}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
          >
            <span>{label}</span>
            <i aria-hidden="true">→</i>
          </a>
        ))}
        <a className="mobile-nav-cta" href="/tests/mbti/" tabIndex={open ? 0 : -1}>
          무료 MBTI 검사 시작
        </a>
      </nav>
    </>
  );
}
