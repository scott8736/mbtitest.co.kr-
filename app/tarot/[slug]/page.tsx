import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TarotDaily from "../../../components/TarotDaily";
import { tarotFortuneBySlug, tarotSlugs } from "../../../lib/tarot";
import "../tarot.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return tarotSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fortune = tarotFortuneBySlug(slug);
  if (!fortune) return {};

  return {
    title: `${fortune.title} 무료`,
    description: `${fortune.description} 회원가입 없이 하루 한 번, 오늘의 카드를 확인하세요.`,
    keywords: fortune.keywords,
    alternates: { canonical: `/tarot/${slug}/` },
    openGraph: {
      type: "website",
      url: `https://mbtitest.co.kr/tarot/${slug}/`,
      title: `${fortune.title} 무료`,
      description: fortune.description,
      images: [
        {
          url: "/images/og/mbti-test-share.jpg",
          width: 1200,
          height: 630,
          alt: fortune.title,
        },
      ],
    },
  };
}

export default async function TarotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fortune = tarotFortuneBySlug(slug);
  if (!fortune) notFound();
  return <TarotDaily fortune={fortune} />;
}
