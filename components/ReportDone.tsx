"use client";

/**
 * 결제 직후 화면. 페이앱이 결과 통보(feedbackurl)를 보내기 전에 손님이 먼저 도착할 수 있어,
 * 결제 완료가 확인될 때까지 몇 초 간격으로 상태를 다시 물어봅니다.
 */
import { useEffect, useState } from "react";

export default function ReportDone() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "paid" | "waiting" | "error">("loading");
  const [orderNo, setOrderNo] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("o") ?? "";
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (!/^[0-9a-f]{64}$/.test(t)) {
        setState("error");
        return setMessage("주소가 올바르지 않아요. 「주문 다시 찾기」로 열어 주세요.");
      }
      setToken(t);
      tries += 1;
      try {
        const response = await fetch(`/api/report/status?o=${t}`, { cache: "no-store" });
        const data = (await response.json()) as { status?: string; orderNo?: string; error?: string };
        if (data.orderNo) setOrderNo(data.orderNo);
        if (data.status === "paid") return setState("paid");
        if (["cancelled", "failed", "refunded"].includes(data.status ?? "")) {
          setState("error");
          return setMessage(data.status === "refunded" ? "환불된 주문이에요." : "결제가 완료되지 않았어요. 다시 주문해 주세요.");
        }
        setState("waiting");
      } catch {
        setState("waiting");
      }
      if (tries < 40) timer = setTimeout(check, tries < 10 ? 2000 : 5000);
      else {
        setState("error");
        setMessage("결제 확인이 늦어지고 있어요. 결제를 하셨다면 잠시 뒤 「주문 다시 찾기」로 열어 주세요.");
      }
    };
    timer = setTimeout(check, 0);
    return () => clearTimeout(timer);
  }, []);

  if (state === "paid") {
    return (
      <div className="rp-box">
        <p><b>결제가 완료됐어요.</b> 주문번호 <b>{orderNo}</b></p>
        <p>이 주문번호와 휴대폰 뒤 4자리로 언제든 다시 열 수 있어요. 화면을 캡처해 두면 편해요.</p>
        <a className="rp-button" href={`/report-app/?o=${token}`}>리포트 열기</a>
      </div>
    );
  }
  if (state === "error") return <div className="rp-box"><p>{message}</p><a href="/report/find/">주문 다시 찾기</a></div>;
  return (
    <div className="rp-box" aria-busy="true">
      <p>결제를 확인하고 있어요… {orderNo ? `(주문번호 ${orderNo})` : ""}</p>
      <p className="rp-muted">보통 몇 초면 끝나요. 이 화면을 닫지 말아 주세요.</p>
    </div>
  );
}

export function ReportFind() {
  const [orderNo, setOrderNo] = useState("");
  const [last4, setLast4] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/report/find", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNo, last4 }),
      });
      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !data.token) throw new Error(data.error || "주문을 찾지 못했어요.");
      location.assign(`/report-app/?o=${data.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문을 찾지 못했어요.");
      setBusy(false);
    }
  };
  return (
    <form className="rp-box rp-form" onSubmit={submit}>
      <label>
        <span>주문번호 (예: MR261005-123456)</span>
        <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} required autoComplete="off" />
      </label>
      <label>
        <span>결제한 휴대폰 번호 뒤 4자리</span>
        <input value={last4} onChange={(e) => setLast4(e.target.value)} inputMode="numeric" maxLength={4} required autoComplete="off" />
      </label>
      {error ? <p className="rp-error" role="alert">{error}</p> : null}
      <button className="rp-button" type="submit" disabled={busy}>{busy ? "찾는 중…" : "리포트 열기"}</button>
    </form>
  );
}
