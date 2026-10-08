"use client";

/**
 * 리포트 주문 폼 (2026-10-04). 검사 결과(sessionStorage)의 유형·점수로 주문합니다.
 * 금액은 화면에 보여 주기만 하고 서버로 보내지 않습니다 — 서버가 lib/report-config.ts 의 값으로 결제창을 엽니다.
 * 초대 할인권(2026-10-08): 이 기기에 받은 할인권을 자동으로 붙이고, 번호를 직접 넣을 수도 있습니다.
 * 서버가 번호를 다시 확인해 금액을 깎습니다(worker/report.ts) — 화면의 할인 금액은 보여 주기용입니다.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { questions, typeData, type Axis } from "../lib/mbti-data";
import { readLastResult } from "../lib/my-mori";
import { BIRTH_TIME_SLOTS, REPORT_CONSENT_TEXT, REPORT_CONSENT_VERSION } from "../lib/report-config";
import { useReportPricing, won } from "./ReportEvent";
import { bestCoupon, discounted, myCoupons, normalizeCode, untilText, type Coupon } from "../lib/invite-coupon";

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
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const { ready: priced, price } = useReportPricing();
  const [error, setError] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  /** 서버에 번호를 확인합니다. 쓴 것·기한 지난 것은 붙이지 않습니다. */
  const applyCode = async (raw: string, quiet = false) => {
    const code = normalizeCode(raw);
    if (!code) return;
    setCouponMsg("");
    try {
      const r = await fetch(`/api/forest/coupon?c=${encodeURIComponent(code)}`);
      const j = (await r.json()) as { code?: string; amount?: number; expiresAt?: number; error?: string };
      if (!r.ok || !j.code) throw new Error(j.error || "할인권을 확인하지 못했어요.");
      setCoupon({ code: j.code, amount: Number(j.amount), expiresAt: Number(j.expiresAt), kind: "friend" });
      setCodeInput("");
    } catch (e) {
      if (!quiet) setCouponMsg(e instanceof Error ? e.message : "할인권을 확인하지 못했어요.");
    }
  };

  useEffect(() => {
    const saved = bestCoupon(myCoupons());
    if (saved) void applyCode(saved.code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 한 번만 이 기기에 받은 할인권을 붙입니다
  }, []);

  // sessionStorage 는 마운트 뒤에만 읽을 수 있어 한 박자 늦게 읽습니다(정적 렌더와 어긋나지 않게).
  useEffect(() => {
    const id = setTimeout(() => {
      setStored(readStored());
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  if (!ready) return <div className="rp-box">불러오는 중…</div>;
  if (!stored) {
    return (
      <div className="rp-box">
        <p><b>먼저 무료 MBTI 검사를 해 주세요.</b> 리포트는 검사 점수로 만들어져서, 검사 결과가 있어야 주문할 수 있어요.</p>
        <Link className="rp-button" href="/tests/mbti/">무료 MBTI 검사하기</Link>
      </div>
    );
  }

  const percents = leftPercents(stored.scores);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!agree) return setError("환불 안내에 동의해 주세요.");
    setBusy(true);
    try {
      const response = await fetch("/api/report/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: stored.result, scores: percents, name, birth, bt: birth ? bt : 0, phone, agree, consentVersion: REPORT_CONSENT_VERSION, touch: readTouch(), coupon: coupon?.code }),
      });
      const data = (await response.json()) as { payurl?: string; error?: string };
      if (!response.ok || !data.payurl) {
        // 할인권 문제면 빼고 다시 결제할 수 있게 합니다.
        if (data.error?.includes("할인권")) setCoupon(null);
        throw new Error(data.error || "결제창을 열지 못했어요.");
      }
      location.assign(data.payurl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제창을 열지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <form className="rp-box rp-form" onSubmit={submit}>
      <p className="rp-mine">
        내 결과 <b>{stored.result}</b> · {AXES.map((axis, i) => `${axis[percents[i] >= 50 ? 0 : 1]} ${Math.max(percents[i], 100 - percents[i])}%`).join(" · ")}
      </p>
      <label>
        <span>표지에 넣을 이름 (선택, 10자)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} placeholder="예: 하늘" autoComplete="nickname" />
      </label>
      <label>
        <span>생년월일 (선택) — 넣으면 사주 장 6쪽이 더해져요</span>
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} min="1900-01-01" max="2026-12-31" />
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
      <label>
        <span>휴대폰 번호 (결제창 필수 · 나중에 이 번호로 리포트를 다시 찾아요)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="01012345678" required autoComplete="tel" />
      </label>
      <label className="rp-agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>(필수) {REPORT_CONSENT_TEXT} <a href="/refund/" target="_blank" rel="noopener">환불 안내 보기</a></span>
      </label>
      <div className="rp-coupon">
        {coupon ? (
          <p>
            🎁 할인권 <b>-{won(price ? price - discounted(price, coupon.amount) : coupon.amount)}</b> 적용 · {untilText(coupon.expiresAt)}
            <button type="button" onClick={() => setCoupon(null)}>빼기</button>
          </p>
        ) : (
          <details>
            <summary>할인권 번호가 있어요</summary>
            <div>
              <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="10자리 번호" maxLength={14} autoCapitalize="characters" />
              <button type="button" onClick={() => applyCode(codeInput)}>적용</button>
            </div>
          </details>
        )}
        {couponMsg ? <p className="rp-error" role="alert">{couponMsg}</p> : null}
      </div>
      {error ? <p className="rp-error" role="alert">{error}</p> : null}
      <button className="rp-button" type="submit" disabled={busy}>
        {busy
          ? "결제창 여는 중…"
          : priced
            ? coupon
              ? `${won(discounted(price, coupon.amount))} 결제하기 (${won(price)}에서 할인)`
              : `${won(price)} 결제하기`
            : "결제하기"}
      </button>
    </form>
  );
}

/** 무료 미리보기 여섯 쪽(표지·내 모리·내 점수·16모리·연애 장·13개월 달력). 내 검사 결과가 있으면 내 유형 견본을, 없거나 아직 없는 유형이면 INFP 견본을 보여 줍니다. */
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
      if (e.key === "ArrowRight") setOpen((n) => (n === null ? n : Math.min(n + 1, PREVIEW_PAGES.length - 1)));
      if (e.key === "ArrowLeft") setOpen((n) => (n === null ? n : Math.max(n - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const src = (n: number) => `/report-app/preview/${type}-${n}.jpg`;
  const fallback = (n: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.includes("/INFP-")) img.src = `/report-app/preview/INFP-${n}.jpg`;
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
    setAt(Math.min(PREVIEW_PAGES.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 10))));
  };

  return (
    <div className="rp-preview-wrap">
      <div className="rp-preview-bar">
        <span className="rp-hint-m">👉 옆으로 넘겨 보세요 · 누르면 크게 보여요</span>
        <span className="rp-hint-d">👉 쪽을 누르면 크게 보여요</span>
        <b>{at + 1} / {PREVIEW_PAGES.length}</b>
      </div>
      <div className="rp-preview-box">
        <div className="rp-preview" ref={strip} onScroll={onScroll}>
          {PREVIEW_PAGES.map((n, i) => (
            <button type="button" key={`${type}-${n}`} onClick={() => setOpen(i)} aria-label={`미리보기 ${n}쪽 크게 보기`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
              <img src={src(n)} alt={`${type} 리포트 미리보기 ${n}쪽`} loading="lazy" onError={fallback(n)} />
            </button>
          ))}
        </div>
        {at > 0 ? <button type="button" className="rp-preview-arrow is-prev" onClick={() => go(at - 1)} aria-label="이전 쪽">‹</button> : null}
        {at < PREVIEW_PAGES.length - 1 ? <button type="button" className="rp-preview-arrow is-next" onClick={() => go(at + 1)} aria-label="다음 쪽">›</button> : null}
      </div>
      <div className="rp-preview-dots" aria-hidden="true">
        {PREVIEW_PAGES.map((n, i) => <i key={n} className={i === at ? "on" : ""} />)}
      </div>

      {open !== null ? (
        <div className="rp-lightbox" role="dialog" aria-modal="true" aria-label="미리보기 크게 보기" onClick={() => setOpen(null)}>
          <div className="rp-lightbox-in" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다 */}
            <img src={src(PREVIEW_PAGES[open])} alt={`${type} 리포트 미리보기 ${PREVIEW_PAGES[open]}쪽`} onError={fallback(PREVIEW_PAGES[open])} />
            <div className="rp-lightbox-nav">
              <button type="button" onClick={() => setOpen(Math.max(open - 1, 0))} disabled={open === 0}>‹ 이전</button>
              <b>{open + 1} / {PREVIEW_PAGES.length}</b>
              <button type="button" onClick={() => setOpen(Math.min(open + 1, PREVIEW_PAGES.length - 1))} disabled={open === PREVIEW_PAGES.length - 1}>다음 ›</button>
            </div>
            <button type="button" className="rp-lightbox-close" onClick={() => setOpen(null)} aria-label="닫기">×</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
