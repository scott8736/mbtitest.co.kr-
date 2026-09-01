import type { Metadata } from "next";
import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";

// title.absolute 를 쓰는 이유: layout.tsx 의 template "%s | MBTI 검사" 가 뒤에 붙으면
// 파이프가 두 번 들어가 검색결과에서 잘립니다.
export const metadata: Metadata = {
  title: { absolute: "에겐테토 테스트 20문항 무료 | 나는 에겐녀·테토남일까?" },
  description:
    "20가지 질문으로 알아보는 에겐·테토 성향. 에겐녀·에겐남·테토녀·테토남 중 나는 어떤 유형일까요? 회원가입 없이 무료로 확인하세요.",
  keywords: [
    "에겐테토 테스트",
    "에겐녀 테스트",
    "테토녀 테스트",
    "에겐남 테스트",
    "테토남 테스트",
    "에겐 테토 차이",
    "에겐녀 테토남 궁합",
  ],
  alternates: { canonical: "/tests/egen-teto/" },
  openGraph: {
    type: "website",
    url: "https://mbtitest.co.kr/tests/egen-teto/",
    title: "에겐테토 테스트 20문항 무료 | 나는 에겐녀·테토남일까?",
    description: "에겐녀·에겐남·테토녀·테토남 중 나는 어떤 유형일까요? 20문항 무료 성향 테스트",
    images: [
      {
        url: "/images/og/mbti-test-share.png",
        width: 1200,
        height: 630,
        alt: "무료 에겐테토 성향 테스트",
      },
    ],
  },
};

export default function Page() {
  return <GenericTestRunner test={genericTests["egen-teto"]} />;
}
