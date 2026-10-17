"use client";

/**
 * 리포트 주문 폼 (2026-10-04). 검사 결과(sessionStorage)의 유형·점수로 주문합니다.
 * 금액은 화면에 보여 주기만 하고 서버로 보내지 않습니다 — 서버가 lib/report-config.ts 의 값으로 결제창을 엽니다.
 * 할인권은 2026-10-14 사용자 결정("효과 없다")으로 화면에서 뺐습니다. 서버(worker/report.ts)의 할인 처리는 그대로 두되 화면은 번호를 보내지 않습니다.
 * 2026-10-14: 표지 이름은 랜덤으로 미리 채우고, 약관 동의는 미리 체크해 두고 눌러서 내용을 봅니다.
 * 판매 페이지 안 단계 기록(2026-10-08): 결과 있음/없음 → 폼 봄 → 입력 시작 → 결제 버튼 → 오류. 관리자 깔때기 표 아래 줄에 나옵니다.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { questions, typeData, type Axis } from "../lib/mbti-data";
import { readLastResult } from "../lib/my-mori";
import { BIRTH_TIME_SLOTS, REPORT_CONSENT_TEXT, REPORT_CONSENT_VERSION, REPORT_TERMS } from "../lib/report-config";
import { randomNick } from "../lib/random-nick";
import { useReportPricing, won } from "./ReportEvent";
import { recordTestEventOnce, type ReportStep } from "../lib/test-events";

const step = (s: ReportStep) => recordTestEventOnce(s, "report_step");

type Stored = { result: string; scores: Record<Axis, number> };
const AXES: Axis[] = ["EI", "SN", "TF", "JP"];

/** 유입 경로(components/TouchRecorder) + 어느 버튼으로 들어왔는지(?from=). 관리자 주문 표에만 쓰입니다. */
function readTouch(): Record<string, string> {
  const entry = new URLSearchParams(location.search).get("from") ?? "";
  try {
    const t = JSON.parse(localStorage.getItem("mori-touch") ?? "{}") as Record<string, string>;
    return { ref: String(t.ref ?? ""), landing: String(t.landing ?? ""), utm: String(t.utm ?? ""), entry };
  } catch {
    return { ref: "", landing: "", utm: "", entry };
  }
}

function readStored(): Stored | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("mbti-test-result") ?? "null") as Stored | null;
    if (parsed && typeData[parsed.result] && parsed.scores) return parsed;
    // 탭을 닫았다가 다른 날 와도 이 기기에 남은 마지막 결과로 주문할 수 있게(lib/my-mori.ts)
    const last = readLastResult();
    return last && typeData[last.result] ? (last as Stored) : null;
  } catch {
    return null;
  }
}

/** 결과 화면과 같은 계산이되, 리포트는 실제 값을 씁니다(화면 막대처럼 10~90 으로 자르지 않음). */
function leftPercents(scores: Record<Axis, number>): number[] {
  const per = questions.filter((q) => q.axis === "EI").length;
  return AXES.map((axis) => Math.round(((scores[axis] + per) / (2 * per)) * 100));
}

export default function ReportBuy() {
  const [stored, setStored] = useState<Stored | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [bt, setBt] = useState(0);
  const [phone, setPhone] = useState("");
  // 약관 동의는 미리 체크해 두고(2026-10-14 사용자 요청) 눌러서 내용을 봅니다. 체크를 풀면 결제가 막힙니다.
  const [agree, setAgree] = useState(true);
  // 2026-10-13 폼 63명 중 1명만 입력 시작 → 처음엔 결제 버튼만 보이고, 누르면 번호·동의 칸이 열립니다.
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const { ready: priced, price } = useReportPricing();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // 표지에 넣을 이름은 입력이 귀찮으니 랜덤으로 미리 채웁니다(2026-10-14). 마음에 안 들면 고치면 됩니다.
  useEffect(() => setName(randomNick(10)), []);

  // sessionStorage 는 마운트 뒤에만 읽을 수 있어 한 박자 늦게 읽습니다(정적 렌더와 어긋나지 않게).
  useEffect(() => {
    const id = setTimeout(() => {
      const found = readStored();
      setStored(found);
      setReady(true);
      step(found ? "page_has" : "page_none");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // 주문 폼이 화면에 절반 이상 들어오면 「폼 봄」. 미리보기·설명에서 나간 사람과 폼까지 온 사람을 가릅니다.
  useEffect(() => {
    const form = formRef.current;
    if (!form || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        step("form_seen");
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(form);
    return () => io.disconnect();
  }, [ready, stored]);

  if (!ready) return <div className="rp-box">불러오는 중…</div>;
  if (!stored) {
    return (
      <div className="rp-box">
        <p><b>리포트는 내 검사 점수로 만들어져요.</b> 이 기기에 검사 결과가 없어서 아직 주문할 수 없어요.</p>
        <p>무료 40문항 검사(가입 없음)를 끝내면 결과 화면과 이 페이지에서 바로 주문할 수 있어요.</p>
        <Link className="rp-button" href="/tests/mbti/">무료 검사하고 내 리포트 만들기</Link>
      </div>
    );
  }

  const percents = leftPercents(stored.scores);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!agree) {
      step("error");
      return setError("환불 안내에 동의해 주세요.");
    }
    setBusy(true);
    try {
      const response = await fetch("/api/report/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: stored.result, scores: percents, name, birth, bt: birth ? bt : 0, phone, agree, consentVersion: REPORT_CONSENT_VERSION, touch: readTouch() }),
      });
      const data = (await response.json()) as { payurl?: string; error?: string };
      if (!response.ok || !data.payurl) {
        throw new Error(data.error || "결제창을 열지 못했어요.");
      }
      location.assign(data.payurl);
    } catch (e) {
      step("error");
      setError(e instanceof Error ? e.message : "결제창을 열지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <form ref={formRef} className="rp-box rp-form" onSubmit={submit} onFocusCapture={() => step("form_start")} onInvalidCapture={() => step("error")}>
      <p className="rp-mine">
        내 결과 <b>{stored.result}</b> · {AXES.map((axis, i) => `${axis[percents[i] >= 50 ? 0 : 1]} ${Math.max(percents[i], 100 - percents[i])}%`).join(" · ")}
      </p>
      <p className="rp-sum">
        <b>{priced ? won(price) : "9,900원"}</b> · A4 104쪽 PDF · 내 유형 캐릭터와 AI 대화 7일 포함
      </p>
      {/* 2026-10-18 안심 두 줄(사용자 승인 문구 그대로). 결제 폼 → 입력 시작 1.7% — 처음 보는 사이트라 망설인다고 봄. */}
      <ul className="rp-trust">
        <li>🔒 결제는 페이앱 안전결제창</li>
        <li>📱 번호는 주문 다시 찾기용 · 광고 문자 없음</li>
      </ul>
      {!opened ? (
        <button
          className="rp-button"
          type="button"
          onClick={() => {
            step("form_start");
            setOpened(true);
          }}
        >
          {priced ? `${won(price)} 결제하기` : "결제하기"}
        </button>
      ) : (
      <>
      {/* 2026-10-08 판매 페이지 → 결제창 2.0%: 처음에는 꼭 필요한 칸(번호·동의)만 보이게 하고, 선택 칸 셋은 접어 둡니다. */}
      <label>
        <span>휴대폰 번호 (필수)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="01012345678" required autoComplete="tel" autoFocus />
        <small className="rp-hint">결제 확인과 리포트 다시 찾기에만 써요. 광고 문자는 보내지 않아요.</small>
      </label>
      {/* 2026-10-14 사용자 요청: 처음부터 펼쳐 두고, 생년월일이 없으면 사주 장이 없다는 것을 알립니다. */}
      <details className="rp-extra" open>
        <summary>표지 이름 바꾸기 · 생년월일 넣기 (선택 · 생일을 넣으면 사주 장 6쪽 추가)</summary>
        <label>
          <span>표지에 넣을 이름 (바꿔도 돼요 · 10자)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} placeholder="예: 하늘" autoComplete="off" />
        </label>
        <label>
          <span>생년월일</span>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} min="1900-01-01" max="2026-12-31" />
          <small className="rp-hint">{birth ? "입력한 생년월일로 사주 분석 6쪽이 더해져 110쪽으로 만들어져요." : "생년월일을 입력하지 않으면 사주 분석은 제공되지 않아요. (104쪽)"}</small>
        </label>
        {birth ? (
          <label>
            <span>태어난 시간 (모르면 「모름」)</span>
            <select value={bt} onChange={(e) => setBt(Number(e.target.value))}>
              {BIRTH_TIME_SLOTS.map((label, i) => (
                <option key={label} value={i}>{label}</option>
              ))}
            </select>
          </label>
        ) : null}
      </details>
      <div className="rp-terms">
        <label className="rp-agree">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>(필수) 이용약관·환불 안내에 동의해요. {REPORT_CONSENT_TEXT}</span>
        </label>
        <details>
          <summary>이용약관·환불 안내 내용 보기</summary>
          <div className="rp-terms-body">
            {REPORT_TERMS.map(([title, body]) => (
              <div key={title}>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
            <p><a href="/refund/">환불 안내 전문 보기</a></p>
          </div>
        </details>
      </div>
      {error ? <p className="rp-error" role="alert">{error}</p> : null}
      {/* 번호 칸이 비면 브라우저가 onSubmit 전에 막으므로, 누름은 버튼에서 셉니다. */}
      <button className="rp-button" type="submit" disabled={busy} onClick={() => step("submit")}>
        {busy ? "결제창 여는 중…" : priced ? `${won(price)} 결제하기` : "결제하기"}
      </button>
      </>
      )}
    </form>
  );
}

/** 무료 미리보기 여섯 쪽(표지·내 유형·내 점수·16유형·연애 장·13개월 달력). 내 검사 결과가 있으면 내 유형 견본을, 없거나 아직 없는 유형이면 INFP 견본을 보여 줍니다. */
const PREVIEW_PAGES = [1, 2, 3, 4, 5, 6];

/**
 * 무료 미리보기 6쪽 (2026-10-05 개선). 휴대폰에서 옆으로 넘기는 띠였는데 넘길 수 있다는 표시가 없어
 * 1쪽만 보고 지나갔습니다. 다음 쪽을 살짝 보이게 하고, 「1 / 6」·화살표·점을 달고,
 * 누르면 크게 보는 화면(이전·다음)을 엽니다.
 */
export function ReportPreview() {
  const [type, setType] = useState("INFP");
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  // 2026-10-18 흐린 미리보기(결과 화면 카드와 같은 21쪽: 선명 9 + 군데군데 가린 12, 표지 제외). 쪽 정보를 못 받으면 예전 6쪽.
  const [teaser, setTeaser] = useState<{ type: string; clear: number[]; half: number[] } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/report-app/teaser/${type}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && Array.isArray(j.clear) && Array.isArray(j.half)) setTeaser({ type, clear: j.clear, half: j.half }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [type]);
  const items: { n: number; src: string; half: boolean }[] = teaser && teaser.type === type
    ? [...teaser.clear.map((n) => ({ n, half: false })), ...teaser.half.map((n) => ({ n, half: true }))]
        .sort((a, b) => a.n - b.n)
        .map(({ n, half }) => ({ n, half, src: `/report-app/teaser/${type}/${half ? "h" : "c"}${n}.webp` }))
    : PREVIEW_PAGES.map((n) => ({ n, half: false, src: `/report-app/preview/${type}-${n}.jpg` }));
  useEffect(() => {
    const id = setTimeout(() => {
      const parsed = readStored();
      if (parsed) setType(parsed.result);
    }, 0);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((n) => (n === null ? n : Math.min(n + 1, items.length - 1)));
      if (e.key === "ArrowLeft") setOpen((n) => (n === null ? n : Math.max(n - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  const fallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.includes("INFP")) img.src = img.src.replace(`/${type}/`, "/INFP/").replace(`/${type}-`, "/INFP-");
  };
  const go = (i: number) => {
    const el = strip.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = strip.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    setAt(Math.min(items.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 10))));
  };

  return (
    <div className="rp-preview-wrap">
      <div className="rp-preview-bar">
        <span className="rp-hint-m">👉 옆으로 넘겨 보세요 · 누르면 크게 보여요</span>
        <span className="rp-hint-d">👉 쪽을 누르면 크게 보여요</span>
        <b>{at + 1} / {items.length}</b>
      </div>
      <div className="rp-preview-box">
        <div className="rp-preview" ref={strip} onScroll={onScroll}>
          {items.map((it, i) => (
            <button type="button" key={it.src} onClick={() => setOpen(i)} aria-label={`미리보기 ${it.n}쪽 크게 보기`} className={it.half ? "is-half" : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
              <img src={it.src} alt={`${type} 리포트 미리보기 ${it.n}쪽${it.half ? "(일부 가림)" : ""}`} loading="lazy" onError={fallback} />
              {it.half ? <span className="rp-lock">🔒 나머지는 결제 후</span> : null}
            </button>
          ))}
        </div>
        {at > 0 ? <button type="button" className="rp-preview-arrow is-prev" onClick={() => go(at - 1)} aria-label="이전 쪽">‹</button> : null}
        {at < items.length - 1 ? <button type="button" className="rp-preview-arrow is-next" onClick={() => go(at + 1)} aria-label="다음 쪽">›</button> : null}
      </div>
      <div className="rp-preview-dots" aria-hidden="true">
        {items.length <= 8 ? items.map((it, i) => <i key={it.n} className={i === at ? "on" : ""} />) : null}
      </div>

      {open !== null ? (
        <div className="rp-lightbox" role="dialog" aria-modal="true" aria-label="미리보기 크게 보기" onClick={() => setOpen(null)}>
          <div className="rp-lightbox-in" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
            <img src={items[open].src} alt={`${type} 리포트 미리보기 ${items[open].n}쪽`} onError={fallback} />
            <div className="rp-lightbox-nav">
              <button type="button" onClick={() => setOpen(Math.max(open - 1, 0))} disabled={open === 0}>‹ 이전</button>
              <b>{open + 1} / {items.length}</b>
              <button type="button" onClick={() => setOpen(Math.min(open + 1, items.length - 1))} disabled={open === items.length - 1}>다음 ›</button>
            </div>
            <button type="button" className="rp-lightbox-close" onClick={() => setOpen(null)} aria-label="닫기">×</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
