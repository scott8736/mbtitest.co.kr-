import type { Metadata } from "next";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import FortuneTool from "../../../../components/FortuneTool";
import styles from "../../../../lib/fortune.module.css";
import SiteFooter from "../../../../components/SiteFooter";

// 입력값에 따라 달라지는 개인 화면이라 색인하지 않습니다.
// 검색 유입은 /fortune/today/ 이 받습니다.
export const metadata: Metadata = {
  title: "오늘의 운세 결과",
  description: "입력하신 생년월일로 계산한 오늘의 운세 결과입니다.",
  alternates: { canonical: "/fortune/today/result/" },
  robots: { index: false, follow: true },
};

export default function FortuneResultPage() {
  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/today/">오늘의 운세</a> / 결과
        </div>
        <span className={styles.eyebrow}>무료 · 가입 없음</span>
        <h1>오늘의 운세 결과</h1>
      </header>
      <AdUnit position="articleTop" label="오늘의 운세 결과 상단 광고" />
      <FortuneTool mode="today" resultOnly />
      <SiteFooter />
    </main>
  );
}
