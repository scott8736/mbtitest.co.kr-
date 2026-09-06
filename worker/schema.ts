/**
 * D1 스키마를 요청 시점에 확인합니다.
 *
 * drizzle 마이그레이션은 vinext 빌드 산출물(dist/.openai/drizzle)로 나가는데,
 * 실제 배포는 정적 자산 업로드 경로를 타서 마이그레이션이 적용되지 않습니다.
 * 그래서 테이블이 없으면 여기서 직접 만듭니다. 모두 IF NOT EXISTS 라
 * 이미 마이그레이션이 돌아간 데이터베이스에서도 아무것도 바꾸지 않습니다.
 *
 * 관리자 계정 행은 여기서 만들지 않습니다. 비밀번호 해시를 번들에 넣으면
 * /_worker.js 로 내려받을 수 있게 되기 때문입니다. 행이 없으면 /admin 이
 * 최초 1회 비밀번호 설정 화면을 띄웁니다.
 */

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS admin_session (
     token text PRIMARY KEY NOT NULL,
     expires_at integer NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS admin_session_expires_idx ON admin_session (expires_at)`,
  `CREATE TABLE IF NOT EXISTS admin_user (
     id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     salt text NOT NULL,
     password_hash text NOT NULL,
     updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS page_views (
     id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
     path text NOT NULL,
     referrer text DEFAULT '' NOT NULL,
     source text DEFAULT 'direct' NOT NULL,
     device text DEFAULT 'desktop' NOT NULL,
     country text DEFAULT '' NOT NULL,
     city text DEFAULT '' NOT NULL,
     visitor_hash text NOT NULL,
     day text NOT NULL,
     created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS page_views_day_idx ON page_views (day)`,
  `CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path)`,
  `CREATE INDEX IF NOT EXISTS page_views_source_idx ON page_views (source)`,
  `CREATE TABLE IF NOT EXISTS app_settings (
     key text PRIMARY KEY NOT NULL,
     value text NOT NULL,
     updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
   )`,
];

/** 아이솔레이트가 살아 있는 동안은 한 번만 확인합니다. */
let pending: Promise<void> | null = null;

export function ensureSchema(db: D1Database): Promise<void> {
  if (!pending) {
    pending = db
      .batch(STATEMENTS.map((sql) => db.prepare(sql)))
      .then(() => undefined)
      .catch((error) => {
        // 실패하면 다음 요청에서 다시 시도합니다.
        pending = null;
        throw error;
      });
  }
  return pending;
}
