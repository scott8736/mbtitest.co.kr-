import { notFound } from "next/navigation";
import GenericTestRunner from "../../../../components/GenericTestRunner";
import { genericTests } from "../../../../lib/generic-tests";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(genericTests).map((slug) => ({ slug }));
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
