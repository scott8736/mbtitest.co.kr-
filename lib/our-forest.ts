/**
 * 「우리 숲」 브라우저 쪽 공용 (2026-10-07). 서버는 worker/forest.ts.
 * 이 기기 식별값(서버에는 해시만 감), 내 숲 id, 들어간 숲 목록은 localStorage 에만 둡니다.
 */
import { MORI_PAIRS } from "./mori-world";

export type ForestView = { id: string; owner: { type: string; nickname: string }; members: { type: string; nickname: string; via: string }[] };

const DEVICE_KEY = "mori-device";
const MINE_KEY = "our-forest-id";
const JOINED_KEY = "our-forest-joined";
export const PENDING_KEY = "our-forest-pending";

export function deviceId(): string {
  try {
    let v = localStorage.getItem(DEVICE_KEY);
    if (!v || !/^[A-Za-z0-9_-]{12,64}$/.test(v)) {
      const a = new Uint8Array(18);
      crypto.getRandomValues(a);
      v = btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      localStorage.setItem(DEVICE_KEY, v);
    }
    return v;
  } catch {
    return "nostorage-" + Math.random().toString(36).slice(2, 14);
  }
}

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // 저장이 막힌 브라우저에서는 이번 방문 동안만 기억합니다.
  }
};

export const myForestId = () => read(MINE_KEY);
export const setMyForestId = (id: string) => write(MINE_KEY, id);
export const joinedForests = (): string[] => {
  try {
    const v = JSON.parse(read(JOINED_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
export const markJoined = (id: string) => write(JOINED_KEY, JSON.stringify([...new Set([...joinedForests(), id])].slice(-50)));
export const pendingInvite = () => read(PENDING_KEY);
export const setPendingInvite = (id: string | null) => write(PENDING_KEY, id);

export const inviteUrl = (id: string) => `${typeof location !== "undefined" ? location.origin : "https://mbtitest.co.kr"}/mori/forest/f/?id=${id}`;
export const forestName = (v: ForestView) => (v.owner.nickname ? `${v.owner.nickname}님의 숲` : `${v.owner.type} 모리의 숲`);

/** 숲에 모인 유형별 인원(주인 포함) */
export function typeCounts(v: ForestView): Record<string, number> {
  const c: Record<string, number> = { [v.owner.type]: 1 };
  for (const m of v.members) c[m.type] = (c[m.type] ?? 0) + 1;
  return c;
}

/** 열린 열매: 짝꿍·라이벌 12쌍 중 둘 다 숲에 있는 쌍(정본 이야기). 120쌍을 찍어내지 않습니다(기획안 4-1). */
export function fruitsOf(types: string[]) {
  const have = new Set(types);
  return MORI_PAIRS.filter((p) => have.has(p.a) && have.has(p.b));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const j = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(j.error || "잠시 뒤 다시 시도해 주세요.");
  return j;
}
