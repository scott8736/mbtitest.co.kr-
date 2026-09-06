/**
 * Cloudflare Worker 런타임 타입 중 이 프로젝트가 실제로 쓰는 부분만 선언합니다.
 * @cloudflare/workers-types 를 새로 설치하지 않으려고 최소한만 두었습니다.
 * 빌드는 Vite/Wrangler 가 하므로 여기 선언은 타입 검사용입니다.
 */

declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}

interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}
