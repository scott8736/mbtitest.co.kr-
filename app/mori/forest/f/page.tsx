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
 */
export const metadata: Metadata = {
  title: "우리 숲 초대장 — 내 모리를 심어 주세요",
  description: "친구가 만든 마음숲에 내 모리를 심어 16칸을 함께 채워요.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    url: "/mori/forest/f/",
    title: "우리 숲 초대장 🌳",
    description: "친구가 만든 마음숲에 내 모리를 심어 16칸을 함께 채워요.",
    images: [{ url: "/images/og/mbti-mori-og.jpg", width: 1200, height: 630, alt: "16모리" }],
  },
  twitter: { card: "summary_large_image", title: "우리 숲 초대장 🌳", description: "친구가 만든 마음숲에 내 모리를 심어 16칸을 함께 채워요." },
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
