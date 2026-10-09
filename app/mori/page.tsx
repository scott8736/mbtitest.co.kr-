import type { Metadata } from "next";
import AdUnit from "../../components/AdUnit";
import ContentHeader from "../../components/ContentHeader";
import ForestEntry, { MoriChatEntry } from "../../components/ForestEntry";
import MoriLoopVideo from "../../components/MoriLoopVideo";
import SiteFooter from "../../components/SiteFooter";
import { typeData } from "../../lib/mbti-data";
import { MORI, moriImage } from "../../lib/mori";
import { MORI_PAIRS, MORI_WORLD, VILLAGES, villageOf, type VillageKey } from "../../lib/mori-world";
import { SITE_DOMAIN } from "../../lib/site-config";

/**
 * 모리 세계관 「마음숲 안내서」 (2026-10-04). 세계관을 한 장에 모은 페이지입니다.
 * 유형마다 찍어낸 페이지가 아니라 사이트에 한 장뿐인 고유 글이라 색인합니다(사이트맵 포함).
 */
export const metadata: Metadata = {
  title: "마음숲 16모리 세계관 — 네 마을과 짝꿍",
  description: "마음속에 하나씩 사는 숲의 정령 모리. 별빛 언덕·달빛 호수·도토리 마을·바람 들판에 사는 16모리와 짝꿍 이야기.",
  alternates: { canonical: "/mori/" },
  openGraph: {
    type: "website",
    url: "/mori/",
    title: "마음숲 16모리 세계관",
    description: "너의 마음숲에는 어떤 모리가 살고 있을까?",
    images: [{ url: "/images/og/mbti-mori-og.jpg", width: 1200, height: 630, alt: "16모리" }],
  },
};

const ORDER: VillageKey[] = ["nt", "nf", "sj", "sp"];

export default function MoriWorldPage() {
  const codes = Object.keys(MORI_WORLD);
  return (
    <main>
      <ContentHeader active="/mori" />
      <section className="world-hero">
        <span className="eyebrow">MORI · 마음숲 안내서</span>
        <h1>
          모든 사람의 마음속에는
          <br />
          작은 <em>모리</em>가 살고 있어요
        </h1>
        <p>
          모리(森)는 숲이라는 뜻이에요. 모리는 마음속 숲에 사는 작은 정령인데, 평소에는 잠들어 있다가 나를
          들여다보는 질문에 답하는 순간 깨어나요. 16모리는 서로 다른 방식으로 같은 숲을 지켜요.
          <b> 달라서 틀린 게 아니라, 달라서 숲이 완성돼요.</b>
        </p>
        <img className="world-map" src="/images/world/map.webp" width={1200} height={900} alt="마음나무 광장과 네 마을이 있는 마음숲 지도" />
        <a className="primary-button" href="/tests/mbti/">내 모리 깨우기 · 무료 검사 <span>→</span></a>
        <MoriChatEntry placement="mori-world-chat" />
        <ForestEntry title="이 숲을 직접 걸어 보기" />
      </section>

      <section className="world-body">
        <div className="world-tree">
          <h2>🌳 마음나무 광장</h2>
          <p>
            숲 한가운데에는 마음나무가 있어요. 16모리가 모두 모이는 광장이고, 계절마다 축제가 열려요.
            마음나무의 열매는 <b>모리들이 서로를 이해할 때</b> 하나씩 열려요. 그래서 이 숲에서는 다툰 모리들도
            결국 함께 열매를 맺어요.
          </p>
          <nav className="world-nav" aria-label="네 마을">
            {ORDER.map((k) => (
              <a key={k} href={`#${k}`} style={{ "--village": VILLAGES[k].color } as React.CSSProperties}>{VILLAGES[k].name}</a>
            ))}
          </nav>
        </div>

        <AdUnit position="articleTop" label="마음숲 상단 광고" />

        {ORDER.map((k) => {
          const v = VILLAGES[k];
          return (
            <section key={k} id={k} className="world-village" style={{ "--village": v.color } as React.CSSProperties}>
              <img className="world-village-img" src={v.image} width={1280} height={720} alt={`${v.name} 풍경`} loading="lazy" />
              <div className="world-village-head">
                <span>{v.group}</span>
                <h2>{v.name}</h2>
                <p>{v.scene} · {v.landmarks}</p>
              </div>
              <div className="world-mori-grid">
                {codes.filter((c) => villageOf(c) === k).map((c) => (
                  <a key={c} href={`/types/${c.toLowerCase()}/`} className="world-mori" style={{ "--mori": MORI[c].color } as React.CSSProperties}>
                    <img src={moriImage(c)} width={160} height={160} alt={`${c} 모리`} loading="lazy" />
                    <b>{c} · {typeData[c].name}</b>
                    <q>{MORI_WORLD[c].says}</q>
                    <span>{MORI_WORLD[c].line}</span>
                    <small>맡은 일: {MORI_WORLD[c].role} · {MORI[c].prop}</small>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        <section className="world-pairs">
          <h2>짝꿍과 티격태격 라이벌</h2>
          <p>짝꿍은 서로의 빈 곳을 채워 주는 사이, 라이벌은 부딪히다가 결국 함께 마음나무 열매를 맺는 사이예요.</p>
          <div className="world-pair-list">
            {MORI_PAIRS.map((p) => (
              <article key={p.a + p.b} className={p.kind === "짝꿍" ? "is-mate" : "is-rival"}>
                <div className="pair-moris is-large" aria-hidden="true">
                  <img src={moriImage(p.a)} width={80} height={80} alt="" loading="lazy" />
                  <i>{p.kind === "짝꿍" ? "💞" : "⚡"}</i>
                  <img src={moriImage(p.b)} width={80} height={80} alt="" loading="lazy" />
                </div>
                <span>{p.kind}</span>
                <h3>{typeData[p.a].name} × {typeData[p.b].name}</h3>
                <p className="world-pair-hook">{p.hook}</p>
                <p>{p.story}</p>
                <a href={`/compatibility/${p.a.toLowerCase()}/#${p.b.toLowerCase()}`}>{p.a} × {p.b} 궁합 자세히 →</a>
              </article>
            ))}
          </div>
        </section>

        <MoriLoopVideo variant="share" />

        <p className="world-note">
          모리와 마음숲은 {SITE_DOMAIN} 의 자체 캐릭터 세계관입니다. 성격 유형은 자기이해를 돕는 참고 자료이고,
          어느 모리가 더 낫거나 못한 일은 없어요.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
