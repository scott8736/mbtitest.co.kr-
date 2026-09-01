import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "자존감 테스트",
  description: "20개 질문으로 지금 나의 자존감 수준과 자기수용·자기표현 성향을 확인하는 무료 자존감 테스트입니다.",
  keywords: ["자존감 테스트","자존감 검사","자존감 낮은 사람 특징","자존감 높이는 법","무료 심리테스트"],
  alternates: { canonical: "/tests/self-esteem/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/self-esteem/",
    title: "자존감 테스트 | MBTI 검사",
    description: "20개 질문으로 지금 나의 자존감 수준과 자기수용·자기표현 성향을 확인하는 무료 자존감 테스트입니다.",
    images: [{ url: "/images/og/mbti-test-share.png", width: 1200, height: 630, alt: "자존감 테스트" }],
  },
};

export default function Page() { return <GenericTestRunner test={genericTests["self-esteem"]} />; }
