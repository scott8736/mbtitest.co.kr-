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
      {/* 최상단 광고는 2026-10-06 사용자 요청으로 뺐습니다 — 결과 첫 화면(모리 그림)이 광고에 밀려 내려갔습니다. 본문·하단 광고는 MbtiResult 안에 그대로 있습니다. */}
      <MbtiResult />
      <SiteFooter />
    </main>
  );
}
