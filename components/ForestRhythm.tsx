"use client";

/**
 * 바람 들판 「축제 무대 리듬 탭」 화면 (2026-10-07). 악보·판정은 lib/forest-rhythm.ts.
 *
 * 박자는 Web Audio 시계(ctx.currentTime)로만 잽니다. 곡을 AudioBuffer 로 틀어 시작 시각을 정확히 알고,
 * 휴대폰 출력 지연(outputLatency)만큼 화면과 판정을 늦춥니다 — 귀에 들린 박에 맞춰 누른 것을 퍼펙트로.
 * 음표 위치는 매 프레임 transform 으로만 바꿉니다(React 다시 그리기 없음). 점수판만 바뀔 때 다시 그립니다.
 */
import { useEffect, useRef, useState } from "react";
import { moriImage } from "../lib/mori";
import { chartOf, COUNT_IN_BEATS, GOOD_SEC, judgeOf, LOOP_BEATS, notesOf, starsOf, type Judge } from "../lib/forest-rhythm";
import { audioCtx, drum, fanfare, loadBuffer, stopMusic } from "./forest-sound";

const LEAD_BEATS = 2; // 음표가 나타나서 판정선까지 오는 박 수
const LANES = ["🥁 북", "✨ 탬버린"];

type Stats = { perfect: number; good: number; miss: number; combo: number; best: number };
const ZERO: Stats = { perfect: 0, good: 0, miss: 0, combo: 0, best: 0 };

export default function ForestRhythm({ mori, me, muted, best, onClose }: {
  mori: string;
  me: string;
  muted: boolean;
  best?: number;
  /** stars: 이번 판 별(안 끝내고 나가면 null), ask: 「부탁 듣기」를 눌렀는지 */
  onClose: (stars: number | null, ask: boolean) => void;
}) {
  const chart = chartOf(mori)!;
  const notes = useRef(notesOf(chart).map((n) => ({ ...n, judged: false as Judge | false })));
  const [phase, setPhase] = useState<"ready" | "loading" | "play" | "result">("ready");
  const [stats, setStats] = useState<Stats>(ZERO);
  const [flash, setFlash] = useState<{ text: Judge; id: number } | null>(null);
  const [beat, setBeat] = useState(-1);
  const statsRef = useRef<Stats>(ZERO);
  const noteEls = useRef<(HTMLDivElement | null)[]>([]);
  const lane = useRef<HTMLDivElement | null>(null);
  const clock = useRef({ t0: 0, beatSec: 0.649, latency: 0, raf: 0 });
  const source = useRef<AudioBufferSourceNode | null>(null);
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);

  // 화면이 열리면 곡을 미리 받아 둡니다(시작 버튼에서 기다리지 않게).
  useEffect(() => {
    void loadBuffer("sp");
    return () => {
      cancelAnimationFrame(clock.current.raf);
      try {
        source.current?.stop();
      } catch {
        // 이미 멈춘 곡
      }
    };
  }, []);

  const bump = (fn: (s: Stats) => Stats) => {
    statsRef.current = fn(statsRef.current);
    setStats(statsRef.current);
  };

  const judge = (j: Judge) => {
    bump((s) => {
      const combo = j === "miss" ? 0 : s.combo + 1;
      return { ...s, [j]: s[j] + 1, combo, best: Math.max(s.best, combo) };
    });
    setFlash({ text: j, id: Date.now() });
  };

  const finish = () => {
    cancelAnimationFrame(clock.current.raf);
    try {
      source.current?.stop();
    } catch {
      // 이미 멈춘 곡
    }
    const s = statsRef.current;
    const st = starsOf(s.perfect, s.good, notes.current.length);
    setStars(st);
    setPhase("result");
    if (!muted && st >= 2) fanfare();
  };

  const frame = () => {
    const ac = audioCtx();
    const el = lane.current;
    if (!ac || !el) return;
    const { t0, beatSec, latency } = clock.current;
    const now = ac.currentTime - latency;
    const b = (now - t0) / beatSec;
    const h = el.clientHeight * 0.86; // 판정선 높이
    notes.current.forEach((n, i) => {
      const node = noteEls.current[i];
      if (!node) return;
      const ahead = n.beat - b;
      if (!n.judged && (n.beat * beatSec + GOOD_SEC) < (now - t0)) {
        n.judged = "miss";
        judge("miss");
      }
      if (n.judged || ahead > LEAD_BEATS + 0.2) {
        node.style.opacity = "0";
        return;
      }
      node.style.opacity = "1";
      node.style.transform = `translate(-50%, ${h * (1 - ahead / LEAD_BEATS)}px)`;
    });
    const whole = Math.floor(b);
    setBeat((prev) => (prev === whole ? prev : whole));
    const last = notes.current[notes.current.length - 1].beat;
    if (b > last + 1.5) {
      finish();
      return;
    }
    clock.current.raf = requestAnimationFrame(frame);
  };

  const start = async () => {
    const ac = audioCtx(); // 탭 안에서 소리 잠금 풀기
    stopMusic();
    if (!ac) return;
    setPhase("loading");
    const buf = await loadBuffer("sp");
    if (!buf) {
      setPhase("ready");
      return;
    }
    notes.current.forEach((n) => (n.judged = false));
    statsRef.current = ZERO;
    setStats(ZERO);
    setFlash(null);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ac.createGain();
    g.gain.value = muted ? 0 : 0.8;
    src.connect(g).connect(ac.destination);
    const t0 = ac.currentTime + 0.25;
    src.start(t0);
    source.current = src;
    const latency = (ac.outputLatency || 0) + (ac.baseLatency || 0);
    clock.current = { t0, beatSec: buf.duration / LOOP_BEATS, latency, raf: 0 };
    setPhase("play");
    clock.current.raf = requestAnimationFrame(frame);
  };

  const hit = (l: 0 | 1) => {
    if (phase !== "play") return;
    if (!muted) drum(l);
    const ac = audioCtx();
    if (!ac) return;
    const { t0, beatSec, latency } = clock.current;
    const at = ac.currentTime - latency - t0;
    let pick = -1;
    let diff = Infinity;
    notes.current.forEach((n, i) => {
      if (n.judged || n.lane !== l) return;
      const d = at - n.beat * beatSec;
      if (Math.abs(d) < Math.abs(diff)) {
        diff = d;
        pick = i;
      }
    });
    if (pick < 0 || Math.abs(diff) > GOOD_SEC) return; // 빈 박을 친 것은 벌점 없음
    const j = judgeOf(diff);
    notes.current[pick].judged = j;
    judge(j);
  };

  // 컴퓨터에서는 F·J 키로도
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "f" || e.key === "F" || e.key === "ArrowLeft") hit(0);
      if (e.key === "j" || e.key === "J" || e.key === "ArrowRight") hit(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const count = beat < COUNT_IN_BEATS && beat >= 0 ? ["3", "2", "1", "시작!"][beat] : null;
  const total = notes.current.length;

  return (
    <div className="fr" role="dialog" aria-label="축제 무대 리듬 탭">
      <div className="fr-head">
        <img className={`fr-host${beat >= 0 && beat % 2 === 0 ? " is-up" : ""}`} src={moriImage(mori)} width={72} height={72} alt="" />
        <div>
          <b>축제 무대 · {mori} 모리 <small>{chart.level}</small></b>
          {phase === "play" && <span>콤보 {stats.combo} · 퍼펙트 {stats.perfect}</span>}
          {phase !== "play" && best !== undefined && <span>내 최고 {"★".repeat(best)}{"☆".repeat(3 - best)}</span>}
        </div>
        <img className={`fr-me${beat >= 0 && beat % 2 === 1 ? " is-up" : ""}`} src={moriImage(me)} width={60} height={60} alt="" />
      </div>

      <div className="fr-lane" ref={lane}>
        <i className="fr-split" />
        <i className="fr-line" />
        {notes.current.map((n, i) => (
          <div key={i} ref={(el) => { noteEls.current[i] = el; }} className={`fr-note is-${n.lane === 0 ? "l" : "r"}`} />
        ))}
        {count && <strong className="fr-count" key={beat}>{count}</strong>}
        {flash && phase === "play" && (
          <em key={flash.id} className={`fr-flash is-${flash.text}`}>
            {flash.text === "perfect" ? "퍼펙트!" : flash.text === "good" ? "굿" : "미스"}
          </em>
        )}
        {phase === "play" && stats.combo >= 5 && <span className="fr-combo" key={stats.combo}>{stats.combo} 콤보</span>}

        {(phase === "ready" || phase === "loading") && (
          <div className="fr-card">
            <p>떨어지는 음표가 <b>선에 닿을 때</b> 아래 칸을 눌러요.<br />왼쪽은 🥁 북, 오른쪽은 ✨ 탬버린.</p>
            {muted && <p className="fr-warn">소리가 꺼져 있어요. 오른쪽 위 🔇 를 켜면 박자가 들려요.</p>}
            <button className="mf-primary" onClick={start} disabled={phase === "loading"}>
              {phase === "loading" ? "무대 준비 중…" : "🎵 시작"}
            </button>
            <button className="mf-text" onClick={() => onClose(null, false)}>나중에 할게</button>
          </div>
        )}

        {phase === "result" && (
          <div className="fr-card">
            <div className="fr-stars" aria-label={`별 ${stars}개`}>
              {[0, 1, 2].map((i) => <span key={i} className={i < stars ? "is-on" : ""} style={{ animationDelay: `${i * 0.18}s` }}>★</span>)}
            </div>
            <p className="fr-react">“{chart.react[stars]}”</p>
            <p className="fr-sum">퍼펙트 {stats.perfect} · 굿 {stats.good} · 미스 {stats.miss} / {total} · 최고 콤보 {stats.best}</p>
            <button className="mf-primary" onClick={() => onClose(stars, true)}>{mori} 모리 이야기 듣기 →</button>
            <button className="mf-text" onClick={start}>다시 하기</button>
          </div>
        )}
      </div>

      <div className="fr-pads">
        {LANES.map((label, l) => (
          <button
            key={l}
            className={`fr-pad is-${l === 0 ? "l" : "r"}`}
            onPointerDown={(e) => {
              e.preventDefault();
              hit(l as 0 | 1);
            }}
            aria-label={label}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
