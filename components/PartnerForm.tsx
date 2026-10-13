"use client";

import { useState } from "react";

const FIELDS: { key: string; label: string; required?: boolean; type?: string; placeholder?: string }[] = [
  { key: "company", label: "회사·브랜드명", required: true },
  { key: "name", label: "담당자 이름", required: true },
  { key: "email", label: "이메일", type: "email" },
  { key: "phone", label: "연락처", type: "tel" },
  { key: "product", label: "홍보할 제품·서비스", placeholder: "예: 가을 신상 립스틱 라인" },
  { key: "timing", label: "희망 공개 시기", placeholder: "예: 11월 둘째 주" },
];
const BUDGETS = ["정하지 않음", "50만 원 미만", "50만~100만 원", "100만~300만 원", "300만 원 이상"];
const SOURCES = ["검색", "SNS", "지인 소개", "직접 이용해 봄", "기타"];

export default function PartnerForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    body.agree = form.get("agree") === "on";
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/partners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState("done");
        return;
      }
      setError(data.error ?? "보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } catch {
      setError("보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <div className="partner-form partner-done">
        <strong>문의가 접수됐어요.</strong>
        <p>영업일 기준 1~2일 안에 남겨 주신 연락처로 견적과 진행 일정을 보내드립니다.</p>
      </div>
    );
  }

  return (
    <form className="partner-form" onSubmit={submit}>
      <div className="partner-grid">
        {FIELDS.map((f) => (
          <label key={f.key}>
            <span>
              {f.label}
              {f.required ? " *" : ""}
            </span>
            <input name={f.key} type={f.type ?? "text"} required={f.required} placeholder={f.placeholder} maxLength={200} />
          </label>
        ))}
        <label>
          <span>예산</span>
          <select name="budget" defaultValue="정하지 않음">
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label>
          <span>알게 된 경로</span>
          <select name="source" defaultValue="검색">
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="partner-wide">
        <span>문의 내용</span>
        <textarea name="message" rows={5} maxLength={2000} placeholder="원하는 테스트 주제, 결과 화면에 넣고 싶은 것(쿠폰·구매 버튼 등)을 적어 주세요." />
      </label>
      {/* 봇 방지용 숨은 칸 */}
      <input className="partner-trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="partner-agree">
        <input type="checkbox" name="agree" required />
        <span>문의 회신을 위해 회사명·이름·연락처·이메일을 수집하며, 회신 후 1년 뒤 파기합니다. 동의합니다. (필수)</span>
      </label>
      <p className="partner-note">이메일과 연락처 중 하나는 꼭 적어 주세요.</p>
      {error && <p className="partner-error">{error}</p>}
      <button className="primary-button" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "보내는 중…" : "제휴 문의 보내기"}
      </button>
    </form>
  );
}
