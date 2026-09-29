import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";
import { newTestSlugs } from "../../../lib/test-meta";
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
    // 설명이 이미 "36문항으로…" 로 시작하면 문항 수를 두 번 쓰지 않습니다.
    // 소요 시간은 테스트마다 달라서(2~5분) 고정 문구를 쓰지 않습니다.
    description: `${/^\d+문항/.test(item.description) ? "" : `${item.questionCount}개 질문으로 `}${item.description} 회원가입 없이 ${item.duration} 만에 결과를 확인하세요.`,
    keywords: item.keywords,
    alternates: { canonical: `/tests/${slug}/` },
    openGraph: {
      type: "website",
      url: `https://mbtitest.co.kr/tests/${slug}/`,
      title: `${item.title} 무료`,
      description: item.description,
      images: [
        {
          url: "/images/og/mbti-test-share.jpg",
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
