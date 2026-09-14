import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScreenerRunner from "../../../components/ScreenerRunner";
import { screenerBySlug, screenerSlugs } from "../../../lib/screeners";
import "../screener.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return screenerSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screener = screenerBySlug(slug);
  if (!screener) return {};

  return {
    title: `${screener.title} 무료`,
    description: `${screener.questions.length}개 문항으로 ${screener.description} 회원가입 없이 ${screener.duration} 만에 확인하세요.`,
    keywords: screener.keywords,
    alternates: { canonical: `/check/${slug}/` },
    openGraph: {
      type: "website",
      url: `https://mbtitest.co.kr/check/${slug}/`,
      title: `${screener.title} 무료`,
      description: screener.description,
      images: [
        {
          url: "/images/og/mbti-test-share.jpg",
          width: 1200,
          height: 630,
          alt: screener.title,
        },
      ],
    },
  };
}

export default async function ScreenerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screener = screenerBySlug(slug);
  if (!screener) notFound();

  // 지식스니펫과 FAQ 리치 결과를 노린 구조화 데이터. 화면에 보이는 문답과
  // 같은 문구를 씁니다. 다르면 구글이 스팸으로 봅니다.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: screener.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ScreenerRunner screener={screener} />
    </>
  );
}
