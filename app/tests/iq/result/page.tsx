import type { Metadata } from "next";
import IqTestRunner from "../../../../components/IqTestRunner";
import "../../../check/screener.css";
import "../iq.css";

// 푼 사람마다 달라지는 개인 결과 화면이라 색인하지 않습니다. 검색 유입은 /tests/iq/ 가 받습니다.
export const metadata: Metadata = {
  title: "IQ 테스트 결과",
  description: "IQ 퍼즐 20문제의 맞힌 개수와 영역별 정답률, 문제별 해설을 확인하세요.",
  alternates: { canonical: "/tests/iq/result/" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <IqTestRunner resultOnly />;
}
