import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 접속 로그. 요청마다 한 행씩 쌓입니다.
 *
 * IP 원본은 저장하지 않습니다. visitorHash 는 IP·UA 에 날짜별 솔트를 섞은
 * 해시라서 하루가 지나면 같은 사람도 값이 바뀝니다. 그래서 하루 안의
 * 순방문자 집계는 되지만 개인을 계속 추적할 수는 없습니다.
 */
export const pageViews = sqliteTable(
  "page_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    path: text("path").notNull(),
    referrer: text("referrer").notNull().default(""),
    /** google · naver · daum · instagram · direct 처럼 묶어둔 값 */
    source: text("source").notNull().default("direct"),
    device: text("device").notNull().default("desktop"),
    country: text("country").notNull().default(""),
    city: text("city").notNull().default(""),
    visitorHash: text("visitor_hash").notNull(),
    /** YYYY-MM-DD (KST). 일자별 집계를 인덱스로 빠르게 하려고 따로 둡니다 */
    day: text("day").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("page_views_day_idx").on(t.day),
    index("page_views_path_idx").on(t.path),
    index("page_views_source_idx").on(t.source),
  ],
);

/** 관리자 계정. 한 행만 씁니다. 비밀번호는 PBKDF2 해시로만 보관합니다. */
export const adminUser = sqliteTable("admin_user", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  salt: text("salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/** 로그인 세션. 쿠키에는 이 토큰만 담습니다. */
export const adminSession = sqliteTable(
  "admin_session",
  {
    token: text("token").primaryKey(),
    expiresAt: integer("expires_at").notNull(),
  },
  (t) => [index("admin_session_expires_idx").on(t.expiresAt)],
);

/**
 * 검사 도중에 일어난 일을 남깁니다. 지금은 "첫 문항에 답했다" 하나뿐입니다.
 *
 * page_views 로는 들어오자마자 나간 사람과 몇 문항 풀고 그만둔 사람이
 * 구분되지 않습니다. 그 둘은 고쳐야 할 곳이 정반대라 따로 세어야 합니다.
 * 방문자 식별값은 남기지 않습니다. 세는 것 말고는 쓸 일이 없습니다.
 */
export const testEvents = sqliteTable(
  "test_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    /** 지금은 'answered' 만 씁니다 */
    name: text("name").notNull(),
    /** YYYY-MM-DD (KST) */
    day: text("day").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("test_events_day_idx").on(t.day), index("test_events_slug_idx").on(t.slug)],
);

/**
 * 외부 API 키 같은 설정값. 저장소에 남기지 않으려고 D1 에 둡니다.
 * 값은 암호화하지 않으므로, 데이터베이스에 접근할 수 있는 사람은 볼 수 있습니다.
 */
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
