import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

export const metadata: Metadata = {
  title: "사랑의 언어 테스트",
  description: "인정하는 말·함께하는 시간·선물·봉사·스킨십 중 나의 사랑의 언어를 확인하는 무료 연애 심리테스트입니다.",
  keywords: ["사랑의 언어 테스트","5가지 사랑의 언어","연인 사랑의 언어","커플 심리테스트","연애 테스트"],
  alternates: { canonical: "/tests/love-language/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/love-language/",
    title: "사랑의 언어 테스트 | MBTI 검사",
    description: "인정하는 말·함께하는 시간·선물·봉사·스킨십 중 나의 사랑의 언어를 확인하는 무료 연애 심리테스트입니다.",
    images: [{ url: "/images/og/mbti-test-share.png", width: 1200, height: 630, alt: "사랑의 언어 테스트" }],
  },
};

export default function Page() { return <GenericTestRunner test={genericTests["love-language"]} />; }
