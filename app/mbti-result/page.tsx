import type { Metadata } from "next";
import MbtiResult from "../../components/MbtiResult";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "MBTI 검사 결과",
  description: "방금 완료한 무료 MBTI 검사 결과와 성향 지표, 강점·주의점을 확인하세요.",
  alternates: { canonical: "/mbti-result/" },
  robots: { index: false, follow: true },
};

export default function MbtiResultPage() {
  return (
    <main>
      <SiteHeader active="/tests/mbti" />
      <MbtiResult />
      <SiteFooter />
    </main>
  );
}
