import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";
import { newTestSlugs } from "../../../lib/new-tests";
import { testCatalog } from "../../../lib/test-catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return newTestSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = testCatalog.find((test) => test.slug === slug);
  if (!item || !newTestSlugs.includes(slug)) return {};

  return {
    title: `${item.title} 무료`,
    description: `${item.questionCount}개 질문으로 ${item.description} 회원가입 없이 약 2분 만에 결과를 확인하세요.`,
    keywords: item.keywords,
    alternates: { canonical: `/tests/${slug}/` },
    openGraph: {
      type: "website",
      url: `https://mbtitest.co.kr/tests/${slug}/`,
      title: `${item.title} 무료`,
      description: item.description,
      images: [
        {
          url: "/images/og/mbti-test-share.png",
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
    },
  };
}

export default async function NewTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = genericTests[slug];
  if (!test || !newTestSlugs.includes(slug)) notFound();
  return <GenericTestRunner test={test} />;
}
