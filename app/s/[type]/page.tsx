import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { mbtiCodes } from "../../../lib/mbti-content";
import { typeData } from "../../../lib/mbti-data";
import { MORI, moriImage, moriOgImage, moriSharePath } from "../../../lib/mori";

/**
 * 모리 카드 공유 링크가 여는 페이지 (/s/<유형>/, 2026-10-04 제작).
 *
 * 친구가 보낸 「나는 ○○ 모리」를 열면 그 캐릭터를 보여 주고 바로 검사로 보냅니다.
 * 유형만 바뀌는 페이지 16장이라 네이버 스팸 조항(문장 일부만 바꾼 페이지 대량 발행)에
 * 걸리지 않도록 **색인하지 않습니다**(noindex). 사이트맵에도 넣지 않습니다.
 * 공유 유입은 이 주소의 페이지뷰로 셉니다 — 쿼리스트링은 접속 기록에 남지 않습니다.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return mbtiCodes.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const code = type.toUpperCase();
  const info = typeData[code];
  if (!info) return {};
  return {
    title: `나는 ${code} 모리`,
    description: `친구는 ${code} ${info.name} 모리! 40문항 무료 MBTI 검사로 나는 어떤 모리인지 확인해 보세요.`,
    robots: { index: false, follow: true },
    alternates: { canonical: moriSharePath(code) },
    openGraph: {
      type: "website",
      url: moriSharePath(code),
      title: `나는 ${code} 모리 · ${info.name}`,
      description: "너는 어떤 모리야? 무료 MBTI 검사로 확인해 보세요.",
      images: [{ url: moriOgImage(code), width: 1200, height: 630, alt: `${code} 모리 캐릭터` }],
    },
  };
}

export default async function MoriSharePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const code = type.toUpperCase();
  const info = typeData[code];
  if (!info || !MORI[code]) notFound();

  return (
    <main>
      <SiteHeader active="/tests/mbti" />
      <section className="mori-landing" style={{ "--mori": MORI[code].color } as React.CSSProperties}>
        <span className="eyebrow">친구가 보낸 결과</span>
        <img className="mori-landing-img" src={moriImage(code)} width={720} height={720} alt={`${code} ${info.name} 모리 캐릭터`} />
        <h1><b>{code} 모리</b> · {info.name}</h1>
        <p className="mori-landing-tagline">{info.tagline}</p>
        <a className="primary-button" href="/tests/mbti/">나는 어떤 모리일까? 검사 시작 <span>→</span></a>
        <p className="mori-landing-meta">40문항 · 약 4분 · 가입 없이 무료</p>
        <a className="mori-landing-more" href={`/types/${type.toLowerCase()}/`}>{code} 특징 자세히 보기 →</a>
      </section>
      <section className="mori-dex" aria-labelledby="mori-dex-title">
        <h2 id="mori-dex-title">16가지 모리</h2>
        <div>
          {mbtiCodes.map((c) => (
            <a key={c} href={`/types/${c}/`} className={c === type.toLowerCase() ? "on" : ""}>
              <img src={moriImage(c)} width={120} height={120} alt="" loading="lazy" />
              <span>{c.toUpperCase()}</span>
            </a>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
