import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GenericTestRunner from "../../../../components/GenericTestRunner";
import { genericTests } from "../../../../lib/generic-tests";
import { testCatalog } from "../../../../lib/test-catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(genericTests).map((slug) => ({ slug }));
}

// 결과 화면은 방문자의 응답에 따라 달라지는 개인 화면이므로 색인하지 않고,
// 검색 유입은 테스트 페이지가 받도록 합니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = testCatalog.find((test) => test.slug === slug);
  const title = item ? `${item.shortTitle} 결과` : "테스트 결과";
  return {
    title,
    description: item ? `${item.title} 결과를 확인하세요.` : "테스트 결과를 확인하세요.",
    alternates: { canonical: `/tests/${slug}/result/` },
    robots: { index: false, follow: true },
  };
}

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = genericTests[slug];
  if (!test) notFound();
  return <GenericTestRunner test={test} resultOnly />;
}
