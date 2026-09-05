import CoupangPartners from "./CoupangPartners";

export default function SiteFooter() {
  return (
    <>
      <CoupangPartners />
      <footer className="site-footer">
        <div>
          <strong>MBTI 검사</strong>
          <p>무료 성격·연애·마음건강 테스트</p>
        </div>
        <nav aria-label="사이트 안내">
          <a href="/tests/mbti/">MBTI 검사</a>
          <a href="/tests/">심리테스트</a>
          <a href="/types/">16가지 유형</a>
          <a href="/compatibility/">MBTI 궁합</a>
          <a href="/fortune/">무료 운세</a>
          <a href="/fortune/today/">오늘의 운세</a>
          <a href="/fortune/saju/">무료 사주</a>
          <a href="/fortune/zodiac/">띠별 운세</a>
          <a href="/fortune/dream/">꿈해몽</a>
          <a href="/blog/">MBTI 콘텐츠</a>
          <a href="/about/">사이트 소개</a>
          <a href="/contact/">문의하기</a>
          <a href="/privacy/">개인정보처리방침</a>
        </nav>
        <p className="partners-disclosure">
          파트너스 활동의 일환으로, 수수료 제공받음
        </p>
      </footer>
    </>
  );
}
