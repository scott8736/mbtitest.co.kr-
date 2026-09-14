import Link from "next/link";
import type { GenericResult, GenericTest } from "../lib/generic-tests";
import { testCatalog } from "../lib/test-catalog";
import AdUnit from "./AdUnit";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import Mascot from "./Mascot";

/**
 * 공유용 결과 페이지.
 *
 * /tests/{slug}/result/ 와 다릅니다. 그쪽은 방금 검사한 사람에게만 의미가 있는
 * 개인 화면이라 sessionStorage 를 읽고 noindex 입니다. 이 페이지는 결과마다
 * 주소가 따로 있고, 검사하지 않은 사람이 링크를 받아 열어도 내용이 보입니다.
 *
 * 두 가지를 노립니다.
 *
 * 1. 카카오톡 공유 썸네일. 공유된 주소의 og:image 를 그대로 읽어가므로,
 *    결과마다 주소가 있어야 결과마다 다른 썸네일이 뜹니다. 사이트 로고가
 *    뜨는 썸네일은 아무도 누르지 않습니다.
 * 2. 롱테일 검색. "겉테토 속에겐" 처럼 결과 이름으로 찾는 사람이 있습니다.
 *    검사 페이지 하나로는 그 검색어를 받을 수 없습니다.
 *
 * 서버 컴포넌트입니다. 검사 진행이 없으므로 자바스크립트가 필요 없고,
 * 본문이 HTML 에 그대로 들어가야 색인됩니다.
 */
export default function SharedResult({
  test,
  result,
}: {
  test: GenericTest;
  result: GenericResult;
}) {
  const related = test.related
    .map((slug) => testCatalog.find((item) => item.slug === slug && item.status === "published"))
    .filter(Boolean);

  return (
    <main
      className="generic-test"
      style={{ "--test-accent": result.color } as React.CSSProperties}
    >
      <SiteHeader active="/tests" />

      <section className="rich-result">
        <span className="result-kicker">{test.title} 결과</span>
        <Mascot className="result-mascot" mood="celebrate" size={120} accent={result.color} />
        <div className="result-symbol" style={{ background: result.color }}>
          {result.name.slice(0, 2)}
        </div>
        <h1>{result.name}</h1>
        <p className="rich-tagline">{result.tagline}</p>
        <p className="rich-summary">{result.summary}</p>

        <div className="trait-pills">
          {result.traits.map((trait) => (
            <span key={trait}>{trait}</span>
          ))}
        </div>

        <AdUnit position="resultTop" label={`${test.title} ${result.name} 상단 광고`} />

        <div className="rich-result-grid">
          <article>
            <span>01</span>
            <h2>이런 점이 강점입니다</h2>
            <ul>
              {result.strengths.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article>
            <span>02</span>
            <h2>이런 점은 주의하세요</h2>
            <ul>
              {result.cautions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article className="wide">
            <span>03</span>
            <h2>관계 속의 나</h2>
            <p>{result.relationship}</p>
          </article>
          <article className="wide">
            <span>04</span>
            <h2>일상과 성장</h2>
            <p>{result.dailyLife}</p>
          </article>
        </div>

        <div className="growth-plan">
          <span>나를 위한 작은 실천</span>
          <h2>오늘부터 이렇게 해보세요</h2>
          {result.growth.map((line, i) => (
            <p key={line}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              {line}
            </p>
          ))}
        </div>

        {/* 이 페이지에 온 사람 대부분은 친구 링크를 받고 들어온, 아직 검사하지
            않은 사람입니다. 그래서 결과 설명보다 이 버튼이 더 중요합니다. */}
        <div className="shared-cta">
          <p>
            이 결과는 <b>{test.title}</b>의 {Object.keys(test.results).length}가지 유형 중 하나예요.
            <br />
            나는 어떤 유형인지 {test.questions.length}문항으로 확인해 보세요.
          </p>
          <Link className="primary-button" href={`/tests/${test.slug}/`}>
            나도 테스트하기 <span>→</span>
          </Link>
        </div>

        <AdUnit position="resultBottom" label={`${test.title} ${result.name} 하단 광고`} />

        {related.length > 0 && (
          <div className="screener-related">
            <h2>이런 테스트도 있어요</h2>
            <ul>
              {related.map((item) => (
                <li key={item!.slug}>
                  <Link href={item!.href}>
                    <b>{item!.title}</b>
                    <span>{item!.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="disclaimer">{test.disclaimer}</p>
      </section>

      <SiteFooter />
    </main>
  );
}
