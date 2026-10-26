/**
 * 「내 성향 신문」 원고 풀기 (2026-10-25). 책(report-books.ts)과 같은 방식·같은 키입니다.
 *
 * 원고는 AES-256-GCM 암호문(report/news/*.json, scripts/sync-news.mjs 가 만든다)으로만 저장소에 있고,
 * 해독 키는 D1 app_settings.report_content_key — 결제된 신문 주문을 열 때만 풉니다.
 * 키가 없거나 틀리면 null(손님에게는 「잠시 뒤 다시」).
 */
import { NEWS_SEALED } from "../report/news/index";
import { openSealed } from "./report-books";
import { readSetting } from "./naver";

export function hasNews(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(NEWS_SEALED, type);
}

export function newsTypes(): string[] {
  return Object.keys(NEWS_SEALED);
}

const cache = new Map<string, unknown>();

export async function loadNews(db: D1Database, type: string): Promise<Record<string, unknown> | null> {
  if (!hasNews(type)) return null;
  const key = (await readSetting(db, "report_content_key")).trim();
  if (!key) return null;
  const id = `${key.slice(0, 8)}:news:${type}`;
  try {
    if (!cache.has(id)) cache.set(id, await openSealed(key, NEWS_SEALED[type]));
    return cache.get(id) as Record<string, unknown>;
  } catch {
    return null;
  }
}
