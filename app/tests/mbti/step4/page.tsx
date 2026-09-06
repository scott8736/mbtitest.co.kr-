import type { Metadata } from "next";
import MbtiQuiz from "../../../../components/MbtiQuiz";
import SiteFooter from "../../../../components/SiteFooter";
import SiteHeader from "../../../../components/SiteHeader";

// 40문항을 10문항씩 나눈 4단계입니다. 문항 화면이라 색인하지 않습니다.
export const metadata: Metadata = {
  title: "무료 MBTI 검사 4단계",
  description: "40문항 무료 MBTI 검사 4단계입니다. 남은 문항에 답하고 결과를 확인하세요.",
  alternates: { canonical: "/tests/mbti/step4/" },
  robots: { index: false, follow: true },
};

export default function MbtiStep4Page() {
  return (
    <main>
      <SiteHeader active="/tests/mbti" />
      <MbtiQuiz step={4} />
      <SiteFooter />
    </main>
  );
}
