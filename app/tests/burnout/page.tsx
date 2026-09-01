import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "번아웃 테스트",
  description: "20개 질문으로 현재 번아웃 단계와 소진 신호, 회복에 필요한 휴식 방향을 확인하는 무료 번아웃 자가진단 테스트입니다.",
  keywords: ["번아웃 테스트","번아웃 자가진단","번아웃 증후군 증상","직장인 번아웃","무료 심리테스트"],
  alternates: { canonical: "/tests/burnout/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/burnout/",
    title: "번아웃 테스트 | MBTI 검사",
    description: "20개 질문으로 현재 번아웃 단계와 소진 신호, 회복에 필요한 휴식 방향을 확인하는 무료 번아웃 자가진단 테스트입니다.",
    images: [{ url: "/images/og/mbti-test-share.png", width: 1200, height: 630, alt: "번아웃 테스트" }],
  },
};

export default function Page() { return <GenericTestRunner test={genericTests["burnout"]} />; }
