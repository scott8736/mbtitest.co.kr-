import type { GenericTest } from "../lib/generic-tests";
import { testCatalog } from "../lib/test-catalog";

/**
 * 검사 시작 화면 아래에 붙는 안내 본문입니다.
 *
 * 유형별 상세 가이드와 추천 테스트는 이미 있는 results·related 데이터로 만들기 때문에
 * 27개 테스트 전부에 자동으로 붙습니다. 개념 문단·궁합표·FAQ는 테스트별로 쓴 글이 있을 때만
 * 나옵니다(lib/generic-tests.ts 의 GenericTestCopy).
 */
export default function TestGuide({ test }: { test: GenericTest }) {
  const results = Object.values(test.results);
  const related = test.related
    .map((slug) => testCatalog.find((item) => item.slug === slug && item.status === "published"))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const faqSchema = test.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: test.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <div className="test-guide">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <nav className="guide-toc" aria-label="페이지 목차">
        {test.intro?.length ? <a href="#about">{test.introHeading || "테스트 소개"}</a> : null}
        <a href="#types">유형별 상세 가이드</a>
        {test.matchTable?.length ? <a href="#match">유형별 궁합</a> : null}
        {test.faq?.length ? <a href="#faq">자주 묻는 질문</a> : null}
        {related.length > 0 ? <a href="#related">추천 테스트</a> : null}
      </nav>

      {test.intro?.length ? (
        <section id="about" className="guide-section">
          <h2>{test.introHeading || `${test.title} 알아보기`}</h2>
          {test.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ) : null}

      {test.whatYouLearn?.length ? (
        <section className="guide-section">
          <h2>이 테스트로 알 수 있는 것</h2>
          <ul className="guide-list">
            {test.whatYouLearn.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {/* 이 카피가 있으면 위쪽 dimensions 블록이 감춰지므로, 면책 문구를 여기서 이어받습니다. */}
          <p className="guide-disclaimer">{test.disclaimer}</p>
        </section>
      ) : null}

      <section id="types" className="guide-section">
        <h2>유형별 상세 가이드</h2>
        <p className="guide-lead">
          이 테스트는 {results.length}가지 결과로 나뉩니다. 검사를 시작하기 전에 어떤 유형이 있는지 먼저 살펴보세요.
        </p>
        <div className="guide-types">
          {results.map((result) => (
            <article key={result.key} style={{ "--guide-accent": result.color } as React.CSSProperties}>
              <h3>{result.name}</h3>
              <p className="guide-tagline">{result.tagline}</p>
              <p>{result.summary}</p>
              <div className="guide-traits">
                {result.traits.map((trait) => (
                  <span key={trait}>{trait}</span>
                ))}
              </div>
              <h4>강점</h4>
              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4>어려운 점</h4>
              <ul>
                {result.cautions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h4>관계에서는</h4>
              <p>{result.relationship}</p>
              <h4>일상에서는</h4>
              <p>{result.dailyLife}</p>
            </article>
          ))}
        </div>
      </section>

      {test.matchTable?.length ? (
        <section id="match" className="guide-section">
          <h2>유형별 궁합</h2>
          <div className="guide-table-scroll">
            <table className="guide-table">
              <thead>
                <tr>
                  <th>조합</th>
                  <th>궁합 포인트</th>
                </tr>
              </thead>
              <tbody>
                {test.matchTable.map((row) => (
                  <tr key={row.pair}>
                    <th scope="row">{row.pair}</th>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {test.faq?.length ? (
        <section id="faq" className="guide-section">
          <h2>자주 묻는 질문</h2>
          <div className="guide-faq">
            {test.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section id="related" className="guide-section">
          <h2>추천 테스트</h2>
          <div className="guide-related">
            {related.map((item) => (
              <a key={item.slug} href={item.href}>
                <span>{item.category}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.questionCount}문항 · {item.duration}
                </small>
                <i>시작하기 →</i>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
