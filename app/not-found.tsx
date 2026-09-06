import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "../components/SiteFooter";

/**
 * 404 화면.
 *
 * 기본 화면은 안내 한 줄뿐이라 들어온 사람이 그대로 나갑니다. 여기서는 갈 만한
 * 곳을 바로 보여줘서 되돌려 보냅니다.
 *
 * 광고는 넣지 않습니다. 읽을 내용이 없는 화면에 광고를 붙이는 것은 애드센스가
 * 금지하는 배치입니다. 공유 버튼은 두되, 깨진 주소가 아니라 사이트 첫 화면을
 * 공유하도록 대상을 지정합니다.
 *
 */

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: true },
};

const destinations = [
  { href: "/tests/mbti/", title: "무료 MBTI 검사", note: "40문항 · 약 4분" },
  { href: "/tests/", title: "심리테스트 전체", note: "성격·연애·마음건강 27종" },
  { href: "/tests/hsp/", title: "HSP 테스트", note: "16문항 · 약 3분" },
  { href: "/types/", title: "16가지 성격유형", note: "유형별 특징 총정리" },
  { href: "/compatibility/", title: "MBTI 궁합", note: "16유형 조합별 관계" },
  { href: "/fortune/today/", title: "오늘의 운세", note: "생년월일로 확인" },
  { href: "/fortune/saju/", title: "무료 사주", note: "타고난 기질 풀이" },
  { href: "/blog/", title: "심리 콘텐츠", note: "읽을거리 모음" },
];

export default function NotFound() {
  return (
    <main className="info-page">
      <header className="simple-header">
        <Link className="logo" href="/"><span className="brain-mark">✦</span><b>MBTI 검사</b></Link>
        <Link href="/tests/">심리테스트 보기</Link>
      </header>

      <article className="info-article">
        <span className="eyebrow">404</span>
        <h1>찾으시는 페이지가<br />여기에 없습니다</h1>
        <p>
          주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래에서 원하시는 곳으로 바로 이동하세요.
        </p>

        <Link className="primary-button" href="/tests/mbti/">
          무료 MBTI 검사 시작 <span>→</span>
        </Link>

        <h2>어디로 가시겠어요?</h2>
        <div className="info-grid not-found-grid">
          {destinations.map((item) => (
            <section key={item.href}>
              <Link href={item.href}>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </Link>
            </section>
          ))}
        </div>

        <div className="notice-box">
          <strong>링크가 깨져 있었나요?</strong>
          <p>
            다른 사이트나 검색 결과에서 넘어오셨다면 <Link href="/contact/">문의하기</Link>로 알려주시면
            확인해서 고치겠습니다.
          </p>
        </div>
      </article>

      <SiteFooter ads={false} shareTitle="MBTI 검사 · 무료 심리테스트" shareUrl="https://mbtitest.co.kr/" />
    </main>
  );
}
