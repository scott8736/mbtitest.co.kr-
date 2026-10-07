"use client";

/**
 * 마을 미니게임 화면 (2026-10-07): 도토리 받기 · 별자리 잇기 · 등불 기억. 설정·채점은 lib/forest-minigames.ts.
 * 머리·준비·결과 카드는 바람 들판 리듬 탭(ForestRhythm)과 같은 모양(.fr-*)을 씁니다.
 * 움직이는 것은 requestAnimationFrame 한 줄기로만 돌리고, 판이 끝나면 멈춥니다.
 */
import { useEffect, useRef, useState } from "react";
import { moriImage } from "../lib/mori";
import { VILLAGES, villageOf } from "../lib/mori-world";
import {
  acornStars, lanternStars, minigameOf, pickConstellations, starStars,
  type AcornLevel, type LanternLevel, type StarLevel,
} from "../lib/forest-minigames";
import { audioCtx, fanfare, tone } from "./forest-sound";

type Finish = (stars: 0 | 1 | 2 | 3, summary: string) => void;

export default function ForestMinigame({ mori, me, muted, best, onClose }: {
  mori: string;
  me: string;
  muted: boolean;
  best?: number;
  onClose: (stars: number | null, ask: boolean) => void;
}) {
  const game = minigameOf(mori)!;
  const [phase, setPhase] = useState<"ready" | "play" | "result">("ready");
  const [round, setRound] = useState(0); // 다시 하기 때 놀이를 새로 만들려고
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [summary, setSummary] = useState("");
  const [hud, setHud] = useState("");

  const start = () => {
    audioCtx(); // 탭 안에서 소리 잠금 풀기
    setRound((r) => r + 1);
    setHud("");
    setPhase("play");
  };

  const finish: Finish = (st, sum) => {
    setStars(st);
    setSummary(sum);
    setPhase("result");
    if (!muted && st >= 2) fanfare();
  };

  const v = VILLAGES[villageOf(mori)];
  return (
    <div className={`fr fm is-${game.play.kind}`} style={{ "--bg": `url(${v.image})` } as React.CSSProperties} role="dialog" aria-label={`${v.name} ${game.title}`}>
      <div className="fr-head">
        <img className="fr-host" src={moriImage(mori)} width={72} height={72} alt="" />
        <div>
          <b>{game.title} · {mori} 모리 <small>{game.level}</small></b>
          {phase === "play" && hud && <span>{hud}</span>}
          {phase !== "play" && best !== undefined && <span>내 최고 {"★".repeat(best)}{"☆".repeat(3 - best)}</span>}
        </div>
        <img className="fr-me" src={moriImage(me)} width={60} height={60} alt="" />
      </div>

      <div className="fr-lane fm-area">
        {phase === "play" && game.play.kind === "acorn" && <AcornGame key={round} level={game.play} me={me} muted={muted} onHud={setHud} onFinish={finish} />}
        {phase === "play" && game.play.kind === "stars" && <StarGame key={round} level={game.play} muted={muted} onHud={setHud} onFinish={finish} />}
        {phase === "play" && game.play.kind === "lantern" && <LanternGame key={round} level={game.play} muted={muted} onHud={setHud} onFinish={finish} />}

        {phase === "ready" && (
          <div className="fr-card">
            <p>{game.rule}</p>
            {muted && <p className="fr-warn">소리가 꺼져 있어요. 켜면 더 재밌어요.</p>}
            <button className="mf-primary" onClick={start}>시작</button>
            <button className="mf-text" onClick={() => onClose(null, false)}>나중에 할게</button>
          </div>
        )}

        {phase === "result" && (
          <div className="fr-card">
            <div className="fr-stars" aria-label={`별 ${stars}개`}>
              {[0, 1, 2].map((i) => <span key={i} className={i < stars ? "is-on" : ""} style={{ animationDelay: `${i * 0.18}s` }}>★</span>)}
            </div>
            <p className="fr-react">“{game.react[stars]}”</p>
            <p className="fr-sum">{summary}</p>
            <button className="mf-primary" onClick={() => onClose(stars, true)}>{mori} 모리 이야기 듣기 →</button>
            <button className="mf-text" onClick={start}>다시 하기</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 도토리 받기 ---------- */

type Drop = { id: number; x: number; y: number; type: "good" | "bad" | "bonus"; done?: boolean };
const ICON = { good: "🌰", bad: "🐛", bonus: "🧁" } as const;
const CATCH_Y = 0.84; // 바구니 높이(영역 비율)
const CATCH_W = 13; // 바구니 반폭(%)

function AcornGame({ level, me, muted, onHud, onFinish }: { level: AcornLevel; me: string; muted: boolean; onHud: (s: string) => void; onFinish: Finish }) {
  const area = useRef<HTMLDivElement | null>(null);
  const [x, setX] = useState(50);
  const xRef = useRef(50);
  const drops = useRef<Drop[]>([]);
  const [, setTick] = useState(0);
  const got = useRef({ good: 0, bonus: 0, bad: 0 });
  const fell = useRef({ good: 0, bonus: 0 });
  const [pop, setPop] = useState<{ id: number; text: string; x: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    let nextSpawn = t0 + 600;
    let id = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const left = level.seconds - (now - t0) / 1000;
      if (left > 0.6 && now >= nextSpawn) {
        const r = Math.random();
        const type = r < level.bad ? "bad" : r < level.bad + level.bonus ? "bonus" : "good";
        drops.current.push({ id: id++, x: 8 + Math.random() * 84, y: -0.08, type });
        if (type === "good") fell.current.good++;
        if (type === "bonus") fell.current.bonus++;
        nextSpawn = now + level.spawnSec * 1000 * (0.75 + Math.random() * 0.5);
      }
      for (const d of drops.current) {
        if (d.done) continue;
        const before = d.y;
        d.y += dt / level.fallSec;
        if (before < CATCH_Y && d.y >= CATCH_Y && Math.abs(d.x - xRef.current) <= CATCH_W) {
          d.done = true;
          got.current[d.type]++;
          if (!muted) d.type === "bad" ? tone(140, 0, 0.18, 0.12, "sawtooth") : tone(d.type === "bonus" ? 1046 : 660 + got.current.good * 6, 0, 0.12, 0.08);
          setPop({ id: d.id, text: d.type === "bad" ? "-1" : d.type === "bonus" ? "+2" : "+1", x: d.x });
        }
        if (d.y > 1.08) d.done = true;
      }
      drops.current = drops.current.filter((d) => !d.done);
      const score = got.current.good + got.current.bonus * 2 - got.current.bad;
      onHud(`남은 시간 ${Math.max(0, Math.ceil(left))}초 · 점수 ${Math.max(0, score)}`);
      setTick((t) => t + 1);
      if (left <= 0 && drops.current.length === 0) {
        const g = got.current;
        onFinish(acornStars(g, fell.current), `🌰 ${g.good}${fell.current.bonus ? ` · 🧁 ${g.bonus}` : ""} · 🐛 ${g.bad} / 떨어진 것 ${fell.current.good + fell.current.bonus}개`);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // 한 판 동안 설정은 바뀌지 않습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return;
    const nx = Math.min(92, Math.max(8, ((e.clientX - box.left) / box.width) * 100));
    xRef.current = nx;
    setX(nx);
  };

  return (
    <div className="fm-acorn" ref={area} onPointerDown={move} onPointerMove={move}>
      {drops.current.filter((d) => !d.done).map((d) => (
        <span key={d.id} className={`fm-drop is-${d.type}`} style={{ left: `${d.x}%`, top: `${d.y * 100}%` }}>{ICON[d.type]}</span>
      ))}
      {pop && <em key={pop.id} className="fm-pop" style={{ left: `${pop.x}%` }}>{pop.text}</em>}
      <div className="fm-basket" style={{ left: `${x}%` }}>
        <img src={moriImage(me)} width={64} height={64} alt="" />
        <span>🧺</span>
      </div>
      <small className="fm-guide">← 손가락으로 끌어요 →</small>
    </div>
  );
}

/* ---------- 별자리 잇기 ---------- */

function StarGame({ level, muted, onHud, onFinish }: { level: StarLevel; muted: boolean; onHud: (s: string) => void; onFinish: Finish }) {
  const [sets] = useState(() =>
    pickConstellations(level.points).map((c) => ({
      name: c.name,
      pts: c.pts.map(([px, py]) => [px + (Math.random() * 6 - 3), py + (Math.random() * 6 - 3)] as [number, number]),
    })),
  );
  const [idx, setIdx] = useState(0); // 지금 별자리
  const [step, setStep] = useState(0); // 이은 별 수
  const [wrong, setWrong] = useState(-1);
  const [cleared, setCleared] = useState(false);
  const deadline = useRef(performance.now() + level.seconds * 1000);
  const doneRef = useRef(0);
  const over = useRef(false);

  const order = (i: number) => (level.reverse ? level.points - 1 - i : i); // step 번째로 눌러야 할 별

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (over.current) return;
      const left = (deadline.current - performance.now()) / 1000;
      onHud(`남은 시간 ${Math.max(0, Math.ceil(left))}초 · 별자리 ${doneRef.current}/3`);
      if (left <= 0) {
        over.current = true;
        onFinish(starStars(doneRef.current), `이은 별자리 ${doneRef.current}/3`);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (i: number) => {
    if (over.current || cleared) return;
    if (i !== order(step)) {
      deadline.current -= 2000;
      setWrong(i);
      if (!muted) tone(160, 0, 0.2, 0.1, "sawtooth");
      window.setTimeout(() => setWrong(-1), 300);
      return;
    }
    if (!muted) tone(523 * Math.pow(2, step / 7), 0, 0.25, 0.08);
    const next = step + 1;
    setStep(next);
    if (next < level.points) return;
    doneRef.current += 1;
    setCleared(true);
    const left = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
    if (doneRef.current >= 3) {
      over.current = true;
      window.setTimeout(() => onFinish(3, `별자리 3/3 · 남은 시간 ${left}초`), 700);
      return;
    }
    window.setTimeout(() => {
      setIdx((x) => x + 1);
      setStep(0);
      setCleared(false);
    }, 800);
  };

  const set = sets[idx];
  if (!set) return null;
  const linked = Array.from({ length: step }, (_, s) => set.pts[order(s)]);
  return (
    <div className="fm-stars">
      <p className="fm-name">{cleared ? `✨ ${set.name} 완성!` : `${idx + 1}번째 별자리${level.reverse ? " · 큰 번호부터!" : ""}`}</p>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={linked.map((p) => p.join(",")).join(" ")} />
      </svg>
      {set.pts.map(([px, py], i) => {
        const pos = level.reverse ? level.points - 1 - i : i; // 이 별의 차례
        const lit = pos < step;
        return (
          <button
            key={`${idx}-${i}`}
            className={`fm-star${lit ? " is-lit" : ""}${wrong === i ? " is-wrong" : ""}${cleared ? " is-clear" : ""}`}
            style={{ left: `${px}%`, top: `${py}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              tap(i);
            }}
            aria-label={`${i + 1}번 별`}
          >
            <span>★</span>
            <b>{i + 1}</b>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 등불 기억 ---------- */

const LANTERN_TONES = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
const LANTERN_COLORS = ["#ffd166", "#ff9fb2", "#9be7c4", "#a0c4ff", "#ffb703", "#cdb4db", "#f4a261", "#8ecae6", "#ffe5a3"];

function LanternGame({ level, muted, onHud, onFinish }: { level: LanternLevel; muted: boolean; onHud: (s: string) => void; onFinish: Finish }) {
  const n = level.grid * level.grid;
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [mode, setMode] = useState<"show" | "input" | "ok" | "fail">("show");
  const [pos, setPos] = useState(0);
  const best = useRef(0);
  const timers = useRef<number[]>([]);
  const max = level.targets[2];

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  // 따라 누르기 차례에 7초 동안 아무것도 안 누르면 그 판은 끝(안 그러면 영영 기다립니다).
  const idle = useRef(0);
  const IDLE_MS = 7000;
  const fail = () => {
    setMode("fail");
    if (!muted) tone(150, 0.1, 0.35, 0.1, "sawtooth");
    later(() => onFinish(lanternStars(best.current, level.targets), `기억한 순서 최고 ${best.current}개 · 목표 ${level.targets.join("·")}개`), 900);
  };
  const armIdle = () => {
    const token = ++idle.current;
    later(() => {
      if (idle.current === token) fail();
    }, IDLE_MS);
  };

  const flash = (i: number, ms: number) => {
    setLit(i);
    if (!muted) tone(LANTERN_TONES[i], 0, ms / 1000, 0.08, "sine");
    later(() => setLit(-1), ms);
  };

  const show = (s: number[]) => {
    setMode("show");
    setPos(0);
    onHud(`${s.length}개 순서 · 잘 보세요`);
    s.forEach((i, k) => later(() => flash(i, level.onMs), 700 + k * (level.onMs + level.gapMs)));
    later(() => {
      setMode("input");
      onHud(`${s.length}개 순서 · 따라 눌러요`);
      armIdle();
    }, 700 + s.length * (level.onMs + level.gapMs));
  };

  useEffect(() => {
    const first = Array.from({ length: level.targets[0] - 1 }, () => Math.floor(Math.random() * n));
    const s = [...first, Math.floor(Math.random() * n)];
    setSeq(s);
    show(s);
    const ts = timers.current;
    return () => ts.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (i: number) => {
    if (mode !== "input") return;
    idle.current++; // 누를 때마다 기다리기 시계를 새로
    flash(i, 220);
    if (seq[pos] !== i) {
      fail();
      return;
    }
    if (pos + 1 < seq.length) {
      setPos(pos + 1);
      armIdle();
      return;
    }
    best.current = seq.length;
    setMode("ok");
    if (seq.length >= max) {
      later(() => onFinish(3, `기억한 순서 최고 ${best.current}개 · 끝까지 성공!`), 700);
      return;
    }
    const next = [...seq, Math.floor(Math.random() * n)];
    later(() => {
      setSeq(next);
      show(next);
    }, 800);
  };

  return (
    <div className="fm-lake">
      <p className="fm-name">{mode === "ok" ? "✨ 맞았어요!" : mode === "fail" ? "앗, 순서가 달라요" : mode === "show" ? "등불을 잘 보세요" : `따라 누르기 ${pos}/${seq.length}`}</p>
      <div className={`fm-grid is-${level.grid}`}>
        {Array.from({ length: n }, (_, i) => (
          <button
            key={i}
            className={`fm-lantern${lit === i ? " is-on" : ""}`}
            style={{ "--glow": LANTERN_COLORS[i] } as React.CSSProperties}
            onPointerDown={(e) => {
              e.preventDefault();
              tap(i);
            }}
            disabled={mode !== "input"}
            aria-label={`${i + 1}번 등불`}
          >
            <i />
          </button>
        ))}
      </div>
    </div>
  );
}
