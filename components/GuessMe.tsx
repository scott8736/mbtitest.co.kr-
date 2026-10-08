"use client";

/**
 * 「친구가 본 내 모리」 + 초대 할인권 화면 (2026-10-08, 사용자 결정 "우리의 핵심은 많이 공유, 바이럴").
 *
 *   GuessMePanel   내 링크 만들기·공유·친구 참여 수·할인권·친구들이 본 나 (MBTI 결과, 초대 페이지 끝, 게임 안 우리 숲)
 *   GuessStep      초대 페이지: 「○○님은 어떤 모리 같아?」 고르기 → 정답 공개
 *   CouponTicket   받은 할인권(코드·금액·기한·조건)
 *
 * 퍼지는 고리: 내 링크 → 친구가 맞히기(10초) → 정답·할인권 → 친구도 자기 링크 만들기.
 * 서버는 worker/forest.ts·worker/coupon.ts, 규칙은 lib/invite-coupon.ts.
 */
import { useCallback, useEffect, useState } from "react";
import { MORI, moriImage } from "../lib/mori";
import { MORI_WORLD } from "../lib/mori-world";
import {
  COUPON_TERMS, FRIEND_WORDS, INVITE_GOAL, OWNER_COUPON, FRIEND_COUPON, saveCoupon, untilText, won, type Coupon,
} from "../lib/invite-coupon";
import { api, deviceId, forestName, guessTally, inviteUrl, myForestId, setMyForestId, type ForestMine, type ForestView } from "../lib/our-forest";
import { recordResultClick, recordShare } from "../lib/test-events";
import type { ResultClickPlacement } from "../lib/result-clicks";
import { SITE_DOMAIN } from "../lib/site-config";

const CODES = Object.keys(MORI_WORLD);
const whoOf = (v: ForestView) => (v.owner.nickname ? `${v.owner.nickname}님` : "이 친구");
/** 「달빛님은」/「이 친구는」 — 별명이 없으면 받침이 달라 조사를 따로 붙입니다 */
const whoTopic = (v: ForestView) => (v.owner.nickname ? `${v.owner.nickname}님은` : "이 친구는");

/* ---------- 내 숲(주인) 불러오기 ---------- */

export function useMyForest() {
  const [id, setId] = useState<string | null>(null);
  const [view, setView] = useState<ForestView | null>(null);
  const [mine, setMine] = useState<ForestMine | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (fid: string) => {
    try {
      setErr("");
      const [v, m] = await Promise.all([
        api<ForestView>(`/api/forest/${fid}`),
        api<ForestMine>(`/api/forest/${fid}/mine`, { method: "POST", body: JSON.stringify({ device: deviceId() }) }).catch(() => null),
      ]);
      setView(v);
      if (m) {
        setMine(m);
        if (m.coupon) saveCoupon(m.coupon);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
  }, []);

  useEffect(() => {
    const fid = myForestId();
    setId(fid);
    if (fid) void load(fid);
  }, [load]);

  const create = async (type: string, nickname: string) => {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ id: string }>("/api/forest/create", { method: "POST", body: JSON.stringify({ type, nickname, device: deviceId() }) });
      setMyForestId(r.id);
      setId(r.id);
      await load(r.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
    setBusy(false);
  };

  return { id, view, mine, err, busy, load, create };
}

/* ---------- 공유 ---------- */

export function ShareRow({ view }: { view: ForestView }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(view.id);
  const text = `나는 어떤 모리 같아? 16모리 중에 골라 줘 🤔 맞히면 정답이 바로 나와!`;
  const share = async (how: "invite" | "threads" | "copy") => {
    if (how === "threads") {
      recordShare("forest-threads");
      window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
      return;
    }
    if (how === "invite" && navigator.share) {
      recordShare("forest-invite");
      try {
        await navigator.share({ title: `${forestName(view)} — 나는 어떤 모리 같아?`, text, url });
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
    <div className="gm-share">
      <button className="gm-btn is-main" onClick={() => share("invite")}>💌 친구에게 물어보기</button>
      <div>
        <button className="gm-btn" onClick={() => share("threads")}>스레드에 올리기</button>
        <button className="gm-btn" onClick={() => share("copy")}>{copied ? "복사했어요!" : "링크 복사"}</button>
      </div>
    </div>
  );
}

/* ---------- 할인권 ---------- */

export function CouponTicket({ coupon, note }: { coupon: Coupon; note?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="gm-ticket">
      <div className="gm-ticket-main">
        <span>🎁 리포트 할인권</span>
        <b>{won(coupon.amount)}</b>
        <small>{untilText(coupon.expiresAt)} · 번호 {coupon.code}</small>
      </div>
      {note && <p>{note}</p>}
      <a className="gm-btn is-main" href="/report/?from=coupon" onClick={() => recordResultClick("report-coupon")}>리포트에서 바로 쓰기 →</a>
      <button className="gm-terms-btn" onClick={() => setOpen(!open)}>{open ? "조건 닫기" : "사용 조건 보기"}</button>
      {open && <ul className="gm-terms">{COUPON_TERMS.map((t) => <li key={t}>{t}</li>)}</ul>}
    </div>
  );
}

function CouponProgress({ mine }: { mine: ForestMine | null }) {
  if (!mine) return null;
  if (mine.coupon) return <CouponTicket coupon={mine.coupon} note={mine.coupon.used ? "이미 사용한 할인권이에요." : `친구 ${mine.friends}명이 참여해서 받았어요. 고마워요!`} />;
  const left = Math.max(0, mine.goal - mine.friends);
  return (
    <div className="gm-progress">
      <div className="gm-dots" aria-label={`친구 ${mine.friends}/${mine.goal}명 참여`}>
        {Array.from({ length: mine.goal }, (_, i) => <i key={i} className={i < mine.friends ? "on" : ""}>{i < mine.friends ? "🙋" : ""}</i>)}
      </div>
      <p>
        친구 <b>{mine.friends}/{mine.goal}</b>명 참여 ·{" "}
        {left === 1 ? <b className="gm-hot">1명만 더 오면 리포트 {won(OWNER_COUPON)} 할인권!</b> : <>친구 {mine.goal}명이 맞혀 주면 리포트 <b>{won(OWNER_COUPON)}</b> 할인권</>}
      </p>
    </div>
  );
}

/* ---------- 친구들이 본 나 ---------- */

function FriendsSaw({ view }: { view: ForestView }) {
  const t = guessTally(view);
  const [saving, setSaving] = useState(false);
  if (!t.total) return <p className="gm-empty">아직 맞혀 본 친구가 없어요. 링크를 보내면 여기에 친구들의 선택이 쌓여요.</p>;
  const max = t.types[0][1];
  const card = async () => {
    setSaving(true);
    recordShare("forest-card");
    try {
      await shareCard(view);
    } catch {
      // 공유창을 닫았거나 그림을 못 만든 것 — 화면은 그대로 둡니다.
    }
    setSaving(false);
  };
  return (
    <div className="gm-saw">
      <h3>👀 친구 {t.total}명이 본 나</h3>
      <ol>
        {t.types.slice(0, 5).map(([code, n]) => (
          <li key={code} className={code === view.owner.type ? "is-me" : ""}>
            <img src={moriImage(code)} width={34} height={34} alt="" />
            <b>{code}</b>
            <span><i style={{ width: `${(n / max) * 100}%`, background: MORI[code]?.color }} /></span>
            <em>{n}표</em>
          </li>
        ))}
      </ol>
      <p className="gm-right">진짜 나는 <b>{view.owner.type}</b> · 맞힌 친구 <b>{t.right}</b>명</p>
      {t.words.length > 0 && <p className="gm-words">{t.words.slice(0, 4).map(([w, n]) => <span key={w}>{w} {n}</span>)}</p>}
      <button className="gm-btn" onClick={card} disabled={saving}>{saving ? "카드 만드는 중…" : "📸 친구들이 본 나 카드 저장·공유"}</button>
    </div>
  );
}

/** 9:16 에 가까운 4:5 카드(1080×1350). 인스타 스토리·카톡 프로필에 그대로 올리게. */
async function shareCard(view: ForestView): Promise<void> {
  const t = guessTally(view);
  const top = t.types[0]?.[0] ?? view.owner.type;
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d");
  if (!g) return;
  const color = MORI[top]?.color ?? "#7657d6";
  const grad = g.createLinearGradient(0, 0, 0, 1350);
  grad.addColorStop(0, "#fffaf2");
  grad.addColorStop(1, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1080, 1350);
  g.textAlign = "center";
  g.fillStyle = "#1c2034";
  g.font = "bold 54px sans-serif";
  g.fillText(`${view.owner.nickname ? `${view.owner.nickname}님을` : "나를"} 본 친구 ${t.total}명의 선택`, 540, 130);
  const img = await new Promise<HTMLImageElement>((ok, bad) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = bad;
    i.src = moriImage(top);
  });
  g.drawImage(img, 240, 190, 600, 600);
  g.font = "bold 96px sans-serif";
  g.fillText(`${top} 모리`, 540, 900);
  g.font = "bold 46px sans-serif";
  g.fillStyle = "#3a3f55";
  g.fillText(t.types.slice(0, 3).map(([code, n]) => `${code} ${n}표`).join(" · "), 540, 980);
  g.fillText(`진짜 나는 ${view.owner.type} · 맞힌 친구 ${t.right}명`, 540, 1060);
  if (t.words.length) g.fillText(`친구들이 고른 말: ${t.words.slice(0, 3).map(([w]) => w).join(", ")}`, 540, 1140);
  g.font = "bold 40px sans-serif";
  g.fillStyle = "#ffffff";
  g.fillText(`너도 맞혀 봐 → ${SITE_DOMAIN}`, 540, 1280);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
  if (!blob) return;
  const file = new File([blob], `friends-mori-${view.id}.png`, { type: "image/png" });
  const text = `친구들이 본 나는 ${top} 모리래 ㅋㅋ 너도 맞혀 봐!\n${inviteUrl(view.id)}`;
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- 주인 패널 ---------- */

export type MyForest = ReturnType<typeof useMyForest>;

/** 공유 · 할인권 진행 · 친구들이 본 나. 게임 안 「우리 숲」(OurForestPanel)도 이것을 씁니다. */
export function GuessMeBody({ f }: { f: MyForest }) {
  if (!f.view) return null;
  return (
    <>
      <ShareRow view={f.view} />
      <CouponProgress mine={f.mine} />
      <FriendsSaw view={f.view} />
      <button className="gm-terms-btn" onClick={() => f.id && f.load(f.id)}>새로고침</button>
    </>
  );
}

export function GuessMePanel({ me, placement, title }: { me: string; placement?: ResultClickPlacement; title?: string }) {
  const f = useMyForest();
  const [nick, setNick] = useState("");
  if (!f.id) {
    return (
      <section className="gm-panel">
        <span className="gm-eyebrow">친구가 본 내 모리</span>
        <h2>{title ?? "친구들은 나를 어떤 모리로 볼까?"}</h2>
        <p>링크를 보내면 친구들이 16모리 중에서 나를 골라요. 진짜 나({me})와 같을까요?<br />친구 {INVITE_GOAL}명이 맞혀 주면 <b>리포트 {won(OWNER_COUPON)} 할인권</b>, 참여한 친구도 <b>{won(FRIEND_COUPON)}</b> 할인권을 받아요.</p>
        <label className="gm-nick">
          <span>친구에게 보일 별명 (선택 · 8자, 실명 말고)</span>
          <input value={nick} maxLength={8} onChange={(e) => setNick(e.target.value)} placeholder="예: 달빛" />
        </label>
        <button
          className="gm-btn is-main"
          disabled={f.busy}
          onClick={() => {
            if (placement) recordResultClick(placement);
            void f.create(me, nick);
          }}
        >
          {f.busy ? "링크 만드는 중…" : "🙋 내 링크 만들기"}
        </button>
        {f.err && <p className="gm-err">{f.err}</p>}
      </section>
    );
  }
  return (
    <section className="gm-panel">
      <span className="gm-eyebrow">친구가 본 내 모리</span>
      <h2>{f.view?.owner.nickname ? `${f.view.owner.nickname}님은 어떤 모리 같아?` : "나는 어떤 모리 같아?"}</h2>
      {f.err && <p className="gm-err">{f.err} <button className="gm-terms-btn" onClick={() => f.id && f.load(f.id)}>다시 불러오기</button></p>}
      <GuessMeBody f={f} />
      {!f.view && !f.err && <p className="gm-empty">불러오는 중…</p>}
    </section>
  );
}

/* ---------- 초대 페이지: 맞히기 ---------- */

export type GuessResult = { guess: string; answer: string; right: boolean; friendCoupon?: Coupon; view: ForestView };

export function GuessStep({ view, names, onDone, onSkip }: { view: ForestView; names: Record<string, string>; onDone: (r: GuessResult) => void; onSkip: () => void }) {
  const [pick, setPick] = useState<string | null>(null);
  const [word, setWord] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!pick) return;
    setBusy(true);
    setErr("");
    recordResultClick("forest-guess");
    try {
      const r = await api<ForestView & { ok: boolean; own?: boolean; guess?: string; answer?: string; right?: boolean; friendCoupon?: Coupon }>(`/api/forest/${view.id}/guess`, {
        method: "POST",
        body: JSON.stringify({ guess: pick, word, device: deviceId() }),
      });
      if (r.friendCoupon) saveCoupon(r.friendCoupon);
      onDone({ guess: r.guess ?? pick, answer: r.answer ?? view.owner.type, right: Boolean(r.right), friendCoupon: r.friendCoupon, view: r });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "잠시 뒤 다시 시도해 주세요.");
    }
    setBusy(false);
  };
  return (
    <div className="gm-guess">
      <h2>{whoTopic(view)} 어떤 모리 같아?</h2>
      <p>16모리 중 하나를 골라 줘. 고르면 정답이 바로 나와요.</p>
      <div className="gm-grid">
        {CODES.map((c) => (
          <button key={c} className={pick === c ? "is-on" : ""} onClick={() => setPick(c)} style={{ "--mori": MORI[c].color } as React.CSSProperties} aria-pressed={pick === c}>
            <img src={moriImage(c)} width={52} height={52} alt="" />
            <b>{c}</b>
            <small>{names[c]}</small>
          </button>
        ))}
      </div>
      <div className="gm-wordpick">
        <span>{whoOf(view)}에게 한 마디 (선택)</span>
        <div>
          {FRIEND_WORDS.map((w, i) => (
            <button key={w} className={word === i ? "is-on" : ""} onClick={() => setWord(word === i ? -1 : i)} aria-pressed={word === i}>{w}</button>
          ))}
        </div>
      </div>
      {err && <p className="gm-err">{err}</p>}
      <button className="gm-btn is-main" onClick={submit} disabled={!pick || busy}>{busy ? "정답 확인 중…" : pick ? `${pick} 모리로 맞혀 보기` : "모리를 골라 주세요"}</button>
      <button className="gm-terms-btn" onClick={onSkip}>맞히기 건너뛰고 내 모리만 심기</button>
    </div>
  );
}

export function GuessReveal({ r }: { r: GuessResult }) {
  const t = guessTally(r.view);
  return (
    <div className={`gm-reveal${r.right ? " is-right" : ""}`}>
      <img src={moriImage(r.answer)} width={96} height={96} alt={`${r.answer} 모리`} />
      <b>{r.right ? "정답이에요! 🎉" : "아쉬워요!"}</b>
      <span>{whoTopic(r.view)} <strong>{r.answer}</strong> 모리예요{r.right ? "" : ` (내 선택: ${r.guess})`}</span>
      <small>지금까지 친구 {t.total}명 중 {t.right}명이 맞혔어요</small>
      {r.friendCoupon && !r.friendCoupon.used && <CouponTicket coupon={r.friendCoupon} note="참여해 줘서 고마워요! 이 기기에 저장해 뒀어요." />}
    </div>
  );
}
