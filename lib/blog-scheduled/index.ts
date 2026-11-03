import type { BlogPost } from "../blog-posts";

/**
 * 예약 글 모음 (2026-11-03~).
 *
 * 넣는 법
 *   1. 주차별 파일을 만든다: lib/blog-scheduled/2026-W45.ts  (ISO 주차, 월요일 시작)
 *        import type { BlogPost } from "../blog-posts";
 *        export const posts: BlogPost[] = [ { ...글 }, { ...글 }, ... ];   // 한 주 28편
 *   2. 아래에 import 한 줄 + 배열에 펼치기 한 줄을 더한다.
 *   3. 글마다 대표 그림을 굽는다: node scripts/make-blog-cards.mjs  (예약 글도 미리 굽는다)
 *   4. npm test 로 확인(tests/blog-schedule.test.mjs 가 형식·중복 slug·그림을 본다) → 커밋·푸시.
 *      미래 글은 푸시해도 보이지 않고, 그 시각 뒤 예약 작업이 다시 빌드할 때 나타난다.
 *
 * 발행 시각 칸 (하루 4편, KST): 아침 07:30 · 점심 12:30 · 저녁 18:30 · 밤 21:30
 *   예약 작업이 각 칸 3분 뒤(:33)에 돌고 Cloudflare 빌드가 1~3분 걸려 실제 노출은 그 뒤다.
 *   다른 시각을 적어도 되지만 다음 칸 작업 때 반영된다.
 *
 * 글 견본 (기존 글과 같은 필드 — 실제 데이터 아님, 복사해서 고쳐 쓴다)
 *
 *   {
 *     slug: "intj-workplace-habits",                 // 영문 소문자-하이픈, 전체 글과 겹치면 안 됨
 *     category: "MBTI 기초",                          // "MBTI 기초" | "연애·관계" | "마음건강" | "트렌드" | "운세"
 *     title: "INTJ가 회의에서 말이 없는 진짜 이유",      // 40자 안쪽
 *     description: "첫 문장에서 답을 끝내는 80자 안쪽 요약.",
 *     keywords: ["INTJ 특징", "INTJ 직장"],
 *     readTime: "약 5분",
 *     publishedAt: "2026-11-04T07:30:00+09:00",      // 예약 시각 — 시각과 +09:00 필수
 *     updatedAt: "2026-11-04",                        // 화면에 「업데이트 2026.11.04」로 나온다
 *     intro: ["첫 문단에서 답을 끝낸다.", "두 번째 문단."],   // 앞 2문단 뒤에 본문 광고
 *     sections: [
 *       { heading: "소제목", paragraphs: ["본문"], bullets: ["선택"] },
 *     ],
 *     cta: { eyebrow: "40문항 · 약 4분", title: "나도 INTJ일까요?", description: "한 줄 설명", href: "/tests/mbti/", label: "무료 MBTI 검사 시작하기" },
 *     relatedSlugs: ["mbti-test-guide"],             // 아직 발행 전인 글을 적으면 그 글이 나올 때까지 빠진다
 *     faq: [{ q: "질문 그대로", a: "답" }],            // 선택
 *     sources: [{ label: "출처 이름", href: "https://..." }],  // 선택
 *   }
 *
 * 미니 테스트 견본 — sections[n].quiz 에 넣으면 그 단락 끝(본문·목록 뒤, 단락 버튼 앞)에 나온다.
 * 형식 정의·채점은 lib/blog-quiz.ts. 아래는 점수형(score). 유형형은 score 대신 result: "결과key"
 * 를 모든 보기에 적고, results 에 min/max 대신 key 를 적는다(가장 많이 고른 key, 동점은 앞 결과).
 *
 *   sections: [
 *     {
 *       heading: "나는 회의에서 얼마나 말을 아낄까",
 *       paragraphs: ["아래 6문항으로 바로 확인해 보세요."],
 *       quiz: {
 *         type: "quiz",
 *         title: "회의 속 내 말수 미니 테스트",
 *         intro: "요즘 회의를 떠올리며 가장 가까운 답을 고르세요.",   // 선택
 *         questions: [                                              // 5~8문항, 보기 2~5개
 *           { q: "회의 안건을 미리 받으면?", options: [
 *             { label: "미리 메모를 다 해 둔다", score: 2 },
 *             { label: "훑어보기만 한다", score: 1 },
 *             { label: "회의 가서 본다", score: 0 },
 *           ] },
 *           // … 5~8문항까지 같은 모양
 *         ],
 *         results: [                                                // 가능한 합계 전부가 정확히 한 칸에
 *           { min: 0, max: 4, title: "바로 말하는 편", body: "2~3문장 결과 풀이." },
 *           { min: 5, max: 8, title: "골라서 말하는 편", body: "…" },
 *           { min: 9, max: 12, title: "정리한 뒤 말하는 편", body: "…" },
 *         ],
 *         cta: { label: "무료 MBTI 검사로 정확히 보기", href: "/tests/mbti/" },  // /tests/ 또는 /check/
 *       },
 *     },
 *   ],
 */

// import { posts as w2026W45 } from "./2026-W45";

export const scheduledPosts: BlogPost[] = [
  // ...w2026W45,
];
