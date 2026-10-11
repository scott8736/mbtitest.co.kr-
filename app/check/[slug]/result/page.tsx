import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScreenerRunner from "../../../../components/ScreenerRunner";
import { screenerBySlug, screenerSlugs } from "../../../../lib/screeners";
import "../../screener.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return screenerSlugs.map((slug) => ({ slug }));
}

// 이 탭의 응답으로만 그리는 개인 결과 화면이라 색인하지 않습니다. 검색 유입은 /check/<slug>/ 가 받습니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screener = screenerBySlug(slug);
  return {
    title: screener ? `${screener.title} 결과` : "자가진단 결과",
    description: "자가진단 점수와 구간별 설명, 도움받을 수 있는 곳을 확인하세요.",
    alternates: { canonical: `/check/${slug}/result/` },
    robots: { index: false, follow: true },
  };
}

export default async function ScreenerResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screener = screenerBySlug(slug);
  if (!screener) notFound();
  return <ScreenerRunner screener={screener} resultOnly />;
}
