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
