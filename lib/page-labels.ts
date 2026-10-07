/**
 * 관리자 화면용 한글 이름 (2026-10-08 사용자 요청: 「관리자페이지 맨앞에 한글 메뉴명」).
 * 주소(/tests/egen-teto/step2/)나 검사 slug(egen-teto)만 보면 무슨 페이지인지 알기 어려워서, 표 맨 앞에 붙일 이름을 만듭니다.
 * 이름은 각 목록의 정본(테스트 카탈로그·자가진단·타로·운세·블로그)에서 가져옵니다 — 여기 따로 적지 않습니다.
 */
import { testCatalog } from "./test-catalog";
import { screeners } from "./screeners";
import { tarotFortunes } from "./tarot";
import { fortuneEntries } from "./fortune-catalog";
import { getBlogPost } from "./blog-posts";

/** 주소 하나로 정해지는 페이지 */
const FIXED: Record<string, string> = {
  "/": "홈",
  "/tests/": "심리테스트 목록",
  "/mbti-result/": "MBTI 결과",
  "/report/": "유료 리포트",
  "/report/done/": "유료 리포트 · 결제 완료",
  "/report/find/": "유료 리포트 · 다시 찾기",
  "/mori/": "16모리 마음숲",
  "/mori/forest/": "모리 게임",
  "/mori/forest/f/": "모리 게임 · 우리 숲 초대",
  "/check/": "자가진단 목록",
  "/tarot/": "오늘의 타로",
  "/types/": "16가지 유형",
  "/compatibility/": "MBTI 궁합",
  "/fortune/": "무료 운세",
  "/blog/": "심리 콘텐츠",
  "/about/": "사이트 소개",
  "/contact/": "문의하기",
  "/privacy/": "개인정보처리방침",
  "/refund/": "환불 안내",
  "/test/": "검사 시작(옛 주소)",
};

const shortOf = (title: string) => title.replace(/ — .*$/, "").replace(/\s*\|.*$/, "");

/** 검사 slug → 한글 이름. 모르는 값은 undefined */
export function testLabel(slug: string): string | undefined {
  const s = slug.toLowerCase();
  const t = testCatalog.find((x) => x.slug === s);
  if (t) return t.shortTitle;
  const sc = screeners.find((x) => x.slug === s);
  if (sc) return sc.title;
  const ta = tarotFortunes.find((x) => x.slug === s);
  if (ta) return shortOf(ta.title);
  const fo = fortuneEntries.find((x) => x.href.replace(/\/+$/, "").split("/").pop() === s);
  if (fo) return fo.shortTitle ?? fo.title;
  return undefined;
}

const STEP: Record<string, string> = { step2: "2단계", result: "결과", r: "공유 결과" };

/** 주소 → 한글 이름. 모르는 주소는 undefined(표에는 주소만 나갑니다) */
export function pageLabel(path: string): string | undefined {
  const p = (path.split("?")[0] || "/").replace(/\/*$/, "/");
  if (FIXED[p]) return FIXED[p];
  const seg = p.split("/").filter(Boolean);
  const [a, b, c] = seg;
  if (a === "tests" && b) {
    const name = testLabel(b) ?? b;
    return c ? `${name} · ${STEP[c] ?? c}` : name;
  }
  if (a === "check" && b) return screeners.find((x) => x.slug === b)?.title ?? `자가진단 · ${b}`;
  if (a === "tarot" && b) {
    const t = tarotFortunes.find((x) => x.slug === b);
    return t ? shortOf(t.title) : `타로 · ${b}`;
  }
  if (a === "types" && b) return `${b.toUpperCase()} 유형`;
  if (a === "compatibility" && b) return `${b.toUpperCase()} 궁합`;
  if (a === "s" && b) return `공유 카드 · ${b.toUpperCase()}`;
  if (a === "fortune" && b) {
    const f = fortuneEntries.find((x) => x.href === `/fortune/${b}/`);
    const base = f ? (f.shortTitle ?? f.title) : `운세 · ${b}`;
    return c ? `${base} · ${STEP[c] ?? c}` : base;
  }
  if (a === "blog" && b) {
    const post = getBlogPost(b);
    return post ? `글 · ${post.title}` : "글";
  }
  if (a === "report") return `유료 리포트 · ${seg.slice(1).join("/")}`;
  if (a === "admin") return "관리자";
  return undefined;
}
