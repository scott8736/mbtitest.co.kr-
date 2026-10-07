"use client";

/**
 * 모리 게임 「마음숲 산책」 (2026-10-07, 기획안 2단계 — 혼자 하는 줄기).
 *
 * 화면: 시작 → (유형 고르기) → 숲 지도 → 마을 → 대화 → 도감. DOM + CSS 이동만 씁니다(캔버스 없음).
 * 진행은 이 기기 localStorage(lib/mori-forest.ts)에만 있고, 내 모리는 결과 화면이 남긴 my-mori 를 읽습니다.
 *
 * 소리: 배경곡은 마을마다 한 곡(public/audio/forest, 92 BPM 루프 — 마을을 옮겨도 박이 이어지게),
 * 말소리·도장 팡파르는 브라우저 합성. 휴대폰은 탭 안에서만 소리를 낼 수 있어서 곡을 바꾸는 호출은 모두
 * 탭 처리 함수 안에서 바로 합니다(setTimeout 뒤에서 부르면 아이폰이 막습니다).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MORI, moriImage, moriSprite, testMoriImage } from "../lib/mori";
import { MORI_WORLD, VILLAGES, villageOf, type VillageKey } from "../lib/mori-world";
import { readMyMori, saveMyMori } from "../lib/my-mori";
import { FOREST_QUESTS, readForest, stampsOf, writeForest, type ForestQuest, type ForestSave } from "../lib/mori-forest";
import { recordResultClick } from "../lib/test-events";
import { audioCtx, currentMusic, fanfare, playMusic, stopMusic, tone } from "./forest-sound";
import { chartOf } from "../lib/forest-rhythm";
import { inviteOf, minigameOf } from "../lib/forest-minigames";
import ForestRhythm from "./ForestRhythm";
import ForestMinigame from "./ForestMinigame";

type Screen = "intro" | "pick" | "map" | "village" | "dex";
/** invite: 바람 들판 주민이 리듬 탭을 청하는 대화(끝 버튼이 「한 판 하기」) */
type Talk = { mori: string; lines: string[]; line: number; shown: number; invite?: boolean };

const ORDER: VillageKey[] = ["nt", "nf", "sj", "sp"];
const CODES = Object.keys(MORI_WORLD);

/** 숲 지도(map.webp) 위 마을 자리, 그림 기준 % */
const PINS: Record<VillageKey, { x: number; y: number }> = {
  nt: { x: 22, y: 30 },
  nf: { x: 78, y: 30 },
  sj: { x: 20, y: 72 },
  sp: { x: 76, y: 72 },
};

/**
 * 마을 장면 안 주민 네 자리, 장면 기준 %. 모리 발밑이 이 점에 옵니다.
 * 뒷줄 둘은 양옆, 앞줄 둘은 바깥쪽 — 가운데를 내 모리가 다니는 통로로 비웁니다(10-07 「엉성하다」 지적 뒤 다시 잡음).
 * 말 걸 때는 통로 쪽, 상대와 같은 줄에 섭니다(TALK_SPOTS). 그래야 앞줄 모리 뒤에 숨지 않습니다.
 */
const SLOTS = [
  { x: 12, y: 62 },
  { x: 32, y: 90 },
  { x: 88, y: 62 },
  { x: 68, y: 90 },
];
const TALK_SPOTS = [
  { x: 29, y: 63 },
  { x: 50, y: 89 },
  { x: 71, y: 63 },
  { x: 50, y: 89 },
];
const START = { x: 50, y: 78 };
const GROUND_TOP = 52; // 이 위(하늘·지붕)는 못 걸어감

/** 소품 때문에 그림 안에서 몸이 작게 그려진 모리(ENFP 풍선 등)는 그만큼 키워 몸 크기를 맞춥니다 */
const SPRITE_SCALE: Record<string, number> = { ENFP: 1.32, ESFP: 1.06, ESTP: 1.08, ENFJ: 1.12, ENTJ: 1.12 };

/** 원근: 뒤(위)일수록 작게 */
const depth = (y: number) => 0.74 + ((y - 60) / 40) * 0.36;

/** 말 걸 때 설 자리 */
const beside = (slot: { x: number; y: number }) => TALK_SPOTS[SLOTS.indexOf(slot)] ?? { x: 50, y: 80 };
const WALK_MS = 700;

/** 받침 있으면 「을」, 없으면 「를」 */
const eul = (word: string) => {
  const c = word.charCodeAt(word.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? "을" : "를";
};

/** 모리 말소리. 유형마다 음 높이가 다르고 글자마다 살짝 흔들립니다(웅얼웅얼). */
function blip(code: string) {
  const base = 300 + CODES.indexOf(code) * 22;
  tone(base * (0.92 + Math.random() * 0.18), 0, 0.06, 0.05, "square");
}

/* ---------- 게임 ---------- */

export default function MoriForestGame({ names, testTitles }: { names: Record<string, string>; testTitles: Record<string, string> }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<string | null>(null);
  const [save, setSave] = useState<ForestSave>({ met: [], done: {}, stamped: [], muted: true });
  const [screen, setScreen] = useState<Screen>("intro");
  const [village, setVillage] = useState<VillageKey>("nt");
  const [mapAt, setMapAt] = useState<VillageKey>("nt");
  const [pos, setPos] = useState(START);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [stamp, setStamp] = useState<VillageKey | "all" | null>(null);
  const [rhythm, setRhythm] = useState<string | null>(null);
  const walkTimer = useRef<number | undefined>(undefined);
  const entered = useRef(false);

  const update = useCallback((fn: (s: ForestSave) => ForestSave) => {
    setSave((prev) => {
      const next = fn({ ...prev, met: [...prev.met], done: { ...prev.done }, stamped: [...(prev.stamped ?? [])] });
      writeForest(next);
      return next;
    });
  }, []);

  // 처음 열 때: 내 모리 · 저장된 진행 · 검사 마치고 돌아온 길(?back=검사)
  useEffect(() => {
    const mine = readMyMori();
    const s = readForest();
    if (mine && !s.met.includes(mine)) s.met.unshift(mine);
    writeForest(s);
    setSave(s);
    setMe(mine);
    if (mine) {
      setVillage(villageOf(mine));
      setMapAt(villageOf(mine));
    }
    const back = new URLSearchParams(location.search).get("back");
    const quest = back ? FOREST_QUESTS.find((q) => q.slug === back) : undefined;
    if (mine && quest && quest.slug in s.done) {
      const v = villageOf(quest.mori);
      setVillage(v);
      setMapAt(v);
      setScreen("village");
      const slot = SLOTS[questsIn(v).indexOf(quest)];
      setPos(beside(slot));
      openTalk(quest.mori, s, true);
      // 돌아온 사람은 이미 한 번 탭해서 들어온 사람이라 소리도 그 상태 그대로 둡니다(휴대폰은 다음 탭부터 남).
      entered.current = true;
    }
    if (back) history.replaceState(null, "", location.pathname);
    setReady(true);
    const onHide = () => {
      if (document.hidden) stopMusic();
      else if (entered.current && currentMusic()) playMusic(currentMusic(), readForest().muted ?? false);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      stopMusic();
    };
    // 처음 한 번만 — openTalk 는 아래에서 정의되지만 렌더마다 같은 일을 합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 도장: 마을 네 부탁을 다 풀었는데 아직 축하하지 않았으면 마을 화면에서 한 번 띄웁니다.
  useEffect(() => {
    // 숲 안(지도·마을·도감)에서만 띄웁니다 — 시작 화면에 축하창이 먼저 뜨면 무슨 일인지 모릅니다.
    if (!ready || talk || stamp || rhythm || screen === "intro" || screen === "pick") return;
    const earned = stampsOf(save.done);
    const fresh = earned.find((v) => !(save.stamped ?? []).includes(v));
    if (fresh) {
      setStamp(fresh as VillageKey);
      if (!save.muted) fanfare();
      update((s) => ({ ...s, stamped: [...(s.stamped ?? []), fresh] }));
    }
  }, [ready, talk, stamp, rhythm, screen, save.done, save.stamped, save.muted, update]);

  const questsIn = (v: VillageKey) => FOREST_QUESTS.filter((q) => villageOf(q.mori) === v);

  function linesFor(code: string, s: ForestSave, thanks: boolean): string[] {
    const w = MORI_WORLD[code];
    const quest = FOREST_QUESTS.find((q) => q.mori === code) as ForestQuest;
    const vName = VILLAGES[villageOf(code)].name;
    if (thanks || quest.slug in s.done) {
      return [`${w.says} 다녀왔구나!`, "고마워. 네 결과는 도감 「특별 모리」 칸에 잘 붙여 뒀어."];
    }
    const first = s.met.includes(code) && code !== me ? [] : [
      code === me ? `어? 너도 ${code} 모리구나! 거울 보는 것 같아.` : `안녕! 나는 ${vName}에서 ${w.role}${eul(w.role)} 맡고 있는 ${code} 모리야.`,
    ];
    // 주민은 처음엔 부탁 대신 마을 놀이를 한 판 청합니다(건너뛰기 가능 — 다른 검사로 가는 길을 막지 않게).
    const invite = inviteOf(code);
    if (invite && !(code in (s.rhythm ?? {}))) return [...first, invite];
    return [...first, quest.ask];
  }

  function openTalk(code: string, s: ForestSave, thanks = false) {
    const lines = linesFor(code, s, thanks);
    const invite = !!inviteOf(code) && lines[lines.length - 1] === inviteOf(code);
    setTalk({ mori: code, lines, line: 0, shown: 0, invite });
    if (!s.met.includes(code)) update((x) => ({ ...x, met: [...x.met, code] }));
  }

  // 글자가 한 자씩 나오고, 두 글자마다 말소리
  useEffect(() => {
    if (!talk) return;
    const text = talk.lines[talk.line];
    if (talk.shown >= text.length) return;
    const id = window.setTimeout(() => {
      setTalk((t) => (t ? { ...t, shown: t.shown + 1 } : t));
      if (!save.muted && talk.shown % 2 === 0 && text[talk.shown] !== " ") blip(talk.mori);
    }, 32);
    return () => window.clearTimeout(id);
  }, [talk, save.muted]);

  const nextLine = () => {
    if (!talk) return;
    const text = talk.lines[talk.line];
    if (talk.shown < text.length) setTalk({ ...talk, shown: text.length });
    else if (talk.line < talk.lines.length - 1) setTalk({ ...talk, line: talk.line + 1, shown: 0 });
  };

  const walkTo = (x: number, y: number, then?: () => void) => {
    setFacing(x < pos.x ? -1 : 1);
    setPos({ x, y });
    setWalking(true);
    window.clearTimeout(walkTimer.current);
    walkTimer.current = window.setTimeout(() => {
      setWalking(false);
      then?.();
    }, WALK_MS);
  };

  /* ----- 화면 전환 ----- */

  /** withSound: 시작 화면의 「소리 켜고 들어가기」 — 소리 설정을 켜고 들어갑니다 */
  const enterForest = (withSound = false) => {
    entered.current = true;
    audioCtx(); // 첫 탭에서 소리 잠금 풀기
    const muted = withSound ? false : !!save.muted;
    if (withSound && save.muted) update((s) => ({ ...s, muted: false }));
    playMusic("forest", muted);
    setScreen("map");
  };

  const goVillage = (v: VillageKey) => {
    playMusic(v, !!save.muted);
    setMapAt(v);
    window.setTimeout(() => {
      setVillage(v);
      setPos(START);
      setScreen("village");
      window.scrollTo({ top: frameTop(), behavior: "smooth" });
    }, 450);
  };

  const openGame = (code: string) => {
    setTalk(null);
    audioCtx();
    stopMusic();
    setRhythm(code);
  };

  /** 마을 놀이를 닫을 때(버튼 탭 안이라 배경곡을 바로 다시 틀 수 있습니다) */
  const closeGame = (code: string, stars: number | null, ask: boolean) => {
    setRhythm(null);
    playMusic(villageOf(code), !!save.muted);
    if (stars === null && !(code in (save.rhythm ?? {}))) return;
    const quest = FOREST_QUESTS.find((q) => q.mori === code) as ForestQuest;
    update((s) => ({ ...s, rhythm: { ...(s.rhythm ?? {}), [code]: Math.max(stars ?? 0, s.rhythm?.[code] ?? 0) } }));
    if (ask) setTalk({ mori: code, lines: quest.slug in save.done ? ["또 놀러 와! 무대는 늘 열려 있어."] : [quest.ask], line: 0, shown: 0 });
  };

  const goMap = () => {
    setTalk(null);
    playMusic("forest", !!save.muted);
    setScreen("map");
  };

  const goDex = () => {
    setTalk(null);
    setScreen("dex");
  };

  const toggleMute = () => {
    const muted = !save.muted;
    update((s) => ({ ...s, muted }));
    if (muted) stopMusic();
    else if (entered.current && currentMusic()) playMusic(currentMusic(), false);
  };

  const pickType = (code: string) => {
    saveMyMori(code);
    setMe(code);
    setVillage(villageOf(code));
    setMapAt(villageOf(code));
    update((s) => ({ ...s, met: s.met.includes(code) ? s.met : [code, ...s.met] }));
    setScreen("intro");
  };

  const onGroundTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (talk) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    if (y < GROUND_TOP) return;
    walkTo(Math.min(94, Math.max(6, x)), Math.min(94, y));
  };

  const onResidentTap = (code: string, slot: { x: number; y: number }) => {
    if (talk) return;
    audioCtx();
    const to = beside(slot);
    walkTo(to.x, to.y, () => openTalk(code, save));
  };

  const goQuest = (quest: ForestQuest) => {
    update((s) => ({ ...s, pending: quest.slug }));
    recordResultClick("forest-quest");
    stopMusic();
  };

  /* ----- 그리기 ----- */

  const metCount = CODES.filter((c) => save.met.includes(c)).length;
  const doneCount = FOREST_QUESTS.filter((q) => q.slug in save.done).length;
  const stamps = stampsOf(save.done);

  return (
    <div className="mf google-auto-ads-ignore" id="mori-forest">
      {screen !== "intro" && screen !== "pick" && (
        <div className="mf-bar">
          {screen === "map" ? <span className="mf-bar-title">🌳 마음숲 지도</span> : <button onClick={goMap}>← 지도</button>}
          <button className="mf-bar-dex" onClick={goDex} aria-label={`도감 ${metCount}/16`}>📖 {metCount}/16</button>
          <button className="mf-mute" onClick={toggleMute} aria-label={save.muted ? "소리 켜기" : "소리 끄기"}>{save.muted ? "🔇" : "🔊"}</button>
        </div>
      )}

      {screen === "intro" && (
        <section className="mf-intro">
          <h1>내 모리랑 <em>마음숲 산책</em></h1>
          {!ready && <p className="mf-intro-copy">숲을 깨우는 중…</p>}
          {ready && me && (
            <>
              <div className="mf-wake" style={{ "--mori": MORI[me].color } as React.CSSProperties}>
                <img src={moriImage(me)} width={200} height={200} alt={`${me} 모리`} />
                <span aria-hidden="true">✨</span>
              </div>
              <p className="mf-intro-copy">
                <b>{me} {names[me]}</b> 모리가 깨어났어요.
                <br />네 마을을 돌며 친구 모리 16명의 부탁을 들어 주세요.
              </p>
              <div className="mf-actions">
                {save.muted ? (
                  <>
                    <button className="mf-primary" onClick={() => enterForest(true)}>🔊 소리 켜고 들어가기</button>
                    <button className="mf-secondary" onClick={() => enterForest()}>🔇 조용히 들어가기</button>
                  </>
                ) : (
                  <button className="mf-primary" onClick={() => enterForest()}>숲에 들어가기 →</button>
                )}
                <button className="mf-text" onClick={() => setScreen("pick")}>내 유형이 아니에요</button>
              </div>
              <p className="mf-hint">배경곡·효과음이 있어요 · 소리는 오른쪽 위 버튼으로 언제든 켜고 꺼요 · 진행은 이 휴대폰에만 저장돼요</p>
            </>
          )}
          {ready && !me && (
            <>
              <div className="mf-sleep">
                {["INFP", "ESTJ", "ENTP", "ISFJ"].map((c) => <img key={c} src={moriImage(c)} width={88} height={88} alt="" />)}
              </div>
              <p className="mf-intro-copy">
                마음속 숲에 사는 모리들이 잠들어 있어요.
                <br />먼저 <b>내 모리</b>를 깨워 주세요.
              </p>
              <div className="mf-actions">
                <button className="mf-primary" onClick={() => setScreen("pick")}>내 유형 알아요 · 10초</button>
                <a className="mf-secondary" href="/tests/mbti/">검사로 알아보기 · 4분</a>
              </div>
            </>
          )}
        </section>
      )}

      {screen === "pick" && (
        <section className="mf-pick">
          <h2>내 유형을 골라 주세요</h2>
          {ORDER.map((v) => (
            <div key={v} className="mf-pick-group" style={{ "--village": VILLAGES[v].color } as React.CSSProperties}>
              <b>{VILLAGES[v].name}</b>
              <div>
                {CODES.filter((c) => villageOf(c) === v).map((c) => (
                  <button key={c} onClick={() => pickType(c)} className={c === me ? "is-me" : ""}>
                    <img src={moriImage(c)} width={64} height={64} alt="" loading="lazy" />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="mf-text" onClick={() => setScreen("intro")}>← 돌아가기</button>
        </section>
      )}

      {screen === "map" && me && (
        <section className="mf-map">
          <div className="mf-map-art">
            <img src="/images/world/map.webp" width={1200} height={896} alt="마음나무 광장과 네 마을이 있는 마음숲 지도" />
            {ORDER.map((v) => (
              <button
                key={v}
                className={`mf-pin${stamps.includes(v) ? " is-stamped" : ""}`}
                style={{ left: `${PINS[v].x}%`, top: `${PINS[v].y}%`, "--village": VILLAGES[v].color } as React.CSSProperties}
                onClick={() => goVillage(v)}
              >
                {stamps.includes(v) && <img src={`/images/forest/stamp-${v}.webp`} width={40} height={40} alt="" />}
                <b>{VILLAGES[v].name}</b>
                <small>{questsIn(v).filter((q) => q.slug in save.done).length}/4</small>
              </button>
            ))}
            <img
              className="mf-map-me"
              src={moriImage(me)}
              width={64}
              height={64}
              alt="내 모리"
              style={{ left: `${PINS[mapAt].x}%`, top: `${PINS[mapAt].y - 15}%` }}
            />
          </div>
          <p className="mf-map-copy">가고 싶은 마을을 눌러 주세요. 마을마다 친구 모리 넷이 부탁을 하나씩 갖고 있어요.</p>
          <div className="mf-stamps" aria-label={`마을 도장 ${stamps.length}/4`}>
            {ORDER.map((v) => (
              <span key={v} className={stamps.includes(v) ? "is-on" : ""}>
                <img src={`/images/forest/stamp-${v}.webp`} width={48} height={48} alt="" />
                <small>{VILLAGES[v].name}</small>
              </span>
            ))}
          </div>
          <p className="mf-progress">부탁 {doneCount}/16 · 만난 모리 {metCount}/16</p>
        </section>
      )}

      {screen === "village" && me && (
        <section className="mf-village" style={{ "--village": VILLAGES[village].color } as React.CSSProperties}>
          <h2>{VILLAGES[village].name} <small>{VILLAGES[village].landmarks}</small></h2>
          <div className="mf-scene" onClick={onGroundTap}>
            {/* 배경은 살짝 흐리게 — 그림에 원래 있는 모리들이 뒤로 물러나고 주민이 앞으로 나옵니다 */}
            <div className="mf-scene-bg" style={{ backgroundImage: `url(${VILLAGES[village].image})` }} aria-hidden="true" />
            {questsIn(village).map((q, i) => {
              const done = q.slug in save.done;
              const s = SLOTS[i];
              return (
                <button
                  key={q.mori}
                  className={`mf-char mf-resident${done ? " is-done" : ""}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%`, zIndex: Math.round(s.y), "--s": depth(s.y) * (SPRITE_SCALE[q.mori] ?? 1), "--delay": `${i * 0.6}s` } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    onResidentTap(q.mori, s);
                  }}
                  aria-label={`${q.mori} 모리와 이야기하기`}
                >
                  <span className="mf-bubble" aria-hidden="true">{done ? "✓" : "!"}</span>
                  <img className="mf-sprite" src={moriSprite(q.mori)} width={290} height={360} alt="" />
                  <span className="mf-tag">{q.mori}</span>
                </button>
              );
            })}
            <div
              className={`mf-char mf-me${walking ? " is-walking" : ""}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: Math.round(pos.y) + 1, "--s": depth(pos.y) * (SPRITE_SCALE[me] ?? 1), "--face": facing } as React.CSSProperties}
            >
              <img className="mf-sprite" src={moriSprite(me)} width={290} height={360} alt="내 모리" />
              <span className="mf-tag is-me">나</span>
            </div>
          </div>
          <p className="mf-hint">땅을 누르면 걸어가요 · 모리를 누르면 이야기해요</p>
        </section>
      )}

      {screen === "dex" && (
        <section className="mf-dex">
          <h2>모리 도감 <small>{metCount}/16</small></h2>
          <div className="mf-dex-grid">
            {CODES.map((c) => {
              const met = save.met.includes(c);
              return (
                <article key={c} className={met ? "is-met" : "is-unknown"} style={{ "--mori": MORI[c].color } as React.CSSProperties}>
                  <img src={moriImage(c)} width={96} height={96} alt={met ? `${c} 모리` : "아직 못 만난 모리"} loading="lazy" />
                  <b>{met ? c : "?"}</b>
                  {met ? (
                    <>
                      <span>{names[c]}</span>
                      <q>{MORI_WORLD[c].says}</q>
                      <small>{MORI_WORLD[c].role}{c === me ? " · 나" : ""}</small>
                    </>
                  ) : (
                    <small>{VILLAGES[villageOf(c)].name}</small>
                  )}
                </article>
              );
            })}
          </div>

          <h2>특별 모리 <small>{doneCount}/16</small></h2>
          <p className="mf-dex-note">부탁을 들어주고 받은 검사 결과가 여기 모여요.</p>
          <div className="mf-special">
            {/* 끝낸 부탁을 앞에 — 빈칸 뒤에 숨으면 모은 게 안 보입니다 */}
            {[...FOREST_QUESTS].sort((a, b) => Number(b.slug in save.done) - Number(a.slug in save.done)).map((q) => {
              const key = save.done[q.slug];
              if (!key) return <div key={q.slug} className="mf-special-empty"><span>{q.mori}의 부탁</span></div>;
              const art = testMoriImage(q.slug, key);
              return (
                <a key={q.slug} href={`/tests/${q.slug}/`} className={art ? "is-mori" : ""}>
                  <img src={art ?? `/images/og/r/${q.slug}-${key}.png`} width={art ? 160 : 240} height={art ? 160 : 126} alt="" loading="lazy" />
                  <span>{testTitles[q.slug]}</span>
                </a>
              );
            })}
          </div>
          <button className="mf-primary" onClick={goMap}>지도로 돌아가기</button>
        </section>
      )}

      {talk && (
        <div className="mf-talk" onClick={nextLine} role="dialog" aria-label={`${talk.mori} 모리와 대화`}>
          <div className="mf-talk-card" style={{ "--mori": MORI[talk.mori].color } as React.CSSProperties}>
            <img src={moriImage(talk.mori)} width={84} height={84} alt="" />
            <b>{talk.mori} 모리 <small>{MORI_WORLD[talk.mori].role}</small></b>
            <p aria-live="polite">{talk.lines[talk.line].slice(0, talk.shown)}<span className="mf-caret" /></p>
            {(() => {
              const last = talk.line === talk.lines.length - 1 && talk.shown >= talk.lines[talk.line].length;
              if (!last) return <small className="mf-talk-next">눌러서 계속 ▸</small>;
              const quest = FOREST_QUESTS.find((q) => q.mori === talk.mori) as ForestQuest;
              const done = quest.slug in save.done;
              return (
                <div className="mf-talk-actions" onClick={(e) => e.stopPropagation()}>
                  {talk.invite ? (
                    <>
                      <button className="mf-primary" onClick={() => openGame(talk.mori)}>{playLabel(talk.mori)} 한 판 하기</button>
                      <button className="mf-text" onClick={() => setTalk({ mori: talk.mori, lines: [quest.ask], line: 0, shown: 0 })}>그냥 부탁 들을래</button>
                    </>
                  ) : done ? (
                    <button className="mf-primary" onClick={goDex}>도감 보기</button>
                  ) : (
                    <a className="mf-primary" href={`/tests/${quest.slug}/`} onClick={() => goQuest(quest)}>
                      {/* 「직업적성 해 보기」처럼 이름만 붙이면 어색해서 「테스트 하러 가기」로 (10-07 사용자 지적) */}
                      {testTitles[quest.slug].endsWith("테스트") ? testTitles[quest.slug] : `${testTitles[quest.slug]} 테스트`} 하러 가기 →
                    </a>
                  )}
                  {!talk.invite && <button className="mf-text" onClick={() => setTalk(null)}>{done ? "닫기" : "다음에 할게"}</button>}
                  {!talk.invite && inviteOf(talk.mori) && (
                    <button className="mf-text" onClick={() => openGame(talk.mori)}>{playLabel(talk.mori)} 한 판 더 {save.rhythm?.[talk.mori] !== undefined ? `(최고 ${"★".repeat(save.rhythm[talk.mori])})` : ""}</button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {rhythm && me && (
        chartOf(rhythm) ? (
          <ForestRhythm mori={rhythm} me={me} muted={!!save.muted} best={save.rhythm?.[rhythm]} onClose={(stars, ask) => closeGame(rhythm, stars, ask)} />
        ) : (
          <ForestMinigame mori={rhythm} me={me} muted={!!save.muted} best={save.rhythm?.[rhythm]} onClose={(stars, ask) => closeGame(rhythm, stars, ask)} />
        )
      )}

      {stamp && (
        <div className="mf-stamp" role="dialog" aria-label="마을 도장">
          <div>
            {stamp === "all" ? (
              <>
                <div className="mf-stamp-row">{ORDER.map((v) => <img key={v} src={`/images/forest/stamp-${v}.webp`} width={64} height={64} alt="" />)}</div>
                <b>지도 완성!</b>
                <p>네 마을 부탁을 모두 들어줬어요. 마음나무가 반짝이기 시작했어요.</p>
              </>
            ) : (
              <>
                <img className="mf-stamp-big" src={`/images/forest/stamp-${stamp}.webp`} width={160} height={160} alt="" />
                <b>{VILLAGES[stamp].name} 도장!</b>
                <p>마을 친구 넷의 부탁을 모두 들어줬어요.</p>
              </>
            )}
            <button
              className="mf-primary"
              onClick={() => {
                // 축하한 도장이 넷이 됐을 때만 — 도장 여럿이 한꺼번에 생기면 마지막 도장 뒤에 한 번
                const all = stamp !== "all" && (save.stamped ?? []).length === 4;
                setStamp(all ? "all" : null);
                if (all && !save.muted) fanfare();
              }}
            >
              좋아요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 대화 끝 버튼 이름: 「🎵 무대에서」 「🌰 도토리 받기」 … */
function playLabel(code: string): string {
  if (chartOf(code)) return "🎵 무대에서";
  const g = minigameOf(code);
  return g ? `${g.play.kind === "acorn" ? "🌰" : g.play.kind === "stars" ? "⭐" : "🏮"} ${g.title}` : "";
}

function frameTop(): number {
  const el = document.getElementById("mori-forest");
  return el ? el.getBoundingClientRect().top + window.scrollY - 8 : 0;
}
