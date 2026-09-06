import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GenericTestRunner from "../../../../components/GenericTestRunner";
import { genericTests } from "../../../../lib/generic-tests";
import { testCatalog } from "../../../../lib/test-catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(genericTests).map((slug) => ({ slug }));
}

// 문항을 푸는 화면이라 색인하지 않습니다. 검색 유입은 /tests/[slug]/ 가 받습니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = testCatalog.find((test) => test.slug === slug);
  return {
    title: item ? `${item.shortTitle} 2단계` : "테스트 2단계",
    description: item ? `${item.title}의 나머지 문항에 답하고 결과를 확인하세요.` : "남은 문항에 답해 주세요.",
    alternates: { canonical: `/tests/${slug}/step2/` },
    robots: { index: false, follow: true },
  };
}

export default async function TestStepTwoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = genericTests[slug];
  if (!test) notFound();
  return <GenericTestRunner test={test} part={2} />;
}
