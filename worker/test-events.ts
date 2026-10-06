/**
 * 검사 진행 이벤트. worker/index.ts(로컬 개발)와 worker/pages-entry.ts(실제 배포)
 * 양쪽에서 부르므로 여기 하나로 둡니다. 예전에 페이지뷰 기록을 index.ts 에만
 * 넣었다가 라이브(pages-entry.ts)에는 없어서 안 쌓인 적이 있어, 같은 일이
 * 반복되지 않도록 공유 모듈로 뺐습니다.
 *
 * 저장하는 것: 첫 문항에 답했다는 사실과 검사를 끝냈다는 사실, slug, 날짜.
 * 응답 내용은 보내지 않습니다.
 */
import { testCatalog } from "../lib/test-catalog";
import { SAJULAB_PLACEMENT_KEYS } from "../lib/sajulab";
import { RESULT_CLICK_PLACEMENT_KEYS } from "../lib/result-clicks";
import { SHARE_CHANNEL_KEYS } from "../lib/mori";
import { isBot, RETENTION_DAYS, seoulDay } from "../lib/analytics";
import { ensureSchema } from "./schema";

interface EventEnv {
  DB?: D1Database;
}

interface EventCtx {
  waitUntil(promise: Promise<unknown>): void;
}

/** 카탈로그에 있는 slug 만 받습니다. 아무 값이나 들어오면 표가 쓰레기가 됩니다. */
const KNOWN_SLUGS = new Set(testCatalog.map((item) => item.slug));

/** 받는 이벤트 이름. 여기 없는 이름은 버립니다. */
const KNOWN_NAMES = new Set([
  "visited",
  "answered",
  "step2",
  "completed",
  "pick_click",
  "report_seen",
  "report_click",
  "report_peek",
  "report_follow",
  "saju_seen",
  "saju_click",
  "result_click",
  "share_click",
  "mbti_type",
  "mbti_tie",
]);

const MBTI_TYPE_SLUGS = new Set(["istj", "isfj", "infj", "intj", "istp", "isfp", "infp", "intp", "estp", "esfp", "enfp", "entp", "estj", "esfj", "enfj", "entj"]);
const MBTI_TIE_SLUGS = new Set(["ei", "sn", "tf", "jp"]);

/** 사주랩 배너는 테스트가 아니라 배너 자리로 셉니다. 자리 목록 밖의 값은 버립니다. */
const SAJULAB_SLUGS = new Set<string>(SAJULAB_PLACEMENT_KEYS);

/** 결과 화면 링크 묶음도 테스트가 아니라 묶음 이름으로 셉니다. */
const RESULT_CLICK_SLUGS = new Set<string>(RESULT_CLICK_PLACEMENT_KEYS);

/** 모리 카드 공유도 공유 수단 이름으로 셉니다. */
const SHARE_SLUGS = new Set<string>(SHARE_CHANNEL_KEYS);

export function isKnownEvent(slug: string, name: string): boolean {
  if (!KNOWN_NAMES.has(name)) return false;
  if (name.startsWith("saju_")) return SAJULAB_SLUGS.has(slug);
  if (name === "result_click") return RESULT_CLICK_SLUGS.has(slug);
  if (name === "share_click") return SHARE_SLUGS.has(slug);
  if (name === "mbti_type") return MBTI_TYPE_SLUGS.has(slug);
  if (name === "mbti_tie") return MBTI_TIE_SLUGS.has(slug);
  return KNOWN_SLUGS.has(slug);
}

/**
 * `/api/event` POST 요청이면 처리하고 204 를 돌려줍니다. 아니면 null 이라
 * 호출한 쪽이 이어서 다른 라우팅을 계속합니다.
 */
export function handleTestEvent(request: Request, url: URL, env: EventEnv, ctx: EventCtx): Response | null {
  if (url.pathname !== "/api/event" || request.method !== "POST") return null;
  ctx.waitUntil(recordTestEvent(request, url, env));
  // 브라우저는 응답을 기다리지 않습니다. 기록보다 먼저 돌려줍니다.
  return new Response(null, { status: 204 });
}

async function recordTestEvent(request: Request, url: URL, env: EventEnv): Promise<void> {
  try {
    if (!env?.DB) return;
    if (isBot(request.headers.get("user-agent") ?? "")) return;

    const slug = url.searchParams.get("slug") ?? "";
    const name = url.searchParams.get("name") ?? "";
    if (!isKnownEvent(slug, name)) return;

    await ensureSchema(env.DB);
    await env.DB.prepare("INSERT INTO test_events (slug, name, day) VALUES (?, ?, ?)")
      .bind(slug, name, seoulDay())
      .run();

    // page_views 와 같은 기간만 남깁니다.
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
      await env.DB.prepare("DELETE FROM test_events WHERE day < ?").bind(seoulDay(cutoff)).run();
    }
  } catch {
    // 통계 기록 실패가 사이트를 멈추게 하면 안 됩니다.
  }
}
