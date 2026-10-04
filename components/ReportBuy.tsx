"use client";

/**
 * 리포트 주문 폼 (2026-10-04). 검사 결과(sessionStorage)의 유형·점수로 주문합니다.
 * 금액은 화면에 보여 주기만 하고 서버로 보내지 않습니다 — 서버가 lib/report-config.ts 의 값으로 결제창을 엽니다.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { questions, typeData, type Axis } from "../lib/mbti-data";
import { BIRTH_TIME_SLOTS, REPORT_CONSENT_TEXT, REPORT_CONSENT_VERSION, REPORT_PRICE } from "../lib/report-config";

type Stored = { result: string; scores: Record<Axis, number> };
const AXES: Axis[] = ["EI", "SN", "TF", "JP"];

function readStored(): Stored | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("mbti-test-result") ?? "null") as Stored | null;
    return parsed && typeData[parsed.result] && parsed.scores ? parsed : null;
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
  const [error, setError] = useState("");

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
        body: JSON.stringify({ type: stored.result, scores: percents, name, birth, bt: birth ? bt : 0, phone, agree, consentVersion: REPORT_CONSENT_VERSION }),
      });
      const data = (await response.json()) as { payurl?: string; error?: string };
      if (!response.ok || !data.payurl) throw new Error(data.error || "결제창을 열지 못했어요.");
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
      {error ? <p className="rp-error" role="alert">{error}</p> : null}
      <button className="rp-button" type="submit" disabled={busy}>
        {busy ? "결제창 여는 중…" : `${REPORT_PRICE.toLocaleString()}원 결제하기`}
      </button>
    </form>
  );
}

/** 무료 미리보기 세 쪽. 내 검사 결과가 있으면 내 유형 견본을, 없거나 아직 없는 유형이면 INFP 견본을 보여 줍니다. */
export function ReportPreview() {
  const [type, setType] = useState("INFP");
  useEffect(() => {
    const id = setTimeout(() => {
      const parsed = readStored();
      if (parsed) setType(parsed.result);
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="rp-preview">
      {[1, 2, 3].map((n) => (
        // eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기(output: export)라 next/image 최적화를 쓰지 않습니다
        <img
          key={`${type}-${n}`}
          src={`/report-app/preview/${type}-${n}.jpg`}
          alt={`${type} 리포트 미리보기 ${n}쪽`}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.includes("/INFP-")) img.src = `/report-app/preview/INFP-${n}.jpg`;
          }}
        />
      ))}
    </div>
  );
}
