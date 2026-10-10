import type { Metadata } from "next";

// 2026-10-11부터 40문항을 /tests/mbti/ 한 페이지에서 풉니다. 예전 2단계 주소로 들어오면
// (뒤로가기·북마크) 앞 단계 답이 없으므로 처음 화면으로 보냅니다.
export const metadata: Metadata = {
  title: "무료 MBTI 검사",
  description: "40문항 무료 MBTI 검사는 첫 화면에서 처음부터 진행합니다.",
  alternates: { canonical: "/tests/mbti/" },
  robots: { index: false, follow: true },
};

export default function MbtiStep2Page() {
  return (
    <main>
      <meta httpEquiv="refresh" content="0;url=/tests/mbti/" />
      <p style={{ padding: 24, textAlign: "center" }}>
        <a href="/tests/mbti/">MBTI 검사 처음 화면으로 이동합니다</a>
      </p>
    </main>
  );
}
