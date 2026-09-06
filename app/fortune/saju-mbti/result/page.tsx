import type { Metadata } from "next";
import CrossPromo from "../../../../components/CrossPromo";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import FortuneTool from "../../../../components/FortuneTool";
import styles from "../../../../lib/fortune.module.css";
import SiteFooter from "../../../../components/SiteFooter";

// 입력값에 따라 달라지는 개인 화면이라 색인하지 않습니다.
// 검색 유입은 /fortune/saju-mbti/ 이 받습니다.
export const metadata: Metadata = {
  title: "사주 MBTI 비교 결과",
  description: "사주와 MBTI를 함께 비교한 결과입니다.",
  alternates: { canonical: "/fortune/saju-mbti/result/" },
  robots: { index: false, follow: true },
};

export default function FortuneResultPage() {
  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/saju-mbti/">사주 MBTI</a> / 결과
        </div>
        <span className={styles.eyebrow}>무료 · 가입 없음</span>
        <h1>사주 MBTI 결과</h1>
      </header>
      <AdUnit position="articleTop" label="사주 MBTI 결과 상단 광고" />
      <FortuneTool mode="saju-mbti" resultOnly />
      <CrossPromo variant="tests" title="사주 MBTI를 봤다면" />
      <SiteFooter />
    </main>
  );
}
