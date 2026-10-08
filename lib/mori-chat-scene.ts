/**
 * 모리 대화창 「지금 숲의 풍경」 (2026-10-08 사용자 요청: 날씨·아침·점심·저녁·특별한 날에 맞게 바뀌기).
 *
 * 서버(worker/mori-chat.ts)가 계산해 화면에 보내고, 같은 내용을 AI 지시문에도 한 줄 넣어 모리가 자연스럽게 꺼내게 합니다.
 * 시간대·특별한 날은 한국 시각으로 서버가 정하고, 날씨는 기상청 초단기실황(키가 있을 때만)입니다.
 * 특별한 날은 날짜가 확실한 것만 둡니다 — 음력 명절은 korean-lunar-calendar 로 해마다 계산합니다.
 */
import KoreanLunarCalendar from "korean-lunar-calendar";
import { iya } from "./mori-chat";

export type SlotKey = "dawn" | "morning" | "lunch" | "afternoon" | "evening" | "night";
export type WeatherKind = "clear" | "cloudy" | "rain" | "snow";

export type Scene = {
  slot: SlotKey;
  slotName: string;
  special: { key: string; name: string; emoji: string } | null;
  weather: { kind: WeatherKind; temp: number | null } | null;
};

export const SLOT_NAMES: Record<SlotKey, string> = {
  dawn: "새벽", morning: "아침", lunch: "점심", afternoon: "오후", evening: "저녁", night: "밤",
};

/** 한국 시각 시(0~23) → 시간대 */
export function slotOf(hour: number): SlotKey {
  if (hour < 5) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 14) return "lunch";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

/** 양력으로 날짜가 정해진 날 (월-일) */
const SOLAR_DAYS: Record<string, { key: string; name: string; emoji: string }> = {
  "01-01": { key: "newyear", name: "새해 첫날", emoji: "🎍" },
  "02-14": { key: "valentine", name: "밸런타인데이", emoji: "🍫" },
  "03-01": { key: "samiljeol", name: "삼일절", emoji: "🇰🇷" },
  "03-14": { key: "whiteday", name: "화이트데이", emoji: "🍬" },
  "05-05": { key: "children", name: "어린이날", emoji: "🎈" },
  "05-08": { key: "parents", name: "어버이날", emoji: "💐" },
  "05-15": { key: "teachers", name: "스승의 날", emoji: "🌷" },
  "06-06": { key: "memorial", name: "현충일", emoji: "🕊️" },
  "08-15": { key: "liberation", name: "광복절", emoji: "🇰🇷" },
  "10-03": { key: "gaecheon", name: "개천절", emoji: "🌄" },
  "10-09": { key: "hangeul", name: "한글날", emoji: "ㄱ" },
  "10-31": { key: "halloween", name: "핼러윈", emoji: "🎃" },
  "11-11": { key: "pepero", name: "빼빼로데이", emoji: "🥢" },
  "12-24": { key: "xmas-eve", name: "크리스마스이브", emoji: "🎄" },
  "12-25": { key: "xmas", name: "크리스마스", emoji: "🎄" },
  "12-31": { key: "newyear-eve", name: "한 해의 마지막 날", emoji: "🎆" },
};

/** 음력 명절: 설날(1/1 앞뒤 하루)·정월대보름·추석(8/15 앞뒤 하루) */
function lunarSpecial(y: number, m: number, d: number): { key: string; name: string; emoji: string } | null {
  try {
    const cal = new KoreanLunarCalendar();
    if (!cal.setSolarDate(y, m, d)) return null;
    const l = cal.getLunarCalendar() as { month: number; day: number; intercalation?: boolean };
    if (l.intercalation) return null;
    // 설 연휴 첫날은 음력 12월 말일(29 또는 30)이라, 다음 날이 음력 1/1 인지로 판단합니다.
    const next = new KoreanLunarCalendar();
    const t = new Date(Date.UTC(y, m - 1, d + 1));
    next.setSolarDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    const ln = next.getLunarCalendar() as { month: number; day: number; intercalation?: boolean };
    if ((l.month === 1 && (l.day === 1 || l.day === 2)) || (ln.month === 1 && ln.day === 1 && !ln.intercalation)) {
      return { key: "seollal", name: "설날 연휴", emoji: "🧧" };
    }
    if (l.month === 1 && l.day === 15) return { key: "daeboreum", name: "정월대보름", emoji: "🌕" };
    if (l.month === 8 && l.day >= 14 && l.day <= 16) return { key: "chuseok", name: "추석 연휴", emoji: "🌕" };
  } catch {
    // 변환이 안 되는 날짜는 특별한 날이 아닌 것으로 둡니다.
  }
  return null;
}

/** 한국 시각 기준 연·월·일·시 */
export function seoulClock(at: Date): { y: number; m: number; d: number; h: number } {
  const t = new Date(at.getTime() + 9 * 3600_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours() };
}

export function specialDay(at: Date): Scene["special"] {
  const { y, m, d } = seoulClock(at);
  return lunarSpecial(y, m, d) ?? SOLAR_DAYS[`${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`] ?? null;
}

export function sceneAt(at: Date, weather: Scene["weather"] = null): Scene {
  const slot = slotOf(seoulClock(at).h);
  return { slot, slotName: SLOT_NAMES[slot], special: specialDay(at), weather };
}

const WEATHER_NAMES: Record<WeatherKind, string> = { clear: "맑은", cloudy: "흐린", rain: "비 오는", snow: "눈 오는" };

/** AI 지시문에 넣는 한 줄. 모리가 매번 날씨 얘기만 하지 않게 「어울릴 때만」이라고 적는다. */
export function sceneLine(s: Scene): string {
  const parts = [`지금은 한국 시각 ${s.slotName}`];
  if (s.weather) parts.push(`${WEATHER_NAMES[s.weather.kind]} 날${s.weather.temp !== null ? `(${Math.round(s.weather.temp)}도)` : ""}`);
  if (s.special) parts.push(`오늘은 ${s.special.name}`);
  return `지금 상황: ${parts.join(", ")}. 대화에 어울릴 때만 가끔 자연스럽게 꺼내(첫인사나 안부 정도). 시간·날씨를 지어내지 마.`;
}

/** 화면 첫인사 앞머리(AI 를 부르지 않는다) */
export function sceneHello(s: Scene): string {
  if (s.special) return `${s.special.emoji} 오늘은 ${s.special.name}${iya(s.special.name)}!`;
  const w = s.weather?.kind;
  if (w === "rain") return "☔ 비가 오네.";
  if (w === "snow") return "❄️ 눈이 와!";
  const by: Record<SlotKey, string> = {
    dawn: "🌙 이 시간까지 깨어 있구나.", morning: "☀️ 좋은 아침!", lunch: "🍚 점심은 먹었어?",
    afternoon: "🌤️ 오후도 힘내고 있어?", evening: "🌆 오늘 하루 어땠어?", night: "🌙 오늘도 수고했어.",
  };
  return by[s.slot];
}

// ── 기상청 초단기실황 ──

/** 위경도 → 기상청 격자(nx, ny). 기상청 「단기예보 격자 변환」 람베르트 정각원추 공식. */
export function kmaGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0, OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD, olon = OLON * DEGRAD, olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return { nx: Math.floor(ra * Math.sin(theta) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5) };
}

/** 초단기실황 항목 → 날씨. PTY(강수형태) 1·2·5·6 비, 3·7 눈. 실황에는 하늘 상태(SKY)가 없어 강수가 없으면 「맑은」으로 둔다. */
export function weatherFromNcst(items: { category: string; obsrValue: string }[]): Scene["weather"] {
  const v = (c: string) => items.find((i) => i.category === c)?.obsrValue;
  const pty = Number(v("PTY") ?? NaN);
  const temp = Number(v("T1H") ?? NaN);
  if (!Number.isFinite(pty)) return null;
  const kind: WeatherKind = [1, 2, 5, 6].includes(pty) ? "rain" : [3, 7].includes(pty) ? "snow" : "clear";
  return { kind, temp: Number.isFinite(temp) ? temp : null };
}

/** 초단기실황 발표 시각: 매시 정각 자료가 40분쯤 올라오므로 45분 전으로 잡는다. */
export function kmaBase(at: Date): { date: string; time: string } {
  const t = new Date(at.getTime() + 9 * 3600_000 - 45 * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}`, time: `${p(t.getUTCHours())}00` };
}
