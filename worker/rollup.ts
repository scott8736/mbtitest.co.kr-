/**
 * 관리자 화면용 하루 집계 (2026-10-04~).
 *
 * 예전 관리자 화면은 쿼리 열아홉 개가 각각 page_views 의 조회 기간 전체를 훑었습니다.
 * 30일을 한 번 열면 약 150만 행을 읽어, 2026-10-04 에 D1 무료 한도(하루 읽기 500만 행)를
 * 넘겨 관리자·통계 기록·홈 트렌드 카드가 다음 날 09:00 까지 멈췄습니다.
 *
 * 지금은 하루치 기록을 **한 번만** 읽어 이 파일에서 집계하고, 지난 날짜는 daily_rollup 에
 * 하루 한 행으로 저장해 둡니다. 지난 날은 바뀌지 않으므로 다시 읽을 일이 없고, 30일 조회는
 * 집계 30행만 읽습니다. 오늘 것만 10분마다 새로 만듭니다.
 *
 * 집계 방식을 바꾸면 ROLLUP_VERSION 을 올리세요. 저장된 옛 집계는 버전이 달라 다시 만들어집니다.
 */

export const ROLLUP_VERSION = 3; // 2: 들어온 페이지별 이탈(landing) 추가 · 3: 국내(KR) 방문자만의 이탈(kr·landingSourceKr) — 지난 날짜도 다시 집계해 기준 기간과 비교합니다
/** 오늘 집계를 다시 만드는 간격 */
export const TODAY_TTL_MS = 10 * 60_000;
/** 한 번 화면을 열 때 새로 만드는 지난 날짜 수. 처음 90일을 채울 때 한 번에 몰아 읽지 않게 합니다 */
export const MAX_BUILDS_PER_LOAD = 7;
/** 하루 집계에 남기는 주소·리퍼러 수. 나머지 꼬리는 버립니다 */
const KEEP_PATHS = 300;
const KEEP_REFERRERS = 100;
const KEEP_LANDINGS = 200;

export type Journey = {
  visitors: number;
  views: number;
  multi: number;
  mbti_done: number;
  mbti_next: number;
  b0: number;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
};

export type Rollup = {
  v: number;
  day: string;
  views: number;
  visitors: number;
  sources: Record<string, number>;
  devices: Record<string, number>;
  paths: Record<string, number>;
  countries: Record<string, number>;
  referrers: Record<string, number>;
  /** slug → 검사 첫 화면·2단계·결과 화면 조회수 */
  steps: Record<string, { intro: number; step2: number; result: number }>;
  /** "이벤트이름|slug" → 건수 */
  events: Record<string, number>;
  journey: Journey;
  /** MBTI 결과 화면에서 바로 이어서 연 페이지 */
  afterMbti: Record<string, number>;
  /**
   * 모리 카드 공유 페이지(/s/<유형>/). 2026-10-04 에 추가해 그 전에 저장된 집계에는 없습니다 —
   * 그 날들은 공유 페이지가 없던 때라 0 으로 읽으면 맞으므로 ROLLUP_VERSION 은 올리지 않았습니다.
   */
  share?: { views: number; visitors: number; toTest: number };
  /** 다른 테스트 결과 공유 페이지(/tests/<slug>/r/<결과>/) → 아무 검사 첫 화면. 2026-10-04 추가, share 와 같은 이유로 버전은 그대로. */
  shareTest?: { views: number; visitors: number; toTest: number };
  /** 하루 첫 조회 주소 → 그 주소로 들어온 사람(n) · 그 한 페이지만 보고 나간 사람(b). 버전 2부터. */
  landing?: Record<string, Bounce>;
  /** 첫 조회의 유입 경로 → n · b. 버전 2부터. */
  landingSource?: Record<string, Bounce>;
  /**
   * 첫 조회 국가가 KR 인 방문자만의 n · b. 버전 3부터(2026-10-06).
   * 해외 접속(10-05 미국 10%, 데이터센터 지역)은 봇이 섞여 1페이지 이탈을 부풀리므로 사람 이탈을 따로 봅니다.
   */
  kr?: Bounce;
  landingSourceKr?: Record<string, Bounce>;
};

export type Bounce = { n: number; b: number };

export type PageRow = {
  path: string;
  referrer: string;
  source: string;
  device: string;
  country: string;
  visitor_hash: string;
  created_at: string;
};

export type EventRow = { slug: string; name: string; count: number };

const emptyJourney = (): Journey => ({ visitors: 0, views: 0, multi: 0, mbti_done: 0, mbti_next: 0, b0: 0, b1: 0, b2: 0, b3: 0, b4: 0 });

const bump = (map: Record<string, number>, key: string, by = 1) => {
  map[key] = (map[key] ?? 0) + by;
};

const top = (map: Record<string, number>, n: number): Record<string, number> =>
  Object.fromEntries(Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n));

/** 검사 첫 화면. /tests/<slug>/ 와 /check/<slug>/ 만, 그 아래(step2·result·공유 r/…)는 아닙니다. */
export const isTestIntro = (path: string) => /^\/(tests|check)\/[^/]+\/$/.test(path);

/** 검사 단계. MBTI 결과 주소는 /mbti-result/ 라 /tests/... 밖에 있어 따로 묶습니다. */
export function stageOf(path: string): { slug: string; stage: "intro" | "step2" | "result" } | null {
  if (path === "/mbti-result/") return { slug: "mbti", stage: "result" };
  const m = path.match(/^\/tests\/([^/]+)\/(?:(step2|result)\/)?$/);
  if (!m) return null;
  return { slug: m[1], stage: (m[2] as "step2" | "result" | undefined) ?? "intro" };
}

/** 모리 카드 공유 페이지 /s/<유형>/ */
export const isSharePage = (path: string) => /^\/s\/[a-z]{4}\/$/.test(path);

/** 다른 테스트 결과 공유 페이지 /tests/<slug>/r/<결과>/ */
export const isTestSharePage = (path: string) => /^\/tests\/[^/]+\/r\/[^/]+\/$/.test(path);

/** D1 의 CURRENT_TIMESTAMP("YYYY-MM-DD HH:MM:SS", UTC) → 밀리초 */
const toMs = (stamp: string) => Date.parse(stamp.replace(" ", "T") + "Z");

/** 하루치 page_views·test_events 를 집계합니다. DB 를 부르지 않는 순수 함수라 테스트로 고정합니다. */
export function buildRollup(day: string, pages: PageRow[], events: EventRow[]): Rollup {
  const r: Rollup = {
    v: ROLLUP_VERSION,
    day,
    views: pages.length,
    visitors: 0,
    sources: {},
    devices: {},
    paths: {},
    countries: {},
    referrers: {},
    steps: {},
    events: {},
    journey: emptyJourney(),
    afterMbti: {},
    share: { views: 0, visitors: 0, toTest: 0 },
    shareTest: { views: 0, visitors: 0, toTest: 0 },
    landing: {},
    landingSource: {},
    kr: { n: 0, b: 0 },
    landingSourceKr: {},
  };

  type Visitor = { views: number; first: number; last: number; tests: Set<string>; tookMbti: boolean; mbtiAt: number; otherAt: number; shareAt: number; mbtiStartAt: number; testShareAt: number; introAt: number; landing: string; landingSource: string; country: string };
  const visitors = new Map<string, Visitor>();

  for (const p of pages) {
    bump(r.sources, p.source);
    bump(r.devices, p.device);
    bump(r.paths, p.path);
    bump(r.countries, p.country || "알 수 없음");
    if (p.referrer && p.source !== "internal") bump(r.referrers, p.referrer);
    if (p.source === "internal" && p.referrer.includes("/mbti-result/") && p.path !== "/mbti-result/") bump(r.afterMbti, p.path);

    const stage = stageOf(p.path);
    if (stage) {
      const row = (r.steps[stage.slug] ??= { intro: 0, step2: 0, result: 0 });
      row[stage.stage] += 1;
    }

    const at = toMs(p.created_at);
    let v = visitors.get(p.visitor_hash);
    if (!v) {
      v = { views: 0, first: at, last: at, tests: new Set(), tookMbti: false, mbtiAt: Infinity, otherAt: -Infinity, shareAt: Infinity, mbtiStartAt: -Infinity, testShareAt: Infinity, introAt: -Infinity, landing: p.path, landingSource: p.source, country: p.country };
      visitors.set(p.visitor_hash, v);
    }
    v.views += 1;
    // 기록 순서가 시간순이라는 보장이 없어 가장 이른 조회를 첫 페이지로 삼습니다.
    if (at < v.first) {
      v.landing = p.path;
      v.landingSource = p.source;
      v.country = p.country;
    }
    v.first = Math.min(v.first, at);
    v.last = Math.max(v.last, at);
    if (isTestIntro(p.path)) {
      v.tests.add(p.path);
      if (p.path !== "/tests/mbti/") v.otherAt = Math.max(v.otherAt, at);
    }
    if (p.path === "/tests/mbti/step2/") v.tookMbti = true;
    if (p.path === "/mbti-result/") v.mbtiAt = Math.min(v.mbtiAt, at);
    if (isSharePage(p.path)) {
      r.share!.views += 1;
      v.shareAt = Math.min(v.shareAt, at);
    }
    if (p.path === "/tests/mbti/") v.mbtiStartAt = Math.max(v.mbtiStartAt, at);
    if (isTestSharePage(p.path)) {
      r.shareTest!.views += 1;
      v.testShareAt = Math.min(v.testShareAt, at);
    }
    if (isTestIntro(p.path)) v.introAt = Math.max(v.introAt, at);
  }

  // 체류·회유. 체류 시간은 첫 조회 ~ 마지막 조회라 마지막 페이지에 머문 시간은 빠집니다.
  // MBTI 완료자는 2단계와 결과를 둘 다 본 사람입니다 — 공유받은 결과 링크만 연 사람을 빼려고요.
  const j = r.journey;
  for (const v of visitors.values()) {
    const span = (v.last - v.first) / 1000;
    j.visitors += 1;
    j.views += v.views;
    if (v.tests.size >= 2) j.multi += 1;
    const done = v.tookMbti && v.mbtiAt !== Infinity;
    if (done) j.mbti_done += 1;
    if (done && v.otherAt > v.mbtiAt) j.mbti_next += 1;
    if (v.shareAt !== Infinity) {
      r.share!.visitors += 1;
      if (v.mbtiStartAt >= v.shareAt) r.share!.toTest += 1;
    }
    if (v.testShareAt !== Infinity) {
      r.shareTest!.visitors += 1;
      if (v.introAt >= v.testShareAt) r.shareTest!.toTest += 1;
    }
    for (const [map, key] of [[r.landing!, v.landing], [r.landingSource!, v.landingSource]] as const) {
      const row = (map[key] ??= { n: 0, b: 0 });
      row.n += 1;
      if (v.views === 1) row.b += 1;
    }
    if (v.country === "KR") {
      for (const row of [r.kr!, (r.landingSourceKr![v.landingSource] ??= { n: 0, b: 0 })]) {
        row.n += 1;
        if (v.views === 1) row.b += 1;
      }
    }
    if (v.views === 1) j.b0 += 1;
    else if (span < 60) j.b1 += 1;
    else if (span < 180) j.b2 += 1;
    else if (span < 600) j.b3 += 1;
    else j.b4 += 1;
  }
  r.visitors = visitors.size;

  for (const e of events) bump(r.events, `${e.name}|${e.slug}`, e.count);

  r.paths = top(r.paths, KEEP_PATHS);
  r.referrers = top(r.referrers, KEEP_REFERRERS);
  r.landing = Object.fromEntries(Object.entries(r.landing!).sort((a, b) => b[1].n - a[1].n).slice(0, KEEP_LANDINGS));
  return r;
}

/** 여러 날의 집계를 더합니다. day 는 범위 표시용으로 비워 둡니다. */
export function mergeRollups(list: Rollup[]): Rollup {
  const m: Rollup = {
    v: ROLLUP_VERSION, day: "", views: 0, visitors: 0, sources: {}, devices: {}, paths: {}, countries: {},
    referrers: {}, steps: {}, events: {}, journey: emptyJourney(), afterMbti: {},
    share: { views: 0, visitors: 0, toTest: 0 },
    shareTest: { views: 0, visitors: 0, toTest: 0 },
    landing: {},
    landingSource: {},
    kr: { n: 0, b: 0 },
    landingSourceKr: {},
  };
  for (const r of list) {
    m.views += r.views;
    m.visitors += r.visitors;
    for (const key of ["sources", "devices", "paths", "countries", "referrers", "events", "afterMbti"] as const) {
      for (const [k, n] of Object.entries(r[key])) bump(m[key], k, n);
    }
    for (const [slug, s] of Object.entries(r.steps)) {
      const row = (m.steps[slug] ??= { intro: 0, step2: 0, result: 0 });
      row.intro += s.intro;
      row.step2 += s.step2;
      row.result += s.result;
    }
    for (const key of Object.keys(m.journey) as (keyof Journey)[]) m.journey[key] += r.journey[key];
    if (r.kr) {
      m.kr!.n += r.kr.n;
      m.kr!.b += r.kr.b;
    }
    for (const key of ["landing", "landingSource", "landingSourceKr"] as const) {
      for (const [k, x] of Object.entries(r[key] ?? {})) {
        const row = (m[key]![k] ??= { n: 0, b: 0 });
        row.n += x.n;
        row.b += x.b;
      }
    }
    for (const key of ["share", "shareTest"] as const) {
      const from = r[key];
      if (!from) continue;
      m[key]!.views += from.views;
      m[key]!.visitors += from.visitors;
      m[key]!.toTest += from.toTest;
    }
  }
  return m;
}

/** 서울 날짜 day 가 끝나는 순간(다음 날 00:00 KST = 그날 15:00 UTC) + 기록이 늦게 들어오는 여유 1분 */
export const dayEndMs = (day: string) => Date.parse(day + "T15:00:00Z") + 60_000;

/** 범위 안의 날짜들 (YYYY-MM-DD, 오름차순) */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(from + "T00:00:00Z"); t <= Date.parse(to + "T00:00:00Z"); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

async function buildDay(db: D1Database, day: string): Promise<Rollup> {
  const [pages, events] = await Promise.all([
    db
      .prepare(`SELECT path, referrer, source, device, country, visitor_hash, created_at FROM page_views WHERE day = ?`)
      .bind(day)
      .all<PageRow>(),
    db
      .prepare(`SELECT slug, name, COUNT(*) AS count FROM test_events WHERE day = ? GROUP BY slug, name`)
      .bind(day)
      .all<EventRow>(),
  ]);
  return buildRollup(day, pages.results ?? [], events.results ?? []);
}

/**
 * 범위의 하루 집계를 돌려줍니다. 저장된 것은 그대로 쓰고, 없는 지난 날짜는 한 번에
 * MAX_BUILDS_PER_LOAD 개까지만 새로 만들어 저장합니다(최근 날짜부터). 못 만든 날 수는
 * pending 으로 돌려줘 화면이 "새로고침하면 이어서 채운다"고 알리게 합니다.
 */
export async function loadRollups(
  db: D1Database,
  from: string,
  to: string,
  today: string,
  now = Date.now(),
): Promise<{ days: Rollup[]; pending: number }> {
  const stored = (
    await db.prepare(`SELECT day, data, built_at FROM daily_rollup WHERE day BETWEEN ? AND ?`).bind(from, to).all<{ day: string; data: string; built_at: number }>()
  ).results ?? [];
  const byDay = new Map<string, Rollup>();
  for (const row of stored) {
    try {
      const parsed = JSON.parse(row.data) as Rollup;
      if (parsed.v !== ROLLUP_VERSION) continue;
      if (row.day === today && now - row.built_at > TODAY_TTL_MS) continue;
      // 그날이 끝나기 전에 만든 집계(「오늘」로 저장된 중간본)는 날이 지나면 한 번 다시 만듭니다.
      // 2026-10-06 발견: 이 줄이 없어 10-05 가 저녁 중간본(방문자 939, 실제 1,377)으로 굳어 있었습니다.
      if (row.day !== today && row.built_at < dayEndMs(row.day)) continue;
      byDay.set(row.day, parsed);
    } catch {
      // 깨진 행은 다시 만듭니다.
    }
  }

  const missing = daysBetween(from, to).filter((day) => day <= today && !byDay.has(day)).reverse();
  const toBuild = missing.slice(0, MAX_BUILDS_PER_LOAD);
  for (const day of toBuild) {
    const rollup = await buildDay(db, day);
    byDay.set(day, rollup);
    await db
      .prepare(
        `INSERT INTO daily_rollup (day, data, built_at) VALUES (?, ?, ?)
         ON CONFLICT(day) DO UPDATE SET data = excluded.data, built_at = excluded.built_at`,
      )
      .bind(day, JSON.stringify(rollup), now)
      .run();
  }

  const days = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  return { days, pending: missing.length - toBuild.length };
}
