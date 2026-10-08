"use client";

/**
 * 「모리 AI 대화」 화면 (2026-10-08 초안). 서버는 worker/mori-chat.ts, 규칙·숫자는 lib/mori-chat.ts.
 *
 * - 대화 내용은 이 기기(localStorage)에 모리마다 7일 둡니다. 심리테스트를 하고 돌아와도 이어지게(사용자 10-08). 서버는 저장하지 않습니다.
 * - 대화창은 시간대·날씨·특별한 날에 따라 바뀝니다(서버가 scene 으로 보냄, lib/mori-chat-scene.ts).
 * - 모리가 답한 뒤 가끔 사이트 안내 카드(유료 리포트·심리테스트)를 끼웁니다. AI 가 지어낸 홍보가 아니라 정해 둔 카드입니다.
 * - 기기 번호(localStorage)는 하루 무료 횟수를 세는 데만 씁니다. 사람을 알아보는 값이 아닙니다.
 * - 산 대화권 열쇠와 리포트 열쇠는 이 기기에 기억해 두고, 서버가 매번 다시 확인합니다. 화면의 숫자는 보여 주기용입니다.
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAT_CONSENT_TEXT,
  CHAT_CONSENT_VERSION,
  CHAT_FREE_PER_DAY,
  CHAT_MAX_CHARS,
  CHAT_PASS_PRICE,
  CHAT_PASS_SIZE,
  CHAT_REPORT_DAYS,
  CHAT_REPORT_PER_DAY,
  CRISIS_LINES,
  MORI_NICK,
  greeting,
  isMoriCode,
  type ChatQuota,
} from "../lib/mori-chat";
import { MORI, moriImage } from "../lib/mori";
import { MORI_WORLD, VILLAGES, villageOf } from "../lib/mori-world";
import { readMyMori } from "../lib/my-mori";
import { readRemembered } from "./ReportDone";
import { useReportPricing, won } from "./ReportEvent";
import { chatEvent, clearChatReturn, markChatReturn, readChatReturn } from "../lib/mori-chat-return";

type Promo = { kind: "report" } | { kind: "test"; slug: string };
type Msg = { role: "user" | "model" | "promo"; text: string; crisis?: boolean; promo?: Promo };
/** 추천 카드에 쓰는 심리테스트 이름표(페이지가 넘김 — 테스트 목록 전체를 화면 묶음에 싣지 않으려고). */
export type ChatTest = { slug: string; href: string; title: string; icon: string; desc: string };
type SceneView = { slot: string; slotName: string; special: { key: string; name: string; emoji: string } | null; weather: { kind: string; temp: number | null } | null; hello: string };

/** 추천 카드: 모리 답이 이만큼 쌓인 뒤부터, 이 확률로. 연달아 나오지 않게 간격을 둔다. */
const PROMO_MIN_GAP = 3;
const PROMO_CHANCE = 0.4;
const HISTORY_DAYS = 7;

const DEVICE_KEY = "mori-chat-device";
const PASS_KEY = "mori-chat-passes";
const historyKey = (code: string) => `mori-chat:${code}`;
const CODES = Object.keys(MORI_WORLD);

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY) ?? "";
    if (!/^[a-z0-9-]{16,64}$/.test(id)) {
      id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`).toLowerCase();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    // 저장이 막힌 브라우저: 이 탭 동안만 쓰는 번호. 새로 열면 다시 무료 횟수를 받지만 IP 상한이 함께 막습니다.
    return `tab-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }
}

function readPasses(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(PASS_KEY) ?? "[]") as string[];
    return Array.isArray(list) ? list.filter((t) => /^[0-9a-f]{64}$/.test(t)).slice(0, 20) : [];
  } catch {
    return [];
  }
}
/** 서버가 「아직 쓸모 있다」고 한 열쇠만 남깁니다(다 쓴 것·취소된 결제 대기는 지움). */
function keepPasses(alive: string[]): void {
  try {
    const keep = new Set(alive);
    localStorage.setItem(PASS_KEY, JSON.stringify(readPasses().filter((t) => keep.has(t))));
  } catch {
    // 지우지 못해도 서버가 매번 다시 확인합니다.
  }
}

function rememberPass(token: string): void {
  try {
    localStorage.setItem(PASS_KEY, JSON.stringify([token, ...readPasses().filter((t) => t !== token)].slice(0, 20)));
  } catch {
    // 기억하지 못해도 휴대폰 번호로 다시 찾을 수 있습니다.
  }
}

function readHistory(code: string): Msg[] {
  try {
    const saved = JSON.parse(localStorage.getItem(historyKey(code)) ?? "null") as { at?: number; msgs?: Msg[] } | null;
    if (!saved || !Array.isArray(saved.msgs) || Date.now() - Number(saved.at ?? 0) > HISTORY_DAYS * 86400_000) return [];
    return saved.msgs.filter((m) => ["user", "model", "promo"].includes(m.role) && typeof m.text === "string").slice(-80);
  } catch {
    return [];
  }
}
function saveHistory(code: string, list: Msg[]): void {
  try {
    localStorage.setItem(historyKey(code), JSON.stringify({ at: Date.now(), msgs: list.slice(-80) }));
  } catch {
    // 저장이 막히면 새로고침 때 대화가 사라질 뿐입니다.
  }
}
function clearHistory(code: string): void {
  try {
    localStorage.removeItem(historyKey(code));
  } catch {
    // 없어도 됩니다.
  }
}

const reportTokens = () => readRemembered().map((r) => r.token).slice(0, 10);

export default function MoriChat({ tests }: { tests: ChatTest[] }) {
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [passOpen, setPassOpen] = useState(false);
  const [wall, setWall] = useState(false);
  const [notice, setNotice] = useState("");
  const [scene, setScene] = useState<SceneView | null>(null);
  const [showOffer, setShowOffer] = useState(false);
  const [hasReport, setHasReport] = useState(false);
  const { price: reportPrice } = useReportPricing();
  const sincePromo = useRef(0);
  const lastPromo = useRef<"report" | "test">("test");
  const device = useRef("");
  const listRef = useRef<HTMLDivElement>(null);

  const refreshQuota = useCallback(async () => {
    try {
      const r = await fetch("/api/mori-chat/quota", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ d: device.current, r: reportTokens(), p: readPasses() }),
        cache: "no-store",
      });
      const j = (await r.json()) as { quota?: ChatQuota; passOpen?: boolean; scene?: SceneView; passAlive?: string[] };
      if (j.scene) setScene(j.scene);
      if (Array.isArray(j.passAlive)) keepPasses(j.passAlive);
      if (j.quota) {
        setQuota(j.quota);
        setWall(j.quota.open && j.quota.total === 0);
      }
      setPassOpen(Boolean(j.passOpen));
    } catch {
      // 숫자를 못 받아도 대화는 보낼 수 있습니다. 서버가 다시 셉니다.
    }
  }, []);

  /** 결제 직후: 페이앱 통보가 손님보다 늦게 올 수 있어 몇 초 간격으로 다시 묻습니다. */
  const waitForPass = useCallback(async (token: string) => {
    setNotice("대화권 결제를 확인하고 있어요…");
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch(`/api/mori-chat/pass?p=${token}`, { cache: "no-store" });
        const j = (await r.json()) as { status?: string; left?: number };
        if (j.status === "paid") {
          setNotice(`대화권이 붙었어요. 남은 대화 ${j.left ?? CHAT_PASS_SIZE}번이에요.`);
          setWall(false);
          return refreshQuota();
        }
        if (["cancelled", "failed", "refunded", "partial"].includes(j.status ?? "")) return setNotice("결제가 완료되지 않았어요.");
      } catch {
        // 다시 물어봅니다.
      }
      await new Promise((r) => setTimeout(r, i < 10 ? 2000 : 5000));
    }
    setNotice("결제 확인이 늦어지고 있어요. 결제하셨다면 잠시 뒤 아래 「대화권 다시 찾기」로 붙여 주세요.");
  }, [refreshQuota]);

  // 처음: 기기 번호 · 내 모리 · 주소의 ?mori= · 결제 뒤 ?pass=
  useEffect(() => {
    const id = setTimeout(() => {
      device.current = deviceId();
      const params = new URLSearchParams(location.search);
      const mine = readMyMori();
      setMe(mine);
      const asked = (params.get("mori") ?? "").toUpperCase();
      const back = readChatReturn();
      const start = isMoriCode(asked) ? asked : back?.mori ?? mine;
      setHasReport(reportTokens().length > 0);
      if (start) {
        setCode(start);
        let list = readHistory(start);
        // 심리테스트를 하고 돌아왔다: 모리가 먼저 말을 겁니다(AI 를 부르지 않음 — 횟수 안 듦).
        if (back && back.mori === start && params.has("back")) {
          list = [...list, { role: "model", text: `다녀왔구나! 「${back.title}」는 어땠어? 결과가 어떻게 나왔는지 들려줘.` }];
          saveHistory(start, list);
          chatEvent("resume_click", start, back.slug);
        }
        if (back && back.mori === start) clearChatReturn();
        setMsgs(list);
        if (params.has("back")) history.replaceState(null, "", `${location.pathname}?mori=${start}`);
      } else {
        setPicking(true);
      }
      // 결제 뒤 돌아오면 주소는 ?paid=1 뿐입니다(열쇠를 주소에 싣지 않음). ?pass= 는 관리자 검수용 링크에서만 씁니다.
      const pass = params.get("pass") ?? "";
      const paidBack = params.has("paid") ? readPasses()[0] ?? "" : "";
      const target = /^[0-9a-f]{64}$/.test(pass) ? pass : paidBack;
      if (params.has("pass") || params.has("paid")) history.replaceState(null, "", location.pathname + (start ? `?mori=${start}` : ""));
      if (/^[0-9a-f]{64}$/.test(target)) {
        rememberPass(target);
        void waitForPass(target);
      } else if (params.has("paid")) {
        setNotice("결제를 확인하지 못했어요. 결제하셨다면 아래 「대화권 다시 찾기」에 결제한 번호를 넣어 주세요.");
      }
      setReady(true);
      void refreshQuota();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 한 번만
  }, []);


  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const choose = (c: string) => {
    setCode(c);
    setMsgs(readHistory(c));
    setPicking(false);
    setError("");
    history.replaceState(null, "", `${location.pathname}?mori=${c}`);
  };

  /** 리포트와 테스트를 번갈아. 리포트를 이미 산 기기에는 테스트만, 이 대화에서 이미 권한 테스트는 다시 안 권함. */
  const pickPromo = (): Promo | null => {
    const shown = new Set(msgs.flatMap((m) => (m.promo?.kind === "test" ? [m.promo.slug] : [])));
    const pool = tests.filter((t) => !shown.has(t.slug));
    const wantReport = !hasReport && lastPromo.current === "test";
    if (wantReport || !pool.length) {
      if (hasReport) return null;
      lastPromo.current = "report";
      return { kind: "report" };
    }
    lastPromo.current = "test";
    return { kind: "test", slug: pool[Math.floor(Math.random() * pool.length)].slug };
  };

  const goTest = (t: ChatTest) => {
    if (!code) return;
    chatEvent("promo_click", code, t.slug);
    markChatReturn({ mori: code, slug: t.slug, title: t.title });
  };

  const reset = () => {
    if (!code || !confirm("이 모리와 나눈 대화를 이 기기에서 지울까요?")) return;
    clearHistory(code);
    setMsgs([]);
    sincePromo.current = 0;
  };

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (!code || !message || busy) return;
    setError("");
    setBusy(true);
    const before = msgs;
    const next = [...before, { role: "user" as const, text: message }];
    setMsgs(next);
    setInput("");
    try {
      const r = await fetch("/api/mori-chat/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          device: device.current, mori: code, me,
          history: before.filter((m) => !m.crisis && m.role !== "promo").map(({ role, text }) => ({ role, text })),
          message, reports: reportTokens(), passes: readPasses(),
        }),
      });
      const j = (await r.json()) as { reply?: string; crisis?: boolean; error?: string; needPay?: boolean; quota?: ChatQuota };
      if (j.quota) setQuota(j.quota);
      if (j.reply) {
        let done: Msg[] = [...next, { role: "model" as const, text: j.reply, crisis: j.crisis }];
        // 추천 카드: 위험한 말 뒤에는 절대 안 띄우고, 그 뒤로도 한동안 쉽니다.
        sincePromo.current = j.crisis ? -PROMO_MIN_GAP : sincePromo.current + 1;
        const promo = !j.crisis && sincePromo.current >= PROMO_MIN_GAP && Math.random() < PROMO_CHANCE ? pickPromo() : null;
        if (promo) {
          sincePromo.current = 0;
          done = [...done, { role: "promo", text: "", promo }];
          chatEvent("promo_seen", code, promo.kind === "test" ? promo.slug : "report");
        }
        setMsgs(done);
        saveHistory(code, done);
        if (j.quota && j.quota.total === 0) setWall(true);
      } else {
        // 답이 안 왔으면 보낸 말을 입력칸에 돌려놓습니다(횟수는 서버가 되돌렸습니다).
        setMsgs(before);
        setInput(message);
        if (j.needPay) setWall(true);
        else setError(j.error || "모리가 대답하지 못했어요.");
      }
    } catch {
      setMsgs(before);
      setInput(message);
      setError("연결이 끊겼어요. 다시 보내 주세요.");
    }
    setBusy(false);
  };

  if (!ready) return <div className="mc"><p className="mc-muted">모리를 깨우는 중…</p></div>;

  if (quota && !quota.open) {
    return (
      <div className="mc">
        <div className="mc-card">
          {readPasses().length || reportTokens().length ? (
            <>
              <b>모리가 잠깐 쉬는 중이에요</b>
              <p>점검이 끝나면 다시 열려요. <b>산 대화권·리포트 혜택 횟수는 그대로 남아 있어요.</b> 그동안 <Link href="/mori/forest/">마음숲 산책</Link>에서 모리들을 만나 보세요.</p>
            </>
          ) : (
            <>
              <b>모리 대화는 준비 중이에요</b>
              <p>곧 열려요. 그동안 <Link href="/mori/forest/">마음숲 산책</Link>에서 모리들을 먼저 만나 보세요.</p>
            </>
          )}
          <CrisisNote />
        </div>
      </div>
    );
  }

  if (picking || !code) {
    return (
      <div className="mc">
        <h2 className="mc-title">누구랑 이야기할까?</h2>
        {!me ? <p className="mc-muted">아직 내 모리가 없어요. <Link href="/tests/mbti/">무료 검사</Link>를 하면 내 모리가 깨어나요. 아무 모리나 골라도 돼요.</p> : null}
        <div className="mc-pick">
          {CODES.map((c) => (
            <button type="button" key={c} onClick={() => choose(c)} className={c === me ? "is-me" : ""} style={{ "--mori": MORI[c].color } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다 */}
              <img src={moriImage(c)} alt="" width={64} height={64} loading="lazy" />
              <b>{c}</b>
              <span>{MORI_NICK[c]}</span>
              {c === me ? <i>내 모리</i> : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const v = VILLAGES[villageOf(code)];
  const left = quota
    ? quota.free > 0
      ? `오늘 무료 ${quota.free}번 남음`
      : quota.report > 0
        ? `리포트 혜택 오늘 ${quota.report}번 남음 · ${quota.reportUntil}까지`
        : quota.pass > 0
          ? `대화권 ${quota.pass}번 남음`
          : "오늘 대화를 다 썼어요"
    : "";

  return (
    <div
      className={`mc mc-scene is-${scene?.slot ?? "afternoon"}${scene?.weather ? ` is-${scene.weather.kind}` : ""}${scene?.special ? " is-special" : ""}`}
      style={{ "--mori": MORI[code].color } as React.CSSProperties}
    >
      {scene ? (
        <p className="mc-sky" aria-label="지금 숲의 풍경">
          <span>{scene.special ? `${scene.special.emoji} ${scene.special.name}` : SLOT_LABEL[scene.slot] ?? scene.slotName}</span>
          {scene.weather ? <span>{WEATHER_LABEL[scene.weather.kind] ?? ""}{scene.weather.temp !== null ? ` ${Math.round(scene.weather.temp)}°` : ""}</span> : null}
        </p>
      ) : null}
      <div className="mc-head">
        {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 next/image 최적화를 쓰지 않습니다 */}
        <img src={moriImage(code)} alt={`${code} 모리`} width={56} height={56} />
        <div>
          <b>{code} 모리 · {MORI_NICK[code]}</b>
          <span>{v.name} · {MORI_WORLD[code].role}</span>
        </div>
        <button type="button" onClick={() => setPicking(true)}>바꾸기</button>
      </div>
      <p className="mc-ai">
        🤖 모리는 AI 캐릭터예요. 상담·진단이 아니에요. 대화는 이 기기에만 {HISTORY_DAYS}일 남아요.
        {msgs.length ? <button type="button" onClick={reset}>대화 지우기</button> : null}
      </p>

      <div className="mc-list" ref={listRef} aria-live="polite">
        <div className="mc-msg is-model"><p>{scene ? `${scene.hello} ` : ""}{greeting(code)}</p></div>
        {msgs.map((m, i) => m.role === "promo" && m.promo ? (
          <PromoCard key={i} promo={m.promo} tests={tests} price={reportPrice} onTest={goTest} mori={code} />
        ) : (
          <div key={i} className={`mc-msg is-${m.role}${m.crisis ? " is-crisis" : ""}`}>
            <p>{m.text}</p>
            {m.crisis ? (
              <ul className="mc-crisis">
                {CRISIS_LINES.map((l) => (
                  <li key={l.tel}>
                    <a href={`tel:${l.tel.split(" ")[0].replace(/-/g, "")}`}>
                      <b>{l.tel}</b> {l.name}{l.note ? ` · ${l.note}` : ""}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        {busy ? <div className="mc-msg is-model is-typing"><p><i /><i /><i /></p></div> : null}
      </div>

      {notice ? <p className="mc-notice">{notice}</p> : null}
      {error ? <p className="mc-error" role="alert">{error}</p> : null}

      {/* 마지막 무료 1번: 갑자기 막히지 않게 미리 알립니다(결제한 사람에게는 안 보임). */}
      {!wall && quota && quota.free === 1 && quota.report === 0 && quota.pass === 0 ? (
        <p className="mc-last">
          오늘 마지막 무료 대화예요.
          <button type="button" onClick={() => { setShowOffer((v) => !v); chatEvent("promo_seen", code, "pass-early"); }}>{showOffer ? "닫기" : "대화권 보기"}</button>
        </p>
      ) : null}
      {!wall && showOffer && quota && quota.free <= 1 ? (
        <ChatWall early passOpen={passOpen} onPass={(t) => { rememberPass(t); void waitForPass(t); }} />
      ) : null}

      {wall ? (
        <ChatWall passOpen={passOpen} onPass={(t) => { rememberPass(t); void waitForPass(t); }} />
      ) : (
        <form className="mc-input" onSubmit={send}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, CHAT_MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={CHAT_MAX_CHARS}
            placeholder={`${code} 모리에게 말 걸기`}
            aria-label="모리에게 보낼 말"
          />
          <button type="submit" disabled={busy || !input.trim()}>보내기</button>
          <small>{left}{left ? " · " : ""}{input.length}/{CHAT_MAX_CHARS}</small>
        </form>
      )}
    </div>
  );
}

const WEATHER_LABEL: Record<string, string> = { clear: "☀️ 맑음", cloudy: "☁️ 흐림", rain: "☔ 비", snow: "❄️ 눈" };
const SLOT_LABEL: Record<string, string> = {
  dawn: "🌌 새벽 숲", morning: "🌅 아침 숲", lunch: "🍃 한낮 숲", afternoon: "🌤️ 오후 숲", evening: "🌇 저녁 숲", night: "🌙 밤 숲",
};

/** 사이트 안내 카드. 모리 말풍선과 모양을 다르게 해 AI 가 한 말로 읽히지 않게 합니다. */
function PromoCard({ promo, tests, price, onTest, mori }: { promo: Promo; tests: ChatTest[]; price: number; onTest: (t: ChatTest) => void; mori: string }) {
  if (promo.kind === "report") {
    return (
      <Link className="mc-promo is-report" href="/report/?from=mori-chat-card" onClick={() => chatEvent("promo_click", mori, "report")}>
        <small>마음숲 안내</small>
        <b>📖 내 점수로 만든 104쪽 「모리 마음숲 안내서」</b>
        <span>연애·일·돈·충전법까지 11가지 주제, 미리보기 6쪽은 무료예요{price ? ` · ${won(price)}` : ""}. 사면 {CHAT_REPORT_DAYS}일 동안 하루 {CHAT_REPORT_PER_DAY}번 모리와 이야기할 수 있어요.</span>
        <i>미리보기 보기 →</i>
      </Link>
    );
  }
  const t = tests.find((x) => x.slug === promo.slug);
  if (!t) return null;
  return (
    <Link className="mc-promo is-test" href={`${t.href}?from=mori-chat`} onClick={() => onTest(t)}>
      <small>마음숲 안내 · 무료 심리테스트</small>
      <b>{t.icon} {t.title}</b>
      <span>{t.desc}</span>
      <i>해 보고 오기 → 끝나면 이 대화로 돌아올 수 있어요</i>
    </Link>
  );
}

/** 횟수를 다 썼을 때: ① 대화권 ② 리포트 혜택 ③ 대화권 다시 찾기 */
function ChatWall({ passOpen, onPass, early = false }: { passOpen: boolean; onPass: (token: string) => void; early?: boolean }) {
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [findPhone, setFindPhone] = useState("");
  const [findMsg, setFindMsg] = useState("");

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!agree) return setError("안내에 동의해 주세요.");
    setBusy(true);
    try {
      const r = await fetch("/api/mori-chat/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, agree, consentVersion: CHAT_CONSENT_VERSION }),
      });
      const j = (await r.json()) as { payurl?: string; token?: string; error?: string };
      if (!r.ok || !j.payurl) throw new Error(j.error || "결제창을 열지 못했어요.");
      // 결제창에서 돌아오지 못해도 이 기기에서 이어 쓸 수 있게 먼저 기억합니다(결제 전에는 0번으로 셉니다).
      if (j.token) rememberPass(j.token);
      location.assign(j.payurl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제창을 열지 못했어요.");
      setBusy(false);
    }
  };

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    setFindMsg("");
    try {
      const r = await fetch("/api/mori-chat/find", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: findPhone }),
      });
      const j = (await r.json()) as { passes?: { token: string; left: number }[]; error?: string };
      if (!r.ok || !j.passes?.length) throw new Error(j.error || "남은 대화권이 없어요.");
      j.passes.forEach((p) => onPass(p.token));
      setFindMsg(`대화권 ${j.passes.length}개를 이 기기에 붙였어요.`);
    } catch (err) {
      setFindMsg(err instanceof Error ? err.message : "찾지 못했어요.");
    }
  };

  return (
    <div className="mc-wall">
      {early ? (
        <p className="mc-wall-head">무료 대화는 하루 {CHAT_FREE_PER_DAY}번이에요. 더 길게 이야기하고 싶다면:</p>
      ) : (
        <p className="mc-wall-head"><b>오늘 무료 대화 {CHAT_FREE_PER_DAY}번을 다 썼어요.</b> 내일 다시 {CHAT_FREE_PER_DAY}번이 생겨요. 지금 더 이야기하고 싶다면:</p>
      )}

      <div className="mc-offer">
        <b>💬 모리 대화권 {CHAT_PASS_SIZE}번 · {CHAT_PASS_PRICE.toLocaleString()}원</b>
        <span>50번을 다 쓸 때까지 기한 없이 쓸 수 있어요.</span>
        {passOpen ? (
          <form onSubmit={buy}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="휴대폰 번호 01012345678" required autoComplete="tel" />
            <small>결제 확인과 대화권 다시 찾기에만 써요. 광고 문자는 보내지 않아요.</small>
            <label className="mc-agree">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>(필수) {CHAT_CONSENT_TEXT} <a href="/refund/" target="_blank" rel="noopener">환불 안내</a></span>
            </label>
            {error ? <p className="mc-error" role="alert">{error}</p> : null}
            <button type="submit" disabled={busy}>{busy ? "결제창 여는 중…" : `${CHAT_PASS_PRICE.toLocaleString()}원 결제하기`}</button>
          </form>
        ) : (
          <span className="mc-muted">대화권은 곧 열려요.</span>
        )}
      </div>

      <Link className="mc-offer is-report" href="/report/?from=mori-chat">
        <b>📖 모리 마음숲 안내서를 사면</b>
        <span>결제일부터 {CHAT_REPORT_DAYS}일 동안 하루 {CHAT_REPORT_PER_DAY}번 모리와 이야기할 수 있어요. 리포트 보러 가기 →</span>
      </Link>

      <details className="mc-find">
        <summary>대화권을 산 적이 있어요 (다시 찾기)</summary>
        <form onSubmit={find}>
          <input value={findPhone} onChange={(e) => setFindPhone(e.target.value)} inputMode="numeric" placeholder="결제한 휴대폰 번호" required />
          <button type="submit">찾기</button>
        </form>
        {findMsg ? <p className="mc-muted">{findMsg}</p> : null}
      </details>
      {early ? null : <CrisisNote />}
    </div>
  );
}

/** 대화를 할 수 없는 화면(횟수 없음·닫힘)에 늘 두는 상담 번호. 입력칸이 없으면 위험한 말을 보낼 길도 없어서입니다(점검 11번). */
function CrisisNote() {
  return (
    <p className="mc-crisis-note">
      마음이 많이 힘들다면 혼자 견디지 마세요.{" "}
      {CRISIS_LINES.map((l, i) => (
        <span key={l.tel}>
          {i ? " · " : ""}
          <a href={`tel:${l.tel.split(" ")[0].replace(/-/g, "")}`}>{l.name} {l.tel}</a>
        </span>
      ))}
    </p>
  );
}
