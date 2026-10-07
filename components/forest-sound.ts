/**
 * 마음숲 산책 소리 (2026-10-07). 배경곡(HTMLAudio 한 개를 돌려 씀)과 합성음(Web Audio)을 한곳에 둡니다.
 * 리듬 탭은 박자를 정확히 맞춰야 해서 같은 곡을 AudioBuffer 로 따로 틀고, 그동안 배경곡은 멈춥니다.
 * 휴대폰은 탭 안에서만 소리를 낼 수 있으니 playMusic·audioCtx 는 탭 처리 함수 안에서 바로 부릅니다.
 */

let ctx: AudioContext | null = null;
let music: HTMLAudioElement | null = null;
let musicKey = "";

export function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function tone(freq: number, at: number, len: number, gain: number, type: OscillatorType = "triangle") {
  const ac = audioCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ac.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + len + 0.02);
}

export function fanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35, 0.09));
}

/** 리듬 탭 타격음: 왼쪽 북(낮게 떨어지는 음) · 오른쪽 탬버린(짧은 잡음) */
export function drum(lane: 0 | 1) {
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const g = ac.createGain();
  g.connect(ac.destination);
  if (lane === 0) {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.16);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.22);
  } else {
    const len = Math.floor(ac.sampleRate * 0.09);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    g.gain.value = 0.35;
    src.connect(hp).connect(g);
    src.start(t);
  }
}

export function playMusic(key: string, muted: boolean) {
  if (typeof window === "undefined") return;
  if (!music) {
    music = new Audio();
    music.loop = true;
    music.volume = 0.45;
  }
  if (musicKey !== key) {
    musicKey = key;
    music.src = `/audio/forest/${key}.m4a`;
  }
  if (muted) music.pause();
  else void music.play().catch(() => {});
}

export function stopMusic() {
  music?.pause();
}

export const currentMusic = () => musicKey;

const buffers = new Map<string, Promise<AudioBuffer | null>>();

/** 리듬 탭용: 곡을 받아 AudioBuffer 로 풉니다. 같은 곡은 한 번만 받습니다. */
export function loadBuffer(key: string): Promise<AudioBuffer | null> {
  const ac = audioCtx();
  if (!ac) return Promise.resolve(null);
  if (!buffers.has(key)) {
    buffers.set(
      key,
      fetch(`/audio/forest/${key}.m4a`)
        .then((r) => r.arrayBuffer())
        .then((a) => new Promise<AudioBuffer>((ok, no) => ac.decodeAudioData(a, ok, no)))
        .catch(() => {
          buffers.delete(key);
          return null;
        }),
    );
  }
  return buffers.get(key)!;
}
