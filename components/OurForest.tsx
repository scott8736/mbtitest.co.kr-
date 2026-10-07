"use client";

/**
 * 「우리 숲」 화면들 (2026-10-07, 기획안 4절).
 *   OurForestPanel     게임 안 내 숲: 만들기 · 16칸 · 열매 · 친구 초대
 *   ForestInvite       초대 페이지(/mori/forest/f/?id=…): 내 모리 심기
 *   ForestInviteReturn MBTI 결과 화면: 「검사로 알아보기」로 온 사람이 결과 유형으로 바로 심기
 * 서버는 worker/forest.ts, 공용은 lib/our-forest.ts.
 */
import { useCallback, useEffect, useState } from "react";
import { MORI, moriImage, moriSprite } from "../lib/mori";
import { MORI_WORLD, VILLAGES, villageOf, type VillageKey } from "../lib/mori-world";
import { readMyMori, saveMyMori } from "../lib/my-mori";
import {
  api, deviceId, forestName, fruitsOf, inviteUrl, joinedForests, markJoined, myForestId, pendingInvite, setMyForestId,
  setPendingInvite, typeCounts, type ForestView,
} from "../lib/our-forest";
import { recordResultClick, recordShare } from "../lib/test-events";

const ORDER: VillageKey[] = ["nt", "nf", "sj", "sp"];
const CODES = Object.keys(MORI_WORLD);

/* ---------- 16칸 숲 ---------- */

export function ForestGrid({ view, fresh }: { view: ForestView; fresh?: string }) {
  const counts = typeCounts(view);
  return (
    <div className="of-grid" aria-label={`${forestName(view)} ${Object.keys(counts).length}/16`}>
      {ORDER.map((v) => (
        <div key={v} className="of-row" style={{ "--village": VILLAGES[v].color } as React.CSSProperties}>
          <small>{VILLAGES[v].name}</small>
          {CODES.filter((c) => villageOf(c) === v).map((c) => {
            const n = counts[c] ?? 0;
            return (
              <div key={c} className={`of-cell${n ? " is-on" : ""}${fresh === c ? " is-fresh" : ""}${view.owner.type === c ? " is-owner" : ""}`}>
                {n ? <img src={moriSprite(c)} width={58} height={72} alt={`${c} 모리`} /> : <span aria-hidden="true">?</span>}
                <b>{c}</b>
                {n > 1 && <i aria-label={`${n}명`}>♥{n}</i>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Fruits({ view, focus }: { view: ForestView; focus?: string }) {
  const counts = typeCounts(view);
  const types = Object.keys(counts);
  const all = fruitsOf(types);
  const list = focus ? [...all.filter((p) => p.a === focus || p.b === focus), ...all.filter((p) => p.a !== focus && p.b !== focus)] : all;
  return (
    <div className="of-fruits">
      <h3>🍎 마음나무 열매 {all.length + (types.length >= 2 ? 1 : 0)}개</h3>
      {types.length < 2 && <p className="of-empty">서로 다른 모리가 둘 이상 모이면 첫 열매가 열려요.</p>}
      {types.length >= 2 && <p className="of-first">🌱 첫 열매 — 서로 다른 모리 {types.length}명이 한 숲에 모였어요. 달라서 숲이 완성돼요.</p>}
      {list.map((p) => (
        <article key={p.a + p.b} className={p.kind === "짝꿍" ? "is-mate" : "is-rival"}>
          <div aria-hidden="true">
            <img src={moriImage(p.a)} width={40} height={40} alt="" />
            <i>{p.kind === "짝꿍" ? "💞" : "⚡"}</i>
            <img src={moriImage(p.b)} width={40} height={40} alt="" />
          </div>
          <b>{p.a} × {p.b} · {p.kind} 열매</b>
          <p>{p.story}</p>
        </article>
      ))}
      {fruitsLeft(types) > 0 && <p className="of-more">짝꿍·라이벌 이야기 열매가 {fruitsLeft(types)}개 더 숨어 있어요. 친구를 더 불러 보세요!</p>}
    </div>
  );
}
const fruitsLeft = (types: string[]) => 12 - fruitsOf(types).length;

/* ---------- 게임 안: 내 숲 ---------- */

export function OurForestPanel({ me }: { me: string }) {
  const [id, setId] = useState<string | null>(null);
  const [view, setView] = useState<ForestView | null>(null);
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (fid: string) => {
    try {
      setErr("");
      setView(await api<ForestView>(`/api/forest/${fid}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
  }, []);

  useEffect(() => {
    const fid = myForestId();
    setId(fid);
    if (fid) void load(fid);
  }, [load]);

  const create = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ id: string }>("/api/forest/create", { method: "POST", body: JSON.stringify({ type: me, nickname: nick, device: deviceId() }) });
      setMyForestId(r.id);
      setId(r.id);
      await load(r.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
    setBusy(false);
  };

  if (!id) {
    return (
      <section className="of-panel">
        <h2>우리 숲 <small>친구랑 같이 채우는 16칸</small></h2>
        <div className="of-make">
          <img src={moriSprite(me)} width={120} height={150} alt="" />
          <p>내 숲을 만들고 친구에게 링크를 보내요.<br />친구가 자기 모리를 심으면 칸이 차고, 짝꿍·라이벌이 모이면 <b>이야기 열매</b>가 열려요.</p>
          <label>
            <span>숲 이름에 쓸 별명 (선택 · 8자)</span>
            <input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} placeholder="예: 달빛" />
          </label>
          <button className="mf-primary" onClick={create} disabled={busy}>{busy ? "숲을 만드는 중…" : "🌳 내 숲 만들기"}</button>
          {err && <p className="of-err">{err}</p>}
          <small>별명은 친구에게 보이는 숲 이름에만 써요. 실명은 쓰지 마세요.</small>
        </div>
      </section>
    );
  }

  const share = async (how: "invite" | "threads" | "copy") => {
    if (!view) return;
    const url = inviteUrl(view.id);
    const have = Object.keys(typeCounts(view)).length;
    const text = `내 숲에 모리를 심어 줘! ${forestName(view)} ${have}/16 🌳`;
    if (how === "threads") {
      recordShare("forest-threads");
      window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
      return;
    }
    if (how === "invite" && navigator.share) {
      recordShare("forest-invite");
      try {
        await navigator.share({ title: forestName(view), text, url });
      } catch {
        // 공유창을 닫은 것
      }
      return;
    }
    recordShare("forest-copy");
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("이 링크를 복사해 보내 주세요", url);
    }
  };

  return (
    <section className="of-panel">
      <h2>{view ? forestName(view) : "우리 숲"} <small>{view ? `${Object.keys(typeCounts(view)).length}/16` : ""}</small></h2>
      {err && <p className="of-err">{err} <button className="mf-text" onClick={() => load(id)}>다시 불러오기</button></p>}
      {view && (
        <>
          <ForestGrid view={view} />
          <p className="of-count">
            들어온 친구 <b>{view.members.length}</b>명
            {view.members.length > 0 && ` · ${view.members.slice(-5).map((m) => m.nickname || `${m.type} 모리`).join(", ")}${view.members.length > 5 ? " …" : ""}`}
            <button className="mf-text" onClick={() => load(id)}>새로고침</button>
          </p>
          <div className="of-share">
            <button className="mf-primary" onClick={() => share("invite")}>💌 친구 초대하기</button>
            <div>
              <button className="mf-secondary" onClick={() => share("threads")}>스레드에 올리기</button>
              <button className="mf-secondary" onClick={() => share("copy")}>{copied ? "복사했어요!" : "링크 복사"}</button>
            </div>
          </div>
          <Fruits view={view} />
        </>
      )}
      {!view && !err && <p className="of-empty">숲을 불러오는 중…</p>}
    </section>
  );
}

/* ---------- 초대 페이지 ---------- */

export function ForestInvite({ names }: { names: Record<string, string> }) {
  const [id, setId] = useState("");
  const [view, setView] = useState<ForestView | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "own" | "joined" | "pick" | "ready" | "done">("loading");
  const [me, setMe] = useState<string | null>(null);
  const [nick, setNick] = useState("");
  const [fresh, setFresh] = useState<string | undefined>();
  const [err, setErr] = useState("");

  useEffect(() => {
    const fid = new URLSearchParams(location.search).get("id") ?? "";
    setId(fid);
    setMe(readMyMori());
    if (!/^[a-z2-9]{8}$/.test(fid)) {
      setState("missing");
      return;
    }
    api<ForestView>(`/api/forest/${fid}`)
      .then((v) => {
        setView(v);
        if (myForestId() === fid) setState("own");
        else if (joinedForests().includes(fid)) setState("joined");
        else setState("ready");
      })
      .catch(() => setState("missing"));
  }, []);

  const join = async (type: string, via: "known" | "test") => {
    setErr("");
    try {
      const r = await api<ForestView & { ok: boolean; own?: boolean; already?: boolean }>(`/api/forest/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ type, nickname: nick, via, device: deviceId() }),
      });
      if (r.own) {
        setState("own");
        return;
      }
      saveMyMori(type);
      setMe(type);
      markJoined(id);
      setView(r);
      setFresh(type);
      setState("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
  };

  if (state === "loading") return <section className="of-invite"><p className="of-empty">숲을 찾는 중…</p></section>;
  if (state === "missing" || !view) {
    return (
      <section className="of-invite">
        <h1>숲을 찾지 못했어요</h1>
        <p>링크가 잘렸거나 없어진 숲이에요. 내 숲을 직접 만들어 보세요.</p>
        <a className="mf-primary" href="/mori/forest/?ours=1">🌳 내 숲 만들기</a>
      </section>
    );
  }

  const name = forestName(view);
  const have = Object.keys(typeCounts(view)).length;
  return (
    <section className="of-invite">
      <span className="of-eyebrow">🌳 우리 숲 초대장</span>
      <h1>{name}에 초대받았어요</h1>
      <p className="of-lead">{view.owner.type} 모리가 사는 숲이에요. 지금 <b>{have}/16</b>칸이 찼어요. 내 모리를 심어 숲을 채워 주세요!</p>
      <ForestGrid view={view} fresh={fresh} />

      {state === "ready" && (
        <div className="of-join">
          {me && (
            <button className="mf-primary" onClick={() => { recordResultClick("forest-invite-known"); void join(me, "known"); }}>
              <img src={moriImage(me)} width={36} height={36} alt="" /> 내 {me} 모리 심기
            </button>
          )}
          <button className={me ? "mf-secondary" : "mf-primary"} onClick={() => setState("pick")}>{me ? "다른 유형으로 심기" : "내 유형 알아요 · 10초"}</button>
          <a
            className="mf-secondary"
            href="/tests/mbti/"
            onClick={() => {
              recordResultClick("forest-invite-test");
              setPendingInvite(id);
            }}
          >
            검사로 알아보기 · 4분
          </a>
          <label className="of-nick">
            <span>숲에 보일 별명 (선택 · 8자)</span>
            <input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} placeholder="안 쓰면 「○○ 모리」로 보여요" />
          </label>
          {err && <p className="of-err">{err}</p>}
        </div>
      )}

      {state === "pick" && (
        <div className="of-pick">
          <h2>내 유형을 골라 주세요</h2>
          <div>
            {CODES.map((c) => (
              <button key={c} onClick={() => { recordResultClick("forest-invite-known"); void join(c, "known"); }} style={{ "--mori": MORI[c].color } as React.CSSProperties}>
                <img src={moriImage(c)} width={56} height={56} alt="" />
                <b>{c}</b>
                <small>{names[c]}</small>
              </button>
            ))}
          </div>
          {err && <p className="of-err">{err}</p>}
          <button className="mf-text" onClick={() => setState("ready")}>← 돌아가기</button>
        </div>
      )}

      {(state === "done" || state === "joined" || state === "own") && (
        <div className="of-after">
          {state === "done" && fresh && <p className="of-ok">🌱 내 {fresh} 모리가 {name}에 심어졌어요!</p>}
          {state === "joined" && <p className="of-ok">이미 이 숲에 모리를 심었어요. 고마워요!</p>}
          {state === "own" && <p className="of-ok">내 숲이에요! 친구에게 이 링크를 보내 보세요.</p>}
          <a className="mf-primary" href="/mori/forest/?ours=1" onClick={() => recordResultClick("forest-invite-mine")}>
            {state === "own" ? "🌳 내 숲 관리하러 가기" : "🌳 나도 내 숲 만들기"}
          </a>
          <a className="mf-secondary" href="/mori/forest/">모리랑 마음숲 산책하기</a>
          <Fruits view={view} focus={fresh ?? me ?? undefined} />
        </div>
      )}
    </section>
  );
}

/* ---------- MBTI 결과: 검사로 알아보고 온 사람 ---------- */

export function ForestInviteReturn({ code }: { code: string }) {
  const [id, setId] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = pendingInvite();
    if (p && /^[a-z2-9]{8}$/.test(p) && !joinedForests().includes(p)) setId(p);
  }, []);

  if (!id) return null;
  const plant = async () => {
    setBusy(true);
    try {
      const r = await api<ForestView & { own?: boolean }>(`/api/forest/${id}/join`, { method: "POST", body: JSON.stringify({ type: code, via: "test", device: deviceId() }) });
      markJoined(id);
      setPendingInvite(null);
      setDone(forestName(r));
    } catch {
      setDone("");
    }
    setBusy(false);
  };
  return (
    <div className="of-return">
      {done === null ? (
        <>
          <b>🌳 초대받은 숲이 기다려요</b>
          <span>방금 나온 {code} 모리를 친구 숲에 심을까요?</span>
          <button className="mf-primary" onClick={plant} disabled={busy}>{busy ? "심는 중…" : `${code} 모리 심기`}</button>
        </>
      ) : (
        <>
          <b>{done ? `🌱 ${done}에 심었어요!` : "앗, 지금은 심지 못했어요"}</b>
          <a className="mf-secondary" href={`/mori/forest/f/?id=${id}`}>숲 보러 가기 →</a>
        </>
      )}
    </div>
  );
}
