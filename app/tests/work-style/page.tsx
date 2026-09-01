import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "직장 성향 테스트",
  description: "협업, 의사결정, 몰입 방식으로 나의 일하는 스타일과 잘 맞는 업무 환경을 확인하는 무료 직장 성향 테스트입니다.",
  keywords: ["직장 성향 테스트","업무 스타일 테스트","일하는 방식 테스트","직장인 심리테스트","커리어 성향 검사"],
  alternates: { canonical: "/tests/work-style/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/work-style/",
    title: "직장 성향 테스트 | MBTI 검사",
    description: "협업, 의사결정, 몰입 방식으로 나의 일하는 스타일과 잘 맞는 업무 환경을 확인하는 무료 직장 성향 테스트입니다.",
    images: [{ url: "/images/og/mbti-test-share.png", width: 1200, height: 630, alt: "직장 성향 테스트" }],
  },
};

export default function Page() { return <GenericTestRunner test={genericTests["work-style"]} />; }
