"use client";

import { useMemo, useState } from "react";
import { testCatalog, testCategories, type TestCategory } from "../lib/test-catalog";
import Mascot from "./Mascot";

/**
 * 카드마다 고정된 모리(2026-10-05). 전체 목록 순서대로 16모리를 돌려 이웃한 카드가 겹치지 않게 하고,
 * 필터를 눌러도 같은 테스트에는 같은 모리가 나오게 목록 순서(필터 전)로 정합니다.
 */
const MORI16 = ["ENFP", "ISTJ", "INFJ", "ESTP", "ISFP", "ENTJ", "ESFJ", "INTP", "INFP", "ESTJ", "ENFJ", "ISTP", "ESFP", "INTJ", "ISFJ", "ENTP"];
const moriForSlug = (slug: string) => {
  if (slug === "mbti") return "ENFP";
  const i = testCatalog.findIndex((item) => item.slug === slug);
  return MORI16[(i < 0 ? 0 : i) % MORI16.length];
};

/**
 * 홈의 4칸. 목록 앞 4개를 그대로 쓰면 홈 자체인 MBTI 가 한 칸을 차지해서,
 * 네이버 월간 검색량이 큰 순서로 직접 고릅니다 (검색광고 키워드도구 2026-09-29).
 *   애착유형테스트 38,280 · 아이큐+IQ테스트 18,680 · 에겐테토테스트 7,740 · 직업적성테스트 4,380
 */
const HOME_PICKS = ["adult-attachment", "iq", "egen-teto", "career"];

export default function TestDirectory({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<"전체" | TestCategory>("전체");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    if (compact) {
      return HOME_PICKS.map((slug) => testCatalog.find((item) => item.slug === slug)).filter(
        (item) => item !== undefined,
      );
    }
    const normalized = query.trim().toLowerCase();
    return testCatalog
      .filter((item) => category === "전체" || item.category === category)
      .filter((item) =>
        !normalized ||
        `${item.title} ${item.description} ${item.keywords.join(" ")}`
          .toLowerCase()
          .includes(normalized),
      );
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
              <Mascot type={moriForSlug(item.slug)} size={58} />
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
