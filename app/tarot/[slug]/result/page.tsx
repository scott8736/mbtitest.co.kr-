import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TarotDaily from "../../../../components/TarotDaily";
import { tarotFortuneBySlug, tarotSlugs } from "../../../../lib/tarot";
import "../../tarot.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return tarotSlugs.map((slug) => ({ slug }));
}

// 뽑은 카드에 따라 달라지는 개인 결과 화면이라 색인하지 않습니다. 검색 유입은 /tarot/<slug>/ 가 받습니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fortune = tarotFortuneBySlug(slug);
  return {
    title: fortune ? `${fortune.title} 결과` : "타로 결과",
    description: fortune ? `${fortune.title}에서 뽑은 카드의 풀이를 확인하세요.` : "뽑은 카드의 풀이를 확인하세요.",
    alternates: { canonical: `/tarot/${slug}/result/` },
    robots: { index: false, follow: true },
  };
}

export default async function TarotResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fortune = tarotFortuneBySlug(slug);
  if (!fortune) notFound();
  return <TarotDaily fortune={fortune} resultOnly />;
}
