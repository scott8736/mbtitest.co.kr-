import type { Metadata } from "next";
import AdUnit from "../../../../components/AdUnit";
import ContentHeader from "../../../../components/ContentHeader";
import SiteFooter from "../../../../components/SiteFooter";
import CoupleFortuneTool from "../../../../components/CoupleFortuneTool";
import styles from "../../../../lib/fortune.module.css";

// 두 사람 생년월일로 계산한 개인 결과 화면이라 색인하지 않습니다. 검색 유입은 /fortune/gunghap/ 가 받습니다.
export const metadata: Metadata = {
  title: "사주 궁합 결과",
  description: "두 사람의 궁합 점수와 일간·띠 관계, 서로 채워 주는 기운을 확인하세요.",
  alternates: { canonical: "/fortune/gunghap/result/" },
  robots: { index: false, follow: true },
};

export default function GunghapResultPage() {
  return (
    <main className={styles.page}>
      <ContentHeader active="/fortune" />
      <header className={styles.hero}>
        <div className={styles.crumbs}>
          <a href="/">MBTI 검사</a> / <a href="/fortune/">무료 운세</a> / <a href="/fortune/gunghap/">사주 궁합</a> / 결과
        </div>
        <span className={styles.eyebrow}>사주 궁합 · 결과</span>
        <h1>두 사람의 궁합 결과</h1>
      </header>
      <article className={styles.body}>
        <AdUnit position="resultTop" label="궁합 결과 상단 광고" />
        <CoupleFortuneTool resultOnly />
        <AdUnit position="resultBottom" label="궁합 결과 하단 광고" />
      </article>
      <SiteFooter />
    </main>
  );
}
