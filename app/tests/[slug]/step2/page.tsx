import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { genericTests } from "../../../../lib/generic-tests";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(genericTests).map((slug) => ({ slug }));
}

// 2026-10-11부터 문항을 /tests/[slug]/ 한 페이지에서 풉니다. 예전 2단계 주소로 들어오면
// (뒤로가기·북마크) 앞 단계 답이 없으므로 테스트 첫 화면으로 보냅니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "테스트 처음 화면으로",
    description: "이 테스트는 첫 화면에서 처음부터 진행합니다.",
    alternates: { canonical: `/tests/${slug}/` },
    robots: { index: false, follow: true },
  };
}

export default async function TestStepTwoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!genericTests[slug]) notFound();
  return (
    <main>
      <meta httpEquiv="refresh" content={`0;url=/tests/${slug}/`} />
      <p style={{ padding: 24, textAlign: "center" }}>
        <a href={`/tests/${slug}/`}>테스트 처음 화면으로 이동합니다</a>
      </p>
    </main>
  );
}
