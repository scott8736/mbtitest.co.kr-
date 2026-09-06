import type { Metadata } from "next";
import CrossPromo from "../../../../components/CrossPromo";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import FortuneTool from "../../../../components/FortuneTool";
import styles from "../../../../lib/fortune.module.css";
import SiteFooter from "../../../../components/SiteFooter";

// 입력값에 따라 달라지는 개인 화면이라 색인하지 않습니다.
// 검색 유입은 /fortune/saju/ 이 받습니다.
export const metadata: Metadata = {
  title: "무료 사주 풀이 결과",
  description: "입력하신 생년월일로 계산한 사주 풀이 결과입니다.",
  alternates: { canonical: "/fortune/saju/result/" },
  robots: { index: false, follow: true },
};

export default function FortuneResultPage() {
  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/saju/">무료 사주</a> / 결과
        </div>
        <span className={styles.eyebrow}>무료 · 가입 없음</span>
        <h1>무료 사주 결과</h1>
      </header>
      <AdUnit position="articleTop" label="무료 사주 결과 상단 광고" />
      <FortuneTool mode="saju" resultOnly />
      <CrossPromo variant="tests" title="사주를 봤다면" />
      <SiteFooter />
    </main>
  );
}
