import type { Metadata } from "next";
import ContentHeader from "../../../../components/ContentHeader";
import { ForestInvite } from "../../../../components/OurForest";
import SiteFooter from "../../../../components/SiteFooter";
import { typeData } from "../../../../lib/mbti-data";
import "../forest.css";

/**
 * 「우리 숲」 초대 페이지 (2026-10-07). 모든 숲이 이 한 장을 같이 씁니다(/mori/forest/f/?id=…).
 * 숲마다 페이지를 찍어내지 않고 색인하지 않습니다(기획안 8절, /s/ 와 같음).
 * 카톡·스레드 미리보기 제목은 라이브 워커(worker/pages-entry.ts)가 숲 것으로 바꿔 내보냅니다.
 * 2026-10-08: 「친구가 본 내 모리」 — 들어온 친구가 먼저 주인을 맞히고(components/GuessMe.tsx) 그다음 심습니다.
 */
export const metadata: Metadata = {
  title: "나는 어떤 모리 같아? 맞혀 줘 🤔",
  description: "16모리 중 하나를 골라 친구를 맞혀 보고, 내 모리도 숲에 심어 주세요.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    url: "/mori/forest/f/",
    title: "나는 어떤 모리 같아? 맞혀 줘 🤔",
    description: "16모리 중 하나를 골라 친구를 맞혀 보고, 내 모리도 숲에 심어 주세요.",
    // 주인 유형이 보이지 않는 공용 그림(scripts/make-forest-guess-og.py). 제목·설명은 워커가 숲마다 바꿉니다.
    images: [{ url: "/images/og/forest-guess.png", width: 1200, height: 630, alt: "나는 어떤 모리 같아? 16모리" }],
  },
  twitter: { card: "summary_large_image", title: "나는 어떤 모리 같아? 맞혀 줘 🤔", description: "16모리 중 하나를 골라 친구를 맞혀 보고, 내 모리도 숲에 심어 주세요.", images: ["/images/og/forest-guess.png"] },
};

export default function ForestInvitePage() {
  const names = Object.fromEntries(Object.keys(typeData).map((c) => [c, typeData[c].name]));
  return (
    <main className="mf-page">
      <ContentHeader active="/mori/forest" />
      <div className="mf google-auto-ads-ignore">
        <ForestInvite names={names} />
      </div>
      <SiteFooter />
    </main>
  );
}
