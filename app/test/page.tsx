import type { Metadata } from "next";
import MbtiQuiz from "../../components/MbtiQuiz";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

// 예전 /test 주소로 들어오는 링크를 위한 별칭 페이지입니다.
// 정식 주소는 /tests/mbti/ 이므로 색인은 하지 않습니다.
export const metadata: Metadata = {
  title: "무료 MBTI 검사 40문항",
  description: "40개 문항으로 진행하는 무료 MBTI 검사입니다.",
  alternates: { canonical: "/test/" },
  robots: { index: false, follow: true },
};

export default function LegacyTestPage() {
  return (
    <main>
      <SiteHeader active="/tests/mbti" />
      <MbtiQuiz />
      <SiteFooter />
    </main>
  );
}
