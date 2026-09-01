import MbtiHome from "../components/MbtiHome";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MBTI 검사",
    alternateName: ["엠비티아이 검사", "성격테스트"],
    url: "https://mbtitest.co.kr/",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    inLanguage: "ko-KR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    description: "40개 질문으로 16가지 성격유형을 알아보는 무료 MBTI 검사",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader active="/" />
      <MbtiHome />
      <SiteFooter />
    </main>
  );
}
