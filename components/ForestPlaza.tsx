"use client";

/**
 * 마음나무 광장 화면 (2026-10-07): 자라는 마음나무 · 하루 한 번 열매 · 짝꿍 카드 뒤집기 · 말버릇 퀴즈 · 우리 숲 입구.
 * 로직은 lib/forest-plaza.ts. 놀이 화면 틀(.fr-*)은 마을 놀이와 같습니다.
 */
import { useEffect, useRef, useState } from "react";
import { MORI, moriImage } from "../lib/mori";
import { MORI_WORLD } from "../lib/mori-world";
import type { ForestSave } from "../lib/mori-forest";
import {
  dayKST, makeQuiz, mateOf, MATES, nextStreak, pairsStars, QUIZ_LEN, quizStars, shuffle, treeStage, type QuizQ,
} from "../lib/forest-plaza";
import { recordResultClick } from "../lib/test-events";
import { audioCtx, fanfare, tone } from "./forest-sound";

type Props = {
  me: string;
  names: Record<string, string>;
  save: ForestSave;
  update: (fn: (s: ForestSave) => ForestSave) => void;
  doneCount: number;
  /** 우리 숲(친구 초대) 입구. 없으면 버튼을 그리지 않습니다 */
  onOurForest?: () => void;
};

export default function ForestPlaza({ me, names, save, update, doneCount, onOurForest }: Props) {
  const [game, setGame] = useState<"pairs" | "quiz" | null>(null);
  const [drop, setDrop] = useState(0);
  const today = dayKST();
  const picked = save.fruitDay === today;
  const stage = treeStage(doneCount);
  const nextAt = stage < 4 ? stage * 4 : null;

  const pickFruit = () => {
    if (picked) return;
    audioCtx();
    if (!save.muted) [784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.3, 0.07));
    setDrop((d) => d + 1);
    update((s) => ({ ...s, fruits: (s.fruits ?? 0) + 1, streak: nextStreak(s.fruitDay, s.streak ?? 0, today), fruitDay: today }));
  };

  const close = (key: "pairsBest" | "quizBest", stars: number | null) => {
    setGame(null);
    if (stars !== null) update((s) => ({ ...s, [key]: Math.max(stars, s[key] ?? 0) }));
  };

  const starText = (n?: number) => (n === undefined ? "" : ` · 최고 ${"★".repeat(n)}${"☆".repeat(3 - n)}`);

  return (
    <section className="mf-plaza">
      <h2>마음나무 광장 <small>숲 한가운데</small></h2>
      <button className={`mf-tree${picked ? " is-picked" : ""}`} onClick={pickFruit} aria-label={picked ? "오늘 열매는 주웠어요" : "열매 줍기"}>
        <img src={`/images/forest/tree-${stage}.webp`} width={768} height={768} alt={`마음나무 ${stage}단계`} />
        {!picked && <span className="mf-tree-fruit" aria-hidden="true"><img src="/images/forest/fruit.webp" width={64} height={64} alt="" /></span>}
        {drop > 0 && <img key={drop} className="mf-fruit-drop" src="/images/forest/fruit.webp" width={56} height={56} alt="" />}
        <span className="mf-tree-cap">
          {picked ? "오늘 열매를 주웠어요 · 내일 또 열려요" : "🍎 오늘의 열매가 열렸어요 · 나무를 눌러 주워요"}
        </span>
      </button>
      <div className="mf-tree-info">
        <span>마음나무 <b>{stage}단계</b>{nextAt ? ` · 부탁 ${nextAt}개를 들어주면 자라요 (${doneCount}/${nextAt})` : " · 다 자랐어요!"}</span>
        <span>모은 열매 <b>{save.fruits ?? 0}</b>개{(save.streak ?? 0) > 1 ? ` · ${save.streak}일 연속` : ""}</span>
      </div>

      <div className="mf-plaza-games">
        <button onClick={() => { audioCtx(); setGame("pairs"); }}>
          <i aria-hidden="true">💞</i>
          <b>짝꿍 카드 뒤집기</b>
          <small>짝꿍끼리 짝을 맞춰요{starText(save.pairsBest)}</small>
        </button>
        <button onClick={() => { audioCtx(); setGame("quiz"); }}>
          <i aria-hidden="true">💬</i>
          <b>말버릇 퀴즈</b>
          <small>누구의 말버릇일까?{starText(save.quizBest)}</small>
        </button>
        {onOurForest && (
          <button className="is-wide" onClick={onOurForest}>
            <i aria-hidden="true">🌳</i>
            <b>우리 숲</b>
            <small>친구를 불러 16칸 숲을 채워요</small>
          </button>
        )}
      </div>

      {game === "pairs" && <ForestPairs me={me} muted={!!save.muted} best={save.pairsBest} onClose={(st) => close("pairsBest", st)} />}
      {game === "quiz" && <ForestQuiz me={me} names={names} muted={!!save.muted} best={save.quizBest} onClose={(st) => close("quizBest", st)} />}
    </section>
  );
}

/* ---------- 짝꿍 카드 뒤집기 ---------- */

function ForestPairs({ me, muted, best, onClose }: { me: string; muted: boolean; best?: number; onClose: (stars: number | null) => void }) {
  const [cards, setCards] = useState(() => shuffle(MATES.flatMap((p) => [p.a, p.b])));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [phase, setPhase] = useState<"ready" | "play" | "result">("ready");
  const lock = useRef(false);

  const restart = () => {
    setCards(shuffle(MATES.flatMap((p) => [p.a, p.b])));
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    setToast(null);
    lock.current = false;
    setPhase("play");
  };

  const flip = (i: number) => {
    if (phase !== "play" || lock.current || open.includes(i) || matched.has(cards[i])) return;
    if (!muted) tone(660, 0, 0.08, 0.05);
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((k) => cards[k]);
    if (mateOf(a) === b) {
      const p = MATES.find((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a))!;
      const m2 = new Set(matched).add(a).add(b);
      setMatched(m2);
      setOpen([]);
      setToast({ text: `💞 ${p.a} × ${p.b} — ${p.hook}`, id: Date.now() });
      if (!muted) [784, 1046].forEach((f, k) => tone(f, k * 0.1, 0.25, 0.08));
      if (m2.size === 16) {
        window.setTimeout(() => {
          setPhase("result");
          if (!muted) fanfare();
        }, 900);
      }
      return;
    }
    lock.current = true;
    window.setTimeout(() => {
      setOpen([]);
      lock.current = false;
    }, 850);
  };

  const first = open.length === 1 ? cards[open[0]] : null;
  const stars = pairsStars(moves);
  return (
    <div className="fr fm fp" style={{ "--bg": "url(/images/world/map.webp)" } as React.CSSProperties} role="dialog" aria-label="짝꿍 카드 뒤집기">
      <div className="fr-head">
        <img className="fr-host" src={moriImage(me)} width={72} height={72} alt="" />
        <div>
          <b>짝꿍 카드 뒤집기 <small>8쌍</small></b>
          {phase === "play" ? <span>뒤집은 횟수 {moves} · 맞힌 짝 {matched.size / 2}/8</span> : best !== undefined && <span>내 최고 {"★".repeat(best)}{"☆".repeat(3 - best)}</span>}
        </div>
      </div>
      <div className="fr-lane fm-area">
        {phase === "play" && (
          <>
            <p className="fp-hint">{first ? `${first} 모리의 짝꿍은 ${mateOf(first)}! 어디 있었지?` : "카드를 두 장씩 뒤집어 짝꿍끼리 맞혀요"}</p>
            <div className="fp-grid">
              {cards.map((c, i) => {
                const up = open.includes(i) || matched.has(c);
                return (
                  <button key={i} className={`fp-card${up ? " is-up" : ""}${matched.has(c) ? " is-done" : ""}`} onPointerDown={(e) => { e.preventDefault(); flip(i); }} aria-label={up ? `${c} 모리` : "뒤집힌 카드"}>
                    <span className="fp-back" aria-hidden="true">🌿</span>
                    <span className="fp-front" style={{ "--mori": MORI[c].color } as React.CSSProperties}>
                      <img src={moriImage(c)} width={80} height={80} alt="" />
                      <b>{c}</b>
                    </span>
                  </button>
                );
              })}
            </div>
            {toast && <p key={toast.id} className="fp-toast">{toast.text}</p>}
          </>
        )}
        {phase === "ready" && (
          <div className="fr-card">
            <p>16모리 카드를 두 장씩 뒤집어 <b>짝꿍끼리</b> 맞혀요.<br />한 장을 뒤집으면 그 모리의 짝꿍이 누군지 알려 줘요.</p>
            <button className="mf-primary" onClick={restart}>시작</button>
            <button className="mf-text" onClick={() => onClose(null)}>나중에 할게</button>
          </div>
        )}
        {phase === "result" && (
          <div className="fr-card">
            <div className="fr-stars" aria-label={`별 ${stars}개`}>
              {[0, 1, 2].map((i) => <span key={i} className={i < stars ? "is-on" : ""} style={{ animationDelay: `${i * 0.18}s` }}>★</span>)}
            </div>
            <p className="fr-react">짝꿍 8쌍을 모두 찾았어요!</p>
            <p className="fr-sum">뒤집은 횟수 {moves}번 (완벽하면 8번)</p>
            <button className="mf-primary" onClick={() => onClose(stars)}>광장으로</button>
            <button className="mf-text" onClick={restart}>다시 하기</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 말버릇 퀴즈 ---------- */

function ForestQuiz({ me, names, muted, best, onClose }: { me: string; names: Record<string, string>; muted: boolean; best?: number; onClose: (stars: number | null) => void }) {
  const [qs, setQs] = useState<QuizQ[]>([]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [wrong, setWrong] = useState<QuizQ[]>([]);
  const [phase, setPhase] = useState<"ready" | "play" | "result">("ready");

  useEffect(() => setQs(makeQuiz()), []);

  const start = () => {
    setQs(makeQuiz());
    setI(0);
    setPick(null);
    setWrong([]);
    setPhase("play");
  };

  const choose = (c: string) => {
    if (pick) return;
    const q = qs[i];
    setPick(c);
    const ok = c === q.answer;
    if (!muted) ok ? tone(880, 0, 0.18, 0.07) : tone(170, 0, 0.25, 0.08, "sawtooth");
    const nextWrong = ok ? wrong : [...wrong, q];
    if (!ok) setWrong(nextWrong);
    window.setTimeout(() => {
      if (i + 1 >= qs.length) {
        setPhase("result");
        if (!muted && QUIZ_LEN - nextWrong.length >= 6) fanfare();
        return;
      }
      setI(i + 1);
      setPick(null);
    }, ok ? 700 : 1300);
  };

  const right = QUIZ_LEN - wrong.length;
  const stars = quizStars(right);
  const q = qs[i];
  return (
    <div className="fr fm fq" style={{ "--bg": "url(/images/world/map.webp)" } as React.CSSProperties} role="dialog" aria-label="말버릇 퀴즈">
      <div className="fr-head">
        <img className="fr-host" src={moriImage(me)} width={72} height={72} alt="" />
        <div>
          <b>말버릇 퀴즈 <small>{QUIZ_LEN}문제</small></b>
          {phase === "play" ? <span>{i + 1}/{QUIZ_LEN} · 맞힘 {i - wrong.length + (pick && pick === q?.answer ? 1 : 0)}</span> : best !== undefined && <span>내 최고 {"★".repeat(best)}{"☆".repeat(3 - best)}</span>}
        </div>
      </div>
      <div className="fr-lane fm-area">
        {phase === "play" && q && (
          <div className="fq-box">
            <p className="fq-prompt">{q.prompt}</p>
            <div className="fq-choices">
              {q.choices.map((c) => (
                <button
                  key={c}
                  className={`fq-choice${pick ? (c === q.answer ? " is-right" : c === pick ? " is-wrong" : " is-dim") : ""}`}
                  onClick={() => choose(c)}
                >
                  <img src={moriImage(c)} width={72} height={72} alt="" />
                  <b>{c}</b>
                  <small>{names[c]}</small>
                </button>
              ))}
            </div>
            {pick && pick !== q.answer && <p className="fq-note">정답은 {q.answer} — {q.kind === "says" ? MORI_WORLD[q.answer].role : `“${MORI_WORLD[q.answer].says}”`}</p>}
          </div>
        )}
        {phase === "ready" && (
          <div className="fr-card">
            <p>말버릇이나 숲에서 맡은 일을 보고<br />어느 모리인지 맞혀요. 모두 {QUIZ_LEN}문제!</p>
            <button className="mf-primary" onClick={start}>시작</button>
            <button className="mf-text" onClick={() => onClose(null)}>나중에 할게</button>
          </div>
        )}
        {phase === "result" && (
          <div className="fr-card fq-result">
            <div className="fr-stars" aria-label={`별 ${stars}개`}>
              {[0, 1, 2].map((k) => <span key={k} className={k < stars ? "is-on" : ""} style={{ animationDelay: `${k * 0.18}s` }}>★</span>)}
            </div>
            <p className="fr-react">{QUIZ_LEN}문제 중 {right}문제 맞혔어요!</p>
            {wrong.length > 0 && (
              <div className="fq-review" onClick={() => recordResultClick("forest-types")}>
                <small>헷갈린 모리 알아보기</small>
                {wrong.map((w) => (
                  <a key={w.answer} href={`/types/${w.answer.toLowerCase()}/`}>
                    <img src={moriImage(w.answer)} width={36} height={36} alt="" />
                    {w.answer} {names[w.answer]} →
                  </a>
                ))}
              </div>
            )}
            <button className="mf-primary" onClick={() => onClose(stars)}>광장으로</button>
            <button className="mf-text" onClick={start}>다시 하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
