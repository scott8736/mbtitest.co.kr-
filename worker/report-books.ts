/**
 * 리포트 원고 풀기 (2026-10-04).
 *
 * 저장소가 공개(GitHub PUBLIC)라 원고는 AES-256-GCM 암호문(report/content/*.json)으로만 들어 있습니다.
 * 해독 키는 관리자 화면에서 넣어 D1 app_settings.report_content_key 에 두고, 결제된 주문을 열 때만 풉니다.
 * 키가 없거나 틀리면 원고를 주지 않습니다(null) — 손님에게는 「준비 중」으로 보입니다.
 */
import { REPORT_SAJU_SEALED, REPORT_SEALED, type Sealed } from "../report/content/index";
import { readSetting } from "./naver";

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function openSealed(keyB64: string, sealed: Sealed): Promise<unknown> {
  const key = await crypto.subtle.importKey("raw", b64(keyB64), "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(sealed.iv) }, key, b64(sealed.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

export function hasBook(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(REPORT_SEALED, type);
}

export function bookTypes(): string[] {
  return Object.keys(REPORT_SEALED);
}

/** 아이솔레이트 안에서 푼 원고를 기억합니다. 키가 바뀌면 다시 풉니다. */
const cache = new Map<string, unknown>();

export async function loadBook(db: D1Database, type: string): Promise<Record<string, unknown> | null> {
  if (!hasBook(type)) return null;
  const key = (await readSetting(db, "report_content_key")).trim();
  if (!key) return null;
  const id = `${key.slice(0, 8)}:${type}`;
  try {
    if (!cache.has(id)) cache.set(id, await openSealed(key, REPORT_SEALED[type]));
    const saId = `${key.slice(0, 8)}:saju`;
    if (!cache.has(saId)) cache.set(saId, await openSealed(key, REPORT_SAJU_SEALED));
    return { ...(cache.get(id) as Record<string, unknown>), saju: cache.get(saId) };
  } catch {
    return null;
  }
}

/** 관리자 화면에서 키가 맞는지 확인할 때 씁니다. */
export async function keyWorks(keyB64: string): Promise<boolean> {
  try {
    await openSealed(keyB64, REPORT_SAJU_SEALED);
    return true;
  } catch {
    return false;
  }
}
