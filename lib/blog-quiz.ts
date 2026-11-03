/**
 * 블로그 글 속 「미니 테스트」 블록 (2026-11-03~). 화면은 components/BlogQuiz.tsx.
 *
 * 채점 방식은 둘 중 하나만 고른다(한 블록 안에서 섞지 않는다).
 *   - 점수형: 모든 보기에 score(숫자). 합계가 results 의 min~max(둘 다 포함)에 드는 결과.
 *             가능한 모든 합계가 정확히 한 결과에 들어가야 한다(validateQuiz 가 검사).
 *   - 유형형: 모든 보기에 result(결과 key). 가장 많이 고른 key 의 결과.
 *             동점이면 results 배열에서 앞에 있는 결과.
 */

export type BlogQuizOption = { label: string; score?: number; result?: string };
export type BlogQuizQuestion = { q: string; options: BlogQuizOption[] };
export type BlogQuizResult = { key?: string; min?: number; max?: number; title: string; body: string };

export type BlogQuiz = {
  type: "quiz";
  title: string;
  /** 제목 아래 한 줄 안내(선택). */
  intro?: string;
  questions: BlogQuizQuestion[];
  results: BlogQuizResult[];
  /** 결과 아래 정식 검사로 가는 버튼. href 는 /tests/ 또는 /check/ 로 시작. */
  cta: { label: string; href: string };
};

export function quizMode(quiz: BlogQuiz): "score" | "result" {
  return quiz.questions[0]?.options[0]?.result !== undefined ? "result" : "score";
}

/** answers[i] = i번 문항에서 고른 보기 번호. 하나라도 비면 undefined. */
export function quizResult(quiz: BlogQuiz, answers: (number | undefined)[]): BlogQuizResult | undefined {
  const picked = quiz.questions.map((q, i) => (answers[i] === undefined ? undefined : q.options[answers[i] as number]));
  if (picked.some((o) => !o)) return undefined;
  if (quizMode(quiz) === "score") {
    const sum = picked.reduce((acc, o) => acc + (o?.score ?? 0), 0);
    return quiz.results.find((r) => (r.min ?? -Infinity) <= sum && sum <= (r.max ?? Infinity));
  }
  const counts = new Map<string, number>();
  for (const o of picked) counts.set(o!.result!, (counts.get(o!.result!) ?? 0) + 1);
  let best: BlogQuizResult | undefined;
  let bestN = 0;
  for (const r of quiz.results) {
    const n = counts.get(r.key ?? "") ?? 0;
    if (n > bestN) {
      best = r;
      bestN = n;
    }
  }
  return best;
}

/** 형식 오류 목록. 빈 배열이면 통과. tests/blog-schedule.test.mjs 가 모든 글의 블록에 돌린다. */
export function validateQuiz(quiz: BlogQuiz): string[] {
  const errors: string[] = [];
  if (quiz.type !== "quiz") errors.push('type 은 "quiz"');
  if (!quiz.title?.trim()) errors.push("title 비어 있음");
  if (quiz.questions.length < 5 || quiz.questions.length > 8) errors.push(`문항 ${quiz.questions.length}개 — 5~8개`);
  if (!quiz.results.length) errors.push("results 없음");
  if (!/^\/(tests|check)\//.test(quiz.cta?.href ?? "")) errors.push(`cta.href 는 /tests/ 또는 /check/ 로 시작: ${quiz.cta?.href}`);
  if (!quiz.cta?.label?.trim()) errors.push("cta.label 비어 있음");
  const mode = quizMode(quiz);
  quiz.questions.forEach((q, i) => {
    if (!q.q?.trim()) errors.push(`${i + 1}번 문항 q 비어 있음`);
    if (q.options.length < 2 || q.options.length > 5) errors.push(`${i + 1}번 문항 보기 ${q.options.length}개 — 2~5개`);
    for (const o of q.options) {
      if (!o.label?.trim()) errors.push(`${i + 1}번 문항에 빈 보기`);
      if (mode === "score" && (typeof o.score !== "number" || o.result !== undefined))
        errors.push(`${i + 1}번 「${o.label}」: 점수형은 score 만`);
      if (mode === "result" && (typeof o.result !== "string" || o.score !== undefined))
        errors.push(`${i + 1}번 「${o.label}」: 유형형은 result 만`);
    }
  });
  for (const r of quiz.results) if (!r.title?.trim() || !r.body?.trim()) errors.push("결과 title/body 비어 있음");
  if (mode === "result") {
    const keys = new Set(quiz.results.map((r) => r.key));
    for (const q of quiz.questions)
      for (const o of q.options) if (o.result && !keys.has(o.result)) errors.push(`results 에 없는 key: ${o.result}`);
  } else if (!errors.length) {
    // 가능한 모든 합계가 정확히 한 결과에 들어가는지.
    let sums = new Set([0]);
    for (const q of quiz.questions) {
      const next = new Set<number>();
      for (const s of sums) for (const o of q.options) next.add(s + (o.score as number));
      sums = next;
    }
    for (const s of sums) {
      const n = quiz.results.filter((r) => (r.min ?? -Infinity) <= s && s <= (r.max ?? Infinity)).length;
      if (n !== 1) errors.push(`합계 ${s}점이 결과 ${n}개에 걸림 — min/max 를 겹치지도 비지도 않게`);
    }
  }
  return errors;
}
