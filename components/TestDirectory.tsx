"use client";

import { useMemo, useState } from "react";
import { testCatalog, testCategories, type TestCategory } from "../lib/test-catalog";
import Mascot, { moodForQuestion } from "./Mascot";

/**
 * 슬러그로 표정을 정합니다.
 *
 * 목록에서 카드마다 다른 얼굴이 나와야 하고, 다시 그려도 같은 얼굴이
 * 나와야 합니다. 무작위로 고르면 필터를 누를 때마다 얼굴이 바뀌어
 * 목록이 흔들립니다.
 */
function moodForSlug(slug: string) {
  let sum = 0;
  for (let i = 0; i < slug.length; i += 1) sum += slug.charCodeAt(i);
  return moodForQuestion(sum);
}

export default function TestDirectory({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<"전체" | TestCategory>("전체");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return testCatalog
      .filter((item) => category === "전체" || item.category === category)
      .filter((item) =>
        !normalized ||
        `${item.title} ${item.description} ${item.keywords.join(" ")}`
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, compact ? 4 : undefined);
  }, [category, query, compact]);

  return (
    <div className={`test-directory ${compact ? "is-compact" : ""}`}>
      {!compact && (
        <div className="directory-tools">
          <label>
            <span className="sr-only">심리테스트 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="테스트 이름을 검색하세요"
              type="search"
            />
          </label>
          <div className="category-tabs" aria-label="테스트 카테고리">
            {testCategories.map((item) => (
              <button
                key={item}
                className={category === item ? "active" : ""}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="catalog-grid">
        {items.map((item) => (
          <article className={`catalog-card ${item.status}`} key={item.slug}>
            {/* 색 네모에 글리프 한 글자였습니다. 44장이 전부 같은 모양이라
                목록이 색깔 사각형의 나열로 보였습니다. 마스코트는 테스트 색을
                따라가므로 카드마다 다른 그림이 됩니다. */}
            <div className="catalog-icon" style={{ "--test-accent": item.color } as React.CSSProperties}>
              <Mascot mood={moodForSlug(item.slug)} size={58} accent={item.color} />
            </div>
            <div className="catalog-badges">
              <span>{item.category}</span>
              {item.status === "planned" && <em>준비 중</em>}
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="catalog-meta">
              <span>{item.questionCount}문항</span>
              <span>{item.duration}</span>
            </div>
            {item.status === "published" ? (
              <a href={item.href}>검사 시작하기 <span>→</span></a>
            ) : (
              <span className="planned-label" aria-label={`${item.title} 준비 중`}>
                콘텐츠 준비 중
              </span>
            )}
          </article>
        ))}
      </div>
      {items.length === 0 && <p className="empty-catalog">검색 조건에 맞는 테스트가 없습니다.</p>}
    </div>
  );
}
