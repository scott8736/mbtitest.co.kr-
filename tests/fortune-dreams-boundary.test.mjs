import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * lib/fortune-dreams.ts 경계값 테스트.
 *
 * 먼저 밝혀둘 것: 이 파일에는 "부분 일치 검색" 함수가 없습니다. 실제 화면
 * (app/fortune/dream/page.tsx, app/fortune/dream/[slug]/page.tsx) 은 꿈을
 * 카테고리별 목록 또는 슬러그 정확 일치(getDream)로만 찾습니다. 자유 텍스트
 * 검색 UI 는 심리테스트 쪽(components/TestDirectory.tsx, `.includes()` 부분
 * 일치)에만 있고 꿈해몽에는 연결돼 있지 않습니다.
 *
 * 따라서 아래 테스트는 실제로 존재하는 조회 경로인 getDream(slug) 의 경계
 * 입력(빈 문자열/공백/특수문자/매우 긴 문자열/대소문자·띄어쓰기 차이)과,
 * "언젠가 검색을 붙인다면" 바로 걸림돌이 될 사전 데이터 자체의 무결성
 * (키워드 중복, related 슬러그 유효성, 카테고리 값 일치)을 함께 검증합니다.
 */
const { outputFiles } = await build({
  stdin: {
    contents: `export * from "./lib/fortune-dreams";`,
    resolveDir: repoRoot,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);
const { dreamEntries, dreamSlugs, dreamCategories, getDream } = mod;

/* ---------------- getDream: 슬러그 조회 경계 ---------------- */

test("빈 문자열/공백만 있는 슬러그는 undefined 를 반환한다 (크래시하지 않는다)", () => {
  assert.equal(getDream(""), undefined);
  assert.equal(getDream("   "), undefined);
  assert.equal(getDream("\t\n"), undefined);
});

test("특수문자·경로처럼 생긴 슬러그도 크래시 없이 undefined 를 반환한다", () => {
  for (const bad of ["../../etc/passwd", "pig!", "pig?a=1", "pig%20", "<script>", "돼지꿈"]) {
    assert.equal(getDream(bad), undefined, `${bad} 가 조용히 처리되지 않았습니다`);
  }
});

test("매우 긴 문자열을 슬러그로 넘겨도 죽지 않는다", () => {
  const long = "pig".repeat(10000);
  assert.equal(getDream(long), undefined);
});

test("대소문자가 다르면 같은 꿈을 찾지 못한다 (정규화 없음)", () => {
  // 실제 슬러그는 소문자 "pig" 입니다. Next.js 라우트 params 는 URL 그대로
  // 들어오므로 사용자가 대문자 URL을 직접 치면 notFound() 로 빠집니다.
  assert.ok(getDream("pig"));
  assert.equal(getDream("PIG"), undefined);
  assert.equal(getDream("Pig"), undefined);
});

test("앞뒤 공백이 섞인 슬러그는 같은 꿈을 찾지 못한다 (트림 없음)", () => {
  assert.ok(getDream("snake"));
  assert.equal(getDream(" snake"), undefined);
  assert.equal(getDream("snake "), undefined);
  assert.equal(getDream(" snake "), undefined);
});

test("사전에 없는 평범한 단어를 검색하면 undefined 로 조용히 끝난다", () => {
  assert.equal(getDream("고래꿈"), undefined);
  assert.equal(getDream("whale-dream"), undefined);
});

test("존재하는 모든 슬러그는 getDream 으로 정확히 조회된다 (왕복 검증)", () => {
  for (const slug of dreamSlugs) {
    const entry = getDream(slug);
    assert.ok(entry, `${slug} 가 조회되지 않습니다`);
    assert.equal(entry.slug, slug);
  }
});

/* ---------------- 사전 데이터 무결성 (미래 검색 기능의 전제 조건) ---------------- */

test("슬러그가 중복되지 않는다", () => {
  assert.equal(new Set(dreamSlugs).size, dreamSlugs.length);
});

test("모든 항목에 키워드가 최소 하나 이상 있고 빈 문자열이 없다", () => {
  for (const entry of dreamEntries) {
    assert.ok(entry.keywords.length > 0, `${entry.slug} 키워드가 비어 있습니다`);
    for (const kw of entry.keywords) {
      assert.ok(kw.trim().length > 0, `${entry.slug} 에 빈 키워드가 있습니다`);
    }
  }
});

test("서로 다른 꿈이 완전히 같은 키워드 문자열을 공유하지 않는다", () => {
  // 완전히 같은 키워드를 두 항목이 동시에 쓰면, 훗날 "키워드 정확 일치"로
  // 검색을 만들 때 어느 쪽을 보여줄지 모호해집니다. (부분 일치라면 더 심해집니다.)
  const owners = new Map();
  for (const entry of dreamEntries) {
    for (const kw of entry.keywords) {
      const list = owners.get(kw) ?? [];
      list.push(entry.slug);
      owners.set(kw, list);
    }
  }
  const collisions = [...owners.entries()].filter(([, slugs]) => slugs.length > 1);
  assert.deepEqual(collisions, [], `키워드가 여러 항목에 겹칩니다: ${JSON.stringify(collisions)}`);
});

test("related 로 지정한 슬러그는 실제로 존재하고, 자기 자신을 가리키지 않는다", () => {
  const known = new Set(dreamSlugs);
  for (const entry of dreamEntries) {
    for (const slug of entry.related) {
      assert.ok(known.has(slug), `${entry.slug} 의 related ${slug} 가 존재하지 않습니다`);
      assert.notEqual(slug, entry.slug, `${entry.slug} 가 자기 자신을 related 로 가리킵니다`);
    }
  }
});

test("category 값은 dreamCategories 안에 있는 값만 쓴다", () => {
  const known = new Set(dreamCategories);
  for (const entry of dreamEntries) {
    assert.ok(known.has(entry.category), `${entry.slug} 의 category "${entry.category}" 가 목록에 없습니다`);
  }
});

test("모든 카테고리에는 실제로 항목이 하나 이상 있다 (목록 페이지가 빈 섹션을 만들지 않는다)", () => {
  for (const category of dreamCategories) {
    const count = dreamEntries.filter((e) => e.category === category).length;
    assert.ok(count > 0, `${category} 카테고리에 항목이 없습니다`);
  }
});

test("variations 는 비어 있지 않고 situation/meaning 이 모두 채워져 있다", () => {
  for (const entry of dreamEntries) {
    assert.ok(entry.variations.length > 0, `${entry.slug} 상황별 해석이 비어 있습니다`);
    for (const v of entry.variations) {
      assert.ok(v.situation && v.situation.trim().length > 0, `${entry.slug} 에 빈 situation 이 있습니다`);
      assert.ok(v.meaning && v.meaning.trim().length > 0, `${entry.slug} 에 빈 meaning 이 있습니다`);
    }
  }
});

/* ---------------- 부분 일치 검색을 흉내 냈을 때의 false positive 점검 ---------------- */

/**
 * 실제 서비스에는 없지만, 심리테스트 쪽(TestDirectory.tsx)과 같은 방식
 * — `(title+keywords).toLowerCase().includes(query)` — 으로 언젠가
 * 꿈해몽 검색을 만든다면 어떤 일이 생기는지 미리 확인합니다.
 * "예상 못한 다른 꿈이 걸리는" 사례가 이미 데이터 안에 있는지 봅니다.
 */
function naiveSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return dreamEntries.slice();
  return dreamEntries.filter((e) =>
    `${e.title} ${e.keywords.join(" ")}`.toLowerCase().includes(q),
  );
}

test("[설계 참고] 빈 검색어/공백만 있는 검색어는 전체 목록을 반환한다 (아무것도 안 거른다)", () => {
  assert.equal(naiveSearch("").length, dreamEntries.length);
  assert.equal(naiveSearch("   ").length, dreamEntries.length);
});

test("[설계 참고] 한 글자짜리 흔한 검색어는 서로 무관한 여러 꿈에 false positive 로 걸린다", () => {
  // "꿈" 이라는 글자는 거의 모든 keywords 에 들어 있어 사실상 필터 역할을
  // 하지 못합니다. 부분 일치 검색을 붙일 경우 최소 글자 수 제한이 필요합니다.
  const hits = naiveSearch("꿈");
  assert.ok(hits.length > dreamEntries.length / 2, "예상대로 '꿈' 한 글자는 대부분의 항목에 걸립니다");
});

test("[설계 참고] '물' 처럼 다른 단어에 포함되는 검색어는 무관한 꿈을 함께 끌어온다", () => {
  // "물꿈"(water) 을 찾으려 "물" 을 검색하면 "동물", "선물" 같은 단어가
  // keywords 에 없어 지금 당장은 깨끗하지만, 제목 안에 "물"이 들어가는
  // 다른 항목(예: "물고기 꿈")까지 같이 걸리는 것은 실제로 재현됩니다.
  const hits = naiveSearch("물").map((e) => e.slug);
  assert.ok(hits.includes("water"), "정작 찾으려던 water 가 빠지면 안 됩니다");
  assert.ok(hits.includes("fish"), "물고기 꿈도 '물' 부분 일치로 함께 걸립니다 (false positive 성격)");
});

test("[설계 참고] 사전에 없는 단어를 검색하면 빈 배열이지 크래시가 아니다", () => {
  assert.deepEqual(naiveSearch("고래꿈"), []);
  assert.deepEqual(naiveSearch("!!!###"), []);
});

test("[설계 참고] 대소문자·띄어쓰기가 달라도 naiveSearch 는 toLowerCase+trim 덕에 찾는다", () => {
  // getDream 과 달리, TestDirectory 방식의 naiveSearch 는 정규화를 하므로
  // 대소문자·앞뒤 공백 차이에는 강합니다. 참고용 대조 테스트입니다.
  assert.ok(naiveSearch("  돼지꿈  ").some((e) => e.slug === "pig"));
});
