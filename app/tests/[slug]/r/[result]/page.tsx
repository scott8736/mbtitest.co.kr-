import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SharedResult from "../../../../../components/SharedResult";
import { genericTests } from "../../../../../lib/generic-tests";
import { testCatalog } from "../../../../../lib/test-catalog";
import "./shared-result.css";

export const dynamicParams = false;

/**
 * 결과마다 주소를 하나씩 만듭니다.
 *
 * 이 주소가 있어야 카카오톡 썸네일이 결과별로 달라지고(공유된 주소의 og:image
 * 를 그대로 읽어갑니다), 결과 이름으로 검색해 들어오는 유입을 받을 수 있습니다.
 */
export function generateStaticParams() {
  return Object.entries(genericTests).flatMap(([slug, test]) =>
    Object.keys(test.results).map((result) => ({ slug, result })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; result: string }>;
}): Promise<Metadata> {
  const { slug, result: resultKey } = await params;
  const test = genericTests[slug];
  const result = test?.results[resultKey];
  if (!test || !result) return {};

  const item = testCatalog.find((entry) => entry.slug === slug);
  const title = `${result.name} — ${item?.title || test.title}`;
  const description = `${result.tagline}. ${result.summary}`;
  // scripts/make-og.mjs 가 구워 둔 결과별 카드입니다. 없으면 공유 썸네일에
  // 사이트 로고가 떠서 클릭률이 떨어집니다.
  const image = `https://mbtitest.co.kr/images/og/r/${slug}-${resultKey}.png`;

  return {
    title,
    description,
    alternates: { canonical: `/tests/${slug}/r/${resultKey}/` },
    openGraph: {
      type: "article",
      url: `https://mbtitest.co.kr/tests/${slug}/r/${resultKey}/`,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: result.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ slug: string; result: string }>;
}) {
  const { slug, result: resultKey } = await params;
  const test = genericTests[slug];
  const result = test?.results[resultKey];
  if (!test || !result) notFound();
  return <SharedResult test={test} result={result} />;
}
